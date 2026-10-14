'use client';

import * as React from 'react';
import { Briefcase, CalendarDays, CarFront, Check, Fuel, Minus, Plus, UserRound, Users } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { TripDraft } from '@/types';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { CarArt } from '@/components/common/car-art';
import { cn } from '@/lib/utils';

/** Step 2 of the Home planner: pick one of the free vehicles and send the request. */
export function PickVehicleSheet({ open, draft }: { open: boolean; draft?: TripDraft }) {
  const { cars, t, lang, closeSheet, checkConflict, createBooking } = useApp();
  const [carId, setCarId] = React.useState<string | null>(null);
  const [passengers, setPassengers] = React.useState(1);
  const [destination, setDestination] = React.useState('');

  // Free cars, smallest that fits first so big vans stay available for groups
  const free = React.useMemo(
    () => (draft ? cars.filter(c => checkConflict(c.id, draft.date, draft.start, draft.end).ok).sort((a, b) => a.seats - b.seats) : []),
    [cars, draft, checkConflict]
  );
  const bestFit = free.find(c => c.seats >= passengers);

  React.useEffect(() => {
    if (!open) return;
    setPassengers(1);
    setDestination('');
    setCarId(null);
  }, [open]);

  // Keep a valid selection: default to the best fit, drop a car that became too small
  React.useEffect(() => {
    const cur = free.find(c => c.id === carId);
    if (!cur || cur.seats < passengers) setCarId(bestFit?.id ?? null);
  }, [free, carId, passengers, bestFit]);

  if (!draft) return null;
  const car = free.find(c => c.id === carId);

  return (
    <Sheet
      open={open}
      onOpenChange={o => !o && closeSheet()}
      title={t('choose_vehicle')}
      footer={
        <Button
          size="lg"
          className="w-full"
          disabled={!car}
          onClick={() => car && createBooking({ carId: car.id, date: draft.date, startTime: draft.start, endTime: draft.end, purpose: draft.purpose, destination, passengers, needDriver: draft.needDriver })}
        >
          {car ? `${t('submit_request')} · ${car.name}` : t('none_free')}
        </Button>
      }
    >
      {/* Summary of what was chosen on Home */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-3 text-[13px]">
        <Summary icon={<CalendarDays />} text={`${DateUtil.friendly(draft.date, lang)} · ${draft.start}–${draft.end}`} wide />
        <Summary icon={<Briefcase />} text={draft.purpose} />
        <Summary icon={draft.needDriver ? <UserRound /> : <CarFront />} text={draft.needDriver ? t('with_driver') : t('self_drive')} />
        <button type="button" onClick={closeSheet} className="col-span-2 mt-0.5 text-left text-[12.5px] font-semibold text-primary">
          ← {t('edit')}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-3">
        <Field label={t('destination')} htmlFor="pk-dest">
          <Input id="pk-dest" value={destination} onChange={e => setDestination(e.target.value)} placeholder={t('destination_ph')} />
        </Field>
        <Field label={t('passengers')}>
          <div className="flex h-11 items-center gap-1 rounded-xl border bg-card px-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setPassengers(p => Math.max(1, p - 1))} disabled={passengers <= 1} aria-label="−">
              <Minus />
            </Button>
            <span className="w-6 text-center text-[16px] font-bold tabular" aria-live="polite">
              {passengers}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={() => setPassengers(p => Math.min(15, p + 1))} aria-label="+">
              <Plus />
            </Button>
          </div>
        </Field>
      </div>

      <p className="mb-2 mt-5 flex items-center justify-between text-[13px] font-semibold text-muted-foreground">
        {t('choose_vehicle')}
        <span>{t('free_count', { n: free.length })}</span>
      </p>
      <div className="space-y-2" role="radiogroup" aria-label={t('choose_vehicle')}>
        {free.map(c => {
          const fits = c.seats >= passengers;
          const active = c.id === carId;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!fits}
              onClick={() => setCarId(c.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition-all disabled:opacity-40',
                active ? 'border-primary bg-primary-soft/50' : 'border-transparent bg-card ring-1 ring-border'
              )}
            >
              <div className="w-[88px] shrink-0 rounded-xl bg-muted px-1.5 py-1">
                <CarArt type={c.type} color={c.color} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{c.name}</p>
                <p className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
                  <span className="font-mono">{c.plate}</span>
                  {c.id === bestFit?.id && <span className="rounded-full bg-success-soft px-1.5 py-px text-[10.5px] font-semibold text-success">{t('best_fit')}</span>}
                </p>
                <p className="mt-0.5 flex gap-3 text-[12px] text-muted-foreground">
                  <span className={cn('flex items-center gap-1', !fits && 'font-semibold text-destructive')}>
                    <Users className="size-3.5" />
                    {fits ? t('seats', { n: c.seats }) : t('too_small')}
                  </span>
                  {c.fuel && (
                    <span className="flex items-center gap-1">
                      <Fuel className="size-3.5" />
                      {c.fuel}
                    </span>
                  )}
                </p>
              </div>
              <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full border-2', active ? 'border-primary bg-primary' : 'border-input')}>
                {active && <Check className="size-3.5 text-primary-foreground" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

function Summary({ icon, text, wide }: { icon: React.ReactNode; text: string; wide?: boolean }) {
  return (
    <span className={cn('flex min-w-0 items-center gap-1.5 font-semibold [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground', wide && 'col-span-2')}>
      {icon}
      <span className="truncate">{text}</span>
    </span>
  );
}
