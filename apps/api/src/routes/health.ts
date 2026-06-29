import type { FastifyInstance } from 'fastify'
import { query } from '../db/index.js'

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_req, reply) => {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.get('/ready', async (_req, reply) => {
    try {
      await query('SELECT 1')
      return reply.send({ status: 'ok' })
    } catch {
      return reply.status(503).send({ status: 'error', message: 'Database unavailable' })
    }
  })
}
