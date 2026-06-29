import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import fastifySensible from '@fastify/sensible'
import { config } from './config.js'
import { pool } from './db/index.js'
import { registerErrorHandler } from './plugins/error-handler.js'
import { healthRoutes } from './routes/health.js'
import { authRoutes } from './routes/auth.js'
import { workspaceRoutes } from './routes/workspaces.js'
import { projectRoutes } from './routes/projects.js'
import { runRoutes } from './routes/runs.js'
import { artifactRoutes } from './routes/artifacts.js'
import { findingRoutes } from './routes/findings.js'
import { reviewRoutes } from './routes/review.js'
import { exportRoutes } from './routes/export.js'
import { auditRoutes } from './routes/audit.js'

const app = fastify({ logger: true, genReqId: () => crypto.randomUUID() })

// Plugins
await app.register(fastifyJwt, { secret: config.JWT_SECRET })
await app.register(fastifyCors, { origin: true })
await app.register(fastifySensible)

// Error handler
registerErrorHandler(app)

// Routes (no auth)
await app.register(healthRoutes)
await app.register(authRoutes)

// Routes (auth handled per-route via preHandler)
await app.register(workspaceRoutes)
await app.register(projectRoutes)
await app.register(runRoutes)
await app.register(artifactRoutes)
await app.register(findingRoutes)
await app.register(reviewRoutes)
await app.register(exportRoutes)
await app.register(auditRoutes)

// Start
const start = async () => {
  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' })
    app.log.info(`Server listening on port ${config.PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

// Graceful shutdown
const shutdown = async () => {
  app.log.info('Shutting down...')
  await app.close()
  await pool.end()
  process.exit(0)
}

process.on('SIGTERM', () => void shutdown())
process.on('SIGINT', () => void shutdown())

await start()
