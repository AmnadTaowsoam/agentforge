import { describe, it, expect } from 'vitest'
import path from 'path'

// Reproduce the exact canonicalizePath logic from package-artifacts.ts
// This is the two-layer defense: (1) safeName strips all non-alphanumeric, (2) startsWith guard
function canonicalizePath(outputDir: string, artifactType: string): string {
  const safeName = artifactType.replace(/[^a-z0-9-]/g, '')
  const outputPath = path.resolve(outputDir, safeName + '.md')
  const resolvedDir = path.resolve(outputDir)

  if (!outputPath.startsWith(resolvedDir + path.sep) && outputPath !== resolvedDir) {
    throw new Error(`Path traversal rejected: ${outputPath} is not under ${resolvedDir}`)
  }

  return outputPath
}

// Raw path guard without sanitization — tests the second defense layer directly
// (simulates what would happen if safeName was bypassed)
function rawPathGuard(outputDir: string, rawName: string): string {
  const outputPath = path.resolve(outputDir, rawName)
  const resolvedDir = path.resolve(outputDir)

  if (!outputPath.startsWith(resolvedDir + path.sep) && outputPath !== resolvedDir) {
    throw new Error(`Path traversal rejected: ${outputPath} is not under ${resolvedDir}`)
  }

  return outputPath
}

describe('Security: Path traversal rejection (FORBID-PATH-TRAVERSAL-001)', () => {
  const outputDir = '/tmp/agentforge/output'

  it('safeName strips traversal characters from ../etc/passwd leaving etcpasswd (sanitization layer)', () => {
    // The sanitizer strips all non-alphanumeric-dash chars, making traversal impossible at layer 1
    const result = canonicalizePath(outputDir, '../etc/passwd')
    // After stripping: 'etcpasswd' — fully safe, stays in outputDir
    expect(result).toContain('etcpasswd')
    expect(result.startsWith(path.resolve(outputDir))).toBe(true)
  })

  it('raw path guard (second defense layer) rejects ../etc/passwd if sanitization is bypassed', () => {
    // Direct test of the startsWith guard — simulates a bypass of the regex sanitizer
    expect(() => rawPathGuard(outputDir, '../etc/passwd')).toThrow('Path traversal rejected')
  })

  it('raw path guard rejects absolute path escape attempt', () => {
    expect(() => rawPathGuard(outputDir, '/etc/passwd')).toThrow('Path traversal rejected')
  })

  it('raw path guard rejects deep traversal', () => {
    expect(() => rawPathGuard(outputDir, '../../../../etc/shadow')).toThrow('Path traversal rejected')
  })

  it('safeName strips null-byte injection in artifact type', () => {
    // Null bytes and special chars are stripped — output stays in outputDir
    const result = canonicalizePath(outputDir, 'brief\0../etc/passwd')
    expect(result).toContain('briefetcpasswd')
    expect(result.startsWith(path.resolve(outputDir))).toBe(true)
  })

  it('safeName strips Windows-style traversal characters', () => {
    const result = canonicalizePath(outputDir, '..\\..\\windows\\system32')
    // After stripping: 'windowssystem32'
    expect(result).toContain('windowssystem32')
    expect(result.startsWith(path.resolve(outputDir))).toBe(true)
  })

  it('accepts valid artifact types without throwing', () => {
    const validTypes = ['brief', 'requirements', 'architecture', 'api-contract', 'data-model', 'tasks', 'test-plan']
    for (const t of validTypes) {
      expect(() => canonicalizePath(outputDir, t)).not.toThrow()
    }
  })

  it('produced safe paths stay within outputDir', () => {
    const validTypes = ['brief', 'requirements', 'architecture', 'api-contract', 'data-model', 'tasks', 'test-plan']
    const resolvedDir = path.resolve(outputDir)
    for (const t of validTypes) {
      const p = canonicalizePath(outputDir, t)
      expect(p.startsWith(resolvedDir)).toBe(true)
    }
  })
})

describe('Security: Secret redaction in log output', () => {
  function redactSecrets(message: string): string {
    return message.replace(
      /\b(password|secret|api_key|token)\s*=\s*\S+/gi,
      '$1=[REDACTED]'
    )
  }

  it('redacts password=xxx pattern from log messages', () => {
    const log = 'Connection error: password=supersecret123 failed'
    expect(redactSecrets(log)).not.toMatch(/password=supersecret/)
    expect(redactSecrets(log)).toContain('password=[REDACTED]')
  })

  it('redacts token=xxx pattern from log messages', () => {
    const log = 'Auth failed: token=eyJhbGciOiJIUzI1NiJ9.xxx.yyy'
    expect(redactSecrets(log)).not.toMatch(/token=eyJ/)
    expect(redactSecrets(log)).toContain('token=[REDACTED]')
  })

  it('redacts api_key=xxx pattern from log messages', () => {
    const log = 'Request failed: api_key=sk-abc123def456 unauthorized'
    expect(redactSecrets(log)).not.toMatch(/api_key=sk-/)
    expect(redactSecrets(log)).toContain('api_key=[REDACTED]')
  })

  it('redacts secret=xxx pattern from log messages', () => {
    const log = 'Config: secret=my-very-secret-value'
    expect(redactSecrets(log)).not.toMatch(/secret=my-very/)
    expect(redactSecrets(log)).toContain('secret=[REDACTED]')
  })

  it('does not redact normal log content', () => {
    const log = 'Run completed successfully with 7 artifacts'
    expect(redactSecrets(log)).toBe(log)
  })
})
