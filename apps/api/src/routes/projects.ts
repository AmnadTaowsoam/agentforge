import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { query } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'
import type { Project } from '@agentforge/domain'

const createProjectSchema = z.object({
  name: z.string().min(1),
  domain: z.string().min(1).optional(),
})

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/projects', { preHandler: requireAuth }, async (request, reply) => {
    const body = createProjectSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({
        requestId: crypto.randomUUID(),
        code: 'VALIDATION_FAILED',
        message: 'Invalid request body',
        details: { errors: body.error.issues },
      })
    }
    const { name, domain } = body.data
    const result = await query<Project>(
      `INSERT INTO projects (workspace_id, name, domain, owner_user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [request.user.workspaceId, name, domain ?? 'agentic project', request.user.userId]
    )
    return reply.status(201).send(result.rows[0])
  })

  app.get('/api/v1/projects/:projectId', { preHandler: requireAuth }, async (request, reply) => {
    const { projectId } = request.params as { projectId: string }
    const result = await query<Project>(
      `SELECT * FROM projects WHERE id = $1`,
      [projectId]
    )
    const project = result.rows[0]
    if (!project) {
      return reply.status(404).send({
        requestId: crypto.randomUUID(),
        code: 'NOT_FOUND',
        message: 'Project not found',
      })
    }
    if (project.workspace_id !== request.user.workspaceId) {
      return reply.status(403).send({
        requestId: crypto.randomUUID(),
        code: 'FORBIDDEN',
        message: 'Access denied to this project',
      })
    }
    return reply.send(project)
  })

  app.patch('/api/v1/projects/:projectId', { preHandler: requireAuth }, async (request, reply) => {
    const { projectId } = request.params as { projectId: string }
    const body = updateProjectSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({
        requestId: crypto.randomUUID(),
        code: 'VALIDATION_FAILED',
        message: 'Invalid request body',
        details: { errors: body.error.issues },
      })
    }

    // Check project exists and workspace isolation
    const existing = await query<Project>(`SELECT * FROM projects WHERE id = $1`, [projectId])
    const project = existing.rows[0]
    if (!project) {
      return reply.status(404).send({ requestId: crypto.randomUUID(), code: 'NOT_FOUND', message: 'Project not found' })
    }
    if (project.workspace_id !== request.user.workspaceId) {
      return reply.status(403).send({ requestId: crypto.randomUUID(), code: 'FORBIDDEN', message: 'Access denied' })
    }

    const { name, status, metadata } = body.data
    const result = await query<Project>(
      `UPDATE projects SET
        name = COALESCE($1, name),
        status = COALESCE($2, status),
        metadata_json = COALESCE($3::jsonb, metadata_json),
        updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [name ?? null, status ?? null, metadata ? JSON.stringify(metadata) : null, projectId]
    )
    return reply.send(result.rows[0])
  })
}
