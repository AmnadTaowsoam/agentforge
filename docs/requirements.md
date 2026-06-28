# AgentForge Requirements

## 1. Purpose

AgentForge is a Agentic Project Starter that helps users produce practical, reviewable, and reusable outputs from a focused workflow. The product must be useful as a public repository while still being compatible with Cerebra MCP as an internal orchestration, review, testing, security, and DevOps layer.

## 2. Source Alignment

This requirements document is based on the project overview for the Cerebra public product set. Product definition:

- Name: AgentForge
- Category: Agentic Project Starter
- Summary: Turn a raw product idea into a complete project package that an AI coding agent can continue building.
- Priority: Phase 2 / Top 5
- Cerebra MCP fit: CerebraOrchestrator-mcp, CerebraCodegraph-mcp, CerebraReview-mcp, CerebraTesting-mcp

## 3. Goals

- Provide a complete MVP path from input to usable output.
- Make AgentForge understandable to public GitHub visitors without requiring private Cerebra context.
- Produce artifacts that developers, operators, or AI coding agents can immediately use.
- Include validation, review, risk reporting, and delivery evidence.
- Keep the first release focused enough to build and maintain.

## 4. Non-goals

- Do not build a generic chatbot as the primary product.
- Do not require users to run the full Cerebra MCP platform to understand the repo.
- Do not hide assumptions, missing inputs, or risk warnings.
- Do not perform destructive, paid, or outward-facing actions without explicit confirmation.
- Do not expand into marketplace, billing, or enterprise administration before MVP value is proven.

## 5. Personas

### Primary Builder

The person who runs AgentForge to create or inspect the target artifact. They need clear setup, fast feedback, and usable output.

### Technical Reviewer

The person who evaluates output quality, security, maintainability, and delivery readiness. They need evidence, findings, and clear risk levels.

### Project Owner

The person deciding whether the product is worth adopting or extending. They need a readable README, credible scope, sample output, and a realistic roadmap.

## 6. Inputs

The product must accept these input categories:

- idea description, target users, features, preferred stack, deployment target, constraints, examples
- project metadata: name, owner, tags, target environment
- optional constraints: technology stack, compliance needs, deployment target
- optional examples: sample files, sample repo, sample API, sample workflow, sample prompt, or sample document depending on project type

Required inputs must be explicitly marked. Optional inputs must improve quality but not block basic usage.

## 7. Outputs

The product must produce:

- brief.md, requirements.md, architecture.md, api-contract.md, data-model.md, tasks.md, test-plan.md, README.md, optional app scaffold
- a human-readable report or generated package
- machine-readable metadata where useful
- assumptions and unresolved questions
- validation results
- risk warnings
- next-step checklist

Outputs must be exportable or commit-ready for public repository usage.

## 8. Core Capabilities

- idea intake
- scope clarification
- document generation
- architecture recommendation
- task breakdown
- agent handoff package
- starter repo scaffold
- quality gates

## 9. Functional Requirements

### 9.1 Project or Run Setup

- Users can create a new run or project.
- Users can name the run and provide required inputs.
- The system validates input completeness before execution.
- The system stores run metadata, timestamps, and configuration.
- The system can run with safe sample data for public demos.

### 9.2 Input Validation

- Required fields must be checked before the workflow starts.
- Invalid URLs, file paths, schemas, commands, or configuration values must produce actionable errors.
- Missing context must be shown as questions or warnings.
- The user can proceed with non-blocking warnings only when the workflow is still safe.

### 9.3 Workflow Execution

- The system must expose execution states: draft, ready, running, needs_input, completed, failed, cancelled.
- Each workflow step must have a clear name and status.
- Long-running work must show progress.
- Failed steps must include error category, probable cause, and retry guidance.
- The workflow must be deterministic where deterministic checks are possible.

### 9.4 AI-Assisted Generation or Analysis

- AI output must be marked as draft until validated or reviewed.
- Prompt templates must be versioned when AI is used.
- The system must record source inputs used to generate output.
- The system must separate verified facts from inferred recommendations.
- The system must include assumptions and confidence notes for generated content.

### 9.5 Review and Quality Gates

- The product must include a quality checklist for the core output.
- Blocking issues must be separated from advisory warnings.
- Users must be able to review output before export.
- Review evidence must include timestamp, run ID, and checklist version.
- The MVP must include at least one end-to-end sample demonstrating the quality gate.

### 9.6 Export and Handoff

- Users can export the final result as Markdown.
- Where useful, users can export JSON metadata.
- Generated files must be organized in predictable paths.
- Exports must include source metadata, generation date, and warning status.
- Outputs must be suitable for GitHub commits, issue creation, or direct implementation handoff.

### 9.7 Public Repository Experience

- README must explain the product, target users, and basic workflow.
- docs/brief.md must describe why the product exists and what MVP should do.
- docs/requirements.md must define build-ready requirements.
- docs/architecture.md, roadmap.md, and delivery-checklist.md should stay consistent with the product direction.
- The repo must include a license and ignore common local artifacts.

## 10. Product-Specific Requirements

### 10.1 Required MVP Workflow

A user enters an idea such as a repair-shop queue booking system. AgentForge expands it into brief, requirements, architecture, API contract, data model, task plan, test plan, README, and optional backend/frontend starter structure.

The MVP must prove this workflow with one complete, documented example.

### 10.2 Product-Specific Features

- idea intake
- scope clarification
- document generation
- architecture recommendation
- task breakdown
- agent handoff package
- starter repo scaffold
- quality gates

### 10.3 Product-Specific Quality Bar

- Output must match the Agentic Project Starter use case.
- Output must be concrete enough for a developer or operator to act on.
- Output must avoid generic AI advice when a specific artifact is expected.
- Output must include warnings for unsafe, incomplete, or unverifiable items.
- Output must be reproducible from the same inputs and configuration.

## 11. Suggested Data Model

### project

- id
- name
- category
- owner
- description
- status
- created_at
- updated_at

### run

- id
- project_id
- status
- input_hash
- config_json
- started_at
- completed_at
- failure_reason

### input_item

- id
- run_id
- type
- label
- content_ref
- validation_status
- warnings_json

### output_artifact

- id
- run_id
- artifact_type
- path
- content_ref
- validation_status
- created_at

### finding

- id
- run_id
- severity
- category
- title
- description
- recommendation
- evidence_ref

### review_event

- id
- run_id
- reviewer
- decision
- checklist_version
- notes
- created_at

## 12. API Requirements

If implemented as a service, expose:

- POST /api/v1/projects
- GET /api/v1/projects/:id
- POST /api/v1/projects/:id/runs
- GET /api/v1/runs/:id
- POST /api/v1/runs/:id/cancel
- GET /api/v1/runs/:id/artifacts
- GET /api/v1/runs/:id/findings
- POST /api/v1/runs/:id/review
- POST /api/v1/runs/:id/export

API errors must include stable error codes, request IDs, and validation details.

## 13. CLI Requirements

If implemented as a CLI, support:

- init or create command for a new project
- un command for the main workflow
- alidate command for inputs and generated output
- export command for final artifacts
- doctor command for environment checks
- --json mode for automation
- non-zero exit codes for blocking failures

## 14. Security Requirements

Main risk areas: over-scoped outputs, vague requirements, hallucinated constraints, generated architecture that does not match user capability

Security requirements:

- Never log secrets or full credentials.
- Require confirmation before destructive or outward-facing actions.
- Treat external repositories, documents, specs, and generated commands as untrusted input.
- Isolate execution of untrusted code or commands.
- Store tokens only through environment variables or managed secret stores.
- Redact sensitive fields in reports.
- Include audit records for run creation, export, and approval.
- Apply least privilege to integrations.

## 15. Privacy Requirements

- Users must know what data is sent to AI providers.
- The product must support safe sample data for public demos.
- Private inputs must not be included in public examples.
- Exported reports must label sensitive sections when applicable.
- Deletion behavior must be documented.

## 16. Observability Requirements

- Every run must have a unique run ID.
- Logs must include step name, status, duration, and failure category.
- AI calls must record provider, model, latency, and token usage when applicable.
- Validation failures must be countable by category.
- Exports must record artifact type and destination.

## 17. Testing Requirements

- Unit tests for input validation.
- Golden-file tests for generated Markdown or JSON artifacts.
- Integration test for the full MVP workflow.
- Error-path tests for missing inputs and failed external calls.
- Security tests for secret redaction.
- CLI or API smoke test for public demo path.

## 18. Acceptance Criteria

The MVP is ready when:

- a new user can understand AgentForge from README.md
- docs/brief.md and docs/requirements.md match the product concept
- one sample input can produce one useful sample output
- validation catches missing required inputs
- risks and assumptions are visible
- final output can be exported or committed
- tests cover the happy path and at least three failure paths
- no secrets are committed
- public GitHub repo is coherent and useful

## 19. Delivery Plan

### Phase 1 - Documentation and Samples

- finalize README, brief, requirements, architecture, roadmap, and checklist
- add sample input and expected output
- define quality checklist

### Phase 2 - Minimal Runnable Workflow

- implement input parser
- implement validation
- implement core generation or audit workflow
- implement Markdown export
- add smoke test

### Phase 3 - Review and Governance

- add findings model
- add review event
- add risk levels
- add audit events
- add JSON export

### Phase 4 - Integrations

- add the first useful integration
- add CI workflow
- add packaged release
- add examples for real-world usage

### Phase 5 - Public Launch

- polish README
- add demo screenshots or terminal output
- add contribution guide
- tag first release
- publish roadmap issues

## 20. Open Decisions

- exact implementation form: CLI, web app, library, or hybrid
- first sample use case
- first supported integration
- AI provider defaults
- persistence choice for MVP
- whether to include Cerebra MCP adapter in v1 or keep it as internal implementation detail
