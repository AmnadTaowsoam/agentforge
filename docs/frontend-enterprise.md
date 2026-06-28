# AgentForge Frontend Enterprise Specification

## Experience Standard

AgentForge must feel like an enterprise, premium, luxury product: calm, fast, precise, and trustworthy. The UI should avoid demo-like layouts and marketing filler. The first screen must put the usable product workflow in front of the user.

## Frontend Surface

Enterprise product studio for turning ideas into agent-ready project packages

## Product Screens

- Command center: active projects/runs, status, risk, and next action.
- Create flow: guided intake with validation and save-as-draft.
- Workbench: main builder/auditor/editor surface for agentic project starting.
- Evidence panel: source inputs, generated outputs, warnings, assumptions, and audit events.
- Review panel: checklist, comments, approvals, waivers, and export readiness.
- Settings: integrations, environment, secrets references, team roles, retention.
- Sample gallery: safe public examples that show the product without private data.

## Premium UI Rules

- Use dense but readable layouts with strong information hierarchy.
- Use tabs for major work areas, not long scrolling walls.
- Use split panes for source versus output comparison.
- Use status chips only for machine state; use icons for common toolbar actions.
- Use clear empty, loading, error, partial, and success states.
- Keep cards for repeated objects and avoid nested cards.
- Make every action reversible unless it exports, deploys, deletes, or calls an external system.
- Prefer keyboard-friendly workflows for power users.

## Visual Language

- Neutral enterprise base: white or near-white content areas, charcoal text, restrained accent color.
- Premium accent palette: deep graphite, polished blue, controlled emerald for success, amber for warnings, red only for blocking risk.
- No decorative gradient blobs, heavy purple themes, or stock-like hero sections.
- Use subtle borders, 8px radius maximum, precise spacing, and consistent table density.
- Charts and scorecards must be readable in screenshots.

## Component System

- App shell with collapsible navigation.
- Top command bar with search, run status, and primary action.
- Data table with filters, saved views, column visibility, bulk actions.
- Stepper for guided workflows.
- Diff viewer for generated artifacts.
- Timeline for run history and evidence.
- Policy/finding list grouped by severity.
- Drawer for object details.
- Modal only for short confirmations or focused edits.
- Toasts for non-blocking feedback; blocking errors stay inline.

## Key User Flows

### Create First Run

1. User opens the app.
2. User chooses a template or starts from blank.
3. User enters required inputs for agentic project starting.
4. UI validates required fields before enabling run.
5. User starts run and sees step-by-step progress.
6. User reviews output and exports when ready.

### Review Output

1. User opens a completed run.
2. UI shows generated artifact, findings, assumptions, and evidence side by side.
3. User resolves blocking issues or records a waiver.
4. User approves final output.
5. Export actions become available.

### Admin Setup

1. Owner configures integrations and retention.
2. Owner stores secret references, never raw secrets in UI.
3. Owner defines allowed actions and approval rules.
4. Owner tests setup with a safe sample run.

## Responsive Behavior

- Desktop is primary for builder workflows.
- Tablet must support review and lightweight editing.
- Mobile may support viewing status, comments, and approvals but does not need full authoring in MVP.
- Tables collapse into grouped rows on narrow screens.
- Workbench split panes stack vertically under 900px.

## Accessibility

- WCAG 2.2 AA minimum.
- Keyboard navigation for all command surfaces.
- Visible focus states.
- Color is never the only severity signal.
- Form errors announce field, cause, and fix.
- Generated output must be readable by screen readers.

## Frontend State Model

- 'workspace'
- 'project'
- 'run'
- 'inputDraft'
- 'validationResult'
- 'artifact'
- 'finding'
- 'reviewDecision'
- 'exportJob'

## Frontend Quality Gates

- No text overlap at 375px, 768px, 1440px.
- No layout shift during loading and status updates.
- All empty states include a next action.
- All destructive/export/external actions require confirmation.
- All generated outputs show source and validation state.
- Visual regression screenshots for dashboard, workbench, review, settings.

## Design Tokens

- Radius: 6px default, 8px maximum for cards/modals.
- Text: 14px body, 12px metadata, 16px table primary, 20-28px page headings.
- Spacing: 4px base grid with 16px section rhythm.
- Border: '#E5E7EB' equivalent neutral.
- Success: restrained green.
- Warning: amber.
- Blocking risk: red.
- Primary action: strong blue or graphite, never gradient-only.

## Project Modules Reflected In UI

- idea-intake
- spec-generator
- architecture-planner
- task-compiler
- scaffold-writer
- agent-handoff
- review-loop
- exporter
