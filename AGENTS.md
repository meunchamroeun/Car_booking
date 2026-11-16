# Development guide

## Start here

This is a Next.js 15 / React 19 / TypeScript fleet booking demo, with English and
Khmer translations. Read README.md, docs/API.md, and docs/MAINTENANCE.md first.

- `npm run dev`: http://localhost:3000. Existing `.env.local` is loaded by Next.js.
- `npm test`: maintenance regression tests using Node's built-in runner and the
  installed TypeScript compiler, without an extra runtime dependency.
- `npx tsc --noEmit`: type check.
- `npm run build`: production check. Stop the development server first because
  both commands write `.next`; restart it afterward if it was running.
- `npm run lint` is legacy (`next lint` is not available in the installed Next.js).
  Use the type check and relevant tests; do not report lint as passing.

## Where changes belong

- `src/types/index.ts`: shared domain/API types.
- `src/lib/fleet-service.ts`: pure business commands and queries. Keep validation,
  permissions and notifications here; UI-only enforcement is insufficient.
- `src/lib/permissions.ts`: role and booking action permissions.
- `src/lib/store.tsx`: demo state/localStorage, action wiring, Telegram side effects.
- `src/lib/i18n.ts`: add both English and Khmer user-facing strings.
- `src/components/sheets/`: booking, review, maintenance and return flows.
- `src/components/common/status.tsx`: shared booking badges, including conflicts.
- `tests/maintenance.test.cjs`: fixed-clock maintenance regressions.
- `legacy/`: old UI, excluded from the build; do not implement new features here.

## Rules to preserve

Use shared maintenance overlap helpers for previews, conflicts, notifications and
trip start checks. Never detect affected bookings using only `startDate`.
Intervals are `[start, end)`; touching boundaries do not conflict. Keep approvals
and trip history when maintenance is saved. Do not split or reassign bookings; automatic cancellation is limited to the
documented successful-creation rule below. Ongoing trips must remain returnable/completable. Successful new creation
specifically auto-cancels own, overlapping, unstarted maintenance-conflicted
bookings via `maintenanceBookingsToCancel`. Validate before changing state;
creation/cancellations/notifications must commit together. Retain original audit
history and `replacedByBookingId`. Do not cancel healthy/other-user/unrelated or
actually started bookings. Do not add replacement selectors or cancellation
banners to the new-booking form. Home cards expire at the exact end timestamp.

The app currently persists fleet state in the browser; mirror service rules in a
real backend before production. Do not expose `.env.local` or send real Telegram
messages during tests. Update README/docs when workflow or API behavior changes.
Preserve unrelated user changes.
