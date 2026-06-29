import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { query, pool } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'

const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
})

export async function workspaceRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/workspaces', async (request, reply) => {
    const body = createWorkspaceSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({
        requestId: crypto.randomUUID(),
        code: 'VALIDATION_FAILED',
        message: 'Invalid request body',
        details: { errors: body.error.issues },
      })
    }
    const { name, email, password, displayName } = body.data

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const wsResult = await client.query<{ id: string; name: string; plan: string; created_at: Date }>(
        `INSERT INTO workspaces (name) VALUES ($1) RETURNING id, name, plan, created_at`,
        [name]
      )
      const workspace = wsResult.rows[0]!
      const passwordHash = await bcrypt.hash(password, 12)
      const userResult = await client.query<{ id: string; role: string }>(
        `INSERT INTO users (workspace_id, email, display_name, role, password_hash) VALUES ($1, $2, $3, 'owner', $4) RETURNING id, role`,
        [workspace.id, email, displayName, passwordHash]
      )
      await client.query('COMMIT')
      return reply.status(201).send({ workspace, userId: userResult.rows[0]!.id })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  })

  app.get('/api/v1/workspaces/:workspaceId', { preHandler: requireAuth }, async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string }
    if (workspaceId !== request.user.workspaceId) {
      return reply.status(403).send({
        requestId: crypto.randomUUID(),
        code: 'FORBIDDEN',
        message: 'Access denied to this workspace',
      })
    }
    const result = await query<{ id: string; name: string; plan: string; retention_days: number; created_at: Date; updated_at: Date }>(
      `SELECT id, name, plan, retention_days, created_at, updated_at FROM workspaces WHERE id = $1`,
      [workspaceId]
    )
    if (!result.rows[0]) {
      return reply.status(404).send({
        requestId: crypto.randomUUID(),
        code: 'NOT_FOUND',
        message: 'Workspace not found',
      })
    }
    return reply.send(result.rows[0])
  })
}
