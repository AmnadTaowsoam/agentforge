import type {
  Workspace,
  Project,
  Run,
  Artifact,
  Finding,
  AuditEvent,
} from '@agentforge/domain'

// ─── Token helpers ────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('agentforge_token')
}

type LogoutFn = () => void
let _logout: LogoutFn | null = null

export function registerLogout(fn: LogoutFn) {
  _logout = fn
}

// ─── Core fetch ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(path, { ...init, headers })

  if (res.status === 401) {
    if (_logout) _logout()
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json()
      message = body?.message ?? message
    } catch {
      // ignore parse error
    }
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string
  userId: string
  workspaceId: string
  role: string
}

export function register(body: {
  email: string
  password: string
  displayName: string
  workspaceName: string
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function login(body: {
  email: string
  password: string
  workspaceId?: string
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// ─── Workspaces ──────────────────────────────────────────────────────────────

export function getWorkspace(id: string): Promise<Workspace> {
  return apiFetch<Workspace>(`/api/v1/workspaces/${id}`)
}

// ─── Projects ────────────────────────────────────────────────────────────────

export function createProject(body: {
  name: string
  domain?: string
  metadata_json?: Record<string, unknown>
}): Promise<Project> {
  return apiFetch<Project>('/api/v1/projects', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/api/v1/projects/${id}`)
}

export function updateProject(
  id: string,
  body: Partial<{ name: string; domain: string; metadata_json: Record<string, unknown> }>
): Promise<Project> {
  return apiFetch<Project>(`/api/v1/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

// ─── Runs ─────────────────────────────────────────────────────────────────────

export function createRun(projectId: string): Promise<Run> {
  return apiFetch<Run>(`/api/v1/projects/${projectId}/runs`, { method: 'POST' })
}

export function getRun(id: string): Promise<Run> {
  return apiFetch<Run>(`/api/v1/runs/${id}`)
}

export function cancelRun(id: string): Promise<Run> {
  return apiFetch<Run>(`/api/v1/runs/${id}/cancel`, { method: 'POST' })
}

export function getArtifacts(runId: string): Promise<Artifact[]> {
  return apiFetch<Artifact[]>(`/api/v1/runs/${runId}/artifacts`)
}

export function getFindings(runId: string): Promise<Finding[]> {
  return apiFetch<Finding[]>(`/api/v1/runs/${runId}/findings`)
}

export interface ReviewBody {
  decision: 'approved' | 'rejected' | 'waived' | 'needs_revision'
  notes?: string
}

export function submitReview(runId: string, body: ReviewBody): Promise<unknown> {
  return apiFetch<unknown>(`/api/v1/runs/${runId}/review`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export interface ExportResponse {
  runId: string
  artifacts: Array<{ type: string; content: string }>
}

export function exportRun(runId: string): Promise<ExportResponse> {
  return apiFetch<ExportResponse>(`/api/v1/runs/${runId}/export`, { method: 'POST' })
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditPage {
  data: AuditEvent[]
  total: number
  page: number
  limit: number
}

export function getAuditEvents(page = 1, limit = 20): Promise<AuditPage> {
  return apiFetch<AuditPage>(`/api/v1/audit-events?page=${page}&limit=${limit}`)
}

// ─── Health ──────────────────────────────────────────────────────────────────

export function getHealth(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>('/health')
}
