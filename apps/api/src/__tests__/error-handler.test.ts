import { describe, it, expect, vi, beforeEach } from 'vitest'
import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { registerErrorHandler } from '../plugins/error-handler.js'

vi.mock('../db/index.js', () => ({
  pool: {
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
  },
  query: vi.fn(),
}))

const JWT_SECRET = 'test-secret-key-that-is-long-enough-for-tests'

async function buildApp() {
  const app = fastify({ logger: false, genReqId: () => crypto.randomUUID() })
  await app.register(fastifyJwt, { secret: JWT_SECRET })
  await app.register(fastifyCors, { origin: true })
  registerErrorHandler(app)

  // Routes that produce each error type for testing
  app.get('/test/400', async (_req, reply) => {
    return reply.status(400).send(
      app.httpErrors
        ? undefined
        : { requestId: crypto.randomUUID(), code: 'VALIDATION_FAILED', message: 'bad input' }
    )
  })

  // Route that throws a Fastify 400 error (goes through error handler)
  app.get('/test/400-throw', async () => {
    const err = Object.assign(new Error('Invalid input value'), { statusCode: 400 })
    throw err
  })

  app.get('/test/401-throw', async () => {
    const err = Object.assign(new Error('Authorization header with Bearer token is required'), { statusCode: 401 })
    throw err
  })

  app.get('/test/403-throw', async () => {
    const err = Object.assign(new Error('Access denied to this project'), { statusCode: 403 })
    throw err
  })

  app.get('/test/404-throw', async () => {
    const err = Object.assign(new Error('Resource not found'), { statusCode: 404 })
    throw err
  })

  return app
}

describe('Error handler — all error responses have requestId, code, message', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('400 error response has requestId, code=VALIDATION_FAILED, message', async () => {
    const app = await buildApp()
    const response = await app.inject({ method: 'GET', url: '/test/400-throw' })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body) as { requestId: string; code: string; message: string }
    expect(typeof body.requestId).toBe('string')
    expect(body.requestId.length).toBeGreaterThan(0)
    expect(body.code).toBe('VALIDATION_FAILED')
    expect(typeof body.message).toBe('string')
    expect(body.message.length).toBeGreaterThan(0)
    await app.close()
  })

  it('401 error response has requestId, code=AUTH_REQUIRED, message', async () => {
    const app = await buildApp()
    const response = await app.inject({ method: 'GET', url: '/test/401-throw' })

    expect(response.statusCode).toBe(401)
    const body = JSON.parse(response.body) as { requestId: string; code: string; message: string }
    expect(typeof body.requestId).toBe('string')
    expect(body.requestId.length).toBeGreaterThan(0)
    expect(body.code).toBe('AUTH_REQUIRED')
    expect(typeof body.message).toBe('string')
    await app.close()
  })

  it('403 error response has requestId, code=FORBIDDEN, message', async () => {
    const app = await buildApp()
    const response = await app.inject({ method: 'GET', url: '/test/403-throw' })

    expect(response.statusCode).toBe(403)
    const body = JSON.parse(response.body) as { requestId: string; code: string; message: string }
    expect(typeof body.requestId).toBe('string')
    expect(body.requestId.length).toBeGreaterThan(0)
    expect(body.code).toBe('FORBIDDEN')
    expect(typeof body.message).toBe('string')
    await app.close()
  })

  it('404 error response has requestId, code=NOT_FOUND, message', async () => {
    const app = await buildApp()
    const response = await app.inject({ method: 'GET', url: '/test/404-throw' })

    expect(response.statusCode).toBe(404)
    const body = JSON.parse(response.body) as { requestId: string; code: string; message: string }
    expect(typeof body.requestId).toBe('string')
    expect(body.requestId.length).toBeGreaterThan(0)
    expect(body.code).toBe('NOT_FOUND')
    expect(typeof body.message).toBe('string')
    await app.close()
  })

  it('error response does not include token or password_hash fields', async () => {
    const app = await buildApp()
    const response = await app.inject({ method: 'GET', url: '/test/401-throw' })

    const body = JSON.parse(response.body) as Record<string, unknown>
    expect(body).not.toHaveProperty('token')
    expect(body).not.toHaveProperty('password_hash')
    await app.close()
  })

  it('requestId is a non-empty string on every error shape', async () => {
    const app = await buildApp()

    const statuses = [
      { url: '/test/400-throw', code: 400 },
      { url: '/test/401-throw', code: 401 },
      { url: '/test/403-throw', code: 403 },
      { url: '/test/404-throw', code: 404 },
    ]

    for (const { url, code } of statuses) {
      const response = await app.inject({ method: 'GET', url })
      expect(response.statusCode).toBe(code)
      const body = JSON.parse(response.body) as { requestId: string }
      expect(typeof body.requestId).toBe('string')
      expect(body.requestId.length).toBeGreaterThan(0)
    }

    await app.close()
  })
})
