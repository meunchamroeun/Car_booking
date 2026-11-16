# OONE Fleet — API contract (frontend ↔ backend)

The frontend currently runs on mock data. Every write action lives in
`src/lib/fleet-service.ts` as a pure function that maps 1:1 to an endpoint
below. To connect a real backend, replace the matching action in
`src/lib/store.tsx` with a `fetch()` call and move the rule checks to the server.

- Seed data with the exact JSON shapes: `src/lib/mock-data.ts`
- Types: `src/types/index.ts`
- Role rules: `src/lib/permissions.ts`

All endpoints are authenticated; the server derives the acting user from the session/JWT.
Errors return `4xx` with `{ "message": "English text", "key": "err_seats", "vars": { "car": "Toyota Camry Hybrid", "n": 4 } }`.
Success responses carry the same `{ key, vars }` shape for the confirmation toast. Keys live in `src/lib/i18n.ts`
(English + Khmer); the app translates them, so the API never has to know the user's language.
Values of the form `{ "win": { startDate, startTime, endDate, endTime } }` or `{ "day": "YYYY-MM-DD" }` are dates the app formats per language.
Notifications are stored with `titleKey`, `textKey`, `vars` (plus English `title`/`text` as a fallback).

## Roles

| Role (`UserRole`) | UI label | Can do |
|---|---|---|
| `Employee` | Employee | Create bookings, see own bookings, edit own (pending, or approved before start — bigger changes need approval again), cancel own, end own booking early (self-drive or with driver) |
| `Approver` | Manager | Everything Employee can + approve/reject others' requests, edit others' bookings (pending, or approved before start), assign or swap drivers, set vehicles to maintenance / back to available. **Cannot approve own requests** (an Admin does) |
| `Driver` | Driver | See own assignments, start trip, complete trip (return time + odometer). Cannot book |
| `Admin` | Fleet admin | Everything Approver can + vehicle service/maintenance, driver on/off duty, approve anyone's request |

Navigation per role (`ROLE_TABS`): Employee `home, vehicles, trips, profile` · Driver `home, tasks, vehicles, profile` · Manager `home, approvals, vehicles, trips, profile` · Admin `home, approvals, vehicles, fleet, profile`.

## Booking lifecycle

```
Pending ──approve──▶ Approved ──(driver) start──▶ Approved + taskStatus "In Progress" ──complete──▶ Completed
   │                    │                                                                     ▲
   │                    └──(self-drive) return early ─────────────────────────────────────────┘
   ├──reject (reason required)──▶ Rejected
   └──cancel──▶ Cancelled      (also allowed from Approved while not started)
```

Returning before the planned end sets `actualEndTime`, keeps `originalEndTime`,
shortens `endTime`, sets `returnedEarly: true` — the freed slot is immediately bookable.

## Read endpoints

| Method | Path | Returns | Notes |
|---|---|---|---|
| GET | `/me` | `User` | Current user incl. `role`, `driverId` |
| GET | `/users` | `User[]` | Admin/Manager only |
| GET | `/vehicles?date=YYYY-MM-DD` | `Car[]` | Include `maintenance` |
| GET | `/vehicles/:id/availability?date=` | `Booking[]` | Approved + early-returned bookings that occupy the car |
| GET | `/drivers` | `Driver[]` | |
| GET | `/bookings?scope=mine\|all\|pending&from=&to=` | `Booking[]` | `all`/`pending` require Manager/Admin |
| GET | `/tasks?scope=active\|done` | `Booking[]` | Driver's own assignments |
| GET | `/notifications` | `NotificationItem[]` | Current user only |

## Write endpoints

| Method | Path | Body | Service fn | Rules |
|---|---|---|---|---|
| POST | `/bookings` | `{ carId, date, endDate?, startTime, endTime, purpose, destination, passengers, needDriver }` | `createBooking` | role can book; purpose required; not in past; `endDate` ≥ `date` (defaults to `date`), max 14 days; end date-time > start date-time; passengers ≤ seats; no overlap with Approved bookings; car not in service. Notifies Managers+Admins (Admins only if requester is a Manager) |
| POST | `/bookings/:id/approve` | `{ assignDriver?: boolean, driverId?: string }` | `approveBooking` | status Pending; reviewer ≠ requester for Managers. If the request has `needDriver`, the approver answers *Assign a company driver?*: `assignDriver: true` + `driverId` (on duty, not busy in the window) or `assignDriver: false` → approved as self-drive (`needDriver` set false). Re-check car conflict. Notifies requester (+ driver if assigned) |
| POST | `/bookings/:id/reject` | `{ reason }` | `rejectBooking` | reason required. Notifies requester |
| PATCH | `/bookings/:id` | `{ carId, date, endDate?, startTime, endTime, purpose, needDriver, driverId? }` | `updateBooking` | requester: own booking while **Pending**, or **Approved before it starts**; Manager (others' bookings) / Admin (any): the same states. Same checks as create (no clash with other Approved bookings, excluding itself). **Re-approval:** if a requester (not Admin) changes an *approved* booking's car, dates, times or `needDriver`, it goes back to `Pending` (approver, decision and driver cleared; reviewers get `nt_reapprove_*`, the old driver gets `nt_unassigned_*`). Purpose-only changes keep it Approved. Otherwise status stays the same. Manager editing Approved + needDriver: needs a free, active `driverId` (kept if omitted). Notifies the requester when a manager edits (`nt_edited_*`); reviewers when the requester edits (`nt_req_edited_*`); a newly assigned driver (`nt_assigned_*`). Approving it again sends the usual `nt_approved_*` to the requester |
| POST | `/bookings/:id/cancel` | `{ reason? }` | `cancelBooking` | requester only; Pending, or Approved before its start time (after that, use return) |
| POST | `/bookings/:id/return` | `{ returnTime, notes? }` | `returnVehicle` | requester (or Admin), after the booking's start time and within its dates — self-drive **and** driver bookings; notifies the assigned driver |
| POST | `/tasks/:id/start` | — | `startTask` | assigned driver; trip date ≤ today |
| POST | `/tasks/:id/complete` | `{ returnTime, odometer?, notes? }` | `returnVehicle` | assigned driver; `odometer` ≥ car's current odometer (updates car) |
| PUT | `/vehicles/:id/maintenance` | `{ mode: "manual", reason, estimatedDate? }` or `{ mode: "scheduled", reason, startDate, startTime, endDate, endTime }` | `setMaintenance` | Manager or Admin; keeps bookings and notifies requesters, linked assigned drivers, and managers/admins for every overlapping Pending/Approved booking |
| DELETE | `/vehicles/:id/maintenance` | — | `clearMaintenance` | Manager or Admin |
| PATCH | `/drivers/:id` | `{ status: "Active" \| "OffDuty" }` | `toggleDriverDuty` | Admin |
| POST | `/notifications/read-all` | — | `markNotificationsRead` | |

## Scheduled job: auto-complete at end time

Run every minute (cron / queue). Service fn: `autoCompleteExpired`.
Every `Approved` booking whose `endDate endTime` is in the past becomes `Completed`
(`taskStatus: "Completed"` for driver bookings), `actualEndTime = endTime`,
`completedAt = end stamp`, `completionNotes = "Completed automatically at the booking end time."`.
The car is then free for new bookings. Notify the requester and the assigned driver
("Booking ended — car available again").

## Conflict rule (server must enforce)

Bookings are date-time ranges `[startDate startTime, endDate endTime)` and may span several days.
Two bookings conflict when they are for the same car, the existing one is `Approved`,
and `startA < endB && startB < endA` (compare `"YYYY-MM-DD HH:MM"` stamps). The same rule decides whether a driver is busy. Maintenance uses the same half-open date-time overlap rule, including the boundary times of multi-day schedules.
A scheduled record is authoritative even if legacy data has `status = "Maintenance"`;
outside that interval it does not block. A manual record blocks from `setAt` until
explicitly cleared, regardless of `estimatedDate`. A legacy Maintenance car without
metadata remains blocked. Date-only legacy schedules include the entire final day.
See [MAINTENANCE.md](MAINTENANCE.md) for notifications and resolution rules.
Re-check on approve — two pending requests for the same slot can't both be approved.

## Auto-cancelling maintenance conflicts on creation

After successful validation of `POST /bookings`, use
`maintenanceBookingsToCancel` to identify older own Pending/Approved bookings
with maintenance overlap, a future end, no `startedAt`, and no In Progress task.
Their full date-time interval must overlap the new request. Exclude only these
records when checking Approved occupancy; all other validation still applies,
including a future end timestamp on the new request. Atomically create the new
Pending request and mark originals Cancelled with taskStatus null, cancelReason,
and optional `replacedByBookingId`. Retain original approver/driver/history fields.
No user replacement ID or selector is required. On any error commit nothing.

Send request and cancellation in-app notifications; the app also sends created
and cancelled Telegram events. Ordinary manual cancellation permissions are
unchanged; this is a specific creation rule for unstarted maintenance conflicts.
Do not auto-restore originals if the new request is rejected, cancelled or deleted.
Cancelled originals remain in History and are excluded from Home. Home
Pending/Approved cards expire at their exact end time. See MAINTENANCE.md.
