# AgentForge Architecture

## System shape

Recommended architecture:

- Web app for workspace, project, review, and admin screens.
- API service for auth, authorization, project data, exports, and audit events.
- Worker service for long-running workflow execution and AI calls.
- Postgres for transactional data.
- Object storage for uploaded files and generated exports.
- Queue for run execution and retry control.
- Provider adapter layer for AI, integrations, and external delivery targets.

## Component boundaries

- UI must not call AI providers directly.
- API owns authorization, validation, and project lifecycle.
- Workers own execution steps and must write progress events.
- Integration adapters must be isolated behind interfaces.
- Audit logging must be available to both API and worker services.

## Key design decisions

- Use explicit workflow state instead of free-form chat state.
- Store every important output version.
- Keep prompt versions and input references attached to runs.
- Treat external integrations as optional adapters.
- Make review and approval first-class records.
