'use client';

import * as React from 'react';
import { ArrowRight, CalendarClock, CalendarPlus, CarFront, ChevronRight, CheckCircle2, ClipboardCheck, Clock, FileText, Phone, RotateCcw, Route, UserRound, Wrench } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { driverTrips, fleetStats, isLive, myTrips } from '@/lib/selectors';
import { canCompleteTask, canReturnEarly, canStartTask } from '@/lib/permissions';
import { Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, SectionHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty';
import { CarPhoto } from '@/components/common/car-photo';
import { TripCard } from '@/components/common/trip-card';
import { DayBar } from '@/components/common/day-bar';
import { BookingStatusBadge } from '@/components/common/status';
import { cn } from '@/lib/utils';
import { VehiclesScreen } from '@/components/screens/vehicles';

export function HomeScreen() {
  const { currentUser } = useApp();
  return (
    <div className={cn('space-y-1', (currentUser.role === 'Employee' || currentUser.role === 'Approver') && 'pt-2')}>
      {/* Staff and managers open straight on their booking and the cars; fleet admin keeps the greeting */}
      {currentUser.role !== 'Employee' && currentUser.role !== 'Approver' && <Greeting />}
      {currentUser.role === 'Employee' && <EmployeeHome />}
      {currentUser.role === 'Approver' && <ApproverHome />}
      {currentUser.role === 'Driver' && <DriverHome />}
      {currentUser.role === 'Admin' && <AdminHome />}
    </div>
  );
}

function Greeting() {
  const { currentUser, t, lang } = useApp();
  return (
    <div className="px-1 pb-3 pt-2">
      <p className="text-[13px] font-medium text-muted-foreground">
        {DateUtil.formatDate(DateUtil.todayStr(), lang, 'long')}
      </p>
      <h1 className="mt-0.5 text-[24px] font-bold leading-tight tracking-tight">
        {t('hello', { greet: DateUtil.greeting(lang), name: currentUser.name.split(' ')[0] })}
      </h1>
      <p className="mt-0.5 text-[13.5px] text-muted-foreground">{t(`home_sub_${currentUser.role}`)}</p>
    </div>
  );
}

/* ── Live progress: real date-time maths, updated every second ─────────── */

const toDate = (date: string, time: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, mi);
};

/** Current time, re-rendered every `ms`. */
function useNow(ms = 1000) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** "1:38:12" (or "2d 03:10:05" for long bookings). */
function clock(msLeft: number) {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const hms = `${d ? DateUtil.pad(h) : h}:${DateUtil.pad(m)}:${DateUtil.pad(sec)}`;
  return d ? `${d}d ${hms}` : hms;
}

/** In use: progress bar + countdown to the end. Upcoming: countdown to the start. */
function LiveProgress({ b, live }: { b: Booking; live: boolean }) {
  const { t } = useApp();
  const now = useNow(1000);
  const start = toDate(b.startDate, b.startTime).getTime();
  const end = toDate(b.endDate || b.startDate, b.endTime).getTime();

  if (!live) {
    const until = start - now;
    if (until <= 0 || until > 24 * 3600 * 1000) return null;
    return (
      <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-white/75">
        <Clock className="size-3.5" />
        {t('starts_in')} <span className="font-semibold tabular text-white">{clock(until)}</span>
      </p>
    );
  }

  const pct = Math.min(1, Math.max(0, (now - start) / Math.max(1, end - start)));
  const left = end - now;
  return (
    <div className="mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)} aria-label={t('trip_now')}>
      <div className="mb-1.5 flex items-baseline justify-end text-[12px]">
        <span className="text-white/65">
          <span className="font-semibold tabular text-white">{clock(left)}</span> {t('time_left')}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-white/15">
        <div className="h-full rounded-full bg-[hsl(var(--accent))] transition-[width] duration-1000 ease-linear" style={{ width: `${pct * 100}%` }} />
        {/* "now" dot */}
        <span
          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[hsl(var(--accent))] shadow transition-[left] duration-1000 ease-linear"
          style={{ left: `${pct * 100}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] tabular text-white/55">
        <span>{b.startTime}</span>
        <span>{t('ends_in', { time: b.endTime })}</span>
      </div>
    </div>
  );
}

/* ── Booking card: light, compact summary of the booking that matters now ── */

function BookingNowCard({ b }: { b: Booking }) {
  const { cars, users, currentUser, t, lang, openSheet } = useApp();
  const car = cars.find(c => c.id === b.carId)!;
  const requester = users.find(u => u.id === b.requesterId) || currentUser;
  const live = isLive(b);
  const now = useNow(1000);
  const start = toDate(b.startDate, b.startTime).getTime();
  const end = toDate(b.endDate || b.startDate, b.endTime).getTime();
  const until = start - now;
  const multiDay = !!b.endDate && b.endDate !== b.startDate;
  const open = () => openSheet({ type: 'booking', id: b.id });

  return (
    // Tap anywhere on the card to see the booking details
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open())}
      className={cn(
        'cursor-pointer rounded-2xl border p-3 transition-[transform,box-shadow] hover:shadow-card active:scale-[0.99]',
        live ? 'border-success/35 bg-success-soft/40' : 'border-primary/25 bg-primary-soft/40'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cn('flex min-w-0 items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide', live ? 'text-success' : 'text-primary')}>
          {live ? (
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inset-0 animate-ping_soft rounded-full bg-success" />
              <span className="relative size-2 rounded-full bg-success" />
            </span>
          ) : (
            <CalendarClock className="size-3 shrink-0" />
          )}
          <span className="truncate">{live ? t('now_card_live') : t('now_card_next', { day: DateUtil.friendly(b.startDate, lang) })}</span>
        </p>
        {/* Green "In use" to match the card; other states use the usual badge */}
        {live ? (
          <Badge tone="success" dot className="shrink-0">
            {t('st_In Progress')}
          </Badge>
        ) : (
          <BookingStatusBadge b={b} />
        )}
      </div>

      <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
        <p className="truncate text-[14.5px] font-bold">{car.name}</p>
        <span className="shrink-0 rounded-[5px] border border-[#163280] bg-muted/60 px-1.5 py-[1px] font-mono text-[10.5px] font-semibold text-foreground/85 shadow-2xs leading-none">
          {car.plate}
        </span>
      </div>

      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[12px] text-muted-foreground">
        <Clock className="size-3" />
        <span className="font-semibold tabular text-foreground/80">{multiDay ? DateUtil.window(b, lang) : `${b.startTime} – ${b.endTime}`}</span>
        {live ? (
          <span className="tabular">
            · <span className="font-semibold text-foreground/80">{clock(end - now)}</span> {t('time_left')}
          </span>
        ) : (
          until > 0 &&
          until < 24 * 3600 * 1000 && (
            <span className="tabular">
              · {t('starts_in')} <span className="font-semibold text-foreground/80">{clock(until)}</span>
            </span>
          )
        )}
      </p>

      <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[12px] text-muted-foreground">
        <UserRound className="size-3 shrink-0" />
        <span className="font-normal text-muted-foreground/80">{t('booking_by')} : </span>
        <span className="truncate font-semibold text-foreground/85">{requester?.name || currentUser.name}</span>
      </p>

      {b.purpose && (
        <p className="mt-1 flex min-w-0 items-start gap-1.5 text-[12px] text-muted-foreground leading-snug">
          <FileText className="size-3 shrink-0 mt-0.5" />
          <span className="font-normal text-muted-foreground/80 shrink-0">{t('purpose')} : </span>
          <span className="font-medium text-foreground/85 break-words whitespace-normal">{b.purpose}</span>
        </p>
      )}

      {live && canReturnEarly(currentUser, b) && (
        <button
          type="button"
          onClick={e => (e.stopPropagation(), openSheet({ type: 'return', id: b.id, mode: 'early' }))}
          className="mt-2.5 flex w-full items-center gap-2.5 rounded-xl bg-gradient-to-r from-success to-success/80 px-2.5 py-2 text-left text-white shadow-sm transition-transform hover:brightness-105 active:scale-[0.99]"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/20">
            <RotateCcw className="size-3.5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-bold leading-tight">{t('return_early')}</span>
            <span className="block text-[10.5px] leading-tight text-white/85">{t('return_early_sub')}</span>
          </span>
        </button>
      )}
    </div>
  );
}

/* ── Hero: dark navy card for the trip that matters right now ─────────── */

function TripHero({ b, mode }: { b: Booking; mode: 'requester' | 'driver' }) {
  const { cars, users, drivers, currentUser, t, lang, openSheet, startTask } = useApp();
  const car = cars.find(c => c.id === b.carId)!;
  const requester = users.find(u => u.id === b.requesterId);
  const driver = drivers.find(d => d.id === b.driverId);
  const live = isLive(b);

  return (
    // Tap the card to open the booking details
    <div
      role="button"
      tabIndex={0}
      onClick={() => openSheet({ type: 'booking', id: b.id })}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openSheet({ type: 'booking', id: b.id }))}
      className="hero-pattern relative cursor-pointer overflow-hidden rounded-[22px] bg-navy p-4 text-navy-foreground shadow-float transition-transform active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <Badge tone="glass">
          {live ? <span className="size-1.5 animate-pulse_ring rounded-full bg-[hsl(var(--success))]" /> : <Clock className="size-3" />}
          {live ? t('trip_now') : t('trip_next')}
        </Badge>
        <span className="font-mono text-[12px] text-white/60">{b.id}</span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12.5px] font-medium text-white/65">
            {DateUtil.longDate(b.startDate, lang)}
            {b.endDate && b.endDate !== b.startDate && ` → ${DateUtil.longDate(b.endDate, lang)}`}
          </p>
          <p className="text-[28px] font-bold leading-none tracking-tight tabular">
            {b.startTime}
            <span className="text-white/45"> – </span>
            {b.endTime}
          </p>
        </div>
        <CarPhoto car={car} zoomable className="h-[80px] w-[124px] shrink-0 rounded-2xl ring-1 ring-white/15" />
      </div>

      <LiveProgress b={b} live={live} />

      <div className="mt-3 divide-y divide-white/10 rounded-2xl bg-white/[0.07] text-[12.5px]">
        <div className="grid grid-cols-2 gap-3 p-3">
          <div className="min-w-0">
            <p className="text-[11.5px] font-medium text-white/55">{t('vehicle')}</p>
            <p className="truncate text-[13.5px] font-semibold">{car.name}</p>
            <p className="font-mono text-[11.5px] text-white/60">{car.plate}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[11.5px] font-medium text-white/55">
              {mode === 'driver' ? t('passenger') : t('driver')}
            </p>
            {mode === 'driver' ? (
              <>
                <p className="truncate text-[13.5px] font-semibold">{requester?.name ?? '—'}</p>
                <p className="truncate text-[11.5px] text-white/60">{requester?.phone || '—'}</p>
              </>
            ) : b.needDriver ? (
              <>
                <p className="truncate text-[13.5px] font-semibold">{driver?.name ?? t('with_driver')}</p>
                <p className="truncate text-[11.5px] text-white/60">{driver?.phone || t('with_driver_desc')}</p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold">
                  <UserRound className="size-3.5 text-white/70" />
                  {t('self_drive')}
                </p>
                <p className="truncate text-[11.5px] text-white/60">{t('self_drive_desc')}</p>
              </>
            )}
          </div>
        </div>

        {b.purpose && (
          <div className="p-3 pt-2.5">
            <p className="text-[11.5px] font-medium text-white/55">{t('purpose')}</p>
            <p className="mt-0.5 text-[13px] font-medium leading-relaxed text-white/95">{b.purpose}</p>
          </div>
        )}
      </div>

      {(mode === 'driver' || (canReturnEarly(currentUser, b) && live)) && (
        <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
          {mode === 'requester' && (
            <Button className="flex-1 bg-white text-navy hover:bg-white/90" onClick={() => openSheet({ type: 'return', id: b.id, mode: 'early' })}>
              <RotateCcw /> {t('return_early')}
            </Button>
          )}
          {mode === 'driver' && (
            <>
              {requester && (
                <Button variant="glass" size="icon" className="size-11 rounded-xl" asChild>
                  <a href={`tel:${requester.phone.replace(/\s/g, '')}`} aria-label={t('call')}>
                    <Phone />
                  </a>
                </Button>
              )}
              {canStartTask(currentUser, b) && (
                <Button className="flex-1 bg-white text-navy hover:bg-white/90" onClick={() => startTask(b.id)}>
                  <Route /> {t('start_trip')}
                </Button>
              )}
              {canCompleteTask(currentUser, b) && (
                <Button className="flex-1 bg-white text-navy hover:bg-white/90" onClick={() => openSheet({ type: 'return', id: b.id, mode: 'complete' })}>
                  <CheckCircle2 /> {t('complete_trip')}
                </Button>
              )}
              {!canStartTask(currentUser, b) && !canCompleteTask(currentUser, b) && (
                <Button variant="glass" className="flex-1" onClick={() => openSheet({ type: 'booking', id: b.id })}>
                  {t('not_today', { date: DateUtil.friendly(b.startDate, lang) })}
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Employee ──────────────────────────────────────────────────────────── */

function EmployeeHome() {
  const app = useApp();
  const { hero } = myTrips(app, app.currentUser.id);
  return (
    <>
      {hero && <BookingNowCard b={hero} />}
      <VehiclesScreen embedded />
    </>
  );
}

/* ── Manager / Approver ────────────────────────────────────────────────── */

function Kpis({ items }: { items: { label: string; value: number | string; icon: React.ReactNode; tone: string; onClick?: () => void }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map(k => (
        <button
          key={k.label}
          type="button"
          onClick={k.onClick}
          disabled={!k.onClick}
          className="group rounded-xl border bg-card p-3.5 text-left shadow-card transition-[transform,box-shadow,border-color] enabled:hover:border-primary/40 enabled:hover:shadow-float enabled:active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-muted-foreground">{k.label}</span>
            <span className={cn('flex size-8 items-center justify-center rounded-lg [&_svg]:size-4', k.tone)}>{k.icon}</span>
          </div>
          <div className="mt-1.5 flex items-end justify-between">
            <p className="text-[26px] font-bold leading-none tabular">{k.value}</p>
            {k.onClick && <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />}
          </div>
        </button>
      ))}
    </div>
  );
}

function ApproverHome() {
  const app = useApp();
  const { currentUser } = app;
  const { hero } = myTrips(app, currentUser.id);

  // Same as staff: pending requests live in the Approvals tab (with its badge)
  return (
    <>
      {hero && <BookingNowCard b={hero} />}
      <VehiclesScreen embedded />
    </>
  );
}

/* ── Driver ────────────────────────────────────────────────────────────── */

function DriverHome() {
  const app = useApp();
  const { currentUser, t } = app;
  const d = driverTrips(app, currentUser.driverId);
  const today = d.active.filter(b => b.startDate === DateUtil.todayStr() && b !== d.hero);
  const later = d.active.filter(b => b.startDate > DateUtil.todayStr() && b !== d.hero);

  return (
    <>
      {d.hero ? <TripHero b={d.hero} mode="driver" /> : <EmptyState icon={<Route />} title={t('no_tasks')} desc={t('no_tasks_desc')} />}
      <div className="mt-3">
        <Kpis
          items={[
            { label: t('kpi_trips_today'), value: d.todayCount, icon: <Route />, tone: 'bg-primary-soft text-primary' },
            { label: t('kpi_done_week'), value: d.weekDone, icon: <CheckCircle2 />, tone: 'bg-success-soft text-success' },
          ]}
        />
      </div>
      {today.length > 0 && (
        <>
          <SectionHeader title={t('my_tasks_today')} />
          <div className="space-y-3">
            {today.map(b => (
              <TripCard key={b.id} b={b} perspective="driver" />
            ))}
          </div>
        </>
      )}
      {later.length > 0 && (
        <>
          <SectionHeader title={t('upcoming')} action={<Button variant="link" size="sm" onClick={() => app.setCurrentTab('tasks')}>{t('see_all')}</Button>} />
          <div className="space-y-3">
            {later.slice(0, 2).map(b => (
                <TripCard key={b.id} b={b} perspective="driver" />
              ))}
          </div>
        </>
      )}
    </>
  );
}

/* ── Fleet admin ───────────────────────────────────────────────────────── */

function AdminHome() {
  const app = useApp();
  const { t, setCurrentTab, openSheet, lang } = app;
  const s = fleetStats(app);
  const { hero } = myTrips(app, app.currentUser.id);

  return (
    <>
      {hero && (
        <div className="mb-2.5">
          <BookingNowCard b={hero} />
        </div>
      )}
      <Kpis
        items={[
          { label: t('kpi_available'), value: s.available.length, icon: <CarFront />, tone: 'bg-success-soft text-success', onClick: () => openSheet({ type: 'kpi', kind: 'available' }) },
          { label: t('kpi_in_use'), value: s.inUse.length, icon: <Route />, tone: 'bg-info-soft text-info', onClick: () => openSheet({ type: 'kpi', kind: 'in_use' }) },
          { label: t('kpi_service'), value: s.inService.length, icon: <Wrench />, tone: 'bg-warning-soft text-warning', onClick: () => openSheet({ type: 'kpi', kind: 'service' }) },
          { label: t('kpi_pending'), value: s.pending.length, icon: <ClipboardCheck />, tone: 'bg-primary-soft text-primary', onClick: () => setCurrentTab('approvals') },
        ]}
      />

      {(s.pending.length > 0 || s.inService.length > 0) && (
        <>
          <SectionHeader title={t('attention')} />
          <Card className="divide-y">
            {s.pending.length > 0 && (
              <button type="button" onClick={() => setCurrentTab('approvals')} className="flex w-full items-center gap-3 p-3.5 text-left hover:bg-muted/40">
                <span className="flex size-9 items-center justify-center rounded-lg bg-warning-soft text-warning">
                  <ClipboardCheck className="size-[18px]" />
                </span>
                <span className="flex-1 text-[14px] font-semibold">
                  {s.pending.length} {t('pending_review').toLowerCase()}
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </button>
            )}
            {s.inService.map(c => (
              <button key={c.id} type="button" onClick={() => openSheet({ type: 'maintenance', carId: c.id })} className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-muted/40">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning">
                  <Wrench className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[14px] font-semibold">{c.name}</span>
                    {c.maintenance?.estimatedDate && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-warning/25 bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning whitespace-nowrap">
                        <Clock className="size-2.5 shrink-0" />
                        {t('back_on', { date: DateUtil.friendly(c.maintenance.estimatedDate, lang) })}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-[12.5px] text-muted-foreground mt-0.5">
                    {c.maintenance?.reason}
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </Card>
        </>
      )}

      <SectionHeader title={t('utilization')} action={<Badge tone="primary">{s.avgUtil}%</Badge>} />
      <Card className="divide-y">
        {s.utilisation.map(u => (
          <div key={u.car.id} className="flex items-center gap-3 px-3.5 py-3">
            <div className="w-[38%] min-w-0">
              <p className="truncate text-[13.5px] font-semibold">{u.car.name}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{u.car.plate}</p>
            </div>
            <DayBar bookings={u.bookings} date={DateUtil.todayStr()} maintenance={u.maintenance} className="flex-1 [&>div:last-child]:hidden" />
            <span className="w-9 text-right text-[12px] font-semibold tabular text-muted-foreground">{u.maintenance ? '—' : `${u.pct}%`}</span>
          </div>
        ))}
      </Card>

      <SectionHeader title={t('tab_drivers')} action={<Button variant="link" size="sm" onClick={() => setCurrentTab('fleet')}>{t('manage')}</Button>} />
      <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4">
        {app.drivers.map(d => {
          const n = app.bookings.filter(b => b.driverId === d.id && b.startDate === DateUtil.todayStr() && b.status === 'Approved').length;
          return (
            <Card key={d.id} className="w-[150px] shrink-0 p-3">
              <div className="flex items-center gap-2">
                <Avatar initials={d.name.split(' ').map(x => x[0]).join('')} seed={d.id} src={d.avatarUrl} className="size-8 text-[11px]" />
                <span className={cn('size-2 rounded-full', d.status === 'Active' ? 'bg-success' : 'bg-muted-foreground/40')} />
              </div>
              <p className="mt-2 truncate text-[13.5px] font-semibold">{d.name}</p>
              <p className="text-[12px] text-muted-foreground">{d.status === 'Active' ? t(n === 1 ? 'trips_today_one' : 'trips_today_n', { n }) : t('off_duty')}</p>
            </Card>
          );
        })}
      </div>
      <Button variant="outline" className="mt-5 w-full" onClick={() => app.openBooking()}>
        <CalendarPlus /> {t('new_booking')}
      </Button>
    </>
  );
}
