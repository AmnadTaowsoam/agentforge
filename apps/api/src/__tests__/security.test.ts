import { describe, it, expect, vi, beforeEach } from 'vitest'
import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { authRoutes } from '../routes/auth.js'
import { runRoutes } from '../routes/runs.js'
import { projectRoutes } from '../routes/projects.js'
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
  const app = fastify({ logger: false })
  await app.register(fastifyJwt, { secret: JWT_SECRET })
  await app.register(fastifyCors, { origin: true })
  registerErrorHandler(app)
  await app.register(authRoutes)
  await app.register(runRoutes)
  await app.register(projectRoutes)
  return app
}

describe('Security: Auth bypass prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST /auth/login with correct email but wrong password returns 401', async () => {
    const bcrypt = await import('bcryptjs')
    const correctHash = await bcrypt.hash('correct-password-xyz', 12)

    const { query } = await import('../db/index.js')
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{ id: 'user-001', workspace_id: 'ws-001', role: 'owner', password_hash: correctHash }],
    } as never)

    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'alice@example.com', password: 'wrong-password' },
    })

    expect(response.statusCode).toBe(401)
    const body = JSON.parse(response.body) as { code: string; token?: string }
    expect(body.code).toBe('AUTH_REQUIRED')
    expect(body.token).toBeUndefined()
    await app.close()
  })

  it('POST /auth/login wrong password response contains no token field at all', async () => {
    const bcrypt = await import('bcryptjs')
    const correctHash = await bcrypt.hash('correct-pw', 12)

    const { query } = await import('../db/index.js')
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{ id: 'user-001', workspace_id: 'ws-001', role: 'owner', password_hash: correctHash }],
    } as never)

    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'alice@example.com', password: 'not-correct' },
    })

    const body = JSON.parse(response.body) as Record<string, unknown>
    // No token, no password_hash must appear in the error response
    expect(Object.prototype.hasOwnProperty.call(body, 'token')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(body, 'password_hash')).toBe(false)
    await app.close()
  })
})

describe('Security: JWT requirement on protected routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api/v1/projects/:id without token returns 401', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/some-project-id',
    })

    expect(response.statusCode).toBe(401)
    const body = JSON.parse(response.body) as { code: string }
    expect(body.code).toBe('AUTH_REQUIRED')
    await app.close()
  })

  it('POST /api/v1/projects without token returns 401', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      payload: { name: 'New Project' },
    })

    expect(response.statusCode).toBe(401)
    const body = JSON.parse(response.body) as { code: string }
    expect(body.code).toBe('AUTH_REQUIRED')
    await app.close()
  })

  it('GET /api/v1/runs/:id without token returns 401', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/runs/some-run-id',
    })

    expect(response.statusCode).toBe(401)
    const body = JSON.parse(response.body) as { code: string }
    expect(body.code).toBe('AUTH_REQUIRED')
    await app.close()
  })

  it('POST /api/v1/projects/:id/runs without token returns 401', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/some-project-id/runs',
      payload: {},
    })

    expect(response.statusCode).toBe(401)
    const body = JSON.parse(response.body) as { code: string }
    expect(body.code).toBe('AUTH_REQUIRED')
    await app.close()
  })
})

describe('Security: SSRF prevention — webhook URLs in run config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST /api/v1/projects/:id/runs with IMDSv1 webhook URL does not make outbound call', async () => {
    const { query } = await import('../db/index.js')
    // The project check returns workspace match OK — run creation should proceed without calling webhooks
    vi.mocked(query)
      .mockResolvedValueOnce({
        rows: [{
          id: 'proj-001',
          workspace_id: 'ws-001',
          name: 'Test Project',
          domain: 'test',
          status: 'active',
          owner_user_id: 'user-001',
          metadata_json: {},
          created_at: new Date(),
          updated_at: new Date(),
        }],
      } as never)
      .mockResolvedValueOnce({
        rows: [{
          id: 'run-new',
          project_id: 'proj-001',
          status: 'ready',
          trigger_type: 'manual',
          config_json: { webhook: 'http://169.254.169.254/latest/meta-data/' },
          started_by: 'user-001',
          started_at: new Date(),
          completed_at: null,
          failure_code: null,
          failure_message: null,
        }],
      } as never)

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fetch should not be called'))

    const app = await buildApp()
    const token = app.jwt.sign({ userId: 'user-001', workspaceId: 'ws-001', role: 'owner' })

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/proj-001/runs',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        config: { webhook: 'http://169.254.169.254/latest/meta-data/' },
      },
    })

    // Run creation either succeeds (201) or fails validation (400) — never makes an outbound call
    expect([201, 400]).toContain(response.statusCode)
    // fetch must never have been called with the IMDS URL
    const imdsCallMade = fetchSpy.mock.calls.some(
      (args) => typeof args[0] === 'string' && args[0].includes('169.254.169.254')
    )
    expect(imdsCallMade).toBe(false)

    fetchSpy.mockRestore()
    await app.close()
  })

  it('error responses never contain token or password_hash fields', async () => {
    const { query } = await import('../db/index.js')
    // Return no user (user-not-found path) — auth should still return 401 not leak data
    vi.mocked(query).mockResolvedValueOnce({ rows: [] } as never)

    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'nobody@example.com', password: 'any' },
    })

    expect(response.statusCode).toBe(401)
    const body = JSON.parse(response.body) as Record<string, unknown>
    expect(body).not.toHaveProperty('token')
    expect(body).not.toHaveProperty('password_hash')
    await app.close()
  })
})
