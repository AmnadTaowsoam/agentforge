export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface Config {
  databaseUrl: string
  aiProvider: string
  logLevel: LogLevel
}

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) {
    throw new Error(`Required environment variable ${name} is not set`)
  }
  return val
}

function parseLogLevel(raw: string | undefined): LogLevel {
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
  if (raw && (levels as string[]).includes(raw)) {
    return raw as LogLevel
  }
  return 'info'
}

export const config: Config = {
  databaseUrl: requireEnv('DATABASE_URL'),
  aiProvider: process.env['AI_PROVIDER'] ?? 'mock',
  logLevel: parseLogLevel(process.env['LOG_LEVEL']),
}
