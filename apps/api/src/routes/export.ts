import type { FastifyInstance } from 'fastify'
import { query } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'
import type { Artifact } from '@agentforge/domain'

export async function exportRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/runs/:runId/export', { preHandler: requireAuth }, async (request, reply) => {
    const { runId } = request.params as { runId: string }

    const check = await query<{ workspace_id: string }>(
      `SELECT p.workspace_id FROM runs r JOIN projects p ON p.id = r.project_id WHERE r.id = $1`,
      [runId]
    )
    if (!check.rows[0]) {
      return reply.status(404).send({ requestId: crypto.randomUUID(), code: 'NOT_FOUND', message: 'Run not found' })
    }
    if (check.rows[0].workspace_id !== request.user.workspaceId) {
      return reply.status(403).send({ requestId: crypto.randomUUID(), code: 'FORBIDDEN', message: 'Access denied' })
    }

    const artifactsResult = await query<Artifact>(
      `SELECT * FROM artifacts WHERE run_id = $1 ORDER BY created_at ASC`,
      [runId]
    )

    await query(
      `INSERT INTO audit_events (workspace_id, actor_user_id, action, target_type, target_id, metadata_json)
       VALUES ($1, $2, 'export.requested', 'run', $3, $4)`,
      [request.user.workspaceId, request.user.userId, runId, JSON.stringify({ artifactCount: artifactsResult.rows.length })]
    )

    return reply.send({
      runId,
      artifacts: artifactsResult.rows.map(a => ({
        type: a.artifact_type,
        content: a.content_ref,
        checksum: a.checksum,
        path: a.path,
      })),
    })
  })
}
