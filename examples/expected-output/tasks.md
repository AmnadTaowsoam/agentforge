# Tasks: Repair-Shop Queue Management

Sprint planning across 3 milestones, each ~4 weeks. Each task has acceptance criteria that must pass before the task is merged to main.

---

## Milestone 1 — Core Job Lifecycle (Weeks 1–4)

Goal: A mechanic can log in, the shop owner can see jobs on a kanban board, and a customer can book an appointment from a public form. No notifications yet. Demo-able at end of milestone.

---

### M1-T1 — Database schema and migrations

Stand up PostgreSQL locally via Docker Compose and apply the initial schema.

**Tasks:**
- Write `001_initial_schema.sql` covering all tables in the data model (`users`, `customers`, `vehicles`, `appointment_slots`, `jobs`, `job_notes`, `job_photos`, `job_events`, `notification_queue`, `refresh_tokens`).
- Add `updated_at` auto-update triggers for `users` and `jobs`.
- Implement `pnpm db:migrate` script that runs pending migration files in order and records applied migrations in a `schema_migrations` table.
- Seed script `pnpm db:seed:dev` inserts: 1 owner account (`owner@shop.test` / `password123`), 2 mechanic accounts, and 5 sample jobs across all three statuses.

**Acceptance criteria:**
- `pnpm db:migrate` runs idempotently (second run is a no-op).
- `pnpm db:seed:dev` populates the DB without errors.
- All foreign key constraints are verified via `psql -c "\d jobs"` showing FK definitions.
- A second migration file `002_add_slot_index.sql` can be added and applied on top of `001` without full re-run.

---

### M1-T2 — Authentication API (owner + mechanic login)

Implement JWT-based authentication for shop staff.

**Tasks:**
- `POST /api/v1/auth/login` — validate email/password, return `accessToken` (24-hour JWT) and set `HttpOnly` refresh token cookie.
- `POST /api/v1/auth/logout` — invalidate refresh token in DB.
- `POST /api/v1/auth/password-reset/request` — generate reset token, store hash in DB, send email (mock in dev mode via console.log).
- `POST /api/v1/auth/password-reset/confirm` — validate token, update password hash.
- Fastify `preHandler` hook for `requireAuth` and `requireRole('owner')` / `requireRole('mechanic')`.

**Acceptance criteria:**
- Login with valid credentials returns a JWT that decodes to `{ sub: userId, role: 'owner', ... }`.
- Login with wrong password returns `401` within 500 ms.
- A request to an auth-gated route without a token returns `401 Unauthorized`.
- A mechanic token rejected on an owner-only route returns `403 Forbidden`.
- Password reset flow tested end-to-end in a Vitest integration test (mock email transport).

---

### M1-T3 — Public appointment booking API + customer notification queue write

Implement the booking endpoint that creates a job and queues a confirmation notification.

**Tasks:**
- `POST /api/v1/appointments` — validate input with Zod, check slot availability (serializable transaction), create `customer` + `vehicle` + `job` + `notification_queue` rows atomically, return job ID and status page token.
- `GET /api/v1/appointments/slots` — return slot availability for requested date range; auto-create `appointment_slots` rows for dates that have no record yet (using default capacity 8).
- Input validation: all required fields, `year` in range 1900–2100, `requestedDate` not in the past, phone must match E.164 format.

**Acceptance criteria:**
- Booking on a fully booked date returns `409` with message "No available slots on 2026-07-15".
- Booking on a blocked date returns `409` with message "Shop is closed on 2026-07-15".
- Successful booking creates exactly 2 rows in `notification_queue` (one email, one SMS channel).
- `booked_count` on the `appointment_slots` row is incremented by exactly 1 after a successful booking.
- Concurrent booking stress test: 10 simultaneous requests for the last slot on a given day result in exactly 1 success and 9 `409` responses.

---

### M1-T4 — Job management API (CRUD + status FSM)

Owner-facing REST endpoints for managing jobs.

**Tasks:**
- `GET /api/v1/jobs` — list with filters (`status`, `mechanicId`, `serviceCategory`, `search`) and pagination.
- `GET /api/v1/jobs/:jobId` — full detail including notes, photos, and events.
- `PATCH /api/v1/jobs/:jobId/status` — enforce FSM (`waiting → in_progress`, `in_progress → done`, `in_progress → waiting`). Write to `job_events`. Enqueue notifications on `in_progress` and `done` transitions.
- `PATCH /api/v1/jobs/:jobId/assign` — assign mechanic, enforce 5-job concurrency limit.
- `GET /api/v1/mechanic/jobs` — scoped to authenticated mechanic.

**Acceptance criteria:**
- Transition `done → waiting` returns `409 Invalid status transition`.
- Assigning a mechanic with 5 active `in_progress` jobs returns `409 Mechanic already has 5 active jobs`.
- `GET /api/v1/jobs?search=toyota` returns only jobs whose vehicle make/model contains "toyota" (case-insensitive).
- Each status transition writes exactly one row to `job_events` with the correct `event_type`.
- Full-list endpoint returns within 300 ms with 1 000 seeded jobs (measured in integration test).

---

### M1-T5 — Kanban board UI (Next.js)

Build the authenticated kanban board that consumes the jobs API.

**Tasks:**
- `/dashboard` page (owner-only): three-column drag-and-drop board using `@dnd-kit/core`. Dropping a card into a different column calls `PATCH /api/v1/jobs/:jobId/status`.
- Job card component: shows customer name, vehicle make/model/year, service category badge, assigned mechanic avatar (or "Unassigned"), elapsed time since `created_at`.
- Job detail slide-over: opens on card click, shows full job detail from `GET /api/v1/jobs/:jobId`, mechanic assignment dropdown, notes list.
- SWR polling at 10-second interval to refresh job list. Optimistic update on drag.
- `/login` page: email + password form; on success stores JWT in memory and redirect to `/dashboard`.

**Acceptance criteria:**
- Dragging a card from "Waiting" to "In Progress" updates the card's column within 200 ms (optimistic) and the change persists on page reload.
- Dragging to an invalid transition (Done → Waiting via drag) is blocked at UI level (drop target disabled).
- Kanban board renders correctly on 1280 × 800 and 390 × 844 (iPhone 14 size).
- Unauthenticated access to `/dashboard` redirects to `/login`.
- All interactive elements are keyboard-navigable (tab order verified manually).

---

## Milestone 2 — Notifications & Mechanic Workflow (Weeks 5–8)

Goal: Customers receive real emails and SMS messages. Mechanics have their own dedicated view. Public job status page is live.

---

### M2-T1 — Notification worker (Twilio + SendGrid)

Wire up the background worker to actually send SMS and email.

**Tasks:**
- Poll `notification_queue WHERE status = 'pending' AND next_attempt_at <= NOW()` every 10 seconds.
- For `channel = 'email'`: call SendGrid `POST /v3/mail/send`. Template: plain text with customer name, vehicle, status phrase, and status page URL.
- For `channel = 'sms'`: call Twilio `POST /2010-04-01/Accounts/{SID}/Messages`. Message: "Hi {name}, your {vehicle} is {statusPhrase}. Track status: {url}".
- On provider error: exponential back-off (`attempt_count * 60` seconds), mark `failed` after 3 attempts, log to `stderr`.
- In `AI_PROVIDER=mock` mode: write notification content to `logs/notifications-dev.log` instead of calling external APIs.

**Acceptance criteria:**
- In mock mode, booking an appointment creates a `notifications-dev.log` entry within 15 seconds with the correct customer name and status page URL.
- In real mode (env vars set), a test booking to a real email address receives the confirmation email within 60 seconds (manual verification step).
- A simulated Twilio `500` error causes the worker to retry after 60 seconds and mark `failed` after the third attempt.
- Failed notifications appear in the owner dashboard "Notification Failures" section.

---

### M2-T2 — Public job status page

Build the customer-facing read-only status page.

**Tasks:**
- `GET /api/v1/status/:token` backend route — look up `notification_queue` by `status_page_token`, return safe subset of job data (no PII beyond first name).
- `/status/[token]` Next.js page — server-rendered, no auth. Shows: status badge (colour-coded), latest mechanic note, estimated ready time (if set), shop phone number as fallback.
- Meta tags: `<title>Your Toyota Camry — In Progress | GaragePro</title>`.
- If token not found or job is > 30 days old: show "This link has expired. Please contact the shop."

**Acceptance criteria:**
- Visiting the URL from a confirmation notification email shows the correct job status without logging in.
- Page is server-rendered (verified by `curl` returning full HTML, not a blank shell).
- Invalid token returns a 404 page, not a stack trace.
- Page scores ≥ 90 on Lighthouse accessibility audit.

---

### M2-T3 — Mechanic job view and note/photo upload

Build the mechanic-specific UI.

**Tasks:**
- `/mechanic` page: lists jobs assigned to the logged-in mechanic, sorted by appointment date. Each row has status badge, customer first name + vehicle, and a "View" button.
- Job detail page `/mechanic/jobs/[jobId]`: shows problem description, notes history, photo gallery. Forms to add a note (textarea + submit) and upload a photo (file input, 10 MB limit, images only).
- Mark-as-done button: calls `PATCH .../status` → `done`, triggers notification, redirects back to job list.
- Photo upload: `POST /api/v1/jobs/:jobId/photos` (multipart). In local dev, files stored in `./uploads/`; in production, uploaded to object storage (path configurable via `OBJECT_STORAGE_ENDPOINT`).

**Acceptance criteria:**
- A mechanic cannot see jobs assigned to another mechanic (API returns empty list; UI shows "No jobs assigned to you").
- Uploading a 15 MB file returns `413 File too large`.
- Uploading a PDF file returns `422 Only image files are accepted`.
- Adding a note and refreshing the page shows the note with the correct timestamp.
- Marking a job done enqueues a `notification_queue` row with `trigger_event = 'job_done'` within the same DB transaction.

---

## Milestone 3 — Owner Dashboard, Polish & Hardening (Weeks 9–12)

Goal: Metrics dashboard live, appointment slot management in UI, performance and security hardened, ready for production handoff.

---

### M3-T1 — Owner metrics dashboard

Build the `/dashboard/metrics` page and its API.

**Tasks:**
- `GET /api/v1/metrics/dashboard` — aggregate queries: jobs completed today/this week, average turnaround (seconds between `created_at` and `completed_at`), notification count this week, mechanic workload, jobs-by-status breakdown.
- Dashboard page: cards for each KPI, a bar chart of "jobs completed per day" for the last 14 days (using Recharts), and mechanic workload table.
- Highlight the two primary target metrics: "Phone call proxy: {notificationsSentThisWeek} notifications sent this week" and "Avg. turnaround: {avgHours} hrs (target: 36 hrs)".

**Acceptance criteria:**
- Dashboard loads in under 1 second with up to 1 000 completed jobs (verified by Vitest integration test with 1 000-row seed).
- Average turnaround calculation is verified against a manually computed expected value in a unit test.
- Charts render without console errors on Chrome 120+.

---

### M3-T2 — Appointment slot management UI

Owner can configure daily capacity and block dates from the UI.

**Tasks:**
- `/dashboard/slots` page: a calendar view (month grid) where each date shows capacity / booked count. Owner can click a date to edit capacity or toggle `is_blocked`.
- `PATCH /api/v1/appointment-slots/:date` — update capacity or blocked status for a given date. Creates the row if it does not exist.
- Blocked dates shown in red on the calendar. Fully booked dates shown in amber.
- Validation: capacity cannot be reduced below `booked_count` for a date that already has bookings.

**Acceptance criteria:**
- Blocking a date via UI causes the booking portal's date picker to skip that date.
- Reducing capacity below current bookings returns `409 Cannot reduce capacity below current booking count (5 booked)`.
- Slot changes take effect immediately on the booking portal (no cache lag > 30 seconds).

---

### M3-T3 — Security hardening and performance baseline

Final hardening pass before production deployment.

**Tasks:**
- Add `helmet` Fastify plugin: set `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`.
- Rate limiting: `@fastify/rate-limit` — 10 requests/minute on `/auth/login` per IP; 30 requests/minute on `/api/v1/appointments` per IP.
- Ensure customer `phone_encrypted` is never returned in any API response (audit all serialisers).
- Run `pnpm test` suite; ensure p95 latency for `GET /api/v1/jobs` is under 300 ms under 50 concurrent users (k6 smoke test in `scripts/load-test.js`).
- Document production deployment steps in `docs/deployment.md`.

**Acceptance criteria:**
- `GET /api/v1/jobs` response body contains no `phone` or `phone_encrypted` field in any nested object.
- 11 login attempts in 60 seconds from the same IP returns `429 Too Many Requests` on the 11th.
- k6 smoke test (`pnpm test:load`) reports p95 < 300 ms and 0 % error rate.
- `curl -I https://shop.example.com` shows `Strict-Transport-Security` and `X-Frame-Options: DENY` headers.
