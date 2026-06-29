export function makeWorkspaceId(): string {
  return crypto.randomUUID()
}

export function makeUserId(): string {
  return crypto.randomUUID()
}

export function makeRunId(): string {
  return crypto.randomUUID()
}

// Create a minimal fake JWT payload (no signing — for unit tests only)
export function fakeBearerToken(payload: { userId: string; workspaceId: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `Bearer ${header}.${body}.fakesig`
}

export const REPAIR_SHOP_IDEA =
  'A web app for a small auto repair shop to manage their service queue, track vehicle repair status, and notify customers when their car is ready.'
