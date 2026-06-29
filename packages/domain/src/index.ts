// AgentForge domain types — all 9 data models

// ─── Workspace ───────────────────────────────────────────────────────────────

export interface Workspace {
  id: string
  name: string
  plan: string
  retention_days: number
  created_at: Date
  updated_at: Date
}

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = 'owner' | 'admin' | 'editor' | 'reviewer' | 'viewer'

export interface User {
  id: string
  email: string
  display_name: string
  role: UserRole
  created_at: Date
  last_seen_at: Date | null
}

// ─── Project ─────────────────────────────────────────────────────────────────

export type ProjectStatus = 'draft' | 'active' | 'archived'

export interface Project {
  id: string
  workspace_id: string
  name: string
  domain: string
  status: ProjectStatus
  owner_user_id: string
  metadata_json: Record<string, unknown>
  created_at: Date
  updated_at: Date
}

// ─── Run ─────────────────────────────────────────────────────────────────────

export type RunStatus =
  | 'draft'
  | 'ready'
  | 'running'
  | 'needs_input'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type TriggerType = 'manual' | 'scheduled' | 'api'

export interface Run {
  id: string
  project_id: string
  status: RunStatus
  trigger_type: TriggerType
  config_json: Record<string, unknown>
  input_hash: string
  started_by: string
  started_at: Date | null
  completed_at: Date | null
  failure_code: string | null
  failure_message: string | null
}

// ─── Input Item ──────────────────────────────────────────────────────────────

export type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'warning'

export interface ValidationWarning {
  code: string
  message: string
  field?: string | undefined
}

export interface InputItem {
  id: string
  run_id: string
  input_type: string
  label: string
  content_ref: string
  validation_status: ValidationStatus
  warnings_json: ValidationWarning[]
  created_at: Date
}

// ─── Artifact ────────────────────────────────────────────────────────────────

export type ArtifactType =
  | 'brief'
  | 'requirements'
  | 'architecture'
  | 'api-contract'
  | 'data-model'
  | 'tasks'
  | 'test-plan'
  | 'readme'
  | 'scaffold'

export interface Artifact {
  id: string
  run_id: string
  artifact_type: ArtifactType
  path: string
  content_ref: string
  checksum: string
  validation_status: ValidationStatus
  created_at: Date
}

// ─── Finding ─────────────────────────────────────────────────────────────────

export type FindingSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical'
export type FindingStatus = 'open' | 'resolved' | 'waived' | 'dismissed'

export interface Finding {
  id: string
  run_id: string
  severity: FindingSeverity
  category: string
  title: string
  body: string
  evidence_ref: string | null
  suggested_fix: string | null
  status: FindingStatus
  created_at: Date
}

// ─── Review Event ────────────────────────────────────────────────────────────

export type ReviewDecision = 'approved' | 'rejected' | 'waived' | 'needs_revision'

export interface ReviewEvent {
  id: string
  run_id: string
  reviewer_user_id: string
  decision: ReviewDecision
  checklist_version: string
  notes: string | null
  created_at: Date
}

// ─── Audit Event ─────────────────────────────────────────────────────────────

export interface AuditEvent {
  id: string
  workspace_id: string
  actor_user_id: string
  action: string
  target_type: string
  target_id: string
  metadata_json: Record<string, unknown>
  created_at: Date
}

// ─── API Error ───────────────────────────────────────────────────────────────

export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'EXTERNAL_SERVICE_FAILED'
  | 'WORKFLOW_FAILED'
  | 'EXPORT_FAILED'

export interface ApiError {
  requestId: string
  code: ApiErrorCode
  message: string
  details?: Record<string, unknown> | undefined
}
