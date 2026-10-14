# OONE Fleet — Company Car Booking (mobile web app)

Mobile-first Next.js app for booking company vehicles, approving requests,
dispatching drivers and managing the fleet. Runs entirely on mock data so it
can be demoed before the backend exists — see **[docs/API.md](docs/API.md)** for the contract.

```bash
npm install
npm run dev      # http://localhost:3000
```

## Demo accounts (Profile → Demo accounts)

| Account | Role | What to try |
|---|---|---|
| Sokha Chan | Employee | Home → Vehicles → Book this car → date & time, purpose, who drives → Book now; My Booking; show vehicle pass; return early |
| Sophea Lim | Manager | Approvals → assign a driver (busy/off-duty drivers are blocked) or reject with reason. Own requests need an Admin |
| Rithy Kong / Bona Sam | Driver | Home hero → Start trip → Complete trip (return time + odometer) |
| Chanthy Ouk | Fleet admin | Dashboard KPIs & utilisation, Fleet → vehicle service (out now / scheduled), drivers on/off duty |

Data persists in `localStorage`; **Profile → Reset demo data** restores the seed.
Seed trips are placed around the current hour so there is always a live trip to show.

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
    sheets/                 book, booking detail + pass, review, return/complete, maintenance, notifications
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
