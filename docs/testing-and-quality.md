# AgentForge Testing And Quality Plan

## Quality Target

AgentForge should be safe to demo publicly and credible enough for real builders. Testing must cover product behavior, backend reliability, frontend polish, generated artifacts, and security boundaries.

## Test Pyramid

- Unit tests for validators, policy rules, generators, mappers, and scoring.
- Integration tests for API, database, worker, and export pipeline.
- Contract tests for API responses and generated JSON.
- End-to-end tests for first run from sample input to exported artifact.
- Visual regression tests for premium frontend screens.
- Accessibility tests for forms, tables, dialogs, and review flows.

## Required Commands

~~~bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm test:visual
pnpm audit
~~~

## Minimum Coverage

- Unit coverage: 80 percent.
- Integration coverage: 60 percent for critical workflow paths.
- E2E: at least one clone-and-run happy path.
- Visual: dashboard, create flow, workbench, review, settings.

## Golden Files

Generated outputs must have golden-file tests. Store examples under:

~~~text
examples/
  input/
  expected-output/
~~~

Golden files must be reviewed when output shape changes.

## Premium Frontend Review

- No overlapping text or controls at 375px, 768px, 1440px.
- Empty states are useful and not decorative.
- Loading states preserve layout.
- Tables remain readable with realistic data.
- Keyboard navigation works for primary flows.
- Color contrast meets WCAG AA.

## Backend Reliability Review

- Jobs are idempotent.
- Failed jobs store actionable failure reason.
- API validates all inputs.
- Workspace isolation is tested.
- Export pipeline handles partial failures.
- Secrets are redacted from logs and artifacts.

## Security Tests

- Unauthorized users cannot read project data.
- Cross-workspace access is denied.
- Secret-like values are redacted.
- URL imports reject unsafe internal addresses.
- Uploaded files enforce size/type limits.
- Destructive actions require confirmation.

## Release Gate

Do not tag a release unless:

- all required commands pass
- first-run sample works from a clean clone
- README and quickstart match actual commands
- no secrets are present
- visual screenshots are reviewed
- known limitations are documented
