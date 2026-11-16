# OONE Fleet — Company Car Booking (mobile web app)

Mobile-first Next.js app for booking company vehicles, approving requests,
dispatching drivers and managing the fleet. Runs entirely on mock data so it
can be demoed before the backend exists — see **[docs/API.md](docs/API.md)** for the contract.

```bash
npm install
npm run dev      # http://localhost:3000
```

Live demo: https://car-booking-demo-app.vercel.app — also runs as a Telegram Mini App in
[@car_booking_appbot](https://t.me/car_booking_appbot) (see **Telegram Mini App** below).

## Demo accounts (Profile → Demo accounts)

| Account | Role | What to try |
|---|---|---|
| Rotanak Vichea (and 18 other staff) | Employee | Home → Vehicles → Book this vehicle → date & time, purpose, company driver → Book now; My Booking; edit or cancel; return early |
| មុន្នី អ៊ឹង | Manager | Approvals → assign a driver or reject with reason; edit requests; set a car to maintenance. Own requests need an Admin |
| ប៊ុនណារ័ត្ន ឈុំ | Fleet admin | Approvals for everyone, Fleet → vehicle maintenance, drivers on/off duty |

The seed data is the approved history of the EPower Resource Booking bot (BKG-2026-000094 … 000152, 8–28 Oct 2026) with the real fleet (5 cars) and company drivers. Bookings already past their end time show as Completed.

Data persists in `localStorage`; **Profile → Reset demo data** restores the seed.

## Structure

```
src/
  types/index.ts            domain types (= API shapes)
  lib/
    mock-data.ts            seed data
    fleet-service.ts        business rules, one function per API endpoint
    permissions.ts          role → permissions, tabs, per-booking rules
    selectors.ts            derived data for dashboards
    store.tsx               React context: state, sheets, toasts, i18n
    i18n.ts                 English + Khmer
  components/
    ui/                     shadcn-style primitives (Button, Card, Badge, Sheet on Radix Dialog, Segmented…)
    common/                 CarArt, DayBar, TripCard, status badges, OONE logo
    shell/                  TopBar, role-based BottomNav, AppShell
    screens/                home (per role), vehicles, trips, tasks, approvals, fleet, profile
    sheets/                 book, booking detail, review, return/complete, maintenance, notifications
docs/API.md                 endpoint contract for the backend
legacy/                     previous UI, kept for reference (excluded from the build)
```

## Design

- Brand colours from oone.bz: plum `#875A7B` (primary), mauve `#B26EA0` (accent), navy `#162447` (hero surfaces), slate `#5B657E` (secondary text). Tokens in `src/app/globals.css`, light + dark.
- shadcn/ui conventions (CSS variables, `cva` variants, `cn()`), Radix Dialog for accessible bottom sheets.
- Inter + Kantumruy Pro (Khmer).

## Vehicle photos

Each car has an `imageUrl` (and optional `imageCredit`). The demo uses Creative Commons photos
from Wikimedia Commons, credited in **Profile → Vehicle photo credits**:

| Vehicle | Credit / licence |
|---|---|
| Toyota Camry | EurovisionNim, CC BY-SA 4.0 |
| Toyota Fortuner | NZ Car Freak, CC BY-SA 4.0 |
| Ford Ranger | M 93, CC BY-SA 3.0 de |
| Toyota HiAce | User3204, CC BY 4.0 |
| Mazda CX-5 | Mr.choppers, CC BY-SA 3.0 |
| Ford Everest | M 93, CC BY-SA 3.0 de |
| Toyota Hilux | Vauxford, CC BY-SA 4.0 |
| Hyundai Staria | Alexander Migl, CC BY-SA 4.0 |

For production, upload photos of the company's own vehicles and store their URLs in `imageUrl`.
If a photo is missing or fails to load, the app falls back to a drawn illustration.

## Telegram Mini App & Bot Notifications

The same build runs inside Telegram. `src/lib/telegram.ts` loads only when opened from Telegram and:
expands to full height, follows the Telegram light/dark theme and header colour, wires Telegram's
Back button to close sheets / return Home, and gives haptic feedback on success and errors.
Outside Telegram it does nothing.

### Connect the bot (done once in @BotFather):

1. `/mybots` → **@car_booking_appbot** → **Bot Settings** → **Menu Button** → **Configure menu button**
   → send `https://car-booking-demo-app.vercel.app` → button title `Book a car`.
2. Optional, for a direct link `t.me/car_booking_appbot/app`: send `/newapp` → choose the bot →
   title, description, a 640×360 photo → Web App URL `https://car-booking-demo-app.vercel.app` → short name `app`.

### Real-time Booking Alerts via @car_booking_appbot:

When staff submit, approve, reject, or cancel a booking, automated bilingual alerts (Khmer & English) are sent directly to Telegram through the `/api/telegram-notify` endpoint.

Configure in `.env.local` or Vercel Environment Variables:
- `TELEGRAM_BOT_TOKEN`: The bot API token from @BotFather for @car_booking_appbot.
- `TELEGRAM_CHAT_ID`: The target Telegram user ID or group chat ID (e.g. `-100xxxxxxxxxx`). Multiple chat IDs can be separated by commas.

## Maintenance conflicts (booking already approved)

A booking for days 1–5 is affected if maintenance starts on day 5 **before the
vehicle's return time**. Maintenance starting exactly at return time does not
conflict. The same full date-time overlap rule applies to multi-day maintenance.

The app preserves the booking's approval history and uses these visible states
for an Approved booking that has a maintenance conflict and has not started:

| When | English badge | Khmer badge | Progress |
|---|---|---|---|
| Before departure | Change vehicle or time | ត្រូវប្ដូររថយន្ត ឬពេលវេលា | Amber maintenance step; approval remains in history |
| At departure (e.g. 08:00) | Cannot start | មិនអាចចាប់ផ្ដើម | Waiting for maintenance resolution or a replacement vehicle |
| After the conflict is resolved | Normal booking status | Normal translated status | Normal flow resumes |

At departure, the compact home card turns amber and reads **Cannot start ·
Maintenance**. It does not imply **In use**, show a time-left countdown, or offer
**Return early** merely because the start time has passed. The current badge no
longer says Approved while an unstarted booking has an unresolved conflict;
the stored status remains Approved for the audit history. Trips explicitly
started (`In Progress` or `startedAt`) keep their return/completion flow.

### Maintenance details and notifications

- The home card retains its original compact style. A bottom section shows the
  maintenance From/To dates and times and the reason when present. The booking
  detail alert shows the same information in its existing style.
- The maintenance editor lists affected Pending and Approved bookings, including
  multi-day trips that started before the maintenance window.
- Saving maintenance notifies the requester, linked assigned driver user, and
  managers/admins in the app. Each notification opens its booking. Maintenance
  alerts do not use the Telegram endpoint.
- **Out now** blocks immediately until **Mark available** is used. Expected back
  is informational, clearly labeled as an estimate, and never releases the car
  or limits notifications to future bookings.
- **Schedule** blocks only its exact date-time interval. Saving replaces that
  car's previous maintenance record; only one maintenance window per car is
  currently supported.

### Resolving a conflict

Before departure, a manager/admin can edit the booking to use an available
vehicle or change its dates/times, subject to existing permission, approval and
driver rules. Creating, editing, approving and starting driver trips enforce
maintenance conflicts in the service.

For an ongoing trip, coordinate a safe return. The requester or fleet admin can
use **Return early**, or the assigned driver can complete the trip. Make a
separate booking for the replacement vehicle. Splitting or reassigning an ongoing
trip is not automated. Once the scheduled start time has passed, existing
permissions prevent editing the Approved booking, even when departure is blocked;
this currently requires manager coordination using the existing return/rebooking
flow. Clearing maintenance restores the normal time-based display.

For continuation by another developer/agent, start with [AGENTS.md](AGENTS.md),
[docs/MAINTENANCE.md](docs/MAINTENANCE.md), and [docs/API.md](docs/API.md).

## Verification

```bash
npm test            # Maintenance and departure-state regression tests
npx tsc --noEmit    # Type checking
npm run build       # Production build (stop dev first: both use .next)
```

The tests cover full interval overlap, touching boundaries, notification
recipients, ongoing trips, manual maintenance estimates, legacy schedules,
permissions, and the 07:59 → 08:00 blocked-departure transition.

## Deployment

The repository is hosted on GitHub and the application is linked to Vercel.
After the checks above, commit the intended source/documentation changes and push
them to `origin/main`. Verify the production deployment is Ready before reporting
it as live. With an authenticated Vercel CLI and the correct project link in
`.vercel/project.json`, `vercel --prod --yes` deploys the current source to
production. Keep `.vercel`, `.env.local`, and other credentials out of Git.

When an unstarted booking has a maintenance conflict, its schedule line shows
**Vehicle unavailable** (មិនអាចប្រើរថយន្តបាន) instead of **Starts in**, even before
departure. The original booking time remains visible for reference. The normal
countdown returns if the conflict is resolved; actually started trips retain
their remaining-time display and return/completion actions.

## Automatic cancellation after a new booking

A successful new request automatically cancels older **own Pending/Approved
bookings with a maintenance conflict** whose date-time interval overlaps the new
request. Affected originals must not have `startedAt` or an In Progress task and
must not have reached their end time. This also handles an unstarted blocked
booking after its scheduled departure; ordinary manual cancellation permissions
are unchanged.

The old records become **Cancelled**, their taskStatus is cleared, and their
approval/driver history is retained. `replacedByBookingId` links each original to
the new request, with a translated cancellation reason in booking details. The
original leaves Home and remains in History. The new request is **Pending** and
still needs approval. It does not automatically restore the originals if later
rejected or cancelled. The normal created/cancelled in-app and Telegram events
are emitted, and the success toast indicates the cancellation count. The form
uses its normal **Book now** button with no replacement selector or pre-submit
cancellation banner.

The shared `maintenanceBookingsToCancel` helper is used by creation and form
availability validation. Validate the new request's full interval, future end,
seats, purpose, and maintenance state before committing cancellation. Exclude
only the original requests eligible for auto-cancellation from occupancy checks.
If any validation fails, commit nothing: old bookings and notifications remain
unchanged. Healthy bookings, other owners, unrelated date-time windows, ended
bookings and actually started trips are unaffected. Half-open boundaries apply:
ending one trip exactly when the other starts is not overlap.

Persist creation, original cancellations and in-app notifications in one backend
transaction. Old data without `replacedByBookingId` remains compatible. No
`homeSupersededById` visibility field is used. Home Pending/Approved summaries end
at the exact end timestamp, not midnight, so cancelled or ended old cards do not
return when the new card ends. Actual In Progress return/completion behavior is
unchanged.
