import { describe, it, expect, vi, beforeEach } from 'vitest'
import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { projectRoutes } from '../routes/projects.js'
import { runRoutes } from '../routes/runs.js'
import { reviewRoutes } from '../routes/review.js'
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
  await app.register(projectRoutes)
  await app.register(runRoutes)
  await app.register(reviewRoutes)
  return app
}

const WORKSPACE_A = 'workspace-aaaa-0000-0000-000000000000'
const WORKSPACE_B = 'workspace-bbbb-1111-1111-111111111111'

describe('Workspace isolation — cross-workspace reads return 403', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api/v1/projects/:id belonging to another workspace returns 403 (not 200 or 404)', async () => {
    const { query } = await import('../db/index.js')
    // Project belongs to WORKSPACE_B, but the authenticated user is in WORKSPACE_A
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{
        id: 'project-bbb',
        workspace_id: WORKSPACE_B,
        name: 'Secret Project',
        domain: 'finance',
        status: 'active',
        owner_user_id: 'user-bbb',
        metadata_json: {},
        created_at: new Date(),
        updated_at: new Date(),
      }],
    } as never)

    const app = await buildApp()
    const token = app.jwt.sign({ userId: 'user-aaa', workspaceId: WORKSPACE_A, role: 'owner' })

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/project-bbb',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(response.statusCode).toBe(403)
    const body = JSON.parse(response.body) as { code: string; requestId: string; message: string }
    expect(body.code).toBe('FORBIDDEN')
    expect(body.requestId).toBeDefined()
    expect(typeof body.requestId).toBe('string')
    await app.close()
  })

  it('GET /api/v1/runs/:id belonging to another workspace returns 403', async () => {
    const { query } = await import('../db/index.js')
    // Run joined with project — workspace_id comes from the project
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{
        id: 'run-bbb',
        project_id: 'project-bbb',
        workspace_id: WORKSPACE_B,
        status: 'completed',
        trigger_type: 'manual',
        config_json: {},
        started_by: 'user-bbb',
        started_at: new Date(),
        completed_at: new Date(),
        failure_code: null,
        failure_message: null,
      }],
    } as never)

    const app = await buildApp()
    const token = app.jwt.sign({ userId: 'user-aaa', workspaceId: WORKSPACE_A, role: 'owner' })

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/runs/run-bbb',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(response.statusCode).toBe(403)
    const body = JSON.parse(response.body) as { code: string; requestId: string }
    expect(body.code).toBe('FORBIDDEN')
    expect(body.requestId).toBeDefined()
    await app.close()
  })

  it('POST /api/v1/runs/:id/cancel on another workspace\'s run returns 403', async () => {
    const { query } = await import('../db/index.js')
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{
        id: 'run-bbb',
        project_id: 'project-bbb',
        workspace_id: WORKSPACE_B,
        status: 'running',
        trigger_type: 'manual',
        config_json: {},
        started_by: 'user-bbb',
        started_at: new Date(),
        completed_at: null,
        failure_code: null,
        failure_message: null,
      }],
    } as never)

    const app = await buildApp()
    const token = app.jwt.sign({ userId: 'user-aaa', workspaceId: WORKSPACE_A, role: 'owner' })

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/runs/run-bbb/cancel',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(response.statusCode).toBe(403)
    const body = JSON.parse(response.body) as { code: string; requestId: string }
    expect(body.code).toBe('FORBIDDEN')
    expect(body.requestId).toBeDefined()
    await app.close()
  })

  it('POST /api/v1/runs/:id/review on another workspace\'s run returns 403', async () => {
    const { query } = await import('../db/index.js')
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{ workspace_id: WORKSPACE_B }],
    } as never)

    const app = await buildApp()
    const token = app.jwt.sign({ userId: 'user-aaa', workspaceId: WORKSPACE_A, role: 'owner' })

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/runs/run-bbb/review',
      headers: { authorization: `Bearer ${token}` },
      payload: { decision: 'approved' },
    })

    expect(response.statusCode).toBe(403)
    const body = JSON.parse(response.body) as { code: string; requestId: string }
    expect(body.code).toBe('FORBIDDEN')
    expect(body.requestId).toBeDefined()
    await app.close()
  })

  it('cross-workspace access returns 403, not 404 — the resource exists but is off-limits', async () => {
    const { query } = await import('../db/index.js')
    // Must be 403 not 404 — 404 would leak existence info the wrong way
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{
        id: 'project-bbb',
        workspace_id: WORKSPACE_B,
        name: 'Hidden Project',
        domain: 'test',
        status: 'draft',
        owner_user_id: 'user-bbb',
        metadata_json: {},
        created_at: new Date(),
        updated_at: new Date(),
      }],
    } as never)

    const app = await buildApp()
    const token = app.jwt.sign({ userId: 'user-aaa', workspaceId: WORKSPACE_A, role: 'owner' })

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/project-bbb',
      headers: { authorization: `Bearer ${token}` },
    })

    // Must be 403, not 200 and not 404
    expect(response.statusCode).not.toBe(200)
    expect(response.statusCode).not.toBe(404)
    expect(response.statusCode).toBe(403)
    await app.close()
  })
})
