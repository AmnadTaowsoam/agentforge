import { query, closePool } from './db/index.js'
import { runPipeline } from './pipeline/index.js'

const POLL_INTERVAL_MS = 2000
let isShuttingDown = false

interface RunRow {
  id: string
  project_id: string
  workspace_id: string
}

async function pollForWork(): Promise<void> {
  // Claim a single ready run atomically using FOR UPDATE SKIP LOCKED
  const claimResult = await query<RunRow>(
    `UPDATE runs
     SET status = 'running', started_at = NOW()
     WHERE id = (
       SELECT r.id
       FROM runs r
       JOIN projects p ON p.id = r.project_id
       WHERE r.status = 'ready'
       ORDER BY r.created_at ASC
       LIMIT 1
       FOR UPDATE OF r SKIP LOCKED
     )
     RETURNING id, project_id, (
       SELECT workspace_id FROM projects WHERE id = runs.project_id
     ) AS workspace_id`
  )

  if (claimResult.rows.length === 0) {
    // No ready runs available
    return
  }

  const run = claimResult.rows[0]
  if (!run) return

  console.log(`[worker] Starting run ${run.id}`)

  try {
    const result = await runPipeline({
      runId: run.id,
      projectId: run.project_id,
      workspaceId: run.workspace_id,
    })

    await query(
      `UPDATE runs
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1`,
      [run.id]
    )

    console.log(
      `[worker] Completed run ${run.id}: ${result.artifactCount} artifacts, ${result.findingCount} findings`
    )
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    const failureCode = 'PIPELINE_ERROR'
    const failureMessage = error.message.slice(0, 2000)

    console.error(`[worker] Run ${run.id} failed: ${failureMessage}`)

    await query(
      `UPDATE runs
       SET status = 'failed',
           completed_at = NOW(),
           failure_code = $1,
           failure_message = $2
       WHERE id = $3`,
      [failureCode, failureMessage, run.id]
    ).catch((dbErr: unknown) => {
      const dbError = dbErr instanceof Error ? dbErr : new Error(String(dbErr))
      console.error(`[worker] Failed to update run status to failed: ${dbError.message}`)
    })
  }
}

async function main(): Promise<void> {
  console.log('[worker] AgentForge Worker starting up')

  process.on('SIGTERM', () => {
    console.log('[worker] Received SIGTERM — shutting down gracefully')
    isShuttingDown = true
  })

  process.on('SIGINT', () => {
    console.log('[worker] Received SIGINT — shutting down gracefully')
    isShuttingDown = true
  })

  while (!isShuttingDown) {
    try {
      await pollForWork()
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      // Redact potential secrets from log output per security rule
      const safeMessage = error.message
        .replace(/\b(password|secret|api_key|token)\s*=\s*\S+/gi, '$1=[REDACTED]')
      console.error(`[worker] Poll error: ${safeMessage}`)
    }

    if (!isShuttingDown) {
      await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    }
  }

  console.log('[worker] Closing database pool')
  await closePool()
  console.log('[worker] Shutdown complete')
}

main().catch((err: unknown) => {
  const error = err instanceof Error ? err : new Error(String(err))
  console.error('[worker] Fatal error:', error.message)
  process.exit(1)
})
