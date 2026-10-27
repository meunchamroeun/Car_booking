'use client';

import * as React from 'react';
import { CalendarDays, CarFront, ChevronRight, Clock, LayoutList, Users, Wrench } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { can } from '@/lib/permissions';
import { occupyingBookings } from '@/lib/fleet-service';
import { Car } from '@/types';
import { PageHeader, Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DateKeyIn } from '@/components/ui/date-key-in';
import { Segmented } from '@/components/ui/segmented';
import { EmptyState } from '@/components/ui/empty';
import { CarPhoto } from '@/components/common/car-photo';
import { DAY_START } from '@/components/common/day-bar';
import { RangeCalendar } from '@/components/ui/range-calendar';
import { cn } from '@/lib/utils';
import { BOOKING_SLOTS, SLOT_ORDER } from '@/lib/slots';

const SLOT_RANGE = {
  morning: [BOOKING_SLOTS.morning.start, BOOKING_SLOTS.morning.end],
  afternoon: [BOOKING_SLOTS.afternoon.start, BOOKING_SLOTS.afternoon.end],
} as const;

export function VehiclesScreen({ embedded = false }: { embedded?: boolean }) {
  const app = useApp();
  const { t, viewMode, setViewMode, selectedDate, setSelectedDate, selectedSlot, setSelectedSlot, cars, lang } = app;

  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const today = React.useMemo(() => DateUtil.todayStr(), []);
  const tomorrow = React.useMemo(() => DateUtil.addDays(today, 1), [today]);
  const isCustom = selectedDate !== today && selectedDate !== tomorrow;

  const filtered = React.useMemo(() => {
    // Free cars first, then the ones that can't be booked
    return [...cars].sort((a, b) => {
      const aAvail = !app.isCarInMaintenance(a.id, selectedDate) && !!suggestWindow(app, a.id);
      const bAvail = !app.isCarInMaintenance(b.id, selectedDate) && !!suggestWindow(app, b.id);
      if (aAvail && !bAvail) return -1;
      if (!aAvail && bAvail) return 1;
      return 0;
    });
  }, [cars, app, selectedDate, selectedSlot]);

  return (
    <div id={embedded ? 'vehicles' : undefined} className={embedded ? 'scroll-mt-20 !mt-5 first:!mt-0' : ''}>
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

      {/* Date: Today | Tomorrow | a box to type a date or pick it from the calendar */}
      <div className="grid grid-cols-[1fr_1fr_1.45fr] gap-0.5 rounded-xl bg-muted/60 p-0.5" role="radiogroup" aria-label={t('date')}>
        {[
          { d: today, label: t('today') },
          { d: tomorrow, label: t('tomorrow') },
        ].map(o => (
          <button
            key={o.d}
            type="button"
            role="radio"
            aria-checked={selectedDate === o.d}
            onClick={() => (setSelectedDate(o.d), setCalendarOpen(false))}
            className={cn(
              'h-8 rounded-[10px] text-[12.5px] transition-all',
              selectedDate === o.d ? 'bg-primary font-semibold text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
            )}
          >
            {o.label}
          </button>
        ))}
        <DateKeyIn
          value={selectedDate}
          min="2020-01-01"
          active={isCustom}
          open={calendarOpen}
          onChange={d => (setSelectedDate(d), setCalendarOpen(false))}
          onToggle={() => setCalendarOpen(o => !o)}
          onOpen={() => setCalendarOpen(true)}
          label={t('key_in_date')}
          placeholder={t('date_ph')}
          pickLabel={t('select_date')}
        />
      </div>

      {/* Calendar to pick a date */}
      {calendarOpen && (
        <div className="mt-2 animate-in fade-in-0 zoom-in-95">
          <RangeCalendar
            mode="single"
            start={selectedDate}
            end={selectedDate}
            min="2020-01-01"
            lang={lang}
            onChange={s => {
              setSelectedDate(s);
              setCalendarOpen(false);
            }}
            onDone={() => setCalendarOpen(false)}
            labels={{
              pickStart: t('cal_pick_start'),
              pickSingle: t('cal_pick_single'),
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
        {/* Time slot: 3 chips fitting the width cleanly without ellipsis or scrolling */}
        <div className="grid grid-cols-[auto_1fr_1.08fr] gap-1" role="radiogroup" aria-label={t('a11y_time_slot')}>
          {(
            [
              ['all', 'full_day'],
              ['morning', 'morning'],
              ['afternoon', 'afternoon'],
            ] as const
          ).map(([value, key]) => {
            const on = selectedSlot === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setSelectedSlot(value)}
                className={cn(
                  'flex h-8 min-w-0 items-center justify-center whitespace-nowrap rounded-full border px-1.5 text-center transition-colors',
                  value === 'all' && 'px-2.5',
                  on ? 'border-primary bg-primary-soft text-primary font-semibold' : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                <span className="text-[10.5px] min-[380px]:text-[11.5px] font-semibold">
                  {t(key)}
                  {value !== 'all' && (
                    <span className="ml-1 font-medium tabular opacity-80">
                      {BOOKING_SLOTS[key].start}–{BOOKING_SLOTS[key].end}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <EmptyState icon={<CarFront />} title={t('no_results')} />
        ) : viewMode === 'cards' ? (
          <div className="space-y-3">
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
const MIN_GAP = 60; // shortest free stretch worth offering, in minutes

/**
 * Time to offer on a car card:
 * 1. the slot picked in the filter (or Full day, then Morning/Afternoon), if free;
 * 2. otherwise the first free stretch of at least an hour inside working hours
 *    (e.g. 14:00–17:30 when someone has 11:00–14:00), so a partly booked car is still bookable.
 */
function suggestWindow(app: ReturnType<typeof useApp>, carId: string, slotOverride?: 'all' | 'morning' | 'afternoon'): [string, string] | null {
  const { selectedDate } = app;
  const selectedSlot = slotOverride ?? app.selectedSlot;
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
  const { t, selectedDate, selectedSlot, currentUser, users, openBooking, openSheet, lang } = app;
  const busy = occupyingBookings(app, car.id, selectedDate);
  const inService = app.isCarInMaintenance(car.id, selectedDate);
  const isPast = selectedDate < DateUtil.todayStr();
  const win = inService || isPast ? null : suggestWindow(app, car.id);
  const anyWin = inService || isPast ? null : (selectedSlot === 'all' ? win : suggestWindow(app, car.id, 'all'));
  const canBook = can(currentUser, 'booking.create');
  const targetWin = win ?? anyWin;
  const bookable = !isPast && canBook && !!targetWin;
  const book = () => targetWin && openBooking(car.id, targetWin[0], targetWin[1]);

  const status = inService
    ? { tone: 'warning' as const, label: t('st_service') }
    : isPast
      ? busy.length > 0
        ? { tone: 'neutral' as const, label: t('st_not_available') }
        : { tone: 'neutral' as const, label: t('st_not_available') }
      : !anyWin
        ? busy.length > 0
          ? { tone: 'danger' as const, label: t('st_full') }
          : { tone: 'neutral' as const, label: t('st_not_available') }
        : busy.length === 0
          ? { tone: 'success' as const, label: t('st_available') }
          : { tone: 'primary' as const, label: t('st_partly') };

  return (
    <Card
      className={cn('overflow-hidden', bookable && 'cursor-pointer transition-[box-shadow,transform] hover:shadow-float active:scale-[0.99]')}
      {...(bookable && {
        role: 'button',
        tabIndex: 0,
        'aria-label': `${t('book_short')} ${car.name} ${targetWin![0]}–${targetWin![1]}`,
        onClick: book,
        onKeyDown: (e: React.KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), book()),
      })}
    >
      {/* Name and details at the top beside the photo; the status floats top-right and the name wraps around it */}
      <div className="flex items-start gap-3 p-3">
        <CarPhoto car={car} zoomable className="h-16 w-[92px] shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <Badge tone={status.tone} dot className="float-right ml-2 mt-0.5 px-2 py-0 text-[10.5px]">
            {status.label}
          </Badge>
          <p className="text-[14.5px] font-semibold leading-tight">{car.name}</p>
          <p className="mt-1 flex items-center gap-1.5 truncate text-[11.5px] text-muted-foreground">
            <span className="rounded-[5px] border border-[#163280] bg-muted/60 px-1.5 py-[1.5px] font-mono text-[10.5px] font-semibold text-foreground/85 shadow-2xs leading-none">
              {car.plate}
            </span>
            <span aria-hidden>·</span>
            <span className="flex items-center gap-0.5">
              <Users className="size-3" />
              {car.seats}
            </span>
            <span aria-hidden>·</span>
            <span>{t(`type_${car.type}`)}</span>
          </p>
        </div>
      </div>

      {/* Maintenance note or today's bookings; nothing when the car is free */}
      <div className={cn('px-3', (inService || busy.length > 0) && 'pb-3')}>
        {inService ? (
          <div className="rounded-2xl border border-warning/25 bg-warning-soft/70 p-3.5 text-warning">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-warning">
                <span className="flex size-5 items-center justify-center rounded-full bg-warning/20">
                  <Wrench className="size-3 text-warning" />
                </span>
                <span>{t('st_service')}</span>
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
          </div>
        ) : (
          <>
            {busy.length > 0 && (
              <ul className="space-y-2">
                {busy.map(b => {
                  const who = users.find(u => u.id === b.requesterId);
                  const mine = b.requesterId === currentUser.id;
                  const done = b.status === 'Completed';
                  return (
                    <li key={b.id}>
                      <button
                        type="button"
                        // Anyone can open the booking details (actions inside still follow permissions)
                        onClick={e => {
                          e.stopPropagation();
                          openSheet({ type: 'booking', id: b.id });
                        }}
                        className={cn(
                          'group/bitem flex w-full items-center gap-3 rounded-2xl p-2.5 text-left border transition-all',
                          mine
                            ? 'bg-primary-soft/80 border-primary/25 hover:bg-primary-soft hover:border-primary/40 hover:shadow-xs'
                            : 'bg-muted/40 border-border/60 hover:bg-muted/70 hover:border-border hover:shadow-xs'
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] leading-tight">
                            <span className="text-muted-foreground font-normal">{t('booking_by')} : </span>
                            <span className="font-semibold text-foreground">{who?.name ?? '—'}</span>
                          </p>
                          <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground break-words whitespace-normal" title={b.purpose}>
                            <span className="text-muted-foreground/80 font-normal">{t('purpose')} : </span>
                            <span className="font-medium text-foreground/85">{b.purpose || '—'}</span>
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          {(() => {
                            const full = app.bookings.find(x => x.id === b.id) ?? b;
                            const last = full.endDate || full.startDate;
                            const box = cn(
                              'rounded-lg border shadow-2xs tabular',
                              done ? 'border-border bg-muted/80 text-muted-foreground' : 'border-foreground/20 bg-background text-foreground'
                            );
                            // One day: just the times
                            if (last === full.startDate)
                              return (
                                <span className={cn(box, 'inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-semibold')}>
                                  <Clock className="size-3 shrink-0 opacity-70" />
                                  {DateUtil.timeSpan(full, lang)}
                                </span>
                              );
                            // Several days: a small start → end timeline, dates muted and times aligned on the right
                            const day = (d: string) => `${DateUtil.weekdayShort(d, lang)} ${d.slice(8, 10)}/${d.slice(5, 7)}`;
                            const time = (t: string) => t.replace(/^0/, '');
                            return (
                              <span className={cn(box, 'grid grid-cols-[auto_auto_auto] items-center gap-x-2 gap-y-1 px-2.5 py-1.5 text-[11.5px]')}>
                                <span className="relative flex h-full items-center justify-center">
                                  <span className="size-1.5 rounded-full border border-current opacity-70" />
                                  <span className="absolute left-1/2 top-1/2 h-[calc(100%+4px)] w-px -translate-x-1/2 translate-y-[3px] bg-current opacity-25" />
                                </span>
                                <span className="text-left text-muted-foreground">{day(full.startDate)}</span>
                                <span className="text-right font-semibold">{time(full.startTime)}</span>
                                <span className="flex items-center justify-center">
                                  <span className="size-1.5 rounded-full bg-current opacity-70" />
                                </span>
                                <span className="text-left text-muted-foreground">{day(last)}</span>
                                <span className="text-right font-semibold">{time(full.endTime)}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      {canBook && (
        <div className="flex gap-2 border-t px-3 py-2.5">
          <Button
            size="sm"
            className="h-9 min-w-0 flex-1"
            variant={!win && anyWin ? 'outline' : 'default'}
            disabled={!targetWin}
            onClick={e => (e.stopPropagation(), book())}
          >
            {win ? (
              t('book')
            ) : anyWin ? (
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate opacity-75">{t('slot_full_book', { slot: t(selectedSlot) })}</span>
                <span className="shrink-0 tabular font-semibold">
                  {anyWin[0]}–{anyWin[1]}
                </span>
              </span>
            ) : (
              t('unavailable')
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}

function Timeline({ cars }: { cars: Car[] }) {
  const app = useApp();
  const { t, selectedDate, currentUser, users, openBooking, openSheet } = app;
  // The timeline shows 08:00–21:00 (labels 08 … 20), wider than the 08–18 day bars, so evening trips fit
  const TL_END = 21;
  const hours = Array.from({ length: TL_END - DAY_START }, (_, i) => DAY_START + i);
  const span = (TL_END - DAY_START) * 60;
  const pct = (time: string) => ((DateUtil.toMins(time) - DAY_START * 60) / span) * 100;
  const canBook = can(currentUser, 'booking.create');
  const isToday = selectedDate === DateUtil.todayStr();
  const now = pct(DateUtil.nowTimeStr());
  const nowM = DateUtil.toMins(DateUtil.nowTimeStr());

  return (
    <Card className="overflow-hidden">
      <p className="border-b px-3 py-2 text-[11.5px] text-muted-foreground">{canBook ? t('timeline_hint') : DateUtil.friendly(selectedDate, app.lang)}</p>
      {/* One line per car; swipe sideways when it doesn't fit (car names stay pinned on the left) */}
      <div className="no-scrollbar overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="flex border-b bg-muted/40">
            <div className="sticky left-0 z-20 w-[158px] shrink-0 border-r bg-muted" />
            <div className="relative h-6 flex-1">
              {/* A label for every hour */}
              {hours
                .map(h => (
                  <span
                    key={h}
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-semibold tabular text-muted-foreground first:translate-x-0 first:pl-1"
                    style={{ left: `${((h - DAY_START) / hours.length) * 100}%` }}
                  >
                    {DateUtil.pad(h)}
                  </span>
                ))}
            </div>
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
                  className="group sticky left-0 z-20 flex h-11 w-[158px] shrink-0 items-center border-r bg-card px-2.5 text-left transition-colors enabled:hover:bg-primary-soft enabled:active:bg-primary-soft disabled:cursor-default"
                >
                  {/* Full car name on one line */}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate whitespace-nowrap text-[11.5px] font-semibold leading-tight group-enabled:group-hover:text-primary">{c.name}</span>
                    <span className="mt-0.5 inline-block rounded-[5px] border border-[#163280] bg-muted/60 px-1 py-[1px] font-mono text-[9.5px] font-semibold leading-none text-foreground/85 shadow-2xs">{c.plate}</span>
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
                      className={cn('flex-1 transition-colors enabled:hover:bg-primary-soft disabled:cursor-default', h > DAY_START && 'border-l border-border/60')}
                    />
                  ))}
                  {/* Time already passed today: grey diagonal stripes (//////) */}
                  {isToday && now > 0 && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 left-0 bg-[repeating-linear-gradient(135deg,hsl(var(--muted-foreground)/0.2)_0_1.5px,transparent_1.5px_5px)]"
                      style={{ width: `${Math.min(now, 100)}%` }}
                    />
                  )}
                  {service && (
                    <div className="absolute inset-1 flex items-center justify-center gap-1 overflow-hidden rounded-md bg-[repeating-linear-gradient(45deg,hsl(var(--warning)/0.18)_0_5px,transparent_5px_10px)] text-[10px] font-semibold text-warning">
                      <Wrench className="size-3 shrink-0" /> <span className="truncate">{t('st_service')}</span>
                    </div>
                  )}
                  {!service &&
                    busy.map(b => {
                      const mine = b.requesterId === currentUser.id || b.driverId === currentUser.driverId;
                      const who = users.find(u => u.id === b.requesterId);
                      const full = app.bookings.find(x => x.id === b.id) ?? b;
                      // Keep the bar inside the day: a booking from an earlier day / into the next day is cut at the edge
                      const left = Math.max(0, pct(b.startTime));
                      const right = Math.min(100, pct(b.endTime));
                      if (right <= left) return null;
                      // Square edge where the bar is cut (other day, or outside the hours shown)
                      const fromBefore = full.startDate < selectedDate || pct(b.startTime) < 0;
                      const intoAfter = (full.endDate || full.startDate) > selectedDate || pct(b.endTime) > 100;
                      // Times by real days: "← 19:30" = continues from an earlier day and ends 19:30 today
                      const earlierDay = full.startDate < selectedDate;
                      const laterDay = (full.endDate || full.startDate) > selectedDate;
                      const times = earlierDay && laterDay ? `← ${t('full_day')} →` : earlierDay ? `← ${full.endTime}` : laterDay ? `${full.startTime} →` : `${full.startTime}–${full.endTime}`;
                      const label = `${t('booking_by')}: ${who?.name ?? '—'} · ${DateUtil.window(full, app.lang)}`;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          title={label}
                          aria-label={label}
                          onClick={() => openSheet({ type: 'booking', id: b.id })}
                          className={cn(
                            'absolute inset-y-1.5 flex items-center overflow-hidden whitespace-nowrap rounded-md px-2 text-left text-[10.5px] font-semibold',
                            fromBefore && 'rounded-l-none',
                            intoAfter && 'rounded-r-none',
                            b.status === 'Completed' ? 'bg-muted text-muted-foreground' : mine ? 'bg-primary text-primary-foreground' : 'bg-navy text-navy-foreground dark:bg-primary/40'
                          )}
                          style={{ left: `${left}%`, width: `${right - left}%` }}
                        >
                          {/* One line: Booked By: name · time */}
                          <span className="truncate">
                            {right - left >= 25 && <span className="font-normal opacity-70">{t('booking_by')}: </span>}
                            {who?.name ?? '—'}
                            <span className="font-normal opacity-75 tabular"> · {times}</span>
                          </span>
                        </button>
                      );
                    })}
                  {isToday && now > 0 && now < 100 && <div className="pointer-events-none absolute inset-y-0 w-px bg-destructive/80" style={{ left: `${now}%` }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
