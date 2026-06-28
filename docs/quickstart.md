# AgentForge Clone-And-Run Quickstart

## Target Developer Experience

The finished repository should support this flow:

~~~bash
git clone https://github.com/AmnadTaowsoam/agentforge.git
cd agentforge
cp .env.example .env
pnpm install
pnpm dev
~~~

Primary product command:

~~~bash
pnpm dev
~~~

Default local URL:

~~~text
http://localhost:4302
~~~

## Required Repository Shape

~~~text
agentforge/
  apps/
    web/
    api/
    worker/
  packages/
    ui/
    config/
    domain/
    testkit/
  docs/
  examples/
  infra/
    docker/
    github-actions/
  scripts/
  .env.example
  docker-compose.yml
  package.json
  README.md
~~~

For CLI-first projects, 'apps/web' can be documentation/demo UI, but the CLI must still be runnable from the root.

## Local Start Commands

~~~bash
pnpm install
pnpm db:up
pnpm db:migrate
pnpm dev
~~~

## Docker Start Commands

~~~bash
docker compose up --build
~~~

The compose stack should include:

- API service
- worker service
- web service where applicable
- database
- queue/cache when required
- object storage emulator when file artifacts are required

## First Successful Run

1. Open the local URL or run the CLI command.
2. Create sample project.
3. Load sample input from 'examples/'.
4. Start a run.
5. Confirm run reaches 'completed'.
6. Open generated artifacts.
7. Export Markdown or JSON.

## Definition Of Clone-And-Run Ready

- Fresh clone works with documented commands.
- '.env.example' contains every required variable.
- Sample data is included and safe to publish.
- Docker Compose works without paid external services.
- The first run produces a useful artifact.
- README explains what success looks like.
- Common failures have troubleshooting notes.

## Troubleshooting

### Port already in use

Change 'PORT' in '.env' or stop the process using port '4302'.

### Database unavailable

Run:

~~~bash
pnpm db:up
pnpm db:migrate
~~~

### External AI provider unavailable

Use mock mode:

~~~bash
AI_PROVIDER=mock pnpm dev
~~~

### Worker is not processing jobs

Check worker logs and queue connection:

~~~bash
pnpm worker:dev
pnpm queue:inspect
~~~
