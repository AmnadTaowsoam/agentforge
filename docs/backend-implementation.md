# AgentForge Backend Implementation Specification

## Backend Promise

The backend must be production-shaped from day one. It should support real users, persistent state, auditability, validation, background jobs, integration boundaries, and safe failure behavior.

## Recommended Runtime

- API: Node.js/TypeScript with Fastify or NestJS.
- Alternative: Python/FastAPI where AI/data processing dominates.
- Database: PostgreSQL for projects, documents, versions, tasks, review events.
- Queue: Document generation and scaffold generation jobs.
- Cache: optional Redis only for rate limits, short-lived locks, and job coordination.
- Storage: local filesystem for MVP samples; S3-compatible object storage for production.
- Auth: email/password or OAuth in MVP, abstracted for SSO later.

## Core Backend Modules

- idea-intake
- spec-generator
- architecture-planner
- task-compiler
- scaffold-writer
- agent-handoff
- review-loop
- exporter

## Service Boundaries

- API service owns auth, authorization, validation, and read/write APIs.
- Worker service owns long-running generation, audit, scan, sync, or eval tasks.
- Integration adapters isolate external APIs.
- Policy service or module evaluates allowed actions and approval needs.
- Export service creates Markdown, JSON, ZIP, or generated project files.
- Audit service records important events independently from debug logs.

## Data Model

### workspaces

- id
- name
- plan
- retention_days
- created_at
- updated_at

### users

- id
- email
- display_name
- role
- created_at
- last_seen_at

### projects

- id
- workspace_id
- name
- domain: 'agentic project starting'
- status
- owner_user_id
- metadata_json
- created_at
- updated_at

### runs

- id
- project_id
- status
- trigger_type
- config_json
- input_hash
- started_by
- started_at
- completed_at
- failure_code
- failure_message

### input_items

- id
- run_id
- input_type
- label
- content_ref
- validation_status
- warnings_json
- created_at

### artifacts

- id
- run_id
- artifact_type
- path
- content_ref
- checksum
- validation_status
- created_at

### findings

- id
- run_id
- severity
- category
- title
- body
- evidence_ref
- suggested_fix
- status
- created_at

### review_events

- id
- run_id
- reviewer_user_id
- decision
- checklist_version
- notes
- created_at

### audit_events

- id
- workspace_id
- actor_user_id
- action
- target_type
- target_id
- metadata_json
- created_at

## API Surface

- 'POST /api/v1/workspaces'
- 'GET /api/v1/workspaces/:workspaceId'
- 'POST /api/v1/projects'
- 'GET /api/v1/projects/:projectId'
- 'PATCH /api/v1/projects/:projectId'
- 'POST /api/v1/projects/:projectId/runs'
- 'GET /api/v1/runs/:runId'
- 'POST /api/v1/runs/:runId/cancel'
- 'GET /api/v1/runs/:runId/artifacts'
- 'GET /api/v1/runs/:runId/findings'
- 'POST /api/v1/runs/:runId/review'
- 'POST /api/v1/runs/:runId/export'
- 'GET /api/v1/audit-events'
- 'GET /health'
- 'GET /ready'

## Domain Workflow

1. Create project for agentic project starting.
2. Validate required inputs.
3. Create run with immutable config snapshot.
4. Enqueue job.
5. Worker executes module pipeline.
6. Worker writes artifacts, findings, and audit events.
7. API exposes review and export.
8. User approves or requests changes.

## Job Pipeline

- 'validate-inputs'
- 'prepare-context'
- 'execute-core-workflow'
- 'validate-output'
- 'generate-findings'
- 'package-artifacts'
- 'notify-reviewers'

Jobs must be idempotent by 'run_id' and step name. Retried jobs must not duplicate artifacts without a new version.

## Error Model

Use stable error codes:

- 'VALIDATION_FAILED'
- 'AUTH_REQUIRED'
- 'FORBIDDEN'
- 'NOT_FOUND'
- 'CONFLICT'
- 'RATE_LIMITED'
- 'EXTERNAL_SERVICE_FAILED'
- 'WORKFLOW_FAILED'
- 'EXPORT_FAILED'

Each error response includes 'requestId', 'code', 'message', and optional 'details'.

## Security Controls

- Workspace isolation on every query.
- Role-based access: owner, admin, editor, reviewer, viewer.
- Secret values never stored in project config; only secret references.
- External inputs treated as untrusted.
- Audit events for run, review, export, integration call, policy waiver.
- Rate limits per user and workspace.
- SSRF protection for URL-based imports.
- File size and file type limits.
- Malware scanning hook for uploaded files when applicable.

## Observability

- Structured logs with request ID, workspace ID, project ID, run ID.
- Metrics for run duration, failure rate, queue latency, export count.
- Trace each workflow step.
- Store worker failure reason and retry count.
- Admin report for failed jobs.

## Acceptance Criteria

- API can create project, create run, poll status, fetch artifacts, review, and export.
- Worker can complete the primary agentic project starting workflow using sample inputs.
- All writes are scoped by workspace.
- Failed runs are diagnosable from UI and logs.
- No secret is present in logs, artifacts, or sample exports.
