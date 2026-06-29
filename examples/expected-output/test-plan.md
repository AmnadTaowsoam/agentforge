# Test Plan: Repair-Shop Queue Management

Test coverage spans three levels: unit tests (fast, isolated), integration tests (database + API), and end-to-end tests (browser-driven, full stack). All tests run via Vitest (`pnpm test`). E2E tests use Playwright (`pnpm test:e2e`). Load tests use k6 (`pnpm test:load`).

---

## Unit Tests

Scope: pure functions and business logic in isolation. No database, no HTTP server, no external services. Mocks used for dependencies. Target: < 200 ms total runtime.

### UT-01 — Job status FSM transitions

**File:** `packages/core/src/job-fsm.test.ts`

Verify that `applyStatusTransition(currentStatus, nextStatus)` returns the new status for valid transitions and throws `InvalidTransitionError` for invalid ones.

| # | Input (current → next) | Expected result |
|---|---|---|
| 1 | `waiting → in_progress` | Returns `in_progress` |
| 2 | `in_progress → done` | Returns `done` |
| 3 | `in_progress → waiting` | Returns `waiting` (re-queue allowed) |
| 4 | `done → waiting` | Throws `InvalidTransitionError` |
| 5 | `done → in_progress` | Throws `InvalidTransitionError` |
| 6 | `waiting → done` | Throws `InvalidTransitionError` (must pass through `in_progress`) |

---

### UT-02 — Appointment slot availability check

**File:** `packages/core/src/slot-availability.test.ts`

Verify that `isSlotAvailable(slot)` returns the correct boolean.

| # | Slot state | Expected |
|---|---|---|
| 1 | `capacity: 8, booked: 5, is_blocked: false` | `true` |
| 2 | `capacity: 8, booked: 8, is_blocked: false` | `false` (fully booked) |
| 3 | `capacity: 8, booked: 0, is_blocked: true` | `false` (shop closed) |
| 4 | `capacity: 8, booked: 7, is_blocked: false` | `true` (one slot left) |
| 5 | `capacity: 0, booked: 0, is_blocked: false` | `false` (zero capacity edge case) |

---

### UT-03 — Notification back-off schedule

**File:** `packages/worker/src/back-off.test.ts`

Verify that `computeNextAttemptAt(attemptCount, now)` returns the correct timestamp using linear back-off (`attemptCount * 60` seconds).

| # | `attemptCount` | Expected delay |
|---|---|---|
| 1 | `0` | `now + 0s` (immediate first attempt) |
| 2 | `1` | `now + 60s` |
| 3 | `2` | `now + 120s` |
| 4 | `3` | `now + 180s` |
| 5 | `4` (max, will be marked failed) | Throws `MaxAttemptsExceededError` |

---

### UT-04 — Customer phone encryption/decryption round-trip

**File:** `packages/crypto/src/phone.test.ts`

Verify that `encryptPhone(raw, key)` → `decryptPhone(cipher, key)` returns the original value, and that the cipher text is never equal to the plain text.

| # | Input | Expected |
|---|---|---|
| 1 | `+16505551234` | Round-trip returns `+16505551234` |
| 2 | `+441234567890` | Round-trip returns `+441234567890` |
| 3 | `encryptPhone("+16505551234", key)` | Cipher text `!==` `"+16505551234"` |
| 4 | `decryptPhone(cipher, wrongKey)` | Throws `DecryptionError` |
| 5 | `encryptPhone("", key)` | Throws `ValidationError` (empty phone) |

---

### UT-05 — Turnaround time calculation for metrics

**File:** `packages/core/src/metrics.test.ts`

Verify that `computeAverageTurnaroundHours(completedJobs)` returns the correct average in hours.

| # | Input | Expected |
|---|---|---|
| 1 | `[{ createdAt: T, completedAt: T+3600 }]` | `1.0` (1 hour) |
| 2 | `[{ createdAt: T, completedAt: T+3600 }, { createdAt: T, completedAt: T+7200 }]` | `1.5` (average of 1h and 2h) |
| 3 | `[]` (no completed jobs) | `0` |
| 4 | `[{ createdAt: T, completedAt: T+259200 }]` | `72.0` (3 days in hours) |
| 5 | `[{ createdAt: T, completedAt: T+129600 }]` | `36.0` (1.5 days — target threshold) |

---

## Integration Tests

Scope: HTTP API + real PostgreSQL (test DB, reset per test file via `beforeAll`/`afterAll`). No external services — Twilio/SendGrid replaced by in-memory stubs. Target: < 30 s total runtime.

### IT-01 — Appointment booking creates all expected records

**File:** `apps/api/src/__tests__/appointments.test.ts`

POST to `/api/v1/appointments` with valid body and assert the full side-effect tree in the database.

| # | Assertion | Expected |
|---|---|---|
| 1 | HTTP response status | `201 Created` |
| 2 | `jobs` table row count | Increased by 1 |
| 3 | New job `status` | `waiting` |
| 4 | `appointment_slots.booked_count` for the requested date | Increased by 1 |
| 5 | `notification_queue` rows for the new job | Exactly 2 (one `email`, one `sms`) |
| 6 | Both notification rows `trigger_event` | `job_created` |
| 7 | `customers` table row | New customer row with correct `email` |
| 8 | `vehicles` table row | New vehicle row linked to the customer |
| 9 | Response body contains `statusPageUrl` | URL matches pattern `/status/[a-z0-9]{20,}` |
| 10 | Booking on fully-booked date | Returns `409` with correct error message |

---

### IT-02 — Job status transition writes events and queues notifications

**File:** `apps/api/src/__tests__/job-status.test.ts`

Owner PATCH job status and verify DB side-effects.

| # | Scenario | Expected |
|---|---|---|
| 1 | `waiting → in_progress` | HTTP `200`, `jobs.status = 'in_progress'`, `jobs.started_at` populated |
| 2 | `in_progress → done` | HTTP `200`, `jobs.status = 'done'`, `jobs.completed_at` populated |
| 3 | `done → waiting` | HTTP `409`, `jobs.status` unchanged |
| 4 | `in_progress` transition enqueues notification | 1 new `notification_queue` row with `trigger_event = 'job_in_progress'` |
| 5 | `done` transition enqueues notification | 1 new `notification_queue` row with `trigger_event = 'job_done'` |
| 6 | Each transition creates 1 `job_events` row | `event_type` matches transition description |

---

### IT-03 — Mechanic assignment enforces concurrency limit

**File:** `apps/api/src/__tests__/mechanic-assign.test.ts`

Seed 5 in-progress jobs assigned to mechanic A, then attempt a 6th assignment.

| # | Scenario | Expected |
|---|---|---|
| 1 | Assign mechanic with 0 active jobs | HTTP `200` |
| 2 | Assign mechanic with 4 active jobs | HTTP `200` |
| 3 | Assign mechanic with 5 active jobs | HTTP `409 Mechanic already has 5 active jobs` |
| 4 | Reassign mechanic mid-job | HTTP `200`, previous mechanic freed |
| 5 | `GET /api/v1/mechanics` reflects updated active job count | `activeJobs` decremented on old mechanic, incremented on new |

---

### IT-04 — Public status page token resolution

**File:** `apps/api/src/__tests__/status-token.test.ts`

| # | Scenario | Expected |
|---|---|---|
| 1 | Valid token for a `waiting` job | HTTP `200`, body contains `status: 'waiting'` |
| 2 | Valid token for a `done` job | HTTP `200`, body contains `status: 'done'` and `latestNote` |
| 3 | Completely random token not in DB | HTTP `404` |
| 4 | Token that exists but job is 31 days old | HTTP `404` (expired) |
| 5 | Response body does not contain `customerEmail` or `phone` | Assert field absence |

---

### IT-05 — Notification worker mock delivery

**File:** `apps/worker/src/__tests__/notification-worker.test.ts`

Use an in-memory stub for Twilio and SendGrid transports. Seed `notification_queue` rows, run one worker tick, assert outcomes.

| # | Scenario | Expected |
|---|---|---|
| 1 | Pending notification, first attempt | Stub called once, row marked `sent` |
| 2 | Provider stub throws on first call | Row status stays `pending`, `attempt_count` incremented to 1 |
| 3 | Provider stub throws on 3rd call | Row marked `failed`, `attempt_count = 3` |
| 4 | Row with `status = 'sent'` | Worker ignores it (stub not called) |
| 5 | Row with `next_attempt_at` in the future | Worker skips it (stub not called) |
| 6 | Two pending rows processed in one tick | Stub called twice |

---

## End-to-End Tests (Playwright)

Scope: real browser against a locally running full stack (Next.js + Fastify + PostgreSQL). DB seeded before suite, wiped after. Target: < 3 minutes total runtime.

### E2E-01 — Customer books an appointment successfully

**File:** `e2e/booking.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to `/book` | Page title contains "Book a Repair" |
| 2 | Fill out booking form (name, email, phone, vehicle, service, description) | All fields accept input |
| 3 | Select an available date from the slot picker | Selected date is highlighted |
| 4 | Submit the form | Redirected to confirmation page |
| 5 | Confirmation page shows customer name and vehicle | Text "Sarah Johansson" and "2019 Toyota Camry" visible |
| 6 | Confirmation page shows a status page link | Link href matches `/status/[token]` |
| 7 | Clicking the status link opens the status page | Status badge shows "Waiting" |

---

### E2E-02 — Shop owner logs in and manages the kanban board

**File:** `e2e/kanban.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to `/login` and log in as owner | Redirected to `/dashboard` |
| 2 | Kanban board shows three columns: Waiting, In Progress, Done | All three column headings visible |
| 3 | Seeded "Waiting" job card is visible in the Waiting column | Card shows correct vehicle name |
| 4 | Drag card to "In Progress" column | Card appears in In Progress column; API returns 200 |
| 5 | Page reload — card remains in In Progress | Persistence confirmed |
| 6 | Click on card to open detail slide-over | Slide-over shows problem description and customer info |
| 7 | Assign a mechanic from the dropdown | "Carlos Rivera" appears on card as assigned mechanic |

---

### E2E-03 — Mechanic logs in, adds a note, and marks job done

**File:** `e2e/mechanic-flow.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Log in as mechanic `carlos@garagepro.test` | Redirected to `/mechanic` |
| 2 | Assigned job is visible in the job list | Job with seeded vehicle "2019 Toyota Camry" shown |
| 3 | Click "View" to open job detail | Problem description is visible |
| 4 | Type and submit a note "Brake pads confirmed worn" | Note appears in notes history with mechanic name and timestamp |
| 5 | Click "Mark as Done" | Confirmation dialog appears |
| 6 | Confirm the action | Status badge changes to "Done" |
| 7 | Navigate to `/dashboard` as owner | Job card appears in "Done" column |

---

### E2E-04 — Booking blocked on closed dates

**File:** `e2e/slot-management.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Owner logs in and navigates to `/dashboard/slots` | Slot calendar is visible |
| 2 | Click on tomorrow's date | Date editor opens showing current capacity |
| 3 | Toggle "Shop Closed" checkbox and save | Date turns red on calendar |
| 4 | Navigate to `/book` in a new browser context (unauthenticated) | Booking form visible |
| 5 | Open the date picker — tomorrow's date | Date is greyed out / disabled |
| 6 | Attempt to select the blocked date via keyboard | Date cannot be selected |

---

### E2E-05 — Unauthenticated access is blocked on all staff routes

**File:** `e2e/auth-guard.spec.ts`

| # | Route | Expected behaviour |
|---|---|---|
| 1 | `/dashboard` (no session) | Redirect to `/login` |
| 2 | `/mechanic` (no session) | Redirect to `/login` |
| 3 | `/dashboard/slots` (no session) | Redirect to `/login` |
| 4 | `/dashboard/metrics` (no session) | Redirect to `/login` |
| 5 | `/dashboard` with mechanic session (wrong role) | Redirect to `/mechanic` (no cross-role access) |
| 6 | `/book` (no session) | Renders booking form (public, no redirect) |
| 7 | `/status/[valid-token]` (no session) | Renders status page (public, no redirect) |
