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
