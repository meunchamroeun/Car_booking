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
| `Employee` | Employee | Create bookings, see own bookings, cancel own, end own booking early (self-drive or with driver) |
| `Approver` | Manager | Everything Employee can + approve/reject others' requests, assign drivers, set vehicles to maintenance / back to available. **Cannot approve own requests** (an Admin does) |
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
| POST | `/bookings/:id/cancel` | `{ reason? }` | `cancelBooking` | requester only; Pending, or Approved & not started |
| POST | `/bookings/:id/return` | `{ returnTime, notes? }` | `returnVehicle` | requester (or Admin), today within the booking dates — self-drive **and** driver bookings; notifies the assigned driver |
| POST | `/tasks/:id/start` | — | `startTask` | assigned driver; trip date ≤ today |
| POST | `/tasks/:id/complete` | `{ returnTime, odometer?, notes? }` | `returnVehicle` | assigned driver; `odometer` ≥ car's current odometer (updates car) |
| PUT | `/vehicles/:id/maintenance` | `{ mode: "manual", reason, workshop?, estimatedDate? }` or `{ mode: "scheduled", reason, workshop?, startDate, startTime, endDate, endTime }` | `setMaintenance` | Manager or Admin; notifies requesters of bookings inside the window |
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
and `startA < endB && startB < endA` (compare `"YYYY-MM-DD HH:MM"` stamps). The same rule decides whether a driver is busy. A car is unavailable when
`status = "Maintenance"`, or it has a `scheduled` maintenance window covering the date (and time, for single-day windows).
Re-check on approve — two pending requests for the same slot can't both be approved.
