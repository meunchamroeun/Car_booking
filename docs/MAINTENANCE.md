# Maintenance workflow and implementation

## Product decision

Maintenance can be recorded even if a booking already exists: urgent vehicle
issues must be recorded. Preserve the booking's approval and history, flag the
conflict, and let a manager coordinate a replacement or changed dates. Saving
maintenance does not automatically cancel, split, or reassign any trip.

Example: booking Nov 1 09:00 → Nov 5 17:00; maintenance Nov 5 08:00 → 18:00.
This conflicts even though the booking starts before maintenance. Maintenance
starting Nov 5 17:00 or later does not conflict with that booking.

## Shared implementation

`src/lib/fleet-service.ts` exports:

- `maintenanceOverlaps(record, bookingWindow)`: compare full date-time intervals.
- `affectedMaintenanceBookings({ bookings }, carId, record)`: Pending/Approved
  bookings for this car, including ongoing multi-day trips.
- `hasMaintenanceConflict(car, bookingWindow)`: shared car availability query,
  including legacy Maintenance cars without a maintenance record.
- `isCarInMaintenance(car, date, start?, end?)`: per-day query; omitted times
  mean the entire day, from midnight to the next midnight.

`checkConflict` uses the full booking window directly, with no day iteration cap.
Creating, editing, approving and starting driver trips enforce maintenance in the
service. Booking status badges and detail sheets derive the warning from current
car metadata; clearing maintenance removes the warning automatically.

## Interval rules and persistence

Compare local `YYYY-MM-DD HH:MM` strings using `startA < endB && startB < endA`.
The app uses local browser time; an eventual backend must define a consistent
business timezone (Asia/Phnom_Penh) across clients and jobs.

Scheduled maintenance uses its precise start and end timestamps across all days.
Missing legacy times mean midnight at start and midnight after the final day.
Schedule writes store the car as Active: the scheduled interval determines its
availability. This also avoids leaving expired schedules permanently offline.
Existing scheduled records with Maintenance status follow their interval too.

Manual maintenance starts at `setAt`; when absent on legacy data, use now.
It has no automatic end. `estimatedDate` is informational only. Clearing it sets
the car Active and removes its maintenance metadata. Scheduled saves replace a
previous manual/scheduled record; there is one record per vehicle, not a calendar
of multiple maintenance appointments.

## Notifications and resolution

Saving notifies, per affected booking, its requester, linked driver user, and all
Approver/Admin users. Recipients are deduplicated per booking. Notifications carry
`bookingId` and English/Khmer translation keys. They are in-app notifications;
maintenance does not send Telegram alerts. A repeated save can send another alert.

Before departure, managers use existing booking edit/review actions to change car
or dates, retaining their permission and conflict checks. Once a trip has started,
existing permissions disallow editing it: coordinate the return, then use Return
early (requester/fleet admin) or Complete (assigned driver), and request a separate
replacement booking. Return/completion is deliberately still allowed during
maintenance. There is no automatic emergency dispatch workflow.

## Validation and regression checks

Run `npm test` and `npx tsc --noEmit`. Tests freeze the business clock and cover
Day 1–5 versus Day 5, exact touching boundaries, multi-day schedule boundaries,
manual maintenance beyond estimates, past trips, recipient links, inactive
booking statuses, stale legacy status, clear maintenance, invalid intervals,
permissions, and service enforcement when starting a trip.

Manual QA: use demo accounts, create an approved future multi-day booking, then
save maintenance overlapping its last day. Verify the editor count/IDs, the two
booking badges, detail warning, and each role's notification link. Move the
maintenance start to the booking's exact end and verify the conflict disappears.
For an ongoing trip, verify return/completion is still possible.

## Continuation opportunities

Multiple maintenance windows and an audit trail need a domain/API migration.
Other explicit future work: manager workflow for splitting/reassigning ongoing
trips, resolved-conflict notifications, Telegram maintenance alerts, and backend
transactions enforcing these same checks. Existing automatic end-time completion
still applies to Approved bookings; maintenance does not add a new booking status.

At the scheduled departure time, an Approved booking with an unresolved maintenance
conflict shows **Cannot start · Maintenance** in amber on the home card. Approval
is preserved, and the card shows the maintenance window, reason, and manager
contact guidance. It does not show In use, a time-left countdown, or Return early
just because its start time has passed. Trips explicitly started (`In Progress`
or `startedAt`) keep their return/completion flow. Clearing maintenance restores
the normal time-based display; this does not add a new booking status.

For Approved bookings with maintenance conflicts that have not actually started,
the visible status badge reads **Change vehicle or time** before departure, then
**Cannot start** at departure time. The stored status remains Approved for audit
history. Progress retains the approval event and shows an amber maintenance step
instead of implying the vehicle is in use; the return step stays unfinished.
Explicitly started trips retain In use and their return/completion actions.
