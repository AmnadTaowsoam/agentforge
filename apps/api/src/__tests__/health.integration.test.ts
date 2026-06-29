import { describe, it, expect, beforeAll } from 'vitest'
import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { healthRoutes } from '../routes/health.js'
import { registerErrorHandler } from '../plugins/error-handler.js'

const TEST_DB = process.env['TEST_DATABASE_URL']
const RUN_INTEGRATION = !!TEST_DB

// When TEST_DATABASE_URL is not set these tests are skipped gracefully.
// Run them with: TEST_DATABASE_URL=postgresql://... pnpm --filter @agentforge/api test:integration
describe.skipIf(!RUN_INTEGRATION)('Health routes integration', () => {
  // Override DATABASE_URL so the db module connects to the test DB
  beforeAll(() => {
    if (TEST_DB) process.env['DATABASE_URL'] = TEST_DB
  })

  it('GET /health returns 200 with status ok', async () => {
    const app = fastify({ logger: false })
    await app.register(fastifyJwt, { secret: 'test-secret-key-that-is-long-enough-for-tests' })
    await app.register(fastifyCors, { origin: true })
    registerErrorHandler(app)
    await app.register(healthRoutes)

    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body) as { status: string; timestamp: string }
    expect(body.status).toBe('ok')
    expect(typeof body.timestamp).toBe('string')

    await app.close()
  })

  it('GET /ready returns 200 when DB is reachable', async () => {
    const app = fastify({ logger: false })
    await app.register(fastifyJwt, { secret: 'test-secret-key-that-is-long-enough-for-tests' })
    await app.register(fastifyCors, { origin: true })
    registerErrorHandler(app)
    await app.register(healthRoutes)

    const response = await app.inject({ method: 'GET', url: '/ready' })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body) as { status: string }
    expect(body.status).toBe('ok')

    await app.close()
  })
})
