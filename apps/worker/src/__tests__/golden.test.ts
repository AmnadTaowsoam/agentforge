import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import type { InputItem } from '@agentforge/domain'
import { generateBrief } from '../generators/brief.js'

// Resolve __dirname in ESM context
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// The examples directory is at apps/worker/examples/input/
// __dirname is apps/worker/src/__tests__, so we go up 2 levels then into examples/input/
const EXAMPLES_DIR = path.resolve(__dirname, '..', '..', 'examples', 'input')

interface ExampleFile {
  idea: string
  inputs: Array<Omit<InputItem, 'created_at'> & { created_at: string }>
}

describe('Golden test: repair-shop-queue', () => {
  const examplePath = path.join(EXAMPLES_DIR, 'repair-shop-queue.json')

  it('example file exists and parses correctly', () => {
    const raw = readFileSync(examplePath, 'utf8')
    const data = JSON.parse(raw) as ExampleFile
    expect(data).toBeDefined()
    expect(data.inputs).toBeDefined()
    expect(Array.isArray(data.inputs)).toBe(true)
    expect(data.inputs.length).toBeGreaterThan(0)
  })

  it('brief generator output contains expected sections', async () => {
    const raw = readFileSync(examplePath, 'utf8')
    const data = JSON.parse(raw) as ExampleFile

    const inputs: InputItem[] = data.inputs.map((item) => ({
      ...item,
      created_at: new Date(item.created_at),
    }))

    const result = await generateBrief({ runId: 'run-golden-001', inputs })

    expect(result.content).toContain('# Project Brief')
    expect(result.content).toContain('## Summary')
    expect(result.content).toContain('## Target Users')
  })

  it('brief generator output does not contain literal undefined or [object Object]', async () => {
    const raw = readFileSync(examplePath, 'utf8')
    const data = JSON.parse(raw) as ExampleFile

    const inputs: InputItem[] = data.inputs.map((item) => ({
      ...item,
      created_at: new Date(item.created_at),
    }))

    const result = await generateBrief({ runId: 'run-golden-001', inputs })

    expect(result.content).not.toContain('undefined')
    expect(result.content).not.toContain('[object Object]')
  })

  it('brief generator returns correct artifact type', async () => {
    const raw = readFileSync(examplePath, 'utf8')
    const data = JSON.parse(raw) as ExampleFile

    const inputs: InputItem[] = data.inputs.map((item) => ({
      ...item,
      created_at: new Date(item.created_at),
    }))

    const result = await generateBrief({ runId: 'run-golden-001', inputs })

    expect(result.artifactType).toBe('brief')
    expect(result.content.length).toBeGreaterThan(200)
  })
})
