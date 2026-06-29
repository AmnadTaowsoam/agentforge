# AgentForge

**AgentForge** คือ agentic pipeline ที่เปลี่ยน idea ดิบๆ ให้กลายเป็น software foundation ที่พร้อมส่งทีม — เพียงแค่อธิบายสิ่งที่ต้องการสร้างเป็นภาษาธรรมดา ระบบจะ generate เอกสารทั้งหมดให้อัตโนมัติ: brief, requirements, architecture, API contract, data model, sprint tasks, และ test plan

> **AgentForge** transforms a raw product idea into a complete, build-ready documentation package. Describe what you want to build in plain language — the pipeline generates 7 professional artifacts automatically using a mock AI provider (no API key required for local development).

---

## สารบัญ

- [สิ่งที่จะได้รับ](#สิ่งที่จะได้รับ)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [ความต้องการเบื้องต้น](#ความต้องการเบื้องต้น)
- [การติดตั้งและรัน](#การติดตั้งและรัน)
- [Clone และใช้งาน](#clone-และใช้งาน)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [การพัฒนา](#การพัฒนา)
- [Testing](#testing)
- [Docker Deployment](#docker-deployment)
- [ตัวอย่าง: Repair-Shop Queue](#ตัวอย่าง-repair-shop-queue)
- [การขยาย (Extending)](#การขยาย-extending)

---

## สิ่งที่จะได้รับ

เมื่อ submit idea เข้าไป ระบบจะ generate artifact 7 ชิ้นพร้อมกัน:

| # | Artifact | คำอธิบาย |
|---|---|---|
| 1 | **Brief** | Executive summary + target users + success metrics |
| 2 | **Requirements** | Functional (FR) + Non-functional (NFR) requirements |
| 3 | **Architecture** | System diagram + component breakdown |
| 4 | **API Contract** | OpenAPI-style route definitions |
| 5 | **Data Model** | ERD + table definitions |
| 6 | **Tasks** | Sprint milestones + acceptance criteria |
| 7 | **Test Plan** | Unit, integration, E2E test scenarios |

---

## Architecture

```
Browser (port 4302)
    │
    ├─ Next.js 15 Web App (/api/v1/* proxied to API)
    │
    ▼
Fastify API (port 4303)
    │  ├─ Auth (JWT + bcrypt)
    │  ├─ Projects / Runs / Artifacts
    │  └─ Review / Export / Audit
    │
    ▼
PostgreSQL 16 ◄─── Worker (polls every 2s)
                        │
                        └─ 7-step pipeline:
                           validate → prepare → generate
                           → validate output → findings
                           → package artifacts → notify
```

การสื่อสาร Worker ↔ API ผ่าน database โดยตรง (polling `status=ready`) ไม่ใช้ message queue ภายนอก ทำให้ setup ง่ายสำหรับ local dev

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js + MUI | 15 / 6 |
| API Server | Fastify + TypeScript | 4 |
| Auth | bcryptjs + @fastify/jwt | — |
| Validation | Zod | 3 |
| Database | PostgreSQL | 16 |
| DB Driver | pg (node-postgres) | 8 |
| Worker | Node.js poll loop | ESM |
| Package Manager | pnpm workspace | 9 |
| Local Infra | Docker Compose | v2 |
| Testing | Vitest | 2 |
| Types | TypeScript | 5.4 |

---

## Project Structure

```
AgentForge/
├── apps/
│   ├── api/                    # Fastify REST API (port 4303)
│   │   ├── db/migrations/      # 9 SQL migration files (idempotent)
│   │   ├── scripts/
│   │   │   └── migrate.js      # Migration runner (ESM)
│   │   ├── src/
│   │   │   ├── config.ts       # Env validation + JWT_SECRET guard
│   │   │   ├── db/index.ts     # pg.Pool singleton
│   │   │   ├── middleware/     # JWT auth preHandler
│   │   │   ├── plugins/        # Error handler (requestId + ApiErrorCode)
│   │   │   └── routes/         # 16 routes: auth, projects, runs, ...
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── worker/                 # Background pipeline service
│   │   ├── src/
│   │   │   ├── generators/     # 7 artifact generators
│   │   │   ├── pipeline/       # 7-step orchestrator
│   │   │   │   └── steps/      # validate, prepare, execute, ...
│   │   │   ├── providers/      # mock AI provider (+ factory)
│   │   │   └── utils/redact.ts # Secret redaction for logs
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                    # Next.js frontend (port 4302)
│       ├── src/
│       │   ├── app/            # App Router pages (9 screens)
│       │   ├── components/     # AppNav, SplitPane, StatusBadge, ...
│       │   └── lib/            # api.ts (typed fetch) + auth.tsx (JWT context)
│       ├── next.config.ts      # Rewrites /api/v1/* → port 4303
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── config/                 # tsconfig.base.json + eslint.config.js
│   ├── domain/                 # TypeScript types for all 9 DB models
│   ├── testkit/                # Shared test helpers (makeWorkspaceId, etc.)
│   └── ui/                    # Reserved for shared components
│
├── examples/
│   ├── input/
│   │   └── repair-shop-queue.json   # Demo input (canonical example)
│   └── expected-output/             # 7 golden .md files
│       ├── brief.md
│       ├── requirements.md
│       ├── architecture.md
│       ├── api-contract.md
│       ├── data-model.md
│       ├── tasks.md
│       └── test-plan.md
│
├── docs/                       # Extended documentation
│   ├── quickstart.md
│   ├── backend-implementation.md
│   ├── frontend-enterprise.md
│   ├── environment.md
│   ├── testing-and-quality.md
│   └── delivery-checklist.md
│
├── .env.example                # Template — copy to .env
├── docker-compose.yml          # postgres + api + worker + web
├── package.json                # Workspace root scripts
└── pnpm-workspace.yaml
```

---

## ความต้องการเบื้องต้น

| เครื่องมือ | Version ขั้นต่ำ | ตรวจสอบ |
|---|---|---|
| Node.js | 22+ | `node --version` |
| pnpm | 9+ | `pnpm --version` |
| Docker Desktop | 4+ (Compose v2) | `docker compose version` |
| Git | ใดก็ได้ | `git --version` |

---

## การติดตั้งและรัน

### 1. Clone Repository

```bash
git clone <repository-url> AgentForge
cd AgentForge
```

### 2. ตั้งค่า Environment

```bash
cp .env.example .env
```

เปิดไฟล์ `.env` แล้วแก้ค่าที่จำเป็น:

```bash
# สร้าง JWT_SECRET (ต้อง ≥32 ตัวอักษร)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# สร้าง ENCRYPTION_KEY (32 bytes, base64)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. ติดตั้ง Dependencies

```bash
pnpm install
```

### 4. เปิด Database

```bash
# เปิด PostgreSQL container ใน background
docker compose up postgres -d

# รอ ~5 วินาที แล้ว migrate
pnpm db:migrate
```

migration runner จะสร้าง 9 ตารางและ track ว่า migration ไหนรันแล้ว — รันซ้ำได้ปลอดภัย (idempotent)

### 5. รัน Development Server

```bash
pnpm dev
```

จะเปิด 3 services พร้อมกัน:

| Service | URL | คำอธิบาย |
|---|---|---|
| Web (Next.js) | http://localhost:4302 | หน้าเว็บหลัก |
| API (Fastify) | http://localhost:4303 | REST API |
| Worker | — | poll DB ทุก 2 วินาที |

เปิดเบราว์เซอร์ที่ **http://localhost:4302** แล้ว Register บัญชีใหม่

---

## Clone และใช้งาน

### Option A — Local Dev (แนะนำ)

```bash
git clone <repo-url> my-project
cd my-project

# ติดตั้ง
cp .env.example .env
# (แก้ JWT_SECRET และ ENCRYPTION_KEY ใน .env)
pnpm install

# เริ่มต้น
docker compose up postgres -d
pnpm db:migrate
pnpm dev
```

### Option B — Full Docker Stack

รัน services ทั้งหมดใน containers:

```bash
git clone <repo-url> my-project
cd my-project

cp .env.example .env
# แก้ค่าใน .env ก่อนรัน

docker compose up --build
```

เปิดที่ http://localhost:4302 (web map จาก container port 3000)

### Option C — ใช้เป็น Template โปรเจกต์ใหม่

1. Fork หรือ clone repo นี้
2. แก้ชื่อใน `package.json` root: `"name": "my-app"`
3. แก้ชื่อใน workspace packages: `@agentforge/*` → `@my-app/*`
4. แก้ `packages/domain/src/index.ts` เพิ่ม domain types ของตัวเอง
5. แก้ `apps/worker/src/generators/` ให้ generate artifact แบบที่ต้องการ
6. ลบ `examples/` เก่าออก แล้วสร้าง golden files ใหม่

---

## Environment Variables

คัดลอก `.env.example` → `.env` และกรอกค่าต่อไปนี้:

### Required

| Variable | Default | คำอธิบาย |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/agentforge` | PostgreSQL connection string |
| `JWT_SECRET` | — | Secret สำหรับ sign JWT **ต้อง ≥ 32 ตัวอักษร** production จะ exit(1) ถ้าสั้นกว่า |
| `ENCRYPTION_KEY` | — | 32-byte base64 key สำหรับเข้ารหัส PII |

### Optional

| Variable | Default | คำอธิบาย |
|---|---|---|
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `PORT` | `4303` | Port ของ API server |
| `AI_PROVIDER` | `mock` | `mock` (ไม่ต้อง API key) หรือ `anthropic` / `openai` |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |
| `REDIS_URL` | — | (optional) สำหรับ cache ในอนาคต |
| `OPENAI_API_KEY` | — | ต้องการเมื่อ `AI_PROVIDER=openai` |
| `ANTHROPIC_API_KEY` | — | ต้องการเมื่อ `AI_PROVIDER=anthropic` |

> **ข้อควรระวัง:** ไม่ commit ไฟล์ `.env` ขึ้น git ไม่ว่าในกรณีใดทั้งสิ้น ไฟล์นี้ถูก ignore แล้วใน `.gitignore`

### สร้าง Secrets

```bash
# JWT_SECRET (hex string, 64 chars = 32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ENCRYPTION_KEY (base64, 44 chars = 32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Database Schema

รัน migration ด้วย:

```bash
pnpm db:migrate
```

**9 ตารางหลัก:**

```
workspaces          (id, name, plan, retention_days)
  └── users         (id, workspace_id, email, role, password_hash)
  └── projects      (id, workspace_id, name, status, owner_user_id)
  │     └── runs    (id, project_id, status, trigger_type, config_json)
  │           ├── input_items   (id, run_id, input_type, content_ref)
  │           ├── artifacts     (id, run_id, artifact_type, path, checksum)
  │           │                  UNIQUE(run_id, artifact_type)
  │           ├── findings      (id, run_id, severity, category, title)
  │           └── review_events (id, run_id, reviewer_user_id, decision)
  └── audit_events  (id, workspace_id, actor_user_id, action, target_id)
```

**Run status flow:**
```
draft → ready → running → completed
                       └→ failed
                       └→ cancelled
               └→ needs_input
```

**Migration runner** ที่ `apps/api/scripts/migrate.js`:
- Track migrations ใน `_migrations` table
- รัน files ตาม order (001_, 002_, ...)
- Skip files ที่รันแล้ว (safe to run multiple times)
- Rollback ถ้า error เกิดขึ้นกลางคัน

---

## API Routes

Base URL: `http://localhost:4303`

### Auth (Public)

| Method | Path | Body | คำอธิบาย |
|---|---|---|---|
| `POST` | `/auth/register` | `{email, password, displayName, workspaceName}` | สร้าง workspace + user แรก |
| `POST` | `/auth/login` | `{email, password, workspaceId?}` | รับ JWT token |

### Workspaces (Auth required)

| Method | Path | คำอธิบาย |
|---|---|---|
| `GET` | `/api/v1/workspaces/:id` | ดู workspace info |

### Projects

| Method | Path | Body | คำอธิบาย |
|---|---|---|---|
| `POST` | `/api/v1/projects` | `{name, domain?, metadata_json?}` | สร้าง project ใหม่ |
| `GET` | `/api/v1/projects/:id` | — | ดู project |
| `PATCH` | `/api/v1/projects/:id` | `{name?, status?, metadata_json?}` | แก้ไข project |

### Runs

| Method | Path | คำอธิบาย |
|---|---|---|
| `POST` | `/api/v1/projects/:projectId/runs` | เริ่ม run ใหม่ (status→ready, worker จะ pick up) |
| `GET` | `/api/v1/runs/:id` | ดู run + status |
| `POST` | `/api/v1/runs/:id/cancel` | ยกเลิก run |

### Artifacts & Findings

| Method | Path | คำอธิบาย |
|---|---|---|
| `GET` | `/api/v1/runs/:id/artifacts` | ดู artifacts ทั้งหมดของ run |
| `GET` | `/api/v1/runs/:id/findings` | ดู findings/warnings |

### Review & Export

| Method | Path | Body | คำอธิบาย |
|---|---|---|---|
| `POST` | `/api/v1/runs/:id/review` | `{decision, notes?}` | approve / reject / needs_revision |
| `POST` | `/api/v1/runs/:id/export` | — | Export artifacts เป็น JSON package |

### Audit & Health

| Method | Path | คำอธิบาย |
|---|---|---|
| `GET` | `/api/v1/audit-events` | Log ทุก action (paginated) |
| `GET` | `/health` | Health check (no auth) |
| `GET` | `/ready` | Readiness check (DB ping) |

**Auth Header:** `Authorization: Bearer <token>`

**Error Response Format:**
```json
{
  "requestId": "uuid",
  "code": "AUTH_REQUIRED",
  "message": "human readable message"
}
```

Error codes: `VALIDATION_FAILED` `AUTH_REQUIRED` `FORBIDDEN` `NOT_FOUND` `CONFLICT` `RATE_LIMITED` `EXTERNAL_SERVICE_FAILED` `WORKFLOW_FAILED` `EXPORT_FAILED`

---

## การพัฒนา

### Scripts หลัก

```bash
# Dev (รัน web + api + worker พร้อมกัน)
pnpm dev

# Build ทั้งหมด
pnpm build

# Typecheck ทั้งหมด
pnpm typecheck

# Lint ทั้งหมด
pnpm lint

# Test ทั้งหมด
pnpm test

# Test เฉพาะ package
pnpm --filter @agentforge/api test
pnpm --filter @agentforge/worker test

# Golden file tests
pnpm test:golden

# Integration tests (ต้องมี TEST_DATABASE_URL)
pnpm test:integration

# DB migration
pnpm db:migrate

# เปิดแค่ Postgres
docker compose up postgres -d
```

### Hot Reload

- **API**: `tsx watch` — reload ทันทีเมื่อแก้ไฟล์
- **Worker**: `tsx watch` — reload ทันทีเมื่อแก้ไฟล์
- **Web**: Next.js Fast Refresh

### เพิ่ม Migration ใหม่

```bash
# สร้างไฟล์ migration ลำดับถัดไป
# เช่น: apps/api/db/migrations/010_add_comments.sql

CREATE TABLE IF NOT EXISTS comments (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id   UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  body     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

# แล้วรัน
pnpm db:migrate
```

---

## Testing

### รัน Tests

```bash
# Unit + Integration tests ทั้งหมด
pnpm test

# เฉพาะ API (23 tests)
pnpm --filter @agentforge/api test

# เฉพาะ Worker (29 tests)
pnpm --filter @agentforge/worker test

# Golden file regression
pnpm test:golden

# Integration (ต้องมี Postgres จริง)
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agentforge_test \
  pnpm test:integration
```

### สิ่งที่ Test ครอบคลุม

| ประเภท | จำนวน | ครอบคลุม |
|---|---|---|
| Auth tests | 4 | Register, login correct/wrong pw, JWT response |
| Error handler | 6 | ทุก error code มี requestId + code + message |
| Workspace isolation | 5 | Cross-workspace → 403 (ไม่ใช่ 200 หรือ 404) |
| Security (API) | 8 | Auth bypass, JWT required, SSRF, no token leak |
| Pipeline (Worker) | 4 | 7 artifacts generated, idempotency |
| Golden files | 4 | repair-shop-queue → brief ตรงกับ expected |
| Security (Worker) | 13 | Path traversal, secret redaction |
| Secret redaction | 8 | password/token/api_key ถูก redact จาก logs |
| **รวม** | **52** | **0 failures** |

### Security Tests ที่สำคัญ

```
✓ POST /auth/login wrong password → 401 (ไม่ใช่ JWT)
✓ POST /auth/login correct password → JWT (bcrypt.compare ก่อน sign เสมอ)
✓ GET /api/v1/projects/:id (wrong workspace) → 403 FORBIDDEN
✓ Path traversal ../etc/passwd → rejected (canonicalization)
✓ Secret patterns ไม่ปรากฏใน logs
```

---

## Docker Deployment

### รัน Full Stack

```bash
# Build และรันทุก service
docker compose up --build

# หรือ detach mode
docker compose up --build -d

# ดู logs
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f web
```

### Services และ Ports

| Service | Container Port | Host Port | คำอธิบาย |
|---|---|---|---|
| postgres | 5432 | 5432 | PostgreSQL 16 Alpine |
| api | 4303 | 4303 | Fastify API |
| worker | — | — | Background pipeline (ไม่ expose port) |
| web | 3000 | **4302** | Next.js (mapped to 4302) |

### หยุดและล้าง

```bash
# หยุด services
docker compose down

# หยุดและลบ volumes (ลบข้อมูล DB ด้วย)
docker compose down -v
```

### Production Considerations

1. **JWT_SECRET** ต้องเป็น random string ≥ 32 chars — API จะ `exit(1)` ถ้าสั้นกว่าใน `NODE_ENV=production`
2. ไม่ commit `.env` ขึ้น git
3. ใช้ secrets manager (AWS Secrets Manager, Vault) แทน env files ใน production
4. ตั้ง `DATABASE_URL` ชี้ไป managed PostgreSQL (RDS, Supabase, Neon)
5. ตั้ง `AI_PROVIDER=anthropic` พร้อม `ANTHROPIC_API_KEY` สำหรับ real generation

---

## ตัวอย่าง: Repair-Shop Queue

โปรเจกต์นี้มี canonical example ครบชุด: **ระบบจัดคิวสำหรับอู่ซ่อมรถขนาดเล็ก**

### Input

ไฟล์: `examples/input/repair-shop-queue.json`

```json
{
  "projectName": "Repair-Shop Queue Management",
  "domain": "field service / small business",
  "idea": "A web app for a small auto repair shop to manage their job queue...",
  "inputs": [
    { "input_type": "idea", "label": "Raw Product Idea", "content_ref": "..." },
    { "input_type": "constraint", "label": "Budget Constraint", "content_ref": "..." },
    { "input_type": "context", "label": "Current Pain Points", "content_ref": "..." }
  ]
}
```

### Golden Files (Expected Output)

เก็บใน `examples/expected-output/`:

```
brief.md          — Project Brief พร้อม success metrics
requirements.md   — FR-01 ถึง FR-10 + NFR
architecture.md   — Mermaid diagram + component breakdown
api-contract.md   — 14 routes สำหรับ repair shop
data-model.md     — ERD + 5 ตาราง
tasks.md          — 3 milestones × 5 tasks พร้อม acceptance criteria
test-plan.md      — Unit/Integration/E2E scenarios
```

### ลองใช้งาน

1. เปิด http://localhost:4302 แล้ว Register
2. คลิก **New Project** → วาง idea จาก `repair-shop-queue.json`
3. คลิก **Start Run** → ดู pipeline ทำงาน
4. เปิด **Workbench** → อ่าน artifact แต่ละชิ้น
5. เปิด **Review Panel** → approve run
6. คลิก **Export** → ได้ JSON package ทั้งหมด

รัน golden test เพื่อเปรียบเทียบ output:
```bash
pnpm test:golden
```

---

## การขยาย (Extending)

### เพิ่ม Artifact Type ใหม่

1. เพิ่ม type ใน `packages/domain/src/index.ts`:
   ```typescript
   export type ArtifactType = ... | 'security-review'
   ```

2. สร้าง generator ใน `apps/worker/src/generators/security-review.ts`

3. เพิ่มใน migration `006_create_artifacts.sql` CHECK constraint (หรือสร้าง migration ใหม่)

4. เพิ่มใน `apps/worker/src/pipeline/steps/execute-core-workflow.ts`

5. อัปเดต golden files ใน `examples/expected-output/`

### เพิ่ม AI Provider จริง

1. สร้าง `apps/worker/src/providers/anthropic.ts`:
   ```typescript
   export async function callAnthropic(prompt: string): Promise<string> {
     // ใช้ Anthropic SDK
   }
   ```

2. อัปเดต `apps/worker/src/providers/index.ts`:
   ```typescript
   if (AI_PROVIDER === 'anthropic') return anthropicProvider
   ```

3. ตั้งค่าใน `.env`:
   ```bash
   AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-...
   ```

### เพิ่ม API Route ใหม่

1. สร้างไฟล์ใน `apps/api/src/routes/my-route.ts`
2. Register ใน `apps/api/src/index.ts`: `await app.register(myRoutes)`
3. เพิ่ม typed fetch function ใน `apps/web/src/lib/api.ts`
4. เพิ่ม test ใน `apps/api/src/__tests__/`

---

## License

MIT © 2026

---

## Links

| | |
|---|---|
| Local App | http://localhost:4302 |
| Local API | http://localhost:4303 |
| API Health | http://localhost:4303/health |
| Docs | `docs/` directory |
| Examples | `examples/` directory |
