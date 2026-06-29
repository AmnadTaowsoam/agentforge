# Project Brief: Repair-Shop Queue Management

## Executive Summary

Repair-Shop Queue Management is a lightweight web application purpose-built for small auto repair shops that currently run their operations on paper logbooks and sticky notes. The system digitises every step of the job lifecycle — from customer self-service appointment booking through mechanic assignment and status tracking to automated SMS/email notifications when a vehicle is ready for pickup. The primary business outcomes are a 70 % reduction in inbound phone call volume and a halving of average job turnaround time, from 3 days to 1.5 days, within three months of go-live.

## Problem Statement

Small auto repair shops lose revenue and customer trust through three compounding operational failures:

1. **Missed appointments.** Without a centralised booking system, roughly 20 % of callback appointments are missed, leading to lost jobs and frustrated customers who do not return.
2. **Status-inquiry phone calls.** Customers have no self-service way to check whether their car is ready, so they call the shop 2–3 times per job. At an average of 4 minutes per call, a shop handling 25 jobs per week wastes approximately 3–6 hours per week answering status questions — time that could be spent on actual repairs.
3. **Invisible workload.** Mechanics and the shop owner share a paper logbook that provides no real-time visibility into which jobs are waiting, in progress, or complete, making it impossible to balance workload or give customers accurate ETAs.

The cost of these failures is measurable: missed appointments cost revenue directly; excessive phone calls consume owner and mechanic time; and the lack of coordination keeps average turnaround at 3 days when 1.5 days should be achievable with the same staff.

## Proposed Solution

A single-page web application with three interconnected surfaces:

- **Customer booking portal** — a public-facing form where vehicle owners select a service category, describe the issue, and pick an available appointment slot. Confirmation is sent immediately via email (and optionally SMS).
- **Shop owner kanban board** — a drag-and-drop board with three columns (Waiting, In Progress, Done) giving the owner real-time sight of every active job. Clicking any card exposes full job details: customer info, vehicle, diagnosis notes, assigned mechanic, and elapsed time.
- **Mechanic assignment view** — mechanics see only their own assigned jobs, can add notes and mark jobs complete, triggering automatic customer notifications.

The system is built as a Next.js monorepo with a Fastify API backend, PostgreSQL persistence, and Twilio/SendGrid for notifications. It is designed to run on a single $50/month VPS (or equivalent managed service), making it financially sustainable for a solo-developer operation.

## Target Users

- **Shop owner / manager** — needs full visibility across all jobs, the ability to reassign mechanics, override appointment slots, and see business metrics (jobs completed per day, average turnaround, phone call volume proxy).
- **Mechanics / technicians** — need to see their assigned jobs, update job status, add diagnosis notes, and mark work complete without navigating complex UI.
- **End customers (vehicle owners)** — need to book appointments without calling, receive proactive updates, and trust that their vehicle will be ready when promised.

## Success Metrics

- 70 % reduction in inbound phone call volume within 3 months of go-live (tracked via shop owner self-report and optional call-log integration).
- Average job turnaround time: 3 days → 1.5 days (measured as time between appointment check-in and customer notification sent).
- Customer satisfaction score ≥ 4.2 / 5 (collected via automated post-pickup SMS survey, target response rate ≥ 30 %).
- Appointment no-show rate below 10 % (down from an estimated ~20 % baseline).
- Zero missed callback appointments after week 2 (all follow-ups tracked in-system, not on paper).
