import { v4 as uuidv4 } from 'uuid'
import { query } from '../../db/index.js'

export interface NotifyReviewersInput {
  runId: string
  workspaceId: string
  artifactCount: number
  findingCount: number
}

export async function notifyReviewers(input: NotifyReviewersInput): Promise<void> {
  await query(
    `INSERT INTO audit_events (id, workspace_id, actor_user_id, action, target_type, target_id, metadata_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      uuidv4(),
      input.workspaceId,
      'system-worker',
      'run.completed',
      'run',
      input.runId,
      JSON.stringify({
        artifact_count: input.artifactCount,
        finding_count: input.findingCount,
        completed_at: new Date().toISOString(),
      }),
    ]
  )
}
