import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { query } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'
import type { AuditEvent } from '@agentforge/domain'

const auditQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
})

export async function auditRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/audit-events', { preHandler: requireAuth }, async (request, reply) => {
    const queryParams = auditQuerySchema.safeParse(request.query)
    if (!queryParams.success) {
      return reply.status(400).send({
        requestId: crypto.randomUUID(),
        code: 'VALIDATION_FAILED',
        message: 'Invalid query params',
        details: { errors: queryParams.error.issues },
      })
    }
    const { page, pageSize } = queryParams.data
    const offset = (page - 1) * pageSize

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_events WHERE workspace_id = $1`,
      [request.user.workspaceId]
    )
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10)

    const result = await query<AuditEvent>(
      `SELECT * FROM audit_events WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [request.user.workspaceId, pageSize, offset]
    )

    return reply.send({
      data: result.rows,
      pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
    })
  })
}
