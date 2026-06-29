import type { FastifyRequest, FastifyReply } from 'fastify'
import type { UserRole } from '@agentforge/domain'

export interface AuthUser {
  userId: string
  workspaceId: string
  role: UserRole
}

// Augment @fastify/jwt so that request.user resolves to AuthUser
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUser
    user: AuthUser
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const auth = request.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return reply.status(401).send({
      requestId: crypto.randomUUID(),
      code: 'AUTH_REQUIRED',
      message: 'Authorization header with Bearer token is required',
    })
  }
  try {
    await request.jwtVerify()
  } catch {
    return reply.status(401).send({
      requestId: crypto.randomUUID(),
      code: 'AUTH_REQUIRED',
      message: 'Invalid or expired token',
    })
  }
}
