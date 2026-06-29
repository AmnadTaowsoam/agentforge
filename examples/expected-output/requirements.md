# Requirements: Repair-Shop Queue Management

## Functional Requirements

### FR-01 — Customer Appointment Booking
Customers shall be able to book a repair appointment via a public web page without creating an account. The booking form must capture: full name, phone number, email address, vehicle make/model/year, mileage, service category (e.g. oil change, brake repair, engine diagnostic, tyre replacement, general inspection), and a free-text description of the problem. On submission the system creates a `Job` record in `Waiting` status and sends a confirmation email to the customer within 30 seconds.

### FR-02 — Kanban Job Board
The shop owner shall see all active jobs on a drag-and-drop kanban board with three columns: **Waiting**, **In Progress**, and **Done**. Dragging a card between columns updates job status in real time (optimistic UI + server confirmation). Each card must display: customer name, vehicle, service category, assigned mechanic (if any), and elapsed time in current status.

### FR-03 — Mechanic Assignment
The shop owner shall be able to assign or reassign any job to any mechanic from the kanban card detail view. When a job is assigned, the mechanic receives an in-app notification and an optional SMS alert. A mechanic can have a maximum of 5 concurrently active (`In Progress`) jobs; the UI must warn before exceeding this limit.

### FR-04 — Job Status Updates by Mechanic
Authenticated mechanics shall be able to view their assigned jobs, add timestamped diagnosis notes, upload up to 5 photos per job, and mark a job as `Done`. Marking a job `Done` automatically triggers a customer notification (see FR-05).

### FR-05 — Automated Customer Notifications
The system shall send customers an SMS and email notification at the following events: (a) appointment confirmation (immediately on booking), (b) job moved to `In Progress` (car has been picked up / work started), and (c) job marked `Done` (car is ready for pickup). Each notification must include the customer's name, vehicle description, and a direct link to a read-only job status page. Notification delivery failures must be logged and surfaced to the shop owner dashboard.

### FR-06 — Public Job Status Page
Each job shall have a publicly accessible, token-authenticated status page (no login required) where a customer can see their current job status, the mechanic's latest note, and the estimated completion time if set by the owner. The URL is included in every notification.

### FR-07 — Appointment Slot Management
The shop owner shall be able to configure daily appointment capacity (maximum number of new jobs per day) and block out dates (holidays, closures). The booking portal must enforce these limits and show only available slots to customers.

### FR-08 — Shop Owner Dashboard / Metrics
The owner shall have a dashboard view showing: jobs completed today vs. this week, average turnaround time (rolling 7-day), current mechanic workload (jobs per mechanic), and a count of notifications sent this week as a proxy for call deflection.

### FR-09 — Authentication & Role-Based Access
The application shall support three roles: `owner`, `mechanic`, and `customer` (unauthenticated). Owner and mechanic accounts use email + password authentication with JWT sessions. Password reset via email must be supported. Customers do not have accounts; their access to job status is via a single-use token embedded in notification links.

### FR-10 — Search and Filter
The shop owner shall be able to search jobs by customer name, vehicle, or job ID and filter the kanban board by mechanic, service category, or date range. Search results must appear within 500 ms on a dataset of up to 10 000 jobs.

## Non-Functional Requirements

### NFR-01 — Performance
All page loads (initial HTML + critical JS) must complete within 2 seconds on a standard 4G mobile connection (simulated at 20 Mbps). API responses for read operations (job list, job detail) must return within 300 ms at p95 under a load of 50 concurrent users.

### NFR-02 — Reliability and Uptime
The system must achieve 99.5 % monthly uptime (measured by external health check). Notification delivery must be retried up to 3 times with exponential back-off on transient provider errors. All job state transitions must be durable (written to PostgreSQL before the API responds with 200).

### NFR-03 — Security
All API endpoints except the booking form and public job status page must require a valid JWT. Passwords must be hashed with bcrypt (cost factor ≥ 12). Customer PII (phone, email) must be stored encrypted at rest (AES-256). Public job status tokens must be unguessable (128-bit random, single-use per notification send). HTTPS must be enforced; HTTP must redirect to HTTPS.

### NFR-04 — Accessibility
The booking portal and public status page must meet WCAG 2.1 AA. Form inputs must have visible labels, all interactive elements must be keyboard-navigable, and colour contrast ratios must be ≥ 4.5:1 for normal text.

### NFR-05 — Operational Cost Constraint
The total infrastructure cost must not exceed $50/month. This implies: a single server (VPS or equivalent), managed PostgreSQL on the same host or a low-cost add-on, and use of free-tier or low-volume paid SMS/email tiers (Twilio and SendGrid both offer free tiers adequate for a shop handling under 200 jobs/month).
