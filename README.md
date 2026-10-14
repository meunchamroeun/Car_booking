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
