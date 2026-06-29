import type { FastifyInstance, FastifyError } from 'fastify'
import type { ApiErrorCode } from '@agentforge/domain'

const statusToCode: Record<number, ApiErrorCode> = {
  400: 'VALIDATION_FAILED',
  401: 'AUTH_REQUIRED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const requestId = (request.id as string) ?? crypto.randomUUID()
    const status = error.statusCode ?? 500
    const code: ApiErrorCode = statusToCode[status] ?? 'VALIDATION_FAILED'

    app.log.error({ requestId, err: error }, error.message)

    void reply.status(status).send({
      requestId,
      code,
      message: error.message,
      ...(error.validation ? { details: { validation: error.validation } } : {}),
    })
  })
}
