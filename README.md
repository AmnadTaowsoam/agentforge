# AgentForge

Design, test, and ship role-based AI agents with governed prompts, tools, memory, and evaluations.

## Why this exists

Teams are adopting AI tools faster than their delivery process, governance model, and validation habits can keep up. AgentForge is a focused agent builder that turns that messy middle into an explicit product workflow: define the job, connect the required tools, verify the output, and leave behind delivery evidence that another human can trust.

This repository currently contains the product brief and implementation requirements needed to build the first production-ready version from scratch. It is intentionally practical: scope, workflows, architecture, data model, API surface, security expectations, rollout plan, and acceptance criteria are all documented.

## Target users

- AI product teams, solution architects, prompt engineers
- Teams that want a usable internal product, not only a demo
- Builders who need clear requirements before starting implementation

## MVP outcome

The first release should let a user complete the core workflow end to end:

1. Create or import the primary work item for AgentForge.
2. Configure the required inputs, policies, and integrations.
3. Run the workflow in a controlled, observable way.
4. Review generated output, risks, and validation evidence.
5. Export or hand off the result to the next delivery system.

## Repository contents

- [Project brief](docs/brief.md) - product direction, audience, positioning, and success metrics.
- [Requirements](docs/requirements.md) - build-ready functional, non-functional, security, data, and delivery requirements.
- [Architecture](docs/architecture.md) - suggested system design and component boundaries.
- [Roadmap](docs/roadmap.md) - staged path from prototype to production.
- [Delivery checklist](docs/delivery-checklist.md) - release gates and operational readiness checks.

## Suggested implementation stack

- Frontend: Next.js or React with TypeScript
- Backend: Node.js/NestJS or FastAPI
- Database: Postgres
- Background jobs: BullMQ, Celery, or cloud-native queues
- Auth: OAuth plus role-based access control
- AI layer: provider-agnostic service wrapper with logging, evaluation hooks, and policy checks
- Observability: structured logs, traces, audit events, and product analytics

## Build principles

- Start with one complete workflow before adding broad feature coverage.
- Keep human approval in the loop for risky or outward-facing actions.
- Treat generated AI output as draft until verified by rules, tests, or a reviewer.
- Store decisions, source inputs, and delivery evidence alongside the final output.
- Make permissions explicit and auditable from the first release.

## Current status

Planning package. The repo is ready for implementation planning, issue creation, design review, and MVP build kickoff.

## License

MIT
