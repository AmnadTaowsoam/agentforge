import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { query } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'
import type { Run, Project } from '@agentforge/domain'

const createRunSchema = z.object({
  triggerType: z.enum(['manual', 'scheduled', 'api']).optional(),
  config: z.record(z.unknown()).optional(),
})

export async function runRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/projects/:projectId/runs', { preHandler: requireAuth }, async (request, reply) => {
    const { projectId } = request.params as { projectId: string }
    const body = createRunSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({
        requestId: crypto.randomUUID(),
        code: 'VALIDATION_FAILED',
        message: 'Invalid request body',
        details: { errors: body.error.issues },
      })
    }

    // Validate project ownership
    const projectResult = await query<Project>(`SELECT * FROM projects WHERE id = $1`, [projectId])
    const project = projectResult.rows[0]
    if (!project) {
      return reply.status(404).send({ requestId: crypto.randomUUID(), code: 'NOT_FOUND', message: 'Project not found' })
    }
    if (project.workspace_id !== request.user.workspaceId) {
      return reply.status(403).send({ requestId: crypto.randomUUID(), code: 'FORBIDDEN', message: 'Access denied' })
    }

    const { triggerType, config } = body.data
    const result = await query<Run>(
      `INSERT INTO runs (project_id, status, trigger_type, config_json, started_by)
       VALUES ($1, 'ready', $2, $3, $4)
       RETURNING *`,
      [projectId, triggerType ?? 'manual', JSON.stringify(config ?? {}), request.user.userId]
    )
    return reply.status(201).send(result.rows[0])
  })

  app.get('/api/v1/runs/:runId', { preHandler: requireAuth }, async (request, reply) => {
    const { runId } = request.params as { runId: string }
    const result = await query<Run & { workspace_id: string }>(
      `SELECT r.*, p.workspace_id FROM runs r
       JOIN projects p ON p.id = r.project_id
       WHERE r.id = $1`,
      [runId]
    )
    const run = result.rows[0]
    if (!run) {
      return reply.status(404).send({ requestId: crypto.randomUUID(), code: 'NOT_FOUND', message: 'Run not found' })
    }
    if (run.workspace_id !== request.user.workspaceId) {
      return reply.status(403).send({ requestId: crypto.randomUUID(), code: 'FORBIDDEN', message: 'Access denied' })
    }
    return reply.send(run)
  })

  app.post('/api/v1/runs/:runId/cancel', { preHandler: requireAuth }, async (request, reply) => {
    const { runId } = request.params as { runId: string }
    const existing = await query<Run & { workspace_id: string }>(
      `SELECT r.*, p.workspace_id FROM runs r JOIN projects p ON p.id = r.project_id WHERE r.id = $1`,
      [runId]
    )
    const run = existing.rows[0]
    if (!run) {
      return reply.status(404).send({ requestId: crypto.randomUUID(), code: 'NOT_FOUND', message: 'Run not found' })
    }
    if (run.workspace_id !== request.user.workspaceId) {
      return reply.status(403).send({ requestId: crypto.randomUUID(), code: 'FORBIDDEN', message: 'Access denied' })
    }
    const result = await query<Run>(
      `UPDATE runs SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [runId]
    )
    return reply.send(result.rows[0])
  })
}
