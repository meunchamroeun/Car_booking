'use client';

import * as React from 'react';
import { AlertTriangle, Briefcase, CalendarDays, CarFront, Check, CheckCircle2, Clock, Sun, Sunrise, SunMedium, UserRound, Users } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { occupyingBookings } from '@/lib/fleet-service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { TimeSelect } from '@/components/ui/time-select';
import { CarArt } from '@/components/common/car-art';
import { DayBar } from '@/components/common/day-bar';
import { cn } from '@/lib/utils';

const SLOTS = [
  { key: 'morning', icon: Sunrise, start: '08:00', end: '12:00' },
  { key: 'afternoon', icon: SunMedium, start: '13:00', end: '17:00' },
  { key: 'full_day', icon: Sun, start: '08:00', end: '17:00' },
] as const;

/**
 * Staff booking on Home, in the order staff think about it:
 *   1. choose an available car → 2. date & time → 3. purpose → 4. who drives → Book.
 * Slots the chosen car can't take are disabled, and who already booked it is shown.
 */
export function TripPlanner() {
  const app = useApp();
  const { t, lang, cars, users, currentUser, checkConflict, isCarInMaintenance, createBooking } = app;

  const nowMins = DateUtil.toMins(DateUtil.nowTimeStr());
  const today = DateUtil.todayStr();

  const [carId, setCarId] = React.useState<string | null>(null);
  // After 16:00 there is little left of today, so start on tomorrow.
  const [date, setDate] = React.useState(nowMins >= 16 * 60 ? DateUtil.tomorrowStr() : today);
  const [slot, setSlot] = React.useState<string>('morning');
  const [custom, setCustom] = React.useState({ start: '09:00', end: '11:00' });
  const [purpose, setPurpose] = React.useState('');
  const [needDriver, setNeedDriver] = React.useState(false);
  const [touched, setTouched] = React.useState(false);

  const car = cars.find(c => c.id === carId);
  const preset = SLOTS.find(s => s.key === slot);
  const start = preset?.start ?? custom.start;
  const end = preset?.end ?? custom.end;
  const days = [0, 1, 2, 3, 4].map(i => DateUtil.addDays(today, i));

  const slotProblem = (s: string, e: string): string | null => {
    if (DateUtil.toMins(e) <= DateUtil.toMins(s)) return t('time_passed');
    if (date === today && DateUtil.toMins(e) <= nowMins) return t('time_passed');
    if (!car) return null;
    const c = checkConflict(car.id, date, s, e);
    return c.ok ? null : c.reason;
  };

  // When the car or date changes, jump to the first slot that still works
  React.useEffect(() => {
    if (slot === 'custom' || !preset || !slotProblem(preset.start, preset.end)) return;
    const ok = SLOTS.find(s => !slotProblem(s.start, s.end));
    if (ok) setSlot(ok.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId, date]);

  const timeProblem = slotProblem(start, end);
  const booked = car ? occupyingBookings(app, car.id, date).filter(b => b.status === 'Approved') : [];
  const missing = !car ? t('choose_vehicle') : timeProblem ? timeProblem : !purpose.trim() ? t('pick_purpose') : null;

  const submit = () => {
    setTouched(true);
    if (missing || !car) return;
    createBooking({ carId: car.id, date, startTime: start, endTime: end, purpose, destination: '', passengers: 1, needDriver });
  };

  const carStatus = (id: string) => {
    if (isCarInMaintenance(id, date)) return { tone: 'text-warning', dot: 'bg-warning', label: t('st_service'), disabled: true };
    const n = occupyingBookings(app, id, date).filter(b => b.status === 'Approved').length;
    if (n === 0) return { tone: 'text-success', dot: 'bg-success', label: t('free_all_day'), disabled: false };
    return { tone: 'text-primary', dot: 'bg-primary', label: t('st_partly'), disabled: false };
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="px-4 pb-1 pt-4">
        <h2 className="text-[18px] font-bold tracking-tight">{t('plan_title')}</h2>
        <p className="text-[13px] text-muted-foreground">{t('plan_sub')}</p>
      </div>

      {/* 1. Car */}
      <Step n={1} icon={<CarFront />} label={t('choose_vehicle')} value={car?.name} done={!!car}>
        <div className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label={t('choose_vehicle')}>
          {cars.map(c => {
            const st = carStatus(c.id);
            const active = c.id === carId;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={st.disabled}
                onClick={() => setCarId(c.id)}
                className={cn(
                  'relative w-[136px] shrink-0 snap-start rounded-2xl border-2 bg-card p-2.5 text-left transition-all disabled:opacity-45',
                  active ? 'border-primary shadow-card' : 'border-transparent ring-1 ring-border hover:ring-primary/40'
                )}
              >
                {active && (
                  <span className="absolute right-2 top-2 z-10 flex size-5 items-center justify-center rounded-full bg-primary">
                    <Check className="size-3 text-primary-foreground" strokeWidth={3} />
                  </span>
                )}
                <div className="rounded-xl bg-muted px-2 py-1.5">
                  <CarArt type={c.type} color={c.color} />
                </div>
                <p className="mt-1.5 truncate text-[13px] font-semibold">{c.name}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{c.plate}</p>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Users className="size-3" /> {t('seats', { n: c.seats })}
                </p>
                <p className={cn('mt-1 flex items-center gap-1.5 text-[11.5px] font-semibold', st.tone)}>
                  <span className={cn('size-1.5 rounded-full', st.dot)} />
                  {st.label}
                </p>
              </button>
            );
          })}
        </div>
      </Step>

      {/* 2. Date & time */}
      <Step n={2} icon={<CalendarDays />} label={`${t('plan_date')} & ${t('plan_time')}`} value={`${DateUtil.friendly(date, lang)} · ${start}–${end}`} done={!!car && !timeProblem}>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {days.map(d => {
            const active = d === date;
            return (
              <button
                key={d}
                type="button"
                aria-pressed={active}
                onClick={() => setDate(d)}
                className={cn(
                  'flex h-[58px] w-[54px] shrink-0 flex-col items-center justify-center rounded-2xl border transition-all',
                  active ? 'border-navy bg-navy text-navy-foreground dark:border-primary dark:bg-primary dark:text-primary-foreground' : 'bg-card hover:bg-muted'
                )}
              >
                <span className={cn('text-[11px] font-medium', active ? 'opacity-75' : 'text-muted-foreground')}>{d === today ? t('today') : DateUtil.weekdayShort(d, lang)}</span>
                <span className="text-[18px] font-bold leading-tight tabular">{DateUtil.dayNum(d)}</span>
              </button>
            );
          })}
          <label className={cn('relative flex h-[58px] w-[54px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-2xl border', !days.includes(date) ? 'border-navy bg-navy text-navy-foreground dark:bg-primary' : 'bg-card')}>
            <CalendarDays className="size-5 opacity-70" />
            <span className="text-[10.5px] font-semibold">{!days.includes(date) ? DateUtil.dayNum(date) : '···'}</span>
            <input type="date" min={today} value={date} onChange={e => e.target.value && setDate(e.target.value)} className="absolute inset-0 opacity-0" aria-label={t('plan_date')} />
          </label>
        </div>

        <div className="mt-2.5 grid grid-cols-4 gap-2">
          {SLOTS.map(s => {
            const blocked = !!slotProblem(s.start, s.end);
            return (
              <Choice key={s.key} active={slot === s.key} disabled={blocked} onClick={() => setSlot(s.key)}>
                <s.icon className="size-[18px]" />
                <span className="text-[12.5px] font-semibold leading-tight">{t(s.key)}</span>
                <span className="text-[11px] tabular opacity-70">{blocked ? t('booked_slots') : `${s.start.slice(0, 2)}–${s.end.slice(0, 2)}h`}</span>
              </Choice>
            );
          })}
          <Choice active={slot === 'custom'} onClick={() => setSlot('custom')}>
            <Clock className="size-[18px]" />
            <span className="text-[12.5px] font-semibold leading-tight">{t('plan_custom')}</span>
            <span className="text-[11px] tabular opacity-70">{slot === 'custom' ? `${custom.start.slice(0, 2)}–${custom.end.slice(0, 2)}h` : '··'}</span>
          </Choice>
        </div>
        {slot === 'custom' && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <TimeSelect
              label={t('start_time')}
              value={custom.start}
              onChange={v =>
                setCustom(c => ({ start: v, end: DateUtil.toMins(c.end) <= DateUtil.toMins(v) ? `${DateUtil.pad(Math.min(20, Number(v.slice(0, 2)) + 2))}:${v.slice(3)}` : c.end }))
              }
            />
            <TimeSelect label={t('end_time')} value={custom.end} min={custom.start} onChange={v => setCustom(c => ({ ...c, end: v }))} />
          </div>
        )}

        {car && (
          <div className="mt-3 rounded-2xl bg-muted/60 p-3">
            <DayBar bookings={booked} date={date} />
            {booked.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {booked.map(b => {
                  const who = users.find(u => u.id === b.requesterId);
                  return (
                    <li key={b.id} className="flex items-center gap-2 text-[12.5px]">
                      <Avatar initials={who?.initials ?? '?'} seed={who?.id} className="size-6 text-[10px]" />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {who?.name}
                        {b.requesterId === currentUser.id && <span className="text-primary"> ({t('you')})</span>}
                      </span>
                      <span className="font-semibold tabular text-primary">
                        {b.startTime}–{b.endTime}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className={cn('mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold', timeProblem ? 'text-destructive' : 'text-success')} role="status">
              {timeProblem ? <AlertTriangle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
              {timeProblem ?? t('slot_free')}
            </p>
          </div>
        )}
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
          aria-invalid={touched && !purpose.trim()}
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

      {/* Book */}
      <div className="border-t bg-muted/30 p-4">
        {car && !timeProblem && (
          <p className="mb-2 truncate text-center text-[12.5px] text-muted-foreground">
            {car.name} · {DateUtil.friendly(date, lang)} · <span className="tabular">{start}–{end}</span> · {needDriver ? t('with_driver') : t('self_drive')}
          </p>
        )}
        <Button size="lg" className="w-full" disabled={!!missing} onClick={submit}>
          {t('book_now')}
        </Button>
        {missing && <p className="mt-2 text-center text-[12.5px] font-medium text-muted-foreground">{missing}</p>}
      </div>
    </Card>
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
    <section className={cn('px-4 py-3.5', !last && 'border-b border-dashed')}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[13.5px] font-semibold">
          <span
            className={cn(
              'flex size-6 items-center justify-center rounded-full text-[11.5px] font-bold transition-colors',
              done ? 'bg-success text-white' : 'bg-navy text-navy-foreground dark:bg-primary dark:text-primary-foreground'
            )}
          >
            {done ? <Check className="size-3.5" strokeWidth={3} /> : n}
          </span>
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
        'flex h-[76px] flex-col items-center justify-center gap-0.5 rounded-2xl border px-1 text-center transition-all disabled:opacity-35',
        active ? 'border-primary bg-primary-soft text-primary ring-1 ring-primary' : 'bg-card hover:bg-muted'
      )}
    >
      {children}
    </button>
  );
}
