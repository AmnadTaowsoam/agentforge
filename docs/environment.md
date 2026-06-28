# AgentForge Environment And Configuration

## Required Environment Variables

~~~bash
NODE_ENV=development
PORT=4302
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agentforge
APP_BASE_URL=http://localhost:4302
JWT_SECRET=REPLACE_WITH_MINIMUM_32_CHARACTER_SECRET_HERE
ENCRYPTION_KEY=REPLACE_WITH_32_BYTE_BASE64_ENCODED_KEY_HERE
AI_PROVIDER=mock
AI_MODEL=mock
LOG_LEVEL=info
~~~

## Optional Environment Variables

~~~bash
REDIS_URL=redis://localhost:6379
OBJECT_STORAGE_ENDPOINT=http://localhost:9000
OBJECT_STORAGE_BUCKET=agentforge-artifacts
GITHUB_TOKEN=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
SENTRY_DSN=
~~~

## Configuration Rules

- '.env.example' must be complete and safe to commit.
- '.env' must never be committed.
- All secrets must be read from environment variables or a secret manager.
- Local development must work with 'AI_PROVIDER=mock'.
- Production must fail fast if required secrets are missing.

## Feature Flags

All features are enabled by default. Set any flag to `false` to disable.

~~~bash
FEATURE_AI_GENERATION=false
FEATURE_EXPORT_JSON=false
FEATURE_EXPORT_MARKDOWN=false
FEATURE_PUBLIC_EXAMPLES=false
FEATURE_APPROVAL_GATES=false
~~~

## Deployment Profiles

### Local

- mock AI allowed
- local Postgres
- local object storage optional
- verbose logs

### Staging

- real provider keys allowed
- seeded sample data
- protected test credentials
- full audit logging

### Production

- strict secret loading
- audit logs enabled
- backups enabled
- rate limits enabled
- error tracking enabled
- external actions require approval
