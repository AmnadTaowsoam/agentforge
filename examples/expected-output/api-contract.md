# API Contract: Repair-Shop Queue Management

All endpoints are prefixed with `/api/v1`. Authenticated routes require `Authorization: Bearer <jwt>` header. Request and response bodies are JSON (`Content-Type: application/json`). Timestamps are ISO 8601 strings in UTC.

---

## Authentication

### `POST /api/v1/auth/login`

Authenticate a shop owner or mechanic.

**Request body**
```json
{
  "email": "owner@garagepro.com",
  "password": "s3cr3tP@ssword"
}
```

**Response 200**
```json
{
  "accessToken": "eyJhbGci...",
  "expiresIn": 86400,
  "user": {
    "id": "usr_01HZ",
    "email": "owner@garagepro.com",
    "role": "owner",
    "displayName": "Mike Kowalski"
  }
}
```

**Errors:** `401 Invalid credentials` | `422 Validation error`

---

### `POST /api/v1/auth/password-reset/request`

Send a password-reset email to the given address.

**Request body**
```json
{ "email": "mechanic@garagepro.com" }
```

**Response 202** — always returns 202 regardless of whether the email exists (prevents enumeration).

---

## Appointments (Public — no auth required)

### `POST /api/v1/appointments`

Create a new appointment and an associated job in `Waiting` status. This is the endpoint hit by the public booking form.

**Request body**
```json
{
  "customerName": "Sarah Johansson",
  "customerEmail": "sarah@example.com",
  "customerPhone": "+16505551234",
  "vehicle": {
    "make": "Toyota",
    "model": "Camry",
    "year": 2019,
    "mileage": 74200
  },
  "serviceCategory": "brake_repair",
  "problemDescription": "Grinding noise when braking at low speed. Front left.",
  "requestedDate": "2026-07-15"
}
```

**Response 201**
```json
{
  "jobId": "job_09AB",
  "appointmentId": "appt_03CD",
  "statusPageUrl": "https://shop.example.com/status/tok_abc123def456",
  "confirmedDate": "2026-07-15",
  "message": "Appointment confirmed. You will receive a confirmation email shortly."
}
```

**Errors:** `409 No available slots on requested date` | `422 Validation error`

---

### `GET /api/v1/appointments/slots`

Return available appointment slots for a given date range.

**Query params:** `from=2026-07-10&to=2026-07-20`

**Response 200**
```json
{
  "slots": [
    { "date": "2026-07-10", "capacity": 8, "booked": 5, "available": 3 },
    { "date": "2026-07-11", "capacity": 8, "booked": 8, "available": 0 },
    { "date": "2026-07-14", "capacity": 8, "booked": 2, "available": 6 }
  ]
}
```

---

## Jobs (Owner — auth required, role: owner)

### `GET /api/v1/jobs`

List all jobs with optional filters. Returns paginated results.

**Query params:** `status=waiting|in_progress|done`, `mechanicId=usr_xx`, `serviceCategory=brake_repair`, `search=toyota`, `page=1`, `limit=50`

**Response 200**
```json
{
  "data": [
    {
      "id": "job_09AB",
      "status": "waiting",
      "customerName": "Sarah Johansson",
      "customerPhone": "+16505551234",
      "vehicle": { "make": "Toyota", "model": "Camry", "year": 2019 },
      "serviceCategory": "brake_repair",
      "assignedMechanic": null,
      "createdAt": "2026-07-15T08:00:00Z",
      "statusUpdatedAt": "2026-07-15T08:00:00Z",
      "elapsedHours": 2.5
    }
  ],
  "meta": { "total": 42, "page": 1, "limit": 50 }
}
```

---

### `GET /api/v1/jobs/:jobId`

Fetch full detail for a single job including all events and notes.

**Response 200**
```json
{
  "id": "job_09AB",
  "status": "in_progress",
  "customerName": "Sarah Johansson",
  "customerEmail": "sarah@example.com",
  "customerPhone": "+16505551234",
  "vehicle": { "make": "Toyota", "model": "Camry", "year": 2019, "mileage": 74200 },
  "serviceCategory": "brake_repair",
  "problemDescription": "Grinding noise when braking at low speed. Front left.",
  "assignedMechanic": { "id": "usr_04EF", "displayName": "Carlos Rivera" },
  "estimatedReadyAt": "2026-07-15T17:00:00Z",
  "notes": [
    { "id": "note_01", "authorName": "Carlos Rivera", "body": "Confirmed worn front-left brake pads. Ordering parts.", "createdAt": "2026-07-15T10:30:00Z" }
  ],
  "photos": [
    { "id": "photo_01", "url": "https://cdn.example.com/jobs/job_09AB/photo_01.jpg", "createdAt": "2026-07-15T10:35:00Z" }
  ],
  "events": [
    { "id": "evt_01", "type": "created", "actorName": "System", "createdAt": "2026-07-15T08:00:00Z" },
    { "id": "evt_02", "type": "assigned", "actorName": "Mike Kowalski", "detail": "Assigned to Carlos Rivera", "createdAt": "2026-07-15T09:00:00Z" },
    { "id": "evt_03", "type": "status_changed", "actorName": "Carlos Rivera", "detail": "waiting → in_progress", "createdAt": "2026-07-15T10:00:00Z" }
  ],
  "createdAt": "2026-07-15T08:00:00Z"
}
```

---

### `PATCH /api/v1/jobs/:jobId/status`

Transition job status. Enforces valid FSM transitions.

**Request body**
```json
{ "status": "in_progress" }
```

**Response 200** — returns updated job summary.

**Errors:** `409 Invalid status transition (e.g. done → waiting)` | `403 Forbidden`

---

### `PATCH /api/v1/jobs/:jobId/assign`

Assign or reassign a mechanic to a job.

**Request body**
```json
{
  "mechanicId": "usr_04EF",
  "estimatedReadyAt": "2026-07-15T17:00:00Z"
}
```

**Response 200** — returns updated job summary.

**Errors:** `409 Mechanic already has 5 active jobs` | `404 Mechanic not found`

---

## Jobs (Mechanic — auth required, role: mechanic)

### `GET /api/v1/mechanic/jobs`

Return only the jobs assigned to the authenticated mechanic.

**Response 200** — same schema as `GET /api/v1/jobs` but scoped to the caller.

---

### `POST /api/v1/jobs/:jobId/notes`

Add a timestamped note to a job. Mechanic must be assigned to the job.

**Request body**
```json
{ "body": "Brake pads replaced. Bleeding lines now." }
```

**Response 201**
```json
{
  "id": "note_02",
  "jobId": "job_09AB",
  "authorId": "usr_04EF",
  "authorName": "Carlos Rivera",
  "body": "Brake pads replaced. Bleeding lines now.",
  "createdAt": "2026-07-15T14:00:00Z"
}
```

---

### `POST /api/v1/jobs/:jobId/photos`

Upload a photo for a job. `multipart/form-data`. Max 5 photos per job, 10 MB per file.

**Response 201**
```json
{ "id": "photo_02", "url": "https://cdn.example.com/jobs/job_09AB/photo_02.jpg" }
```

**Errors:** `413 File too large` | `409 Photo limit (5) reached`

---

## Public Job Status (No auth — token-based)

### `GET /api/v1/status/:token`

Fetch the read-only customer-facing status for a job, identified by its notification token. No authentication header required; token is embedded in the URL from the notification.

**Response 200**
```json
{
  "customerName": "Sarah",
  "vehicle": "2019 Toyota Camry",
  "serviceCategory": "Brake Repair",
  "status": "in_progress",
  "statusLabel": "In Progress — your car is being worked on",
  "latestNote": "Brake pads replaced. Bleeding lines now.",
  "estimatedReadyAt": "2026-07-15T17:00:00Z",
  "updatedAt": "2026-07-15T14:00:00Z"
}
```

**Errors:** `404 Token not found or expired`

---

## Mechanics Management (Owner only)

### `GET /api/v1/mechanics`

List all mechanic accounts with current workload.

**Response 200**
```json
{
  "data": [
    {
      "id": "usr_04EF",
      "displayName": "Carlos Rivera",
      "email": "carlos@garagepro.com",
      "activeJobs": 2,
      "completedThisWeek": 9
    }
  ]
}
```

---

## Metrics Dashboard (Owner only)

### `GET /api/v1/metrics/dashboard`

Aggregate metrics for the shop owner dashboard.

**Response 200**
```json
{
  "jobsCompletedToday": 4,
  "jobsCompletedThisWeek": 23,
  "averageTurnaroundHours": 28.4,
  "notificationsSentThisWeek": 67,
  "mechanicWorkload": [
    { "mechanicName": "Carlos Rivera", "activeJobs": 2 },
    { "mechanicName": "Amy Chen", "activeJobs": 3 }
  ],
  "jobsByStatus": { "waiting": 5, "in_progress": 5, "done": 23 }
}
```
