'use client';

import * as React from 'react';
import { AlertTriangle, Briefcase, CalendarDays, CarFront, Check, CheckCircle2, ChevronDown, Clock, UserRound, Users, Zap } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { occupyingBookings } from '@/lib/fleet-service';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { CarPhoto } from '@/components/common/car-photo';
import { cn } from '@/lib/utils';
import { CalendarPopup } from '@/components/ui/calendar-popup';
import { TimeRangeTrack } from '@/components/ui/time-range-track';
import { TimeWheelPicker } from '@/components/ui/time-wheel-picker';
import { RangeCalendar } from '@/components/ui/range-calendar';
import { BOOKING_SLOTS, SLOT_ORDER } from '@/lib/slots';
import { can, needsReapproval } from '@/lib/permissions';
import { DriverSelect } from '@/components/common/driver-select';

const SLOTS = SLOT_ORDER.map(key => ({ key, ...BOOKING_SLOTS[key] }));
/** Order of the quick slot chips: Full day, Morning, Afternoon. */
const QUICK_SLOTS = (['full_day', 'morning', 'afternoon'] as const).map(key => ({ key, ...BOOKING_SLOTS[key] }));
/** Minutes since midnight → "HH:MM". */
const spinTime = (m: number) => `${DateUtil.pad(Math.floor(m / 60))}:${DateUtil.pad(m % 60)}`;

const QUICK_DURATION_OPTIONS = [
  { key: '2hr', label: '2 hr' },
  { key: '1d', label: '1 day' },
  { key: '2d', label: '2 days' },
  { key: '3d', label: '3 days' },
  { key: '1w', label: '1 week' },
] as const;

const monthShort = (dateStr: string, lang: 'en' | 'kh' = 'en') => {
  const [y, m] = dateStr.split('-').map(Number);
  const names = DateUtil.names(lang);
  return names.monthShort[(m || 1) - 1] ?? '';
};

const formatAmPm = (timeStr: string) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'p.m.' : 'a.m.';
  const hour = h % 12 === 0 ? 12 : h % 12;
  const padHour = String(hour).padStart(2, '0');
  const padMinute = String(m || 0).padStart(2, '0');
  return `${padHour}:${padMinute} ${period}`;
};

const formatTicketDuration = (startDate: string, startTime: string, endDate: string, endTime: string, lang: 'en' | 'kh' = 'en'): string => {
  const days = DateUtil.dayDiff(startDate, endDate);
  const startM = DateUtil.toMins(startTime);
  const endM = DateUtil.toMins(endTime);
  const totalMins = days * 1440 + endM - startM;
  if (totalMins <= 0) return '0 hr';

  const totalHours = totalMins / 60;
  if (totalHours < 1) {
    return `${totalMins} min`;
  }
  if (days === 0 || (days === 1 && totalHours < 24)) {
    const hrVal = totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1);
    return `${hrVal} hr`;
  }
  if (days % 7 === 0 && endM === startM) {
    const weeks = days / 7;
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
  if (totalHours % 24 === 0) {
    const d = Math.round(totalHours / 24);
    return d === 1 ? '1 day' : `${d} days`;
  }
  const d = Math.floor(totalHours / 24);
  const remH = Math.round(totalHours % 24);
  if (remH === 0) {
    return d === 1 ? '1 day' : `${d} days`;
  }
  return `${d}d ${remH}h`;
};

/**
 * Booking sheet opened from a vehicle's "Book" button.
 * The car is already chosen, so staff only answer: date & time → purpose → who drives → Book now.
 * With `editId` it edits that booking instead (same form, filled in, "Save changes").
 */
export function BookSheet({ open, init }: { open: boolean; init: { carId?: string; date?: string; start?: string; end?: string; editId?: string } }) {
  const app = useApp();
  const { t, lang, cars, users, currentUser, checkConflict, isCarInMaintenance, closeSheet, createBooking, updateBooking } = app;
  const editing = init.editId ? app.bookings.find(b => b.id === init.editId) : undefined;
  // Managers changing an approved booking that has a company driver can also swap the driver
  const pickDriver = !!editing && editing.status === 'Approved' && can(currentUser, 'booking.approve');

  const today = DateUtil.todayStr();
  const nowMins = DateUtil.toMins(DateUtil.nowTimeStr());

  const [carId, setCarId] = React.useState('');
  const [changingCar, setChangingCar] = React.useState(false);
  const [date, setDate] = React.useState(today); // start date
  const [endDate, setEndDate] = React.useState(today);
  const [picker, setPicker] = React.useState<'dates' | 'from' | 'to' | null>(null);
  // Which time the wheel picker popup is changing
  const [timePick, setTimePick] = React.useState<'start' | 'end' | null>(null);
  // Quick picks stay hidden by default
  const [showQuick, setShowQuick] = React.useState(false);
  // Chosen time window; the Morning/Afternoon/Full day buttons are shortcuts that fill it
  const [range, setRange] = React.useState<{ start: string; end: string }>({ start: '08:00', end: '12:00' });
  const [purpose, setPurpose] = React.useState('');
  const [needDriver, setNeedDriver] = React.useState(false);
  const [driverId, setDriverId] = React.useState<string | null>(null);

  // Reset each time the sheet opens, starting from the vehicle card's date and suggested time
  React.useEffect(() => {
    if (!open) return;
    setShowQuick(false);
    setTimePick(null);
    if (editing) {
      setCarId(editing.carId);
      setChangingCar(false);
      setDate(editing.startDate);
      setEndDate(editing.endDate || editing.startDate);
      setPicker(null);
      setRange({ start: editing.startTime, end: editing.endTime });
      setPurpose(editing.purpose);
      setNeedDriver(editing.needDriver);
      setDriverId(editing.driverId);
      return;
    }
    const d = init.date && init.date >= today ? init.date : today;
    const carForSlot = init.carId ?? cars.find(c => !isCarInMaintenance(c.id, d))?.id ?? cars[0].id;
    const nowM = DateUtil.toMins(DateUtil.nowTimeStr());
    // First preset that is still ahead (for today) and free for this car
    const usable = (x: (typeof SLOTS)[number]) => !(d === today && DateUtil.toMins(x.end) <= nowM) && checkConflict(carForSlot, d, x.start, x.end).ok;
    // Use the slot chosen in the Vehicles filter if it's free, otherwise the first free one
    const requested = SLOTS.find(x => x.start === init.start && x.end === init.end);
    // A custom free window from the car card (e.g. 14:00–17:30) is used as-is
    const custom =
      !requested && init.start && init.end && !(d === today && DateUtil.toMins(init.end) <= nowM) && checkConflict(carForSlot, d, init.start, init.end).ok
        ? { start: init.start, end: init.end }
        : null;
    const first = custom ?? (requested && usable(requested) ? requested : SLOTS.find(usable));
    setCarId(carForSlot);
    setChangingCar(!init.carId);
    setDate(d);
    setEndDate(d);
    setPicker(null);
    setRange(first ? { start: first.start, end: first.end } : { start: SLOTS[0].start, end: SLOTS[0].end });
    setPurpose('');
    setNeedDriver(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const car = cars.find(c => c.id === carId);
  const tomorrow = DateUtil.addDays(today, 1);
  const { start, end } = range;
  const multiDay = endDate !== date;
  // Slot chip matching the chosen times (for several days: start time on the first day, end time on the last)
  const preset = SLOTS.find(s => s.start === start && s.end === end);


  const slotProblem = (s: string, e: string): string | null => {
    if (DateUtil.toMins(e) <= DateUtil.toMins(s)) return t('time_passed');
    if (date === today && DateUtil.toMins(e) <= nowMins) return t('time_passed');
    if (!car) return null;
    const c = checkConflict(car.id, date, s, e, editing?.id);
    return c.ok ? null : c.reason;
  };

  // When the car or date changes, jump to the first preset that still works
  React.useEffect(() => {
    if (!open || editing || multiDay || !preset || !slotProblem(start, end)) return;
    const ok = SLOTS.find(s => !slotProblem(s.start, s.end));
    if (ok) setRange({ start: ok.start, end: ok.end });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId, date]);

  // Problem with the whole chosen window (may span several days)
  const timeProblem = (() => {
    if (DateUtil.stamp(endDate, end) <= DateUtil.stamp(date, start)) return t('end_after_start');
    if (DateUtil.stamp(endDate, end) <= DateUtil.nowStamp()) return t('time_passed');
    if (DateUtil.dayDiff(date, endDate) > 14) return t('max_days');
    if (!car) return null;
    const c = checkConflict(car.id, date, start, end, editing?.id, endDate);
    return c.ok ? null : c.reason;
  })();
  // Existing bookings for this car on any day of the window
  const booked = car
    ? DateUtil.dateRange(date, endDate)
        .flatMap(d => occupyingBookings(app, car.id, d))
        .filter((b, i, all) => b.status === 'Approved' && b.id !== editing?.id && all.findIndex(x => x.id === b.id) === i)
        .map(b => app.bookings.find(x => x.id === b.id)!)
    : [];
  // Blocks shown on the one-day time track
  const dayBooked = car ? occupyingBookings(app, car.id, date).filter(b => b.id !== editing?.id).map(b => ({ id: b.id, start: b.startTime, end: b.endTime })) : [];
  const dayPending = car
    ? app.bookings
        .filter(b => b.carId === car.id && b.status === 'Pending' && b.id !== editing?.id && b.startDate <= date && date <= (b.endDate || b.startDate))
        .map(b => ({ id: b.id, start: b.startDate < date ? '00:00' : b.startTime, end: (b.endDate || b.startDate) > date ? '23:59' : b.endTime }))
    : [];
  const windowText = multiDay
    ? `${DateUtil.friendly(date, lang)} ${start} → ${DateUtil.friendly(endDate, lang)} ${end}`
    : `${DateUtil.friendly(date, lang)} · ${start}–${end}`;

  // Staff changing an approved booking's car / time / driver need → it goes back for approval
  const reapprove = !!editing && !!car && needsReapproval(currentUser, editing, { carId: car.id, date, endDate, startTime: start, endTime: end, needDriver });
  // Start moved past the end → push the end so the booking keeps at least 30 minutes
  const changeStart = (v: string) =>
    setRange(r => {
      const sm = DateUtil.toMins(v);
      return { start: v, end: DateUtil.toMins(r.end) - sm < 30 ? spinTime(Math.min(sm + 60, 23 * 60 + 45)) : r.end };
    });
  const changeEnd = (v: string) => setRange(r => ({ ...r, end: v }));

  const applyQuickDuration = (key: (typeof QUICK_DURATION_OPTIONS)[number]['key']) => {
    if (key === '2hr') {
      setEndDate(date);
      const startM = DateUtil.toMins(start);
      const endM = startM + 120;
      if (endM < 1440) {
        setRange(r => ({ ...r, end: spinTime(endM) }));
      } else {
        setEndDate(DateUtil.addDays(date, 1));
        setRange(r => ({ ...r, end: spinTime(endM - 1440) }));
      }
    } else if (key === '1d') {
      setEndDate(DateUtil.addDays(date, 1));
      setRange(r => ({ ...r, end: r.start }));
    } else if (key === '2d') {
      setEndDate(DateUtil.addDays(date, 2));
      setRange(r => ({ ...r, end: r.start }));
    } else if (key === '3d') {
      setEndDate(DateUtil.addDays(date, 3));
      setRange(r => ({ ...r, end: r.start }));
    } else if (key === '1w') {
      setEndDate(DateUtil.addDays(date, 7));
      setRange(r => ({ ...r, end: r.start }));
    }
  };

  const activeQuick = React.useMemo(() => {
    const days = DateUtil.dayDiff(date, endDate);
    const startM = DateUtil.toMins(start);
    const endM = DateUtil.toMins(end);
    const diffM = days * 1440 + endM - startM;
    if (diffM === 120 && days === 0) return '2hr';
    if (diffM === 1440 && days === 1) return '1d';
    if (diffM === 2880 && days === 2) return '2d';
    if (diffM === 4320 && days === 3) return '3d';
    if (diffM === 10080 && days === 7) return '1w';
    return null;
  }, [date, endDate, start, end]);

  const missing = timeProblem ?? (!purpose.trim() ? t('pick_purpose') : pickDriver && needDriver && !driverId ? t('err_assign_driver') : null);

  const submit = () => {
    if (missing || !car) return;
    if (editing) {
      updateBooking(editing.id, { carId: car.id, date, endDate, startTime: start, endTime: end, purpose, needDriver, ...(pickDriver ? { driverId: needDriver ? driverId : null } : {}) });
      return;
    }
    createBooking({ carId: car.id, date, endDate, startTime: start, endTime: end, purpose, destination: '', passengers: 1, needDriver });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={o => !o && closeSheet()}
      title={editing ? `${t('edit_title')} · ${editing.id}` : t('plan_title')}
      footer={
        <div className="space-y-2">
          {reapprove && (
            <p className="flex items-start gap-1.5 rounded-lg bg-warning-soft px-2.5 py-2 text-[12px] font-medium leading-snug text-warning">
              <AlertTriangle className="mt-px size-3.5 shrink-0" />
              {t('edit_reapprove_note')}
            </p>
          )}
          <Button size="lg" className="w-full" disabled={!!missing} onClick={submit}>
            {editing ? (reapprove ? t('save_reapprove') : t('save_changes')) : t('book_now')}
          </Button>
        </div>
      }
    >
      {/* 1. The chosen car */}
      <Step n={1} icon={<CarFront />} label={t('choose_vehicle')} done>
        {car && (
          <div className="flex items-center gap-3 rounded-2xl bg-muted p-2.5">
            <CarPhoto car={car} zoomable className="h-[62px] w-[92px] shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-semibold">{car.name}</p>
              <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <span className="font-mono">{car.plate}</span>
                <span className="flex items-center gap-1">
                  <Users className="size-3" />
                  {t('seats', { n: car.seats })}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Existing bookings for this vehicle */}
        {booked.length > 0 && (
          <div className="mt-2 rounded-2xl bg-muted/60 p-2.5">
            <ul className="space-y-1.5">
              {booked.map(b => {
                const who = users.find(u => u.id === b.requesterId);
                const sameDay = (b.endDate || b.startDate) === b.startDate;
                return (
                  <li key={b.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/80 p-2.5 text-[12.5px] shadow-2xs">
                    <div className="min-w-0 flex-1">
                      <p className="truncate leading-tight">
                        <span className="text-muted-foreground font-normal">{t('booking_by')} : </span>
                        <span className="font-semibold text-foreground">{who?.name ?? '—'}</span>
                      </p>
                      <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground break-words whitespace-normal" title={b.purpose}>
                        <span className="text-muted-foreground/80 font-normal">{t('purpose')} : </span>
                        <span className="font-medium text-foreground/85">{b.purpose || '—'}</span>
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-border/80 bg-background px-3 py-1 text-[12px] font-semibold tabular text-foreground shadow-2xs">
                      {multiDay || !sameDay ? `${DateUtil.friendly(b.startDate, lang)} ` : ''}
                      {b.startTime} - {sameDay ? '' : `${DateUtil.friendly(b.endDate, lang)} `}
                      {b.endTime}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {changingCar && (
          <div className="no-scrollbar -mx-5 mt-2.5 flex snap-x gap-2 overflow-x-auto px-5 pb-1" role="radiogroup" aria-label={t('choose_vehicle')}>
            {cars.map(c => {
              const service = isCarInMaintenance(c.id, date);
              const active = c.id === carId;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={service}
                  onClick={() => (setCarId(c.id), setChangingCar(false))}
                  className={cn(
                    'w-[112px] shrink-0 snap-start rounded-2xl border-2 bg-card p-2 text-left transition-all disabled:opacity-40',
                    active ? 'border-primary' : 'border-transparent ring-1 ring-border'
                  )}
                >
                  <CarPhoto car={c} className="h-[64px] w-full rounded-lg" />
                  <p className="mt-1 truncate text-[12px] font-semibold">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{service ? t('st_service') : t('seats', { n: c.seats })}</p>
                </button>
              );
            })}
          </div>
        )}
      </Step>

      {/* 2. Date & time */}
      <Step
        n={2}
        icon={<CalendarDays />}
        label={`${t('plan_date')} & ${t('plan_time')}`}
        value={windowText}
        done={!timeProblem}
        extra={
          <button
            type="button"
            onClick={() => setShowQuick(v => !v)}
            aria-expanded={showQuick}
            className={cn(
              'flex h-6 items-center gap-1 rounded-full px-2.5 text-[11.5px] font-semibold transition-colors',
              showQuick ? 'bg-primary text-primary-foreground' : 'bg-primary-soft text-primary hover:bg-primary-soft/70'
            )}
          >
            <Zap className="size-3" fill="currentColor" />
            {t('quick_select')}
            <ChevronDown className={cn('size-3 transition-transform duration-200', showQuick && 'rotate-180')} />
          </button>
        }
      >
        {/* Ticket Date & Time Card */}
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200/90 bg-card p-4 sm:p-5 shadow-xs dark:border-neutral-800">
          {/* Top center cutout notch */}
          <div className="pointer-events-none absolute -top-3.5 left-1/2 -translate-x-1/2 size-7 rounded-full border border-neutral-200/90 bg-background dark:border-neutral-800" />
          {/* Bottom center cutout notch */}
          <div className="pointer-events-none absolute -bottom-3.5 left-1/2 -translate-x-1/2 size-7 rounded-full border border-neutral-200/90 bg-background dark:border-neutral-800" />
          {/* Vertical dashed center divider */}
          <div className="pointer-events-none absolute top-4 bottom-4 left-1/2 -translate-x-1/2 border-l border-dashed border-neutral-300 dark:border-neutral-700" />

          {/* Duration in the middle */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 rounded-md bg-card px-2 py-0.5 text-[12.5px] font-bold text-foreground tabular whitespace-nowrap">
            {formatTicketDuration(date, start, endDate, end, lang)}
          </div>

          <div className="flex items-start justify-between">
            {/* Left: Pick-up */}
            <div className="flex-1 pr-3">
              <p className="text-[13px] font-semibold text-muted-foreground">{t('pick_up')}</p>

              <button
                type="button"
                onClick={() => setPicker(p => (p === 'dates' ? null : 'dates'))}
                className="mt-2 flex items-center gap-2.5 text-left transition-opacity hover:opacity-80"
                title={t('select_date')}
              >
                <span className="text-[40px] min-[380px]:text-[44px] font-black leading-none tracking-tight text-foreground tabular">
                  {DateUtil.dayNum(date)}
                </span>
                <div className="flex flex-col text-[12.5px] min-[380px]:text-[13px] font-bold leading-tight text-muted-foreground">
                  <span>{DateUtil.weekdayShort(date, lang)}</span>
                  <span>{monthShort(date, lang)}</span>
                </div>
              </button>

              <TimeWheelPicker
                open={timePick === 'start'}
                onOpenChange={o => setTimePick(o ? 'start' : null)}
                value={start}
                onChange={changeStart}
                title={t('start_time')}
                labels={{ hour: t('a11y_hour', { label: '' }), minute: t('a11y_minute', { label: '' }) }}
              >
                <button
                  type="button"
                  onClick={() => setTimePick('start')}
                  className="mt-3.5 inline-flex flex-col items-start transition-opacity hover:opacity-80"
                  aria-label={`${t('start_time')} ${formatAmPm(start)}`}
                >
                  <span className="text-[16px] min-[380px]:text-[17px] font-bold tracking-tight text-foreground">
                    {formatAmPm(start)}
                  </span>
                  <span className="mt-1 h-[2.5px] w-full rounded-full bg-amber-400" />
                </button>
              </TimeWheelPicker>
            </div>

            {/* Right: Return */}
            <div className="flex-1 pl-3 text-right">
              <p className="text-[13px] font-semibold text-muted-foreground">{t('return_label')}</p>

              <button
                type="button"
                onClick={() => setPicker(p => (p === 'dates' ? null : 'dates'))}
                className="mt-2 flex items-center justify-end gap-2.5 text-right transition-opacity hover:opacity-80 ml-auto"
                title={t('select_date')}
              >
                <span className="text-[40px] min-[380px]:text-[44px] font-black leading-none tracking-tight text-foreground tabular">
                  {DateUtil.dayNum(endDate)}
                </span>
                <div className="flex flex-col text-[12.5px] min-[380px]:text-[13px] font-bold leading-tight text-muted-foreground text-left">
                  <span>{DateUtil.weekdayShort(endDate, lang)}</span>
                  <span>{monthShort(endDate, lang)}</span>
                </div>
              </button>

              <TimeWheelPicker
                open={timePick === 'end'}
                onOpenChange={o => setTimePick(o ? 'end' : null)}
                value={end}
                onChange={changeEnd}
                title={t('end_time')}
                labels={{ hour: t('a11y_hour', { label: '' }), minute: t('a11y_minute', { label: '' }) }}
              >
                <button
                  type="button"
                  onClick={() => setTimePick('end')}
                  className="mt-3.5 inline-flex flex-col items-end transition-opacity hover:opacity-80 ml-auto"
                  aria-label={`${t('end_time')} ${formatAmPm(end)}`}
                >
                  <span className="text-[16px] min-[380px]:text-[17px] font-bold tracking-tight text-foreground">
                    {formatAmPm(end)}
                  </span>
                  <span className="mt-1 h-[2.5px] w-full rounded-full bg-amber-400" />
                </button>
              </TimeWheelPicker>
            </div>
          </div>
        </div>

        {/* Quick Select presets with toggle */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowQuick(v => !v)}
            className="flex w-full items-center justify-between rounded-xl py-1 text-left transition-colors hover:opacity-80"
            aria-expanded={showQuick}
          >
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground/80">
              <Zap className="size-3.5 text-amber-500" />
              {t('quick_select')}
            </span>
            <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform duration-200', showQuick && 'rotate-180')} />
          </button>

          {showQuick && (
            <div className="mt-2 space-y-2.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
              {/* Quick duration presets: 2 hr, 1 day, 2 days, 3 days, 1 week */}
              <div className="grid grid-cols-5 gap-1.5 min-[410px]:gap-2">
                {QUICK_DURATION_OPTIONS.map(item => {
                  const active = activeQuick === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => applyQuickDuration(item.key)}
                      className={cn(
                        'flex h-10 items-center justify-center rounded-2xl border px-1 text-center text-[13px] min-[380px]:text-[13.5px] font-bold transition-all active:scale-95 shadow-2xs',
                        active
                          ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                          : 'border-neutral-200/90 bg-card text-foreground hover:border-neutral-300 hover:bg-muted/40 dark:border-neutral-800'
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Time slot presets: Full day | Morning | Afternoon */}
              <div className="grid grid-cols-[auto_1fr_1.08fr] gap-1" role="radiogroup" aria-label={t('a11y_time_slot')}>
                {QUICK_SLOTS.map(s => {
                  const on = preset?.key === s.key;
                  const blocked = !!slotProblem(s.start, s.end);
                  return (
                    <button
                      key={s.key}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={blocked}
                      onClick={() => (setRange({ start: s.start, end: s.end }), setPicker(null))}
                      className={cn(
                        'flex h-8 min-w-0 items-center justify-center whitespace-nowrap rounded-full border px-1.5 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                        s.key === 'full_day' && 'px-2.5',
                        on
                          ? 'border-primary bg-primary-soft text-primary font-semibold'
                          : 'border-neutral-200/90 bg-card text-muted-foreground enabled:hover:border-primary/40 enabled:hover:text-foreground dark:border-neutral-800'
                      )}
                    >
                      <span className="text-[10.5px] min-[380px]:text-[11.5px] font-semibold">
                        {t(s.key)}
                        {s.key !== 'full_day' && (
                          <span className="ml-1 font-medium tabular opacity-80">
                            {s.start}–{s.end}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Interactive timeline track card (from user screenshot) */}
              <div className="rounded-2xl border border-neutral-200/90 bg-muted/40 p-3 shadow-2xs dark:border-neutral-800">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-soft px-2.5 py-0.5 text-[13px] font-bold text-primary">
                    <Clock className="size-3.5 shrink-0 text-primary" />
                    <span>{start} — {end}</span>
                  </span>
                  <span className="text-[11.5px] font-medium tabular text-muted-foreground">
                    {DateUtil.spanLabel(start, end, lang)}
                  </span>
                </div>
                <TimeRangeTrack
                  start={start}
                  end={end}
                  onChange={(s, e) => setRange({ start: s, end: e })}
                  booked={dayBooked}
                  pending={dayPending}
                  now={date === today ? nowMins : undefined}
                  invalid={!!timeProblem}
                  lang={lang}
                  labels={{ yours: t('lg_yours'), booked: t('lg_booked'), pending: t('lg_pending'), start: t('start_time'), end: t('end_time') }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Calendar pops up over the screen so the whole month shows; picking the end date closes it */}
        <CalendarPopup open={picker === 'dates'} onOpenChange={o => !o && setPicker(null)} title={t('select_date')}>
          <RangeCalendar
            start={date}
            end={endDate}
            min={today}
            lang={lang}
            onChange={(s, e) => (setDate(s), setEndDate(e))}
            onDone={() => setPicker(null)}
            markDay={d => (car && isCarInMaintenance(car.id, d) ? 'service' : car && occupyingBookings(app, car.id, d).some(b => b.status === 'Approved') ? 'booked' : undefined)}
            labels={{ pickStart: t('cal_pick_start'), pickEnd: t('cal_pick_end'), booked: t('cal_booked'), unavailable: t('unavailable'), prev: t('a11y_prev_month'), next: t('a11y_next_month') }}
          />
        </CalendarPopup>

        {/* One-line result; old style status */}
        <p
          className={cn(
            'mt-2.5 flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-medium',
            timeProblem ? 'bg-destructive-soft text-destructive' : 'bg-success-soft text-success'
          )}
          role="status"
        >
          {timeProblem ? <AlertTriangle className="size-3.5 shrink-0" /> : <CheckCircle2 className="size-3.5 shrink-0" />}
          {timeProblem ?? t('slot_free')}
        </p>
      </Step>

      {/* 3. Purpose */}
      <Step n={3} icon={<Briefcase />} label={t('plan_purpose')} required done={!!purpose.trim()}>
        <Textarea
          value={purpose}
          onChange={e => setPurpose(e.target.value)}
          maxLength={250}
          rows={2}
          placeholder={t('plan_purpose_ph')}
          aria-label={t('plan_purpose')}
          aria-required
          className="min-h-[64px]"
        />
      </Step>

      {/* 4. Who drives */}
      <Step n={4} icon={<UserRound />} label={t('driver_q')} required value={needDriver ? t('driver_needed_yes') : t('driver_needed_no')} done last>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('driver_q')}>
          {[
            { v: false, icon: CarFront, title: t('driver_needed_no') },
            { v: true, icon: UserRound, title: t('driver_needed_yes') },
          ].map(o => (
            <button
              key={String(o.v)}
              type="button"
              role="radio"
              aria-checked={needDriver === o.v}
              onClick={() => setNeedDriver(o.v)}
              className={cn(
                'flex items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5 text-left transition-all',
                needDriver === o.v ? 'border-primary bg-primary-soft/60' : 'border-transparent bg-card ring-1 ring-border'
              )}
            >
              <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-xl', needDriver === o.v ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                <o.icon className="size-4" />
              </span>
              <span className="min-w-0 truncate text-[13.5px] font-semibold">{o.title}</span>
            </button>
          ))}
        </div>
        {pickDriver && needDriver && car && editing && (
          <div className="mt-3">
            <DriverSelect b={{ ...editing, carId: car.id, startDate: date, endDate, startTime: start, endTime: end }} value={driverId} onChange={setDriverId} />
          </div>
        )}
      </Step>
    </Sheet>
  );
}

function Step({
  n,
  icon,
  label,
  value,
  children,
  last,
  done,
  required,
  extra,
}: {
  n: number;
  icon: React.ReactNode;
  label: React.ReactNode;
  /** Small control shown right next to the title (e.g. Quick pick). */
  extra?: React.ReactNode;
  value?: string;
  children: React.ReactNode;
  last?: boolean;
  done?: boolean;
  required?: boolean;
}) {
  return (
    <section className={cn('py-3.5 first:pt-1', !last && 'border-b border-dashed')}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[13.5px] font-semibold">
          <span className="flex items-center gap-1.5 text-foreground/85 [&_svg]:size-4 [&_svg]:text-muted-foreground">
            {icon}
            {label}
            {required && <span className="text-destructive">*</span>}
          </span>
          {extra}
        </span>
        {value && <span className="min-w-0 truncate text-[12.5px] font-semibold text-primary">{value}</span>}
      </div>
      {children}
    </section>
  );
}

