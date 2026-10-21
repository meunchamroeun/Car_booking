'use client';

import * as React from 'react';
import { CalendarClock, FileText, Sparkles } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/input';
import { TimeField } from '@/components/ui/time-field';

/** Self-drive early return (requester) or trip completion (driver). */
export function ReturnSheet({ open, id, mode }: { open: boolean; id?: string; mode: 'early' | 'complete' }) {
  const { bookings, cars, t, lang, closeSheet, returnVehicle } = useApp();
  const b = bookings.find(x => x.id === id);
  const car = cars.find(c => c.id === b?.carId);

  const [time, setTime] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [timeOpen, setTimeOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open || !b) return;
    const now = DateUtil.nowTimeStr();
    const planned = b.originalEndTime || b.endTime;
    // Default to "now", clamped inside the trip window
    const clamped = DateUtil.toMins(now) > DateUtil.toMins(planned) ? planned : DateUtil.toMins(now) <= DateUtil.toMins(b.startTime) ? planned : now;
    setTime(clamped);
    setNotes('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  if (!b) return null;
  const planned = b.originalEndTime || b.endTime;
  const early = time && DateUtil.toMins(time) < DateUtil.toMins(planned);

  return (
    <Sheet
      open={open}
      onOpenChange={o => !o && closeSheet()}
      title={mode === 'complete' ? t('complete_title') : t('return_title')}
      description={`${car?.name} · ${car?.plate}`}
      footer={
        <Button size="lg" variant={mode === 'complete' ? 'success' : 'default'} className="w-full" disabled={!time} onClick={() => returnVehicle(b.id, { returnTime: time, notes })}>
          {mode === 'complete' ? t('complete_trip') : t('return_early')}
        </Button>
      }
    >
      {/* Booking summary: when, then what for */}
      <div className="space-y-1.5 rounded-xl border bg-muted/40 px-3 py-2.5 text-[12.5px]">
        <p className="flex items-center gap-2">
          <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="font-semibold tabular">
            {DateUtil.friendly(b.startDate, lang)} · {b.startTime}–{planned}
          </span>
        </p>
        {b.purpose && (
          <p className="flex items-start gap-2 text-muted-foreground">
            <FileText className="mt-0.5 size-3.5 shrink-0" />
            <span className="line-clamp-2 leading-snug">{b.purpose}</span>
          </p>
        )}
      </div>

      <div className="mt-4 space-y-3.5">
        <div className="grid gap-2">
          <TimeField required label={t('return_time')} value={time} onChange={setTime} open={timeOpen} onOpenChange={setTimeOpen} />
        </div>
        {early && (
          <p className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2.5 text-[13px] font-medium text-success">
            <Sparkles className="size-4 shrink-0" />
            {t('release_hint', { time: planned, h: DateUtil.diffHours(time, planned) })}
          </p>
        )}
        <Field label={t('notes')} htmlFor="rt-notes">
          <Textarea id="rt-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes_ph')} maxLength={250} />
        </Field>
      </div>
    </Sheet>
  );
}
