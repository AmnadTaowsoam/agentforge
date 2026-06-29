import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { query } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'
import type { ReviewEvent } from '@agentforge/domain'

const reviewSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'waived', 'needs_revision']),
  checklistVersion: z.string().min(1).optional(),
  notes: z.string().optional(),
})

export async function reviewRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/runs/:runId/review', { preHandler: requireAuth }, async (request, reply) => {
    const { runId } = request.params as { runId: string }
    const body = reviewSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({
        requestId: crypto.randomUUID(),
        code: 'VALIDATION_FAILED',
        message: 'Invalid request body',
        details: { errors: body.error.issues },
      })
    }

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

    const { decision, checklistVersion, notes } = body.data
    const result = await query<ReviewEvent>(
      `INSERT INTO review_events (run_id, reviewer_user_id, decision, checklist_version, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [runId, request.user.userId, decision, checklistVersion ?? '1.0', notes ?? null]
    )

    // Insert audit event
    await query(
      `INSERT INTO audit_events (workspace_id, actor_user_id, action, target_type, target_id, metadata_json)
       VALUES ($1, $2, 'review.submitted', 'run', $3, $4)`,
      [request.user.workspaceId, request.user.userId, runId, JSON.stringify({ decision })]
    )

    return reply.status(201).send(result.rows[0])
  })
}
