import type { FastifyInstance } from 'fastify'
import { query } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'
import type { Finding } from '@agentforge/domain'

export async function findingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/runs/:runId/findings', { preHandler: requireAuth }, async (request, reply) => {
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
    const result = await query<Finding>(`SELECT * FROM findings WHERE run_id = $1 ORDER BY created_at ASC`, [runId])
    return reply.send(result.rows)
  })
}
