import type { ArtifactType } from '@agentforge/domain'

export interface GenerationInput {
  idea: string
  context: Record<string, unknown>
}

export interface MockProvider {
  generate(input: GenerationInput, artifactType: ArtifactType): Promise<string>
}

function extractIdeaName(idea: string): string {
  // Take first sentence or up to 60 chars
  const trimmed = idea.trim()
  const sentence = trimmed.split(/[.!?]/)[0] ?? trimmed
  return sentence.length > 60 ? sentence.slice(0, 60) + '...' : sentence
}

function generateBrief(idea: string): string {
  const name = extractIdeaName(idea)
  return `# Project Brief: ${name}

## Summary

${idea}

This project addresses a real market need by providing an intelligent, user-friendly solution
that integrates seamlessly into existing workflows. The system will be built with scalability
and maintainability in mind, enabling teams to deliver value rapidly.

## Target Users

- **Primary**: Operations teams and managers who need real-time visibility into queues and workflows
- **Secondary**: Front-line workers who interact with the system daily to manage tasks and items
- **Tertiary**: Executives and stakeholders who require high-level reporting and analytics

## Core Features

- **Queue Management**: Create, prioritize, and route work items to the appropriate handlers
- **Real-time Dashboard**: Live status updates and metrics for all active queues
- **Notification Engine**: Configurable alerts for SLA breaches, queue depth thresholds, and completions
- **Audit Trail**: Full history of all state transitions with timestamps and actor information
- **API Integration**: REST and webhook support for connecting external systems and data sources

## Success Metrics

- Average queue wait time reduced by 40% within 90 days of deployment
- 95% of tasks routed to the correct handler on the first attempt
- System uptime of 99.9% measured over rolling 30-day windows
- User adoption rate of 80% among target users within 60 days of launch
- Net Promoter Score (NPS) of 45 or higher after 6 months of production use
`
}

function generateRequirements(idea: string): string {
  const name = extractIdeaName(idea)
  return `# Requirements: ${name}

## Functional Requirements

### FR-001: Queue Operations
- The system MUST allow users to create queues with configurable priority rules
- The system MUST support FIFO, LIFO, and priority-based ordering modes
- The system MUST allow items to be assigned, reassigned, and escalated
- The system MUST enforce capacity limits per queue with configurable overflow strategies

### FR-002: User Management
- The system MUST support role-based access control (RBAC) with at minimum four roles: admin, manager, agent, viewer
- The system MUST authenticate users via email/password and support SSO integration
- The system MUST log all user actions with timestamps for audit compliance

### FR-003: Notifications and Alerts
- The system MUST send real-time push notifications to assigned users when items arrive
- The system MUST trigger configurable alerts when SLA thresholds are breached
- The system MUST support email, in-app, and webhook notification channels

### FR-004: Reporting
- The system MUST generate daily, weekly, and monthly performance reports
- The system MUST export data in CSV and JSON formats
- The system MUST provide real-time dashboards with sub-second refresh rates

## Non-Functional Requirements

### NFR-001: Performance
- API response time MUST be under 200 ms at the 95th percentile under 1,000 concurrent users
- The system MUST process a minimum of 500 queue operations per second

### NFR-002: Reliability
- The system MUST achieve 99.9% uptime (SLA: max 8.7 hours downtime per year)
- The system MUST support graceful degradation when downstream services are unavailable

### NFR-003: Security
- All data in transit MUST be encrypted using TLS 1.3 or higher
- All data at rest MUST be encrypted using AES-256
- The system MUST pass OWASP Top 10 security checks before production deployment

### NFR-004: Scalability
- The system MUST scale horizontally to support up to 100,000 active queue items without configuration changes
- The system MUST support multi-region deployment for disaster recovery

## Constraints and Assumptions

- Deployment target is Kubernetes on a major cloud provider (AWS, GCP, or Azure)
- Initial release will support English locale only; i18n infrastructure will be included for future expansion
- Third-party identity providers (Google, Microsoft) will be supported via OAuth 2.0
`
}

function generateArchitecture(idea: string): string {
  const name = extractIdeaName(idea)
  return `# Architecture: ${name}

## Overview

The system follows a microservices architecture decomposed around bounded contexts. Services
communicate via a combination of synchronous REST APIs (for read-heavy, latency-sensitive paths)
and asynchronous message queues (for write-heavy, event-driven workflows).

## System Components

### Frontend Layer
- **Web Application**: React 18 single-page application served via CDN
- **Mobile Application**: React Native app sharing business logic with the web client
- **API Gateway**: Kong or AWS API Gateway handling rate limiting, auth, and routing

### Application Layer
- **Queue Service**: Core service managing queue lifecycle, item state machines, and routing rules
- **Notification Service**: Fanout service delivering alerts via email, push, and webhook channels
- **Reporting Service**: Async report generation with caching and pre-computation
- **Auth Service**: JWT issuance, refresh, and session management with RBAC enforcement
- **Worker Service**: Background job processor for async tasks (report generation, bulk operations)

### Data Layer
- **Primary Database**: PostgreSQL 15 for transactional data (queues, items, users, audit logs)
- **Cache Layer**: Redis 7 for session storage, rate limiting counters, and hot-path caching
- **Message Broker**: RabbitMQ or AWS SQS for reliable async communication between services
- **Object Storage**: S3-compatible storage for attachments and generated report files

## Data Flow

\`\`\`
Client → API Gateway → Auth Service (validate JWT)
                     → Queue Service (create/update/query items)
                     → Notification Service (async via MQ)
                     → Reporting Service (async scheduled jobs)
\`\`\`

## Deployment Architecture

- Kubernetes cluster with namespace separation per environment (dev, staging, prod)
- Helm charts for all services with environment-specific values files
- Horizontal Pod Autoscaler (HPA) configured for queue depth and CPU metrics
- PostgreSQL deployed as managed RDS with Multi-AZ failover
- Redis deployed as ElastiCache with automatic failover

## Key Design Decisions

1. **Event sourcing for queue items**: All state transitions are persisted as events, enabling
   full audit trail and point-in-time reconstruction
2. **CQRS for reporting**: Separate read models for reporting queries, updated via event consumers
3. **Optimistic locking**: Database-level optimistic concurrency control to prevent double-processing
4. **Circuit breakers**: Hystrix/Resilience4j patterns on all external service calls
`
}

function generateApiContract(idea: string): string {
  const name = extractIdeaName(idea)
  return `# API Contract: ${name}

## Overview

RESTful API following OpenAPI 3.1 specification. All endpoints require Bearer token authentication
unless marked as public. Rate limiting applies at 1,000 requests per minute per authenticated user.

## Base URL

\`\`\`
https://api.example.com/v1
\`\`\`

## Authentication

\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

## Endpoints

### Queues

#### GET /queues
List all queues accessible to the authenticated user.

**Response 200:**
\`\`\`json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "status": "active | paused | archived",
      "depth": 0,
      "created_at": "ISO8601"
    }
  ],
  "meta": { "total": 0, "page": 1, "per_page": 20 }
}
\`\`\`

#### POST /queues
Create a new queue.

**Request Body:**
\`\`\`json
{
  "name": "string",
  "ordering": "fifo | lifo | priority",
  "capacity": 1000,
  "sla_minutes": 60
}
\`\`\`

**Response 201:** Queue object

#### GET /queues/:id/items
Retrieve items in a queue with optional status filter.

**Query Parameters:**
- \`status\`: filter by item status (pending, in_progress, completed, failed)
- \`page\`: page number (default: 1)
- \`per_page\`: items per page (default: 20, max: 100)

**Response 200:** Paginated list of queue items

### Queue Items

#### POST /queues/:id/items
Add an item to a queue.

**Request Body:**
\`\`\`json
{
  "payload": {},
  "priority": 5,
  "metadata": {},
  "due_at": "ISO8601"
}
\`\`\`

**Response 201:** Queue item object

#### PATCH /queues/:queueId/items/:itemId
Update item status or assignment.

**Request Body:**
\`\`\`json
{
  "status": "in_progress | completed | failed",
  "assigned_to": "user_id",
  "notes": "string"
}
\`\`\`

**Response 200:** Updated queue item

### Webhooks

#### POST /webhooks
Register a webhook endpoint for queue events.

**Request Body:**
\`\`\`json
{
  "url": "https://your-endpoint.com/hook",
  "events": ["item.created", "item.completed", "sla.breached"],
  "secret": "string"
}
\`\`\`

## Error Responses

All errors follow the RFC 7807 Problem Details format:

\`\`\`json
{
  "type": "https://api.example.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "The request body contains invalid fields",
  "errors": [{ "field": "name", "message": "Name is required" }]
}
\`\`\`

## Rate Limiting Headers

\`\`\`
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704067200
\`\`\`
`
}

function generateDataModel(idea: string): string {
  const name = extractIdeaName(idea)
  return `# Data Model: ${name}

## Overview

PostgreSQL relational schema with UUID primary keys, JSONB for flexible metadata, and
comprehensive audit columns. All tables include created_at and where applicable updated_at
timestamps with timezone awareness.

## Entity Relationship Summary

\`\`\`
workspaces
  └── users (workspace_id FK)
  └── queues (workspace_id FK)
        └── queue_items (queue_id FK)
              └── item_events (item_id FK)
        └── queue_members (queue_id, user_id FK)
  └── webhooks (workspace_id FK)
  └── audit_logs (workspace_id FK)
\`\`\`

## Table Definitions

### workspaces
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Workspace identifier |
| name | TEXT | NOT NULL | Display name |
| plan | TEXT | NOT NULL, DEFAULT 'free' | Subscription plan tier |
| settings_json | JSONB | NOT NULL, DEFAULT '{}' | Workspace-level configuration |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

### users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | User identifier |
| workspace_id | UUID | FK workspaces(id) ON DELETE CASCADE | Owning workspace |
| email | TEXT | NOT NULL, UNIQUE | Login email |
| display_name | TEXT | NOT NULL | Shown in UI |
| role | TEXT | NOT NULL, CHECK IN ('admin','manager','agent','viewer') | Access role |
| last_seen_at | TIMESTAMPTZ | | Last activity timestamp |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Account creation |

### queues
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Queue identifier |
| workspace_id | UUID | FK workspaces(id) ON DELETE CASCADE | Owning workspace |
| name | TEXT | NOT NULL | Queue display name |
| ordering | TEXT | NOT NULL, CHECK IN ('fifo','lifo','priority') | Dispatch order |
| capacity | INTEGER | NOT NULL, DEFAULT 10000 | Max items allowed |
| sla_minutes | INTEGER | | Target completion time |
| status | TEXT | NOT NULL, DEFAULT 'active' | Queue state |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation time |

### queue_items
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Item identifier |
| queue_id | UUID | FK queues(id) ON DELETE CASCADE | Parent queue |
| payload | JSONB | NOT NULL, DEFAULT '{}' | Arbitrary item data |
| priority | INTEGER | NOT NULL, DEFAULT 5 | 1 (highest) to 10 (lowest) |
| status | TEXT | NOT NULL, DEFAULT 'pending' | Item lifecycle state |
| assigned_to | UUID | FK users(id) | Current assignee |
| due_at | TIMESTAMPTZ | | SLA deadline |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Enqueue time |
| completed_at | TIMESTAMPTZ | | Completion time |

### item_events (event sourcing)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Event identifier |
| item_id | UUID | FK queue_items(id) ON DELETE CASCADE | Source item |
| event_type | TEXT | NOT NULL | e.g., created, assigned, completed |
| actor_id | UUID | FK users(id) | Who triggered the event |
| payload | JSONB | NOT NULL, DEFAULT '{}' | Event-specific data |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Event time |

## Indexes

\`\`\`sql
CREATE INDEX idx_queue_items_queue_status ON queue_items(queue_id, status);
CREATE INDEX idx_queue_items_assigned ON queue_items(assigned_to) WHERE status = 'in_progress';
CREATE INDEX idx_queue_items_due ON queue_items(due_at) WHERE status != 'completed';
CREATE INDEX idx_item_events_item ON item_events(item_id, created_at DESC);
CREATE INDEX idx_audit_logs_workspace ON audit_logs(workspace_id, created_at DESC);
\`\`\`

## Migration Strategy

All schema changes are versioned sequential migrations using a migrations table to track
applied versions. Migrations are transactional and include both up and down scripts.
`
}

function generateTasks(idea: string): string {
  const name = extractIdeaName(idea)
  return `# Task Breakdown: ${name}

## Sprint 0: Project Setup (Week 1)

### TASK-001: Repository and Infrastructure Setup
- **Estimate**: 3 days
- **Assignee**: Platform Engineer
- Initialize monorepo with pnpm workspaces and shared TypeScript config
- Configure ESLint, Prettier, and Husky pre-commit hooks
- Set up Docker Compose for local development (PostgreSQL, Redis, RabbitMQ)
- Create CI/CD pipeline (GitHub Actions) with lint, typecheck, test, build stages
- **Acceptance**: \`pnpm dev\` starts all services; CI pipeline passes on main branch

### TASK-002: Database Schema and Migrations
- **Estimate**: 2 days
- **Assignee**: Backend Engineer
- Write all SQL migrations for core tables
- Implement migration runner script
- Seed development database with representative test data
- **Acceptance**: \`pnpm db:migrate\` runs cleanly; all tables created with correct constraints

## Sprint 1: Core Queue Service (Weeks 2-3)

### TASK-003: Queue CRUD Operations
- **Estimate**: 4 days
- **Assignee**: Backend Engineer
- Implement POST /queues, GET /queues, GET /queues/:id, DELETE /queues/:id
- Add input validation using Zod schemas
- Write unit tests for all handlers (target: 90% coverage)
- **Acceptance**: All endpoints return correct responses; validation errors return 422

### TASK-004: Queue Item State Machine
- **Estimate**: 3 days
- **Assignee**: Backend Engineer
- Implement item lifecycle: pending → in_progress → completed | failed
- Add optimistic locking to prevent double-processing
- Emit events for all state transitions
- **Acceptance**: Concurrent requests to claim the same item result in exactly one success

### TASK-005: Priority Dispatch Logic
- **Estimate**: 2 days
- **Assignee**: Backend Engineer
- Implement FIFO, LIFO, and priority-based item selection queries
- Add configurable ordering at queue level
- **Acceptance**: Items are dequeued in correct order per queue configuration

## Sprint 2: Auth and Users (Weeks 4-5)

### TASK-006: Authentication Service
- **Estimate**: 4 days
- **Assignee**: Backend Engineer
- Implement email/password login with bcrypt hashing
- Issue short-lived JWT access tokens and long-lived refresh tokens
- Add token revocation via Redis blocklist
- **Acceptance**: Login, refresh, and logout flows work end-to-end

### TASK-007: Role-Based Access Control
- **Estimate**: 3 days
- **Assignee**: Backend Engineer
- Implement RBAC middleware validating JWT claims against route policies
- Ensure viewers cannot write, agents cannot manage queues, etc.
- **Acceptance**: Unauthorized operations return 403; authorized operations succeed

## Sprint 3: Notifications and Reporting (Weeks 6-7)

### TASK-008: Notification Fanout
- **Estimate**: 3 days
- **Assignee**: Backend Engineer
- Implement async notification consumer on message broker
- Add email delivery via SendGrid/SES
- Add webhook delivery with retry and signature verification
- **Acceptance**: Notifications delivered within 5 seconds of triggering event

### TASK-009: Dashboard API
- **Estimate**: 3 days
- **Assignee**: Backend + Frontend Engineer
- Implement aggregate query endpoints for dashboard data
- Add WebSocket channel for real-time queue depth updates
- Build React dashboard components consuming these APIs
- **Acceptance**: Dashboard refreshes without page reload; data latency under 2 seconds

## Sprint 4: Frontend and Polish (Weeks 8-9)

### TASK-010: Queue Management UI
- **Estimate**: 5 days
- **Assignee**: Frontend Engineer
- Build queue list, detail, and item management screens
- Implement drag-and-drop reprioritization
- Add responsive design for tablet and mobile viewports
- **Acceptance**: All core user journeys completable on desktop and mobile

### TASK-011: Performance Testing and Optimization
- **Estimate**: 3 days
- **Assignee**: Backend Engineer
- Run k6 load tests against all critical endpoints
- Identify and resolve query performance issues (EXPLAIN ANALYZE)
- Validate 200ms p95 response time under 1,000 concurrent users
- **Acceptance**: Load test results meet NFR-001 thresholds
`
}

function generateTestPlan(idea: string): string {
  const name = extractIdeaName(idea)
  return `# Test Plan: ${name}

## Overview

This test plan covers unit, integration, end-to-end, performance, and security testing.
The target is 80% code coverage with zero critical security vulnerabilities before production release.

## Testing Strategy

| Level | Tool | Trigger | Coverage Target |
|-------|------|---------|-----------------|
| Unit | Vitest | Pre-commit, CI | 80% line coverage |
| Integration | Vitest + testcontainers | CI | All API endpoints |
| E2E | Playwright | CI (nightly) | Critical user journeys |
| Performance | k6 | Pre-release | NFR-001 thresholds |
| Security | OWASP ZAP + npm audit | Weekly CI | 0 High/Critical findings |

## Unit Test Cases

### Queue Service
| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| UT-001 | Create queue with valid data | Returns queue object with generated UUID |
| UT-002 | Create queue with missing name | Throws ValidationError with field details |
| UT-003 | Enqueue item into active queue | Returns item with status=pending |
| UT-004 | Enqueue item into full queue | Throws QueueCapacityError |
| UT-005 | Claim next item (FIFO) | Returns oldest pending item |
| UT-006 | Claim next item (priority) | Returns highest-priority pending item |
| UT-007 | Complete item | Sets status=completed and completed_at timestamp |
| UT-008 | Double-claim same item | Second claim returns null or throws ConcurrencyError |

### Auth Service
| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| UT-009 | Login with correct credentials | Returns access and refresh tokens |
| UT-010 | Login with wrong password | Returns 401 with generic error message |
| UT-011 | Access endpoint with expired JWT | Returns 401 with token_expired code |
| UT-012 | Refresh with valid refresh token | Returns new access token |
| UT-013 | Access viewer-only route as admin | Returns 200 |
| UT-014 | Access admin-only route as viewer | Returns 403 |

## Integration Test Cases

### API Endpoints
| Test ID | Endpoint | Scenario | Expected Result |
|---------|----------|----------|-----------------|
| IT-001 | POST /queues | Valid body | 201 with queue object |
| IT-002 | POST /queues | Duplicate name in workspace | 409 Conflict |
| IT-003 | POST /queues/:id/items | Valid item | 201 with item |
| IT-004 | PATCH /queues/:id/items/:itemId | Claim item | 200 with in_progress status |
| IT-005 | GET /queues/:id/items | Filter by status | 200 with filtered list |
| IT-006 | POST /webhooks | Valid URL | 201; webhook fires on item.created |

## End-to-End Test Cases

### Critical Journeys
| Test ID | Journey | Steps | Success Criteria |
|---------|---------|-------|-----------------|
| E2E-001 | Queue item lifecycle | Create queue → add item → claim → complete | Item shows completed in UI |
| E2E-002 | SLA breach alert | Create item with 1-min SLA → wait → check notifications | Alert received within 30s of breach |
| E2E-003 | Bulk import | Upload CSV of 500 items | All items created; dashboard count updated |
| E2E-004 | Role enforcement | Login as viewer → attempt queue creation | Action blocked with clear error message |

## Performance Test Scenarios

### Load Profile
\`\`\`javascript
// k6 test profile
stages: [
  { duration: '2m', target: 100 },   // ramp up
  { duration: '5m', target: 1000 },  // sustained load
  { duration: '2m', target: 0 },     // ramp down
]
thresholds: {
  http_req_duration: ['p(95)<200'],   // 95th percentile under 200ms
  http_req_failed: ['rate<0.01'],     // less than 1% error rate
}
\`\`\`

## Security Test Cases

| Test ID | Category | Test | Expected Result |
|---------|----------|------|-----------------|
| SEC-001 | SQL Injection | Send \`'; DROP TABLE queues--\` as queue name | 422 Validation error; no DB change |
| SEC-002 | XSS | Submit \`<script>alert(1)</script>\` in payload | Stored safely; not executed in UI |
| SEC-003 | Auth Bypass | Access /queues without token | 401 Unauthorized |
| SEC-004 | IDOR | Access another workspace's queue by ID | 403 Forbidden |
| SEC-005 | Rate Limiting | Send 1,001 requests in 1 minute | 429 Too Many Requests after limit |
| SEC-006 | Webhook Forgery | POST to webhook endpoint without valid signature | 401 rejected |

## Test Data Management

- All integration and E2E tests use isolated database schemas per test run
- Test data is seeded before each test suite and cleaned up after
- Production data is never used in tests; anonymized snapshots used for perf testing only
- Secrets and credentials are injected via environment variables, never hardcoded
`
}

const generators: Record<ArtifactType, (idea: string) => string> = {
  brief: generateBrief,
  requirements: generateRequirements,
  architecture: generateArchitecture,
  'api-contract': generateApiContract,
  'data-model': generateDataModel,
  tasks: generateTasks,
  'test-plan': generateTestPlan,
  readme: (idea) => generateBrief(idea),   // fallback for non-pipeline types
  scaffold: (idea) => generateTasks(idea), // fallback for non-pipeline types
}

export function createMockProvider(): MockProvider {
  return {
    async generate(input: GenerationInput, artifactType: ArtifactType): Promise<string> {
      const generator = generators[artifactType]
      if (!generator) {
        throw new Error(`No mock generator for artifact type: ${artifactType}`)
      }
      return generator(input.idea)
    },
  }
}
