const env = (key: string, fallback?: string): string => {
  const val = process.env[key] ?? fallback
  if (val === undefined) {
    console.error(`FATAL: missing required env var ${key}`)
    process.exit(1)
  }
  return val
}

export const config = {
  PORT: parseInt(env('PORT', '4303'), 10),
  DATABASE_URL: env('DATABASE_URL', 'postgresql://localhost:5432/agentforge'),
  JWT_SECRET: env('JWT_SECRET', 'dev-secret-key-not-for-production-use'),
  NODE_ENV: env('NODE_ENV', 'development'),
} as const

if (config.NODE_ENV !== 'development' && config.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters in non-development environments')
  process.exit(1)
}
