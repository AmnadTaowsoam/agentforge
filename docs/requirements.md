# AgentForge Requirements

## 1. Purpose

AgentForge is a agent builder for AI product teams, solution architects, prompt engineers. The product must support the complete path from setup to reviewed output, with enough traceability and operational control for real use by a small team.

## 2. Goals

- Deliver one reliable end-to-end workflow for agent builder.
- Make inputs, assumptions, decisions, and outputs explicit.
- Reduce manual setup and handoff work.
- Provide human review points before risky or outward-facing actions.
- Produce artifacts that can be used directly by engineering, operations, or stakeholders.

## 3. Non-goals

- Do not build a general chat application as the primary experience.
- Do not automate destructive, external, or high-risk actions without review.
- Do not require enterprise infrastructure for the first release.
- Do not hide AI uncertainty; assumptions and source gaps must be visible.
- Do not optimize for broad marketplace features before the core workflow works.

## 4. Personas

### Primary operator

Needs to run the workflow, inspect output, and deliver results quickly. Values clear steps, low setup cost, and trustworthy output.

### Technical owner

Needs integration control, data visibility, security review, and deployment confidence. Values APIs, logs, configuration, and predictable failure behavior.

### Reviewer or approver

Needs to verify that output is complete, safe, and ready to use. Values evidence, diffs, warnings, and approval history.

## 5. Core capabilities

The MVP must include these capabilities:

- agent profile editor, instruction versioning, tool permission matrix, eval harness, deployment checklist
- workspace and project management
- role-based user access
- guided intake forms with validation
- source attachment and reference tracking
- AI-assisted draft generation or analysis
- deterministic rule checks where possible
- review, edit, approve, and reject states
- export to Markdown and JSON
- audit events for important actions
- admin-configurable retention and integration settings

## 6. Functional requirements

### 6.1 Workspace management

- Users can create a workspace.
- Users can invite collaborators by email.
- Workspace roles must include owner, editor, reviewer, and viewer.
- Owners can configure retention, integrations, and default workflow templates.
- Every project belongs to exactly one workspace.

### 6.2 Project lifecycle

- Users can create, archive, restore, and delete projects.
- Each project has status: draft, ready, running, review, approved, delivered, archived.
- Each project stores owner, reviewers, due date, tags, and risk level.
- Status changes must be logged with actor, timestamp, previous state, and next state.

### 6.3 Intake and validation

- The product must provide a guided intake form for agent builder.
- Required fields must be validated before a run starts.
- Optional fields should improve output quality but must not block basic usage.
- Missing critical information must be reported as explicit questions or warnings.
- Users can attach files, URLs, repository references, API specs, or free text where relevant.

### 6.4 Workflow execution

- Users can start a run only after required inputs pass validation.
- Runs must have status: queued, running, needs_input, failed, completed, cancelled.
- The system must support cancellation before final output is committed.
- Long-running work must show progress by step.
- Failed runs must expose actionable error messages and retry guidance.

### 6.5 AI assistance

- AI output must be stored with prompt version, model/provider, input references, and timestamp.
- AI-generated content must be marked as draft until reviewed.
- The system must separate verified facts, inferred recommendations, and unresolved assumptions.
- Prompts must be versioned so old runs remain explainable.
- Sensitive inputs must be redacted from logs unless explicitly allowed by policy.

### 6.6 Review and approval

- Reviewers can comment on outputs and request changes.
- Users can compare output versions.
- Approval requires all blocking warnings to be resolved or explicitly waived.
- Waivers must include reason, approver, and timestamp.
- Delivered output must link back to the approved version.

### 6.7 Export and handoff

- Users can export approved output as Markdown.
- Users can export machine-readable output as JSON.
- The product should support at least one integration handoff in MVP: OpenAI API, GitHub, vector stores, observability backends.
- Exports must include metadata, source references, approval state, and generation date.

### 6.8 Admin and configuration

- Owners can configure allowed integrations.
- Owners can configure default templates.
- Owners can view audit logs.
- Owners can set data retention windows.
- Owners can disable AI features for a workspace if required.

## 7. Suggested data model

### users

- id
- email
- display_name
- created_at
- last_login_at

### workspaces

- id
- name
- owner_user_id
- retention_days
- created_at

### workspace_members

- workspace_id
- user_id
- role
- invited_by
- created_at

### projects

- id
- workspace_id
- name
- description
- status
- risk_level
- owner_user_id
- due_date
- created_at
- updated_at

### project_inputs

- id
- project_id
- input_type
- label
- content_uri
- content_text
- validation_status
- created_at

### runs

- id
- project_id
- status
- prompt_version
- model_provider
- model_name
- started_by
- started_at
- completed_at
- failure_reason

### outputs

- id
- run_id
- version
- format
- content
- source_reference_map
- created_at

### reviews

- id
- output_id
- reviewer_user_id
- status
- comments
- approved_at

### audit_events

- id
- workspace_id
- project_id
- actor_user_id
- action
- metadata_json
- created_at

## 8. API requirements

The backend should expose a versioned REST API or GraphQL schema. Minimum REST endpoints:

- POST /api/v1/workspaces
- GET /api/v1/workspaces/:id
- POST /api/v1/workspaces/:id/members
- POST /api/v1/projects
- GET /api/v1/projects/:id
- PATCH /api/v1/projects/:id
- POST /api/v1/projects/:id/inputs
- POST /api/v1/projects/:id/runs
- GET /api/v1/runs/:id
- POST /api/v1/runs/:id/cancel
- GET /api/v1/projects/:id/outputs
- POST /api/v1/outputs/:id/reviews
- POST /api/v1/outputs/:id/export
- GET /api/v1/audit-events

API responses must include stable error codes, request IDs, and validation details.

## 9. Security requirements

Primary risk areas: prompt injection, unsafe tool access, evaluation gaps, unclear ownership.

Security requirements:

- authenticate all non-public endpoints
- enforce workspace-level authorization on every object
- encrypt secrets at rest
- never return another workspace's data through search, export, or logs
- maintain audit logs for status changes, approvals, integration calls, and export actions
- support least-privilege integration tokens
- redact secrets and sensitive document snippets from application logs
- require confirmation for destructive actions
- block external delivery when required approvals are missing

## 10. Privacy and compliance

- Users must know what data is sent to AI providers.
- Workspace owners must be able to disable provider logging where supported.
- Retention policy must be configurable.
- Deleting a project must delete or tombstone derived outputs according to policy.
- Export files must include sensitivity labels when configured.

## 11. Observability

- Log every request with request ID, user ID, workspace ID, and latency.
- Track workflow step duration.
- Track AI provider usage, latency, and failure rates.
- Emit audit events separately from debug logs.
- Provide admin-facing error reports for failed runs.

## 12. Non-functional requirements

- First useful output should be produced in under 90 seconds for normal inputs.
- The app must support at least 50 active projects per workspace in MVP.
- The backend must be horizontally scalable for run workers.
- The UI must be usable on desktop and tablet widths.
- The product must degrade gracefully when AI provider calls fail.
- All critical flows must have automated tests.

## 13. Acceptance criteria

The MVP is acceptable when:

- a new user can create a workspace and project without support
- required inputs are validated before execution
- the core workflow produces a draft output
- a reviewer can request changes and approve the final output
- the approved output can be exported
- audit logs show the complete project lifecycle
- unauthorized users cannot access workspace data
- failed runs can be diagnosed from logs and UI messages
- documentation explains setup, operation, and release readiness

## 14. Delivery plan

### Phase 1 - Foundation

- repository setup
- app shell
- auth and workspace model
- database migrations
- audit log foundation

### Phase 2 - Core workflow

- project creation
- intake schema
- validation rules
- run orchestration
- output storage

### Phase 3 - AI and review

- prompt templates
- provider abstraction
- draft output generation
- review comments
- approval workflow

### Phase 4 - Export and integrations

- Markdown export
- JSON export
- first integration handoff
- integration audit events

### Phase 5 - Production readiness

- security review
- automated tests
- observability
- deployment guide
- incident and rollback procedures

## 15. Test requirements

- unit tests for validation rules
- API tests for authorization and workspace isolation
- integration tests for run lifecycle
- snapshot or golden-file tests for exports
- security tests for unauthorized access
- failure-path tests for provider outages
- end-to-end test for create project to approved export

## 16. Open decisions

- exact implementation stack
- first integration to support
- pricing and account model
- data retention default
- AI provider and model defaults
- whether self-hosting is required in v1
