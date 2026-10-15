'use client';

import * as React from 'react';
import { AlertTriangle, Briefcase, CalendarDays, CarFront, Check, CheckCircle2, UserRound, Users } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { occupyingBookings } from '@/lib/fleet-service';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { CarPhoto } from '@/components/common/car-photo';
import { DayBar, DayBarLegend, legendLabels } from '@/components/common/day-bar';
import { cn } from '@/lib/utils';
import { TimeField } from '@/components/ui/time-field';
import { RangeCalendar } from '@/components/ui/range-calendar';
import { DateBox } from '@/components/ui/date-box';
import { BOOKING_SLOTS, SLOT_ORDER } from '@/lib/slots';

const SLOTS = SLOT_ORDER.map(key => ({ key, ...BOOKING_SLOTS[key] }));

/**
 * Booking sheet opened from a vehicle's "Book" button.
 * The car is already chosen, so staff only answer: date & time → purpose → who drives → Book now.
 */
export function BookSheet({ open, init }: { open: boolean; init: { carId?: string; date?: string; start?: string; end?: string } }) {
  const app = useApp();
  const { t, lang, cars, users, currentUser, checkConflict, isCarInMaintenance, closeSheet, createBooking } = app;

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

  // Reset each time the sheet opens, starting from the vehicle card's date and suggested time
  React.useEffect(() => {
    if (!open) return;
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
  const days = [0, 1, 2, 3, 4].map(i => DateUtil.addDays(today, i));


  const slotProblem = (s: string, e: string): string | null => {
    if (DateUtil.toMins(e) <= DateUtil.toMins(s)) return t('time_passed');
    if (date === today && DateUtil.toMins(e) <= nowMins) return t('time_passed');
    if (!car) return null;
    const c = checkConflict(car.id, date, s, e);
    return c.ok ? null : c.reason;
  };

  // When the car or date changes, jump to the first preset that still works
  React.useEffect(() => {
    if (!open || multiDay || !preset || !slotProblem(start, end)) return;
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
    const c = checkConflict(car.id, date, start, end, undefined, endDate);
    return c.ok ? null : c.reason;
  })();
  // Existing bookings for this car on any day of the window
  const booked = car
    ? DateUtil.dateRange(date, endDate)
        .flatMap(d => occupyingBookings(app, car.id, d))
        .filter((b, i, all) => b.status === 'Approved' && all.findIndex(x => x.id === b.id) === i)
        .map(b => app.bookings.find(x => x.id === b.id)!)
    : [];
  const barBookings = car ? occupyingBookings(app, car.id, date).filter(b => b.status === 'Approved') : [];
  const windowText = multiDay
    ? `${DateUtil.friendly(date, lang)} ${start} → ${DateUtil.friendly(endDate, lang)} ${end}`
    : `${DateUtil.friendly(date, lang)} · ${start}–${end}`;

  const missing = timeProblem ?? (!purpose.trim() ? t('pick_purpose') : null);

  const submit = () => {
    if (missing || !car) return;
    createBooking({ carId: car.id, date, endDate, startTime: start, endTime: end, purpose, destination: '', passengers: 1, needDriver });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={o => !o && closeSheet()}
      title={t('plan_title')}
      footer={
        <div className="space-y-2">
          {car && !timeProblem && (
            <p className="truncate text-center text-[12.5px] text-muted-foreground">
              {car.name} · <span className="tabular">{windowText}</span> · {needDriver ? t('with_driver') : t('self_drive')}
            </p>
          )}
          <Button size="lg" className="w-full" disabled={!!missing} onClick={submit}>
            {t('book_now')}
          </Button>
          {missing && <p className="text-center text-[12.5px] font-medium text-muted-foreground">{missing}</p>}
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
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {days.map(d => {
            const active = d === date && !multiDay;
            return (
              <button
                key={d}
                type="button"
                aria-pressed={active}
                onClick={() => (setDate(d), setEndDate(d))}
                className={cn(
                  'flex h-[58px] w-[54px] shrink-0 flex-col items-center justify-center rounded-2xl border transition-all',
                  active ? 'border-navy bg-navy text-navy-foreground dark:border-primary dark:bg-primary dark:text-primary-foreground' : 'bg-card hover:bg-muted'
                )}
              >
                <span className={cn('text-[10.5px] font-medium leading-none truncate max-w-full px-0.5', active ? 'opacity-75' : 'text-muted-foreground')}>
                  {d === today ? t('today') : d === DateUtil.addDays(today, 1) ? t('tomorrow') : DateUtil.weekdayShort(d, lang)}
                </span>
                <span className="mt-1 text-[18px] font-bold leading-tight tabular">{DateUtil.dayNum(d)}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setPicker(p => (p === 'dates' ? null : 'dates'))}
            aria-label={t('plan_date')}
            className={cn('flex h-[58px] w-[54px] shrink-0 flex-col items-center justify-center rounded-2xl border', !days.includes(date) || multiDay ? 'border-navy bg-navy text-navy-foreground dark:bg-primary' : 'bg-card hover:bg-muted')}
          >
            <CalendarDays className="size-5 opacity-70" />
            <span className="text-[10.5px] font-semibold">{!days.includes(date) || multiDay ? DateUtil.dayNum(date) : '···'}</span>
          </button>
        </div>

        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {SLOTS.map(s => {
            const blocked = !!slotProblem(s.start, s.end);
            return (
              <Choice key={s.key} active={preset?.key === s.key} disabled={blocked} onClick={() => (setRange({ start: s.start, end: s.end }), setEndDate(date), setPicker(null))}>
                <span className="text-[12.5px] font-semibold leading-tight">{t(s.key)}</span>
                <span className="text-[11px] tabular opacity-70">{!blocked ? `${s.start}–${s.end}` : date === today && DateUtil.toMins(s.end) <= nowMins ? t('passed') : t('booked_slots')}</span>
              </Choice>
            );
          })}
        </div>

        {/* Date range (calendar) + exact From/To time (type it or scroll the wheel) */}
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <DateBox label={t('start_date')} value={date} lang={lang} active={picker === 'dates'} onClick={() => setPicker(p => (p === 'dates' ? null : 'dates'))} />
            <DateBox label={t('end_date')} value={endDate} lang={lang} active={picker === 'dates'} onClick={() => setPicker(p => (p === 'dates' ? null : 'dates'))} />
          </div>
          {picker === 'dates' && (
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
          )}
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
          <p className="text-right text-[12px] font-semibold tabular text-muted-foreground">
            {preset ? `${t(preset.key)} · ` : multiDay ? `${t('days_n', { n: DateUtil.dateRange(date, endDate).length })} · ` : ''}
            {DateUtil.duration(date, start, endDate, end)}
          </p>
        </div>

        <div className="mt-2 rounded-2xl bg-muted/60 p-3">
          <DayBar
            bookings={barBookings}
            date={date}
            interactive
            allowOpenBooking={false}
            highlight={{ start, end: multiDay ? '23:59' : end, ok: !timeProblem, reason: timeProblem }}
            onUseFree={(s, e) => {
              setEndDate(date);
              setPicker(null);
              setRange({ start: s, end: e });
            }}
          />
          <DayBarLegend
            className="mt-2"
            labels={legendLabels(t)}
            items={['free', 'booked', timeProblem ? 'clash' : 'yours', ...(date === today ? (['past', 'now'] as const) : [])]}
          />
          {booked.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {booked.map(b => {
                const who = users.find(u => u.id === b.requesterId);
                const sameDay = (b.endDate || b.startDate) === b.startDate;
                return (
                  <li key={b.id} className="flex items-center gap-2 text-[12.5px]">
                    <Avatar initials={who?.initials ?? '?'} seed={who?.id} className="size-6 text-[10px]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {who?.name}
                        {b.requesterId === currentUser.id && <span className="text-primary"> ({t('you')})</span>}
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
          <div className={cn('mt-2.5 flex items-start gap-2 rounded-xl px-3 py-2.5', timeProblem ? 'bg-destructive-soft text-destructive' : 'bg-success-soft text-success')} role="status">
            {timeProblem ? <AlertTriangle className="mt-0.5 size-[18px] shrink-0" /> : <CheckCircle2 className="mt-0.5 size-[18px] shrink-0" />}
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold">{timeProblem ?? t('slot_free')}</p>
              <p className="text-[13px] font-bold tabular text-foreground">{windowText}</p>
            </div>
          </div>
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
      <Step n={4} icon={<UserRound />} label={t('driver_q')} value={needDriver ? t('with_driver') : t('self_drive')} done last>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('driver_q')}>
          {[
            { v: false, icon: CarFront, title: t('self_drive'), desc: t('self_drive_desc') },
            { v: true, icon: UserRound, title: t('with_driver'), desc: t('with_driver_desc') },
          ].map(o => (
            <button
              key={String(o.v)}
              type="button"
              role="radio"
              aria-checked={needDriver === o.v}
              onClick={() => setNeedDriver(o.v)}
              className={cn('flex items-center gap-2.5 rounded-2xl border-2 p-3 text-left transition-all', needDriver === o.v ? 'border-primary bg-primary-soft/60' : 'border-transparent bg-card ring-1 ring-border')}
            >
              <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', needDriver === o.v ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                <o.icon className="size-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold">{o.title}</span>
                <span className="block truncate text-[11.5px] text-muted-foreground">{o.desc}</span>
              </span>
            </button>
          ))}
        </div>
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

function Choice({ active, disabled, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-[60px] flex-col items-center justify-center gap-0.5 rounded-2xl border px-1 text-center transition-all disabled:opacity-35',
        active ? 'border-primary bg-primary-soft text-primary ring-1 ring-primary' : 'bg-card hover:bg-muted'
      )}
    >
      {children}
    </button>
  );
}
