'use client';

import * as React from 'react';
import { AlertTriangle, Briefcase, CalendarDays, CarFront, Check, CheckCircle2, UserRound, Users } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { occupyingBookings } from '@/lib/fleet-service';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { CarPhoto } from '@/components/common/car-photo';
import { cn } from '@/lib/utils';
import { TimeRangeTrack } from '@/components/ui/time-range-track';
import { CalendarPopup } from '@/components/ui/calendar-popup';
import { TimeField } from '@/components/ui/time-field';
import { RangeCalendar } from '@/components/ui/range-calendar';
import { DateBox } from '@/components/ui/date-box';
import { BOOKING_SLOTS, SLOT_ORDER } from '@/lib/slots';
import { can } from '@/lib/permissions';
import { DriverSelect } from '@/components/common/driver-select';

const SLOTS = SLOT_ORDER.map(key => ({ key, ...BOOKING_SLOTS[key] }));

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
  // Chosen time window; the Morning/Afternoon/Full day buttons are shortcuts that fill it
  const [range, setRange] = React.useState<{ start: string; end: string }>({ start: '08:00', end: '12:00' });
  const [purpose, setPurpose] = React.useState('');
  const [needDriver, setNeedDriver] = React.useState(false);
  const [driverId, setDriverId] = React.useState<string | null>(null);

  // Reset each time the sheet opens, starting from the vehicle card's date and suggested time
  React.useEffect(() => {
    if (!open) return;
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
  const { start, end } = range;
  const multiDay = endDate !== date;
  const preset = multiDay ? undefined : SLOTS.find(s => s.start === start && s.end === end);


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
        <Button size="lg" className="w-full" disabled={!!missing} onClick={submit}>
          {editing ? t('save_changes') : t('book_now')}
        </Button>
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
            <Button variant="outline" size="sm" onClick={() => setChangingCar(v => !v)}>
              {t('edit')}
            </Button>
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
      <Step n={2} icon={<CalendarDays />} label={`${t('plan_date')} & ${t('plan_time')}`} value={windowText} done={!timeProblem}>
        {/* Date Selector: Today | Tomorrow | Select Date */}
        {/* Date range (calendar & direct key-in) + time: drag on the day track, or From/To for several days */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <DateBox label={t('start_date')} value={date} lang={lang} active={picker === 'dates'} onClick={() => setPicker(p => (p === 'dates' ? null : 'dates'))} />
            <DateBox label={t('end_date')} value={endDate} lang={lang} active={picker === 'dates'} onClick={() => setPicker(p => (p === 'dates' ? null : 'dates'))} />
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
          {multiDay ? (
            <div className="grid grid-cols-2 gap-2">
              <TimeField
                label={t('start_time')}
                value={start}
                open={picker === 'from'}
                onOpenChange={o => setPicker(o ? 'from' : null)}
                onChange={v =>
                  setRange(r => ({
                    start: v,
                    // keep the end after the start on single-day bookings
                    end: !multiDay && DateUtil.toMins(r.end) <= DateUtil.toMins(v) ? `${DateUtil.pad(Math.min(23, Number(v.slice(0, 2)) + 1))}:${v.slice(3)}` : r.end,
                  }))
                }
              />
              <TimeField label={t('end_time')} value={end} open={picker === 'to'} onOpenChange={o => setPicker(o ? 'to' : null)} onChange={v => setRange(r => ({ ...r, end: v }))} invalid={DateUtil.stamp(endDate, end) <= DateUtil.stamp(date, start)} />
            </div>
          ) : (
            <div className="rounded-xl bg-muted/50 px-3 pb-2.5 pt-2">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-[14px] font-semibold tabular">
                  {start} – {end}
                </span>
                <span className="text-[11px] font-medium tabular text-muted-foreground">{DateUtil.duration(date, start, endDate, end, lang)}</span>
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
          )}
          {multiDay && (
            <p className="text-right text-[12px] font-semibold tabular text-muted-foreground">
              {preset ? `${t(preset.key)} · ` : multiDay ? `${t('days_n', { n: DateUtil.dateRange(date, endDate).length })} · ` : ''}
              {DateUtil.duration(date, start, endDate, end, lang)}
            </p>
          )}
        </div>

        <div className={cn('mt-2', booked.length > 0 && 'rounded-2xl bg-muted/60 p-3')}>
          {booked.length > 0 && (
            <ul className="space-y-1.5">
              {booked.map(b => {
                const who = users.find(u => u.id === b.requesterId);
                const sameDay = (b.endDate || b.startDate) === b.startDate;
                return (
                  <li key={b.id} className="flex items-center gap-2 text-[12.5px]">
                    <Avatar initials={who?.initials ?? '?'} seed={who?.id} className="size-6 text-[10px]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {who?.name}
                      </span>
                      <span className="block truncate text-[11.5px] text-muted-foreground">{b.purpose}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular text-primary">
                      {multiDay || !sameDay ? `${DateUtil.friendly(b.startDate, lang)} ` : ''}
                      {b.startTime}–{sameDay ? '' : `${DateUtil.friendly(b.endDate, lang)} `}
                      {b.endTime}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {/* One-line result; the chosen date and time are already shown above and in the footer */}
          <p
            className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-medium', booked.length > 0 && 'mt-2', timeProblem ? 'bg-destructive-soft text-destructive' : 'bg-success-soft text-success')}
            role="status"
          >
            {timeProblem ? <AlertTriangle className="size-3.5 shrink-0" /> : <CheckCircle2 className="size-3.5 shrink-0" />}
            {timeProblem ?? t('slot_free')}
          </p>
        </div>
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
        <p className="mt-1 text-right text-[11.5px] tabular text-muted-foreground">{purpose.length}/250</p>
      </Step>

      {/* 4. Who drives */}
      <Step n={4} icon={<UserRound />} label={t('driver_q')} required value={needDriver ? t('with_driver') : t('self_drive')} done last>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('driver_q')}>
          {[
            { v: false, icon: CarFront, title: t('self_drive') },
            { v: true, icon: UserRound, title: t('with_driver') },
          ].map(o => (
            <button
              key={String(o.v)}
              type="button"
              role="radio"
              aria-checked={needDriver === o.v}
              onClick={() => setNeedDriver(o.v)}
              className={cn('flex items-center gap-2.5 rounded-2xl border-2 px-2.5 py-2 text-left transition-all', needDriver === o.v ? 'border-primary bg-primary-soft/60' : 'border-transparent bg-card ring-1 ring-border')}
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
}: {
  n: number;
  icon: React.ReactNode;
  label: React.ReactNode;
  value?: string;
  children: React.ReactNode;
  last?: boolean;
  done?: boolean;
  required?: boolean;
}) {
  return (
    <section className={cn('py-3.5 first:pt-1', !last && 'border-b border-dashed')}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[13.5px] font-semibold">
          <span className="flex items-center gap-1.5 text-foreground/85 [&_svg]:size-4 [&_svg]:text-muted-foreground">
            {icon}
            {label}
            {required && <span className="text-destructive">*</span>}
          </span>
        </span>
        {value && <span className="max-w-[50%] truncate text-[12.5px] font-semibold text-primary">{value}</span>}
      </div>
      {children}
    </section>
  );
}

