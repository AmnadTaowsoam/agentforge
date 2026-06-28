# AgentForge Delivery Checklist

## Documentation Ready

- [ ] README explains the product in under one minute.
- [ ] 'docs/brief.md' matches the product direction.
- [ ] 'docs/requirements.md' is build-ready.
- [ ] 'docs/frontend-enterprise.md' defines premium UI behavior where frontend exists.
- [ ] 'docs/backend-implementation.md' defines modules, APIs, data, jobs, and security.
- [ ] 'docs/quickstart.md' supports clean clone onboarding.
- [ ] 'docs/environment.md' lists all required variables.
- [ ] 'docs/testing-and-quality.md' defines release gates.

## Clone-And-Run Ready

- [ ] 'pnpm install' works from root.
- [ ] '.env.example' is complete.
- [ ] 'pnpm db:up' starts local dependencies.
- [ ] 'pnpm db:migrate' creates schema.
- [ ] 'pnpm dev' starts the product.
- [ ] Sample input produces sample output.
- [ ] Docker Compose works without paid services.

## Frontend Ready

- [ ] Product command center exists.
- [ ] Create flow has validation.
- [ ] Workbench supports source/output review.
- [ ] Evidence panel shows inputs, warnings, assumptions, and artifacts.
- [ ] Review and approval flow is visible.
- [ ] No layout overlap at mobile/tablet/desktop widths.
- [ ] Visual regression screenshots are checked.

## Backend Ready

- [ ] API exposes project, run, artifact, finding, review, export endpoints.
- [ ] Worker completes the primary agentic project starting workflow.
- [ ] Jobs are idempotent.
- [ ] Database migrations are repeatable.
- [ ] Audit events are recorded.
- [ ] Secrets are redacted.
- [ ] Export works for Markdown and JSON.

## Security Ready

- [ ] Workspace isolation is tested.
- [ ] External inputs are treated as untrusted.
- [ ] Destructive and outward-facing actions require confirmation.
- [ ] Secret references are used instead of raw secret storage.
- [ ] Logs do not contain secrets.
- [ ] Rate limits are enabled.

## Public Launch Ready

- [ ] Safe example data included.
- [ ] Screenshots or terminal output included.
- [ ] Known limitations documented.
- [ ] First release tag created.
- [ ] GitHub topics set.
- [ ] Issues or roadmap created for next phase.
