import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { query, pool } from '../db/index.js'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
  workspaceName: z.string().min(1).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  workspaceId: z.string().uuid().optional(),
})

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/register', async (request, reply) => {
    const body = registerSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({
        requestId: crypto.randomUUID(),
        code: 'VALIDATION_FAILED',
        message: 'Invalid request body',
        details: { errors: body.error.issues },
      })
    }
    const { email, password, displayName, workspaceName } = body.data

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const wsName = workspaceName ?? `${displayName}'s Workspace`
      const wsResult = await client.query<{ id: string }>(
        `INSERT INTO workspaces (name) VALUES ($1) RETURNING id`,
        [wsName]
      )
      const workspaceId = wsResult.rows[0]!.id

      const existing = await client.query(
        `SELECT id FROM users WHERE workspace_id = $1 AND email = $2`,
        [workspaceId, email]
      )
      if (existing.rows.length > 0) {
        await client.query('ROLLBACK')
        return reply.status(409).send({
          requestId: crypto.randomUUID(),
          code: 'CONFLICT',
          message: 'Email already registered in this workspace',
        })
      }

      const passwordHash = await bcrypt.hash(password, 12)
      const userResult = await client.query<{ id: string; role: string }>(
        `INSERT INTO users (workspace_id, email, display_name, role, password_hash)
         VALUES ($1, $2, $3, 'owner', $4)
         RETURNING id, role`,
        [workspaceId, email, displayName, passwordHash]
      )
      const userId = userResult.rows[0]!.id
      const role = userResult.rows[0]!.role

      await client.query('COMMIT')

      const token = await reply.jwtSign({ userId, workspaceId, role }, { expiresIn: '7d' })
      return reply.status(201).send({ token, userId, workspaceId, role })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  })

  app.post('/auth/login', async (request, reply) => {
    const body = loginSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({
        requestId: crypto.randomUUID(),
        code: 'VALIDATION_FAILED',
        message: 'Invalid request body',
        details: { errors: body.error.issues },
      })
    }
    const { email, password, workspaceId } = body.data

    let userRow: { id: string; workspace_id: string; role: string; password_hash: string } | undefined
    if (workspaceId) {
      const result = await query<{ id: string; workspace_id: string; role: string; password_hash: string }>(
        `SELECT id, workspace_id, role, password_hash FROM users WHERE email = $1 AND workspace_id = $2`,
        [email, workspaceId]
      )
      userRow = result.rows[0]
    } else {
      const result = await query<{ id: string; workspace_id: string; role: string; password_hash: string }>(
        `SELECT id, workspace_id, role, password_hash FROM users WHERE email = $1 ORDER BY created_at ASC LIMIT 1`,
        [email]
      )
      userRow = result.rows[0]
    }

    if (!userRow) {
      // Constant-time: still hash to prevent timing attacks
      await bcrypt.hash(password, 12)
      return reply.status(401).send({
        requestId: crypto.randomUUID(),
        code: 'AUTH_REQUIRED',
        message: 'Invalid email or password',
      })
    }

    // FORBID-SEC-AUTH-001: bcrypt.compare MUST return true before jwtSign
    const passwordMatch = await bcrypt.compare(password, userRow.password_hash)
    if (!passwordMatch) {
      return reply.status(401).send({
        requestId: crypto.randomUUID(),
        code: 'AUTH_REQUIRED',
        message: 'Invalid email or password',
      })
    }

    // Only sign JWT after confirmed password match
    const token = await reply.jwtSign(
      { userId: userRow.id, workspaceId: userRow.workspace_id, role: userRow.role },
      { expiresIn: '7d' }
    )
    return reply.send({ token, userId: userRow.id, workspaceId: userRow.workspace_id, role: userRow.role })
  })
}
