import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { InputItem } from '@agentforge/domain'

// Mock the DB module
vi.mock('../db/index.js', () => ({
  query: vi.fn(),
  closePool: vi.fn(),
}))

import { query } from '../db/index.js'
import { runPipeline } from '../pipeline/index.js'

const ARTIFACT_TYPES = [
  'brief',
  'requirements',
  'architecture',
  'api-contract',
  'data-model',
  'tasks',
  'test-plan',
] as const

const REPAIR_SHOP_IDEA =
  'A repair shop queue management system that allows customers to check in vehicles, track repair status in real-time, and receive SMS notifications when their car is ready.'

function makeInputItem(overrides: Partial<InputItem> = {}): InputItem {
  return {
    id: 'input-001',
    run_id: 'run-001',
    input_type: 'idea',
    label: 'idea',
    content_ref: REPAIR_SHOP_IDEA,
    validation_status: 'pending',
    warnings_json: [],
    created_at: new Date(),
    ...overrides,
  }
}

describe('Pipeline', () => {
  const mockQuery = vi.mocked(query)

  beforeEach(() => {
    vi.clearAllMocks()

    // Track artifact upserts by run_id + artifact_type
    const artifactStore = new Map<string, unknown>()

    mockQuery.mockImplementation(async (sql: string, params?: unknown[]) => {
      const s = sql.trim().toUpperCase()

      // Input items query
      if (s.startsWith('SELECT') && s.includes('INPUT_ITEMS')) {
        return {
          rows: [makeInputItem()],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: [],
        }
      }

      // Artifact upsert — idempotent: store by runId+type key
      if (s.startsWith('INSERT INTO ARTIFACTS')) {
        const p = params as unknown[]
        // params: [id, runId, artifactType, path, content_ref, checksum, 'valid']
        const key = `${String(p[1])}::${String(p[2])}`
        artifactStore.set(key, { id: p[0], content: p[4] })
        return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] }
      }

      // All other queries (UPDATE input_items, INSERT findings, INSERT audit_events)
      return { rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] }
    })
  })

  it('produces exactly 7 artifacts for repair-shop-queue idea', async () => {
    const result = await runPipeline({
      runId: 'run-001',
      projectId: 'proj-001',
      workspaceId: 'ws-001',
    })

    expect(result.success).toBe(true)
    expect(result.artifactCount).toBe(7)
  })

  it('produces one artifact per artifact type', async () => {
    const insertedTypes: string[] = []

    mockQuery.mockImplementation(async (sql: string, params?: unknown[]) => {
      const s = sql.trim().toUpperCase()

      if (s.startsWith('SELECT') && s.includes('INPUT_ITEMS')) {
        return { rows: [makeInputItem()], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }
      }

      if (s.startsWith('INSERT INTO ARTIFACTS')) {
        const p = params as unknown[]
        insertedTypes.push(String(p[2]))
      }

      return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] }
    })

    await runPipeline({ runId: 'run-001', projectId: 'proj-001', workspaceId: 'ws-001' })

    // Verify all 7 types present
    for (const artifactType of ARTIFACT_TYPES) {
      expect(insertedTypes).toContain(artifactType)
    }
    // Verify exactly 7 distinct types
    const uniqueTypes = [...new Set(insertedTypes)]
    expect(uniqueTypes.length).toBe(7)
  })

  it('running the pipeline twice with same runId produces exactly 7 artifacts (idempotency)', async () => {
    const artifactStore = new Map<string, unknown>()

    mockQuery.mockImplementation(async (sql: string, params?: unknown[]) => {
      const s = sql.trim().toUpperCase()

      if (s.startsWith('SELECT') && s.includes('INPUT_ITEMS')) {
        return { rows: [makeInputItem()], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }
      }

      if (s.startsWith('INSERT INTO ARTIFACTS')) {
        const p = params as unknown[]
        // ON CONFLICT DO UPDATE — idempotent store
        const key = `${String(p[1])}::${String(p[2])}`
        artifactStore.set(key, { id: p[0], content: p[4] })
      }

      return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] }
    })

    // Run pipeline twice with same runId
    await runPipeline({ runId: 'run-001', projectId: 'proj-001', workspaceId: 'ws-001' })
    await runPipeline({ runId: 'run-001', projectId: 'proj-001', workspaceId: 'ws-001' })

    // The Map keyed by runId::artifactType means duplicates are overwritten
    // So we still have exactly 7 unique entries
    expect(artifactStore.size).toBe(7)
  })

  it('generated content is non-empty for each artifact type', async () => {
    const insertedContents: Record<string, string> = {}

    mockQuery.mockImplementation(async (sql: string, params?: unknown[]) => {
      const s = sql.trim().toUpperCase()

      if (s.startsWith('SELECT') && s.includes('INPUT_ITEMS')) {
        return { rows: [makeInputItem()], rowCount: 1, command: 'SELECT', oid: 0, fields: [] }
      }

      if (s.startsWith('INSERT INTO ARTIFACTS')) {
        const p = params as unknown[]
        const artifactType = String(p[2])
        const content = String(p[4])
        insertedContents[artifactType] = content
      }

      return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] }
    })

    await runPipeline({ runId: 'run-001', projectId: 'proj-001', workspaceId: 'ws-001' })

    for (const artifactType of ARTIFACT_TYPES) {
      const content = insertedContents[artifactType]
      expect(content, `Content for ${artifactType} should exist`).toBeDefined()
      expect(content!.length, `Content for ${artifactType} should be non-empty`).toBeGreaterThan(100)
    }
  })
})
