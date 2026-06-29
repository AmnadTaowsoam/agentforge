import { describe, it, expect, vi, beforeEach } from 'vitest'
import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { authRoutes } from '../routes/auth.js'
import { projectRoutes } from '../routes/projects.js'
import { registerErrorHandler } from '../plugins/error-handler.js'

// Mock the db module
vi.mock('../db/index.js', () => {
  const mockPool = {
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
  }
  return {
    pool: mockPool,
    query: vi.fn(),
  }
})

const JWT_SECRET = 'test-secret-key-that-is-long-enough-for-tests'

async function buildApp() {
  const app = fastify({ logger: false })
  await app.register(fastifyJwt, { secret: JWT_SECRET })
  await app.register(fastifyCors, { origin: true })
  registerErrorHandler(app)
  await app.register(authRoutes)
  await app.register(projectRoutes)
  return app
}

describe('Auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST /auth/register creates user and returns JWT', async () => {
    const { pool } = await import('../db/index.js')
    const mockClient = {
      query: vi.fn()
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'ws-123', name: "Test Workspace" }] }) // INSERT workspace
        .mockResolvedValueOnce({ rows: [] }) // check existing email
        .mockResolvedValueOnce({ rows: [{ id: 'user-456', role: 'owner' }] }) // INSERT user
        .mockResolvedValueOnce(undefined), // COMMIT
      release: vi.fn(),
    }
    vi.mocked(pool.connect).mockResolvedValue(mockClient as never)

    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'test@example.com',
        password: 'securepassword123',
        displayName: 'Test User',
      },
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.body) as { token: string }
    expect(body.token).toBeDefined()
    expect(typeof body.token).toBe('string')
    expect(body.token.split('.').length).toBe(3) // valid JWT structure
    await app.close()
  })

  it('POST /auth/login with wrong password returns 401 (not a JWT)', async () => {
    const bcrypt = await import('bcryptjs')
    const correctHash = await bcrypt.hash('correctpassword', 12)

    const { query } = await import('../db/index.js')
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{ id: 'user-456', workspace_id: 'ws-123', role: 'owner', password_hash: correctHash }],
    } as never)

    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'wrongpassword',
      },
    })

    expect(response.statusCode).toBe(401)
    const body = JSON.parse(response.body) as { token?: string; code: string }
    expect(body.token).toBeUndefined()
    expect(body.code).toBe('AUTH_REQUIRED')
    await app.close()
  })

  it('POST /auth/login with correct password returns JWT', async () => {
    const bcrypt = await import('bcryptjs')
    const correctHash = await bcrypt.hash('correctpassword', 12)

    const { query } = await import('../db/index.js')
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{ id: 'user-456', workspace_id: 'ws-123', role: 'owner', password_hash: correctHash }],
    } as never)

    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'correctpassword',
      },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body) as { token: string }
    expect(body.token).toBeDefined()
    expect(typeof body.token).toBe('string')
    expect(body.token.split('.').length).toBe(3) // valid JWT structure
    await app.close()
  })

  it('GET /api/v1/projects/:id with another workspace ID returns 403', async () => {
    const { query } = await import('../db/index.js')
    // Return a project belonging to a different workspace
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{
        id: 'project-789',
        workspace_id: 'other-workspace-id',
        name: 'Other Project',
        domain: 'test',
        status: 'draft',
        owner_user_id: 'user-other',
        metadata_json: {},
        created_at: new Date(),
        updated_at: new Date(),
      }],
    } as never)

    const app = await buildApp()

    // Create a valid JWT for workspace ws-123
    const token = app.jwt.sign({ userId: 'user-456', workspaceId: 'ws-123', role: 'owner' })

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/project-789',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(response.statusCode).toBe(403)
    const body = JSON.parse(response.body) as { code: string }
    expect(body.code).toBe('FORBIDDEN')
    await app.close()
  })
})
