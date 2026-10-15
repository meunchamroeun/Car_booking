'use client';

import * as React from 'react';
import { CalendarDays, CarFront, ChevronRight, Clock, Fuel, LayoutList, MapPin, Search, Users, Wrench } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { can } from '@/lib/permissions';
import { occupyingBookings } from '@/lib/fleet-service';
import { Car, CarType } from '@/types';
import { PageHeader, Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Chips, Segmented } from '@/components/ui/segmented';
import { EmptyState } from '@/components/ui/empty';
import { CarPhoto } from '@/components/common/car-photo';
import { DAY_END, DAY_START, DayBar, DayBarLegend, legendLabels } from '@/components/common/day-bar';
import { RangeCalendar } from '@/components/ui/range-calendar';
import { cn } from '@/lib/utils';
import { BOOKING_SLOTS, SLOT_ORDER } from '@/lib/slots';

const SLOT_RANGE = {
  morning: [BOOKING_SLOTS.morning.start, BOOKING_SLOTS.morning.end],
  afternoon: [BOOKING_SLOTS.afternoon.start, BOOKING_SLOTS.afternoon.end],
} as const;

export function VehiclesScreen({ embedded = false }: { embedded?: boolean }) {
  const app = useApp();
  const { t, viewMode, setViewMode, selectedDate, setSelectedDate, selectedSlot, setSelectedSlot, filterType, setFilterType, searchQuery, setSearchQuery, cars, lang } = app;

  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const today = React.useMemo(() => DateUtil.todayStr(), []);
  const tomorrow = React.useMemo(() => DateUtil.addDays(today, 1), [today]);

  const defaultDays = React.useMemo(() => Array.from({ length: 12 }, (_, i) => DateUtil.addDays(today, i)), [today]);
  const days = React.useMemo(() => {
    if (defaultDays.includes(selectedDate)) return defaultDays;
    return [...defaultDays, selectedDate].sort((a, b) => a.localeCompare(b));
  }, [defaultDays, selectedDate]);

  const getDayLabel = (d: string) => {
    if (d === today) return t('today');
    if (d === tomorrow) return t('tomorrow');
    return DateUtil.weekdayShort(d, lang);
  };

  const filtered = cars.filter(c => {
    if (filterType !== 'all' && c.type !== filterType) return false;
    const q = searchQuery.trim().toLowerCase();
    if (q && !c.name.toLowerCase().includes(q) && !c.plate.toLowerCase().includes(q)) return false;
    // Morning / Afternoon: keep cars with at least an hour free in that slot
    if (selectedSlot !== 'all') return !app.isCarInMaintenance(c.id, selectedDate) && !!suggestWindow(app, c.id);
    return true;
  });

  return (
    <div id={embedded ? 'vehicles' : undefined} className={embedded ? 'mt-6 scroll-mt-20' : ''}>
      <PageHeader
        compact={embedded}
        title={t('vehicles_title')}
        subtitle={t('vehicles_sub')}
        action={
          <Segmented
            size="sm"
            ariaLabel={t('a11y_view_mode')}
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'cards', label: <LayoutList className="size-4" aria-label={t('cards')} /> },
              { value: 'timeline', label: <CalendarDays className="size-4" aria-label={t('timeline')} /> },
            ]}
          />
        }
      />

      {/* Date strip */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="listbox" aria-label={t('date')}>
        {days.map(d => {
          const active = d === selectedDate;
          return (
            <button
              key={d}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => {
                setSelectedDate(d);
                setCalendarOpen(false);
              }}
              className={cn(
                'flex h-[64px] min-w-[56px] px-1 shrink-0 flex-col items-center justify-center rounded-2xl border text-center transition-all',
                active ? 'border-navy bg-navy text-navy-foreground shadow-float dark:border-primary dark:bg-primary dark:text-primary-foreground' : 'bg-card hover:bg-muted'
              )}
            >
              <span className={cn('text-[10.5px] font-medium leading-none truncate max-w-full px-0.5', active ? 'opacity-85' : 'text-muted-foreground')}>
                {getDayLabel(d)}
              </span>
              <span className="mt-1 text-[18px] font-bold tabular leading-tight">{DateUtil.dayNum(d)}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setCalendarOpen(o => !o)}
          aria-label={t('plan_date')}
          aria-expanded={calendarOpen}
          className={cn(
            'flex h-[64px] min-w-[56px] px-1 shrink-0 flex-col items-center justify-center rounded-2xl border text-center transition-all',
            calendarOpen || !defaultDays.includes(selectedDate)
              ? 'border-primary bg-primary-soft text-primary font-semibold'
              : 'border-dashed bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <CalendarDays className="size-4" />
          <span className="mt-1 text-[10px] font-semibold leading-tight">
            {!defaultDays.includes(selectedDate) ? DateUtil.dayNum(selectedDate) : t('plan_date')}
          </span>
        </button>
      </div>

      {/* Expandable Calendar Picker */}
      {calendarOpen && (
        <div className="mt-2.5 rounded-2xl border bg-card p-3 shadow-card animate-in fade-in-0 zoom-in-95">
          <div className="mb-2 flex items-center justify-between border-b pb-2">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
              <CalendarDays className="size-4 text-primary" />
              {t('plan_date')} · <span className="font-normal text-muted-foreground">{DateUtil.longDate(selectedDate, lang)}</span>
            </span>
            <button
              type="button"
              onClick={() => setCalendarOpen(false)}
              className="rounded-lg px-2 py-0.5 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {t('close')}
            </button>
          </div>
          <RangeCalendar
            mode="single"
            start={selectedDate}
            end={selectedDate}
            min={today}
            lang={lang}
            onChange={s => {
              setSelectedDate(s);
              setCalendarOpen(false);
            }}
            onDone={() => setCalendarOpen(false)}
            labels={{
              pickStart: t('cal_pick_start'),
              pickEnd: t('cal_pick_end'),
              booked: t('cal_booked'),
              unavailable: t('unavailable'),
              prev: t('a11y_prev_month'),
              next: t('a11y_next_month'),
            }}
          />
        </div>
      )}

      <div className="mt-3 space-y-3">
        <Segmented
          size="lg"
          value={selectedSlot}
          onChange={setSelectedSlot}
          ariaLabel={t('a11y_time_slot')}
          options={(
            [
              ['all', 'full_day'],
              ['morning', 'morning'],
              ['afternoon', 'afternoon'],
            ] as const
          ).map(([value, key]) => ({
            value,
            label: (
              <span className="flex flex-col items-center leading-tight">
                <span>{t(key)}</span>
                <span className="text-[11px] font-medium tabular opacity-70">
                  {BOOKING_SLOTS[key].start}–{BOOKING_SLOTS[key].end}
                </span>
              </span>
            ),
          }))}
        />
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('search_hint')} className="pl-10" aria-label={t('search_hint')} />
        </div>
        <Chips<'all' | CarType>
          value={filterType}
          onChange={setFilterType}
          options={(['all', 'Sedan', 'SUV', 'Van', 'Pickup'] as const).map(v => ({
            value: v,
            label: t(v === 'all' ? 'type_all' : `type_${v}`),
            count: v === 'all' ? undefined : cars.filter(c => c.type === v).length,
          }))}
        />
      </div>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <EmptyState icon={<CarFront />} title={t('no_results')} />
        ) : viewMode === 'cards' ? (
          <div className="space-y-3">
            <div className="rounded-xl border bg-card px-3 py-2">
              <DayBarLegend
                labels={legendLabels(t)}
                items={['free', 'booked', ...(selectedDate === DateUtil.todayStr() ? (['past', 'now'] as const) : []), 'service']}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">{t('bar_tap_hint')}</p>
            </div>
            {filtered.map(c => (
              <VehicleCard key={c.id} car={c} />
            ))}
          </div>
        ) : (
          <Timeline cars={filtered} />
        )}
      </div>
    </div>
  );
}

/** Slot to pre-select when booking: the one picked in the filter, if it's still ahead and free for this car. */
const BOOK_SLOTS: [string, string][] = SLOT_ORDER.map(k => [BOOKING_SLOTS[k].start, BOOKING_SLOTS[k].end]);
/** Name of the slot for a [start, end] window, e.g. 'morning'; null for a custom window. */
function slotKeyOf([s, e]: [string, string]) {
  return SLOT_ORDER.find(k => BOOKING_SLOTS[k].start === s && BOOKING_SLOTS[k].end === e) ?? null;
}

const MIN_GAP = 60; // shortest free stretch worth offering, in minutes

/**
 * Time to offer on a car card:
 * 1. the slot picked in the filter (or Full day, then Morning/Afternoon), if free;
 * 2. otherwise the first free stretch of at least an hour inside working hours
 *    (e.g. 14:00–17:30 when someone has 11:00–14:00), so a partly booked car is still bookable.
 */
function suggestWindow(app: ReturnType<typeof useApp>, carId: string): [string, string] | null {
  const { selectedDate, selectedSlot } = app;
  const today = selectedDate === DateUtil.todayStr();
  const now = DateUtil.toMins(DateUtil.nowTimeStr());
  const fullDay: [string, string] = [BOOKING_SLOTS.full_day.start, BOOKING_SLOTS.full_day.end];
  const candidates = selectedSlot === 'all' ? [fullDay, ...BOOK_SLOTS.filter(w => w[0] !== fullDay[0] || w[1] !== fullDay[1])] : [[...SLOT_RANGE[selectedSlot]] as [string, string]];
  const hhmm = (m: number) => `${DateUtil.pad(Math.floor(m / 60))}:${DateUtil.pad(m % 60)}`;
  // Today: a slot that has already started is offered from the next half hour (e.g. 09:30–17:30)
  const nextHalf = Math.ceil(now / 30) * 30;
  const fromNow = ([s, e]: [string, string]): [string, string] | null => {
    if (!today || DateUtil.toMins(s) >= nextHalf) return [s, e];
    return DateUtil.toMins(e) - nextHalf >= MIN_GAP ? [hhmm(nextHalf), e] : null;
  };
  const preset = candidates
    .map(fromNow)
    .find((w): w is [string, string] => !!w && app.checkConflict(carId, selectedDate, w[0], w[1]).ok);
  if (preset) return preset;

  // Free gaps inside the chosen range (whole working day, or the filtered slot)
  const [rangeStart, rangeEnd] = (selectedSlot === 'all' ? fullDay : SLOT_RANGE[selectedSlot]).map(DateUtil.toMins);
  // Today: start from the next half hour
  const from = Math.max(rangeStart, today ? nextHalf : rangeStart);
  const taken = occupyingBookings(app, carId, selectedDate)
    .filter(b => b.status === 'Approved')
    .map(b => [DateUtil.toMins(b.startTime), DateUtil.toMins(b.endTime)] as const)
    .sort((x, y) => x[0] - y[0]);
  let cur = from;
  for (const [s, e] of [...taken, [rangeEnd, rangeEnd] as const]) {
    const gapEnd = Math.min(s, rangeEnd);
    if (gapEnd - cur >= MIN_GAP) {
      const w: [string, string] = [hhmm(cur), hhmm(gapEnd)];
      if (app.checkConflict(carId, selectedDate, w[0], w[1]).ok) return w;
    }
    cur = Math.max(cur, e);
    if (cur >= rangeEnd) break;
  }
  return null;
}

function VehicleCard({ car }: { car: Car }) {
  const app = useApp();
  const { t, selectedDate, currentUser, users, openBooking, openSheet, lang } = app;
  const canSeeAll = can(currentUser, 'booking.view_all');
  const busy = occupyingBookings(app, car.id, selectedDate);
  const inService = app.isCarInMaintenance(car.id, selectedDate);
  const win = inService ? null : suggestWindow(app, car.id);
  const canBook = can(currentUser, 'booking.create');
  const canManage = can(currentUser, 'vehicle.maintenance');
  // The whole card books the car (the button just shows which slot)
  const bookable = canBook && !!win;
  const book = () => win && openBooking(car.id, win[0], win[1]);

  const status = inService
    ? { tone: 'warning' as const, label: t('st_service') }
    : busy.length === 0
      ? { tone: 'success' as const, label: t('st_available') }
      : win
        ? { tone: 'primary' as const, label: t('st_partly') }
        : { tone: 'danger' as const, label: t('st_full') };

  return (
    <Card
      className={cn('overflow-hidden', bookable && 'cursor-pointer transition-[box-shadow,transform] hover:shadow-float active:scale-[0.99]')}
      {...(bookable && {
        role: 'button',
        tabIndex: 0,
        'aria-label': `${t('book_short')} ${car.name} ${win![0]}–${win![1]}`,
        onClick: book,
        onKeyDown: (e: React.KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), book()),
      })}
    >
      <div className="flex gap-3 p-4">
        <CarPhoto car={car} zoomable className="h-[78px] w-[112px] shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[15px] font-semibold leading-snug">{car.name}</p>
            <Badge tone={status.tone} dot className="shrink-0">
              {status.label}
            </Badge>
          </div>
          <p className="font-mono text-[12px] text-muted-foreground">{car.plate}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {t('seats', { n: car.seats })}
            </span>
            <span className="flex items-center gap-1">
              <CarFront className="size-3.5" />
              {t(`type_${car.type}`)}
            </span>
            {car.fuel && (
              <span className="flex items-center gap-1">
                <Fuel className="size-3.5" />
                {car.fuel}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-3">
        {inService ? (
          <div
            className={cn(
              'group/maint rounded-2xl border border-warning/25 bg-warning-soft/70 p-3.5 text-warning transition-all',
              canManage && 'cursor-pointer hover:border-warning/45 hover:bg-warning-soft/90 hover:shadow-xs'
            )}
            {...(canManage && {
              role: 'button',
              tabIndex: 0,
              onClick: e => {
                e.stopPropagation();
                openSheet({ type: 'maintenance', carId: car.id });
              },
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  openSheet({ type: 'maintenance', carId: car.id });
                }
              },
            })}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-warning">
                <span className="flex size-5 items-center justify-center rounded-full bg-warning/20">
                  <Wrench className="size-3 text-warning" />
                </span>
                <span>{t('nt_maint_title')}</span>
              </div>
              {car.maintenance?.estimatedDate && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-warning/25 bg-background/85 px-2.5 py-0.5 text-[11px] font-semibold text-warning shadow-xs whitespace-nowrap backdrop-blur-xs">
                  <Clock className="size-3 shrink-0" />
                  <span>{t('back_on', { date: DateUtil.friendly(car.maintenance.estimatedDate, lang) })}</span>
                </span>
              )}
              {car.maintenance?.mode === 'scheduled' && car.maintenance.startDate && car.maintenance.endDate && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-warning/25 bg-background/85 px-2.5 py-0.5 text-[11px] font-semibold text-warning shadow-xs whitespace-nowrap backdrop-blur-xs">
                  <CalendarDays className="size-3 shrink-0" />
                  <span>
                    {DateUtil.friendly(car.maintenance.startDate, lang)} – {DateUtil.friendly(car.maintenance.endDate, lang)}
                  </span>
                </span>
              )}
            </div>

            <p className="mt-2 text-[13px] font-medium leading-snug text-foreground/90">
              {car.maintenance?.reason || t('nt_maint_title')}
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-muted-foreground">
              {car.maintenance?.workshop ? (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="size-3 shrink-0 text-muted-foreground/80" />
                  <span className="truncate">{car.maintenance.workshop}</span>
                </span>
              ) : (
                <span />
              )}
              {canManage && (
                <span className="ml-auto inline-flex items-center gap-0.5 font-medium text-warning group-hover/maint:underline">
                  {t('manage')} <ChevronRight className="size-3" />
                </span>
              )}
            </div>
          </div>
        ) : (
          <>
            <DayBar bookings={busy} date={selectedDate} interactive />
            {busy.length > 0 && (
              <ul className="mt-2.5 space-y-1.5">
                {busy.map(b => {
                  const who = users.find(u => u.id === b.requesterId);
                  const mine = b.requesterId === currentUser.id;
                  const done = b.status === 'Completed';
                  return (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={e => {
                          if (!(mine || canSeeAll)) return;
                          e.stopPropagation();
                          openSheet({ type: 'booking', id: b.id });
                        }}
                        className={cn('flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left', mine ? 'bg-primary-soft' : 'bg-muted/60', !(mine || canSeeAll) && 'cursor-default')}
                      >
                        <Avatar initials={who?.initials ?? '?'} seed={who?.id} className="size-7 text-[10.5px]" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold">
                            {who?.name ?? '—'}
                            {mine && <span className="ml-1 font-medium text-primary">({t('you')})</span>}
                          </span>
                          <span className="block truncate text-[11.5px] text-muted-foreground" title={b.purpose}>
                            {b.purpose || who?.dept}
                          </span>
                        </span>
                        <span className={cn('shrink-0 text-[12px] font-semibold tabular', done ? 'text-muted-foreground' : 'text-primary')}>
                          {DateUtil.timeSpan(app.bookings.find(x => x.id === b.id) ?? b, lang)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      {(canBook || canManage) && (
        <div className="flex gap-2 border-t px-4 py-3">
          {canManage && (
            <Button variant="outline" size="sm" className="h-10" onClick={e => (e.stopPropagation(), openSheet({ type: 'maintenance', carId: car.id }))}>
              <Wrench /> {inService ? t('manage') : t('set_service')}
            </Button>
          )}
          {canBook && (
            <Button size="sm" className="h-10 flex-1" disabled={!win} onClick={e => (e.stopPropagation(), book())}>
              {win ? (
                <span className="flex items-center gap-1.5">
                  {t('book_short')}
                  <span className="opacity-60">·</span>
                  {slotKeyOf(win) && <span className="font-medium opacity-90">{t(slotKeyOf(win)!)}</span>}
                  <span className="tabular">
                    {win[0]}–{win[1]}
                  </span>
                </span>
              ) : (
                t('unavailable')
              )}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function Timeline({ cars }: { cars: Car[] }) {
  const app = useApp();
  const { t, selectedDate, currentUser, users, openBooking, openSheet, showToast } = app;
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);
  const span = (DAY_END - DAY_START) * 60;
  const pct = (time: string) => ((DateUtil.toMins(time) - DAY_START * 60) / span) * 100;
  const canBook = can(currentUser, 'booking.create');
  const canSeeAll = can(currentUser, 'booking.view_all');
  const isToday = selectedDate === DateUtil.todayStr();
  const now = pct(DateUtil.nowTimeStr());
  const nowM = DateUtil.toMins(DateUtil.nowTimeStr());

  return (
    <Card className="overflow-hidden">
      <p className="border-b px-4 py-2.5 text-[12.5px] text-muted-foreground">{canBook ? t('timeline_hint') : DateUtil.friendly(selectedDate, app.lang)}</p>
      <div className="no-scrollbar overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="flex border-b bg-muted/40">
            <div className="sticky left-0 z-10 w-[120px] shrink-0 bg-muted/90 backdrop-blur" />
            {hours.map(h => (
              <div key={h} className="flex-1 border-l py-1.5 text-center text-[11px] font-semibold tabular text-muted-foreground">
                {DateUtil.pad(h)}
              </div>
            ))}
          </div>
          {cars.map(c => {
            const busy = occupyingBookings(app, c.id, selectedDate);
            const service = app.isCarInMaintenance(c.id, selectedDate);
            // Tapping the car books its next free window, same as the car cards
            const win = canBook && !service ? suggestWindow(app, c.id) : null;
            return (
              <div key={c.id} className="flex border-b last:border-b-0">
                <button
                  type="button"
                  disabled={!win}
                  onClick={() => win && openBooking(c.id, win[0], win[1])}
                  aria-label={win ? `${t('book_short')} ${c.name} ${win[0]}–${win[1]}` : c.name}
                  className="group sticky left-0 z-10 flex w-[120px] shrink-0 items-center border-r bg-card px-3 py-2.5 text-left transition-colors enabled:hover:bg-primary-soft enabled:active:bg-primary-soft disabled:cursor-default"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold group-enabled:group-hover:text-primary">{c.name}</span>
                    <span className="block font-mono text-[10.5px] text-muted-foreground">{c.plate}</span>
                  </span>
                </button>
                <div className="relative flex flex-1">
                  {hours.map(h => (
                    <button
                      key={h}
                      type="button"
                      disabled={!canBook || service || (isToday && (h + 1) * 60 <= nowM)}
                      aria-label={`${c.name} ${DateUtil.pad(h)}:00`}
                      onClick={() => openBooking(c.id, `${DateUtil.pad(h)}:00`, `${DateUtil.pad(h + 1)}:00`)}
                      className="flex-1 border-l transition-colors enabled:hover:bg-primary-soft disabled:cursor-default"
                    />
                  ))}
                  {/* Time already passed today: grey diagonal stripes (//////) */}
                  {isToday && now > 0 && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 left-0 bg-[repeating-linear-gradient(135deg,hsl(var(--muted-foreground)/0.22)_0_2px,transparent_2px_7px)]"
                      style={{ width: `${Math.min(now, 100)}%` }}
                    />
                  )}
                  {service && (
                    <div className="absolute inset-1 flex items-center justify-center rounded-lg bg-[repeating-linear-gradient(45deg,hsl(var(--warning)/0.18)_0_6px,transparent_6px_12px)] text-[11px] font-semibold text-warning">
                      <Wrench className="mr-1 size-3.5" /> {t('st_service')}
                    </div>
                  )}
                  {!service &&
                    busy.map(b => {
                      const mine = b.requesterId === currentUser.id || b.driverId === currentUser.driverId;
                      const who = users.find(u => u.id === b.requesterId);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => (mine || canSeeAll ? openSheet({ type: 'booking', id: b.id }) : showToast(`${b.startTime}–${b.endTime} · ${who?.name}`, 'info'))}
                          className={cn(
                            'absolute inset-y-1.5 overflow-hidden rounded-lg px-2 text-left text-[11px] font-semibold leading-tight',
                            b.status === 'Completed' ? 'bg-muted text-muted-foreground' : mine ? 'bg-primary text-primary-foreground' : 'bg-navy text-navy-foreground dark:bg-primary/40'
                          )}
                          style={{ left: `${pct(b.startTime)}%`, width: `${pct(b.endTime) - pct(b.startTime)}%` }}
                        >
                          <span className="block truncate">{who?.name.split(' ')[0]}</span>
                          <span className="block truncate font-normal opacity-75 tabular">
                            {DateUtil.timeSpan(app.bookings.find(x => x.id === b.id) ?? b, app.lang)}
                          </span>
                        </button>
                      );
                    })}
                  {isToday && now > 0 && now < 100 && <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-destructive/70" style={{ left: `${now}%` }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
