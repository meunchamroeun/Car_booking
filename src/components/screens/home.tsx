'use client';

import * as React from 'react';
import { ArrowRight, CalendarPlus, CarFront, CheckCircle2, ClipboardCheck, Clock, Phone, QrCode, RotateCcw, Route, Wrench } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { driverTrips, fleetStats, isLive, myTrips } from '@/lib/selectors';
import { canCompleteTask, canReturnEarly, canReview, canStartTask } from '@/lib/permissions';
import { Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, SectionHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty';
import { CarArt } from '@/components/common/car-art';
import { TripCard } from '@/components/common/trip-card';
import { DayBar } from '@/components/common/day-bar';
import { cn } from '@/lib/utils';
import { VehiclesScreen } from '@/components/screens/vehicles';

export function HomeScreen() {
  const { currentUser } = useApp();
  return (
    <div className="space-y-1">
      <Greeting />
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
        {new Date().toLocaleDateString(lang === 'kh' ? 'km-KH' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
      <h1 className="mt-0.5 text-[24px] font-bold leading-tight tracking-tight">
        {t('hello', { greet: DateUtil.greeting(lang), name: currentUser.name.split(' ')[0] })}
      </h1>
      <p className="mt-0.5 text-[13.5px] text-muted-foreground">{t(`home_sub_${currentUser.role}`)}</p>
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
  const progress = live ? DateUtil.progress(b.startTime, b.endTime) : 0;

  return (
    <div className="hero-pattern relative overflow-hidden rounded-[22px] bg-navy p-4 text-navy-foreground shadow-float">
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
            {DateUtil.friendly(b.startDate, lang)}
            {b.endDate && b.endDate !== b.startDate && ` → ${DateUtil.friendly(b.endDate, lang)}`}
          </p>
          <p className="text-[28px] font-bold leading-none tracking-tight tabular">
            {b.startTime}
            <span className="text-white/45"> – </span>
            {b.endTime}
          </p>
        </div>
        <div className="-mb-1 -mr-2 w-[132px] shrink-0 text-black">
          <CarArt type={car.type} color={car.color} />
        </div>
      </div>

      {live && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-[hsl(var(--accent))]" style={{ width: `${Math.max(4, progress * 100)}%` }} />
          </div>
          <p className="mt-1 text-right text-[11.5px] text-white/60">{t('ends_in', { time: b.endTime })}</p>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.07] p-3 text-[12.5px]">
        <div className="min-w-0">
          <p className="text-white/55">{t('vehicle')}</p>
          <p className="truncate font-semibold">{car.name}</p>
          <p className="font-mono text-[11.5px] text-white/60">{car.plate}</p>
        </div>
        <div className="min-w-0">
          <p className="text-white/55">{mode === 'driver' ? t('passenger') : b.needDriver ? t('driver') : t('destination')}</p>
          <p className="truncate font-semibold">{mode === 'driver' ? requester?.name : b.needDriver ? driver?.name ?? '—' : b.destination || '—'}</p>
          <p className="truncate text-[11.5px] text-white/60">{mode === 'driver' ? b.destination : b.needDriver ? driver?.phone : t('self_drive')}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {mode === 'requester' && (
          <>
            <Button variant="glass" className="flex-1" onClick={() => openSheet({ type: 'booking', id: b.id })}>
              <QrCode /> {t('show_pass')}
            </Button>
            {canReturnEarly(currentUser, b) && live && (
              <Button className="flex-1 bg-white text-navy hover:bg-white/90" onClick={() => openSheet({ type: 'return', id: b.id, mode: 'early' })}>
                <RotateCcw /> {t('return_early')}
              </Button>
            )}
          </>
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
    </div>
  );
}

/* ── Employee ──────────────────────────────────────────────────────────── */

function EmployeeHome() {
  const app = useApp();
  const { hero } = myTrips(app, app.currentUser.id);
  return (
    <>
      {hero && <TripHero b={hero} mode="requester" />}
      <VehiclesScreen embedded />
    </>
  );
}

/* ── Manager / Approver ────────────────────────────────────────────────── */

function PendingHero() {
  const app = useApp();
  const { currentUser, users, t, setCurrentTab } = app;
  const pending = app.bookings.filter(b => canReview(currentUser, b));
  if (!pending.length) {
    return (
      <Card className="flex items-center gap-3 p-4">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-success-soft text-success">
          <CheckCircle2 className="size-6" />
        </span>
        <div>
          <p className="font-semibold">{t('all_caught_up')}</p>
          <p className="text-[13px] text-muted-foreground">{t('all_caught_up_desc')}</p>
        </div>
      </Card>
    );
  }
  const people = [...new Set(pending.map(b => b.requesterId))].map(id => users.find(u => u.id === id)!).filter(Boolean);
  return (
    <button type="button" onClick={() => setCurrentTab('approvals')} className="hero-pattern w-full rounded-[22px] bg-navy p-4 text-left text-navy-foreground shadow-float active:scale-[0.99]">
      <div className="flex items-center justify-between">
        <Badge tone="glass">
          <ClipboardCheck className="size-3" /> {t('pending_review')}
        </Badge>
        <div className="flex -space-x-2">
          {people.slice(0, 4).map(u => (
            <Avatar key={u.id} initials={u.initials} seed={u.id} className="size-8 border-2 border-navy text-[11px]" />
          ))}
        </div>
      </div>
      <p className="mt-4 text-[44px] font-bold leading-none tabular">{pending.length}</p>
      <p className="mt-1 text-[13.5px] text-white/70">
        {pending
          .slice(0, 2)
          .map(b => `${users.find(u => u.id === b.requesterId)?.name.split(' ')[0]} · ${DateUtil.friendly(b.startDate)}`)
          .join('  ·  ')}
      </p>
      <span className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-[14px] font-semibold text-navy">
        {t('review_now')} <ArrowRight className="size-4" />
      </span>
    </button>
  );
}

function Kpis({ items }: { items: { label: string; value: number | string; icon: React.ReactNode; tone: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map(k => (
        <Card key={k.label} className="p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-muted-foreground">{k.label}</span>
            <span className={cn('flex size-8 items-center justify-center rounded-lg [&_svg]:size-4', k.tone)}>{k.icon}</span>
          </div>
          <p className="mt-1.5 text-[26px] font-bold leading-none tabular">{k.value}</p>
        </Card>
      ))}
    </div>
  );
}

function ApproverHome() {
  const app = useApp();
  const { currentUser, t, setCurrentTab } = app;
  const s = fleetStats(app);
  const { hero } = myTrips(app, currentUser.id);

  return (
    <>
      <PendingHero />
      <SectionHeader title={t('fleet_today')}  />
      <Kpis
        items={[
          { label: t('kpi_available'), value: s.available.length, icon: <CarFront />, tone: 'bg-success-soft text-success' },
          { label: t('kpi_in_use'), value: s.inUse.length, icon: <Route />, tone: 'bg-info-soft text-info' },
          { label: t('kpi_trips_today'), value: s.tripsToday.length, icon: <Clock />, tone: 'bg-primary-soft text-primary' },
          { label: t('kpi_service'), value: s.inService.length, icon: <Wrench />, tone: 'bg-warning-soft text-warning' },
        ]}
      />
      {hero && (
        <div className="mt-4">
          <TripHero b={hero} mode="requester" />
        </div>
      )}
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

  return (
    <>
      <Kpis
        items={[
          { label: t('kpi_available'), value: s.available.length, icon: <CarFront />, tone: 'bg-success-soft text-success' },
          { label: t('kpi_in_use'), value: s.inUse.length, icon: <Route />, tone: 'bg-info-soft text-info' },
          { label: t('kpi_service'), value: s.inService.length, icon: <Wrench />, tone: 'bg-warning-soft text-warning' },
          { label: t('kpi_pending'), value: s.pending.length, icon: <ClipboardCheck />, tone: 'bg-primary-soft text-primary' },
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
              <button key={c.id} type="button" onClick={() => openSheet({ type: 'maintenance', carId: c.id })} className="flex w-full items-center gap-3 p-3.5 text-left hover:bg-muted/40">
                <span className="flex size-9 items-center justify-center rounded-lg bg-warning-soft text-warning">
                  <Wrench className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">{c.name}</span>
                  <span className="block truncate text-[12.5px] text-muted-foreground">
                    {c.maintenance?.reason}
                    {c.maintenance?.estimatedDate && ` · ${t('back_on', { date: DateUtil.friendly(c.maintenance.estimatedDate, lang) })}`}
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
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
                <Avatar initials={d.name.split(' ').map(x => x[0]).join('')} seed={d.id} className="size-8 text-[11px]" />
                <span className={cn('size-2 rounded-full', d.status === 'Active' ? 'bg-success' : 'bg-muted-foreground/40')} />
              </div>
              <p className="mt-2 truncate text-[13.5px] font-semibold">{d.name}</p>
              <p className="text-[12px] text-muted-foreground">{d.status === 'Active' ? t('trips_today_n', { n }) : t('off_duty')}</p>
            </Card>
          );
        })}
      </div>
      <SectionHeader title={t('quick_book')} />
      <Button variant="outline" className="w-full" onClick={() => app.openBooking()}>
        <CalendarPlus /> {t('new_booking')}
      </Button>
    </>
  );
}
