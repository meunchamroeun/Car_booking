'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';

/** Self-drive early return (requester) or trip completion (driver). */
export function ReturnSheet({ open, id, mode }: { open: boolean; id?: string; mode: 'early' | 'complete' }) {
  const { bookings, cars, t, closeSheet, returnVehicle } = useApp();
  const b = bookings.find(x => x.id === id);
  const car = cars.find(c => c.id === b?.carId);

  const [time, setTime] = React.useState('');
  const [odo, setOdo] = React.useState('');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (!open || !b) return;
    const now = DateUtil.nowTimeStr();
    const planned = b.originalEndTime || b.endTime;
    // Default to "now", clamped inside the trip window
    const clamped = DateUtil.toMins(now) > DateUtil.toMins(planned) ? planned : DateUtil.toMins(now) <= DateUtil.toMins(b.startTime) ? planned : now;
    setTime(clamped);
    setOdo('');
    setNotes('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  if (!b) return null;
  const planned = b.originalEndTime || b.endTime;
  const early = time && DateUtil.toMins(time) < DateUtil.toMins(planned);
  const odoLow = !!odo && !!car?.odometer && Number(odo) < car.odometer;

  return (
    <Sheet
      open={open}
      onOpenChange={o => !o && closeSheet()}
      title={mode === 'complete' ? t('complete_title') : t('return_title')}
      description={`${car?.name} · ${car?.plate}`}
      footer={
        <Button size="lg" variant={mode === 'complete' ? 'success' : 'default'} className="w-full" disabled={!time || odoLow} onClick={() => returnVehicle(b.id, { returnTime: time, odometer: odo || undefined, notes })}>
          {mode === 'complete' ? t('complete_trip') : t('return_early')}
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted p-3 text-[13px]">
        <div>
          <p className="text-muted-foreground">{t('schedule')}</p>
          <p className="font-semibold tabular">
            {b.startTime}–{planned}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">{t('destination')}</p>
          <p className="truncate font-semibold">{b.destination || '—'}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3.5">
        <Field label={t('return_time')} htmlFor="rt-time" required>
          <Input id="rt-time" type="time" value={time} min={b.startTime} max={planned} onChange={e => setTime(e.target.value)} className="tabular" />
        </Field>
        {early && (
          <p className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2.5 text-[13px] font-medium text-success">
            <Sparkles className="size-4 shrink-0" />
            {t('release_hint', { time: planned, h: DateUtil.diffHours(time, planned) })}
          </p>
        )}
        <Field label={t('odometer')} htmlFor="rt-odo" hint={car?.odometer ? `≥ ${car.odometer.toLocaleString()}` : undefined} error={odoLow ? `≥ ${car?.odometer?.toLocaleString()} km` : undefined}>
          <Input id="rt-odo" inputMode="numeric" value={odo} onChange={e => setOdo(e.target.value.replace(/\D/g, ''))} placeholder={car?.odometer ? String(car.odometer + 40) : ''} aria-invalid={odoLow} />
        </Field>
        <Field label={t('notes')} htmlFor="rt-notes">
          <Textarea id="rt-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes_ph')} maxLength={250} />
        </Field>
      </div>
    </Sheet>
  );
}
