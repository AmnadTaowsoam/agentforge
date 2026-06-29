import { describe, it, expect } from 'vitest'
import { secretRedact } from '../utils/redact.js'

describe('secretRedact utility', () => {
  it('redacts password= pattern', () => {
    const input = 'connection string: password=mysecret host=localhost'
    const result = secretRedact(input)
    expect(result).not.toContain('mysecret')
    expect(result).toContain('password= [REDACTED]')
  })

  it('redacts token: pattern (colon separator)', () => {
    const input = 'header: token: abc123'
    const result = secretRedact(input)
    expect(result).not.toContain('abc123')
    expect(result).toContain('[REDACTED]')
  })

  it('redacts api_key= pattern', () => {
    const input = 'request failed: api_key=sk-1234 unauthorized'
    const result = secretRedact(input)
    expect(result).not.toContain('sk-1234')
    expect(result).toContain('api_key= [REDACTED]')
  })

  it('redacts secret= pattern', () => {
    const input = 'config: secret=my-super-secret-value'
    const result = secretRedact(input)
    expect(result).not.toContain('my-super-secret-value')
    expect(result).toContain('[REDACTED]')
  })

  it('redacts authorization: pattern', () => {
    const input = 'header: authorization: Bearer eyJhbGciOiJIUzI1NiJ9'
    const result = secretRedact(input)
    expect(result).not.toContain('eyJhbGciOiJIUzI1NiJ9')
    expect(result).toContain('[REDACTED]')
  })

  it('leaves normal log lines unchanged', () => {
    const input = 'Run completed successfully with 7 artifacts in 2340ms'
    expect(secretRedact(input)).toBe(input)
  })

  it('leaves artifact type names unchanged', () => {
    const input = 'Generating artifact type: api-contract for run run-001'
    expect(secretRedact(input)).toBe(input)
  })

  it('redacts all occurrences when multiple secrets appear in one line', () => {
    const input = 'env: password=abc123 and token=xyz789'
    const result = secretRedact(input)
    expect(result).not.toContain('abc123')
    expect(result).not.toContain('xyz789')
    expect(result.match(/\[REDACTED\]/g)?.length).toBe(2)
  })
})
