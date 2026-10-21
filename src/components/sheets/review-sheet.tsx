'use client';

import * as React from 'react';
import { AlertTriangle, CalendarClock, CarFront, Check, UserRound, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Field, Textarea } from '@/components/ui/input';
import { CarPhoto } from '@/components/common/car-photo';
import { DriverSelect } from '@/components/common/driver-select';
import { cn } from '@/lib/utils';

/** startMode 'reject' (from the Reject button) skips straight to the reason, without the driver question. */
export function ReviewSheet({ open, id, startMode = 'approve' }: { open: boolean; id?: string; startMode?: 'approve' | 'reject' }) {
  const app = useApp();
  const { bookings, cars, users, t, lang, closeSheet, approveBooking, rejectBooking, checkConflict } = app;
  const b = bookings.find(x => x.id === id);

  const [mode, setMode] = React.useState<'approve' | 'reject'>('approve');
  const [driverId, setDriverId] = React.useState<string | null>(null);
  // Request asked for a driver → approver must answer "Assign a company driver?" first
  const [assign, setAssign] = React.useState<'yes' | 'no' | null>(null);
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (!open || !b) return;
    setMode(startMode);
    setReason('');
    setDriverId(null);
    setAssign(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id, startMode]);

  if (!b) return null;
  const car = cars.find(c => c.id === b.carId)!;
  const requester = users.find(u => u.id === b.requesterId)!;
  const conflict = checkConflict(b.carId, b.startDate, b.startTime, b.endTime, b.id, b.endDate);
  // Why Approve is disabled (null = ready)
  const approveHint = !conflict.ok
    ? null
    : b.needDriver && !assign
      ? t('assign_q_hint')
      : b.needDriver && assign === 'yes' && !driverId
        ? t('choose_driver')
        : null;

  return (
    <Sheet
      open={open}
      onOpenChange={o => !o && closeSheet()}
      title={t('review')}
      description={b.id}
      footer={
        mode === 'approve' ? (
          <div className="space-y-2">
            {approveHint && <p className="text-center text-[12.5px] font-medium text-muted-foreground">{approveHint}</p>}
            <div className="flex gap-2">
              <Button variant="destructive-soft" className="flex-1" onClick={() => setMode('reject')}>
                <X /> {t('reject')}
              </Button>
              <Button
                className="flex-[1.6]"
                disabled={!conflict.ok || !!approveHint}
                onClick={() => approveBooking(b.id, assign === 'yes' ? driverId : null, !b.needDriver || assign === 'yes')}
              >
                <Check /> {t('approve')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setMode('approve')}>
              {t('back')}
            </Button>
            <Button variant="destructive" className="flex-[1.6]" disabled={!reason.trim()} onClick={() => rejectBooking(b.id, reason)}>
              {t('reject')}
            </Button>
          </div>
        )
      }
    >
      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <Avatar initials={requester.initials} seed={requester.id} className="size-11" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{requester.name}</p>
            <p className="truncate text-[12.5px] text-muted-foreground">{requester.dept}</p>
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-muted/70 px-3 py-2 text-[13.5px]">{b.purpose}</p>
        <div className="mt-3 flex items-center gap-3">
          <CarPhoto car={car} zoomable className="h-[54px] w-20 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-0.5 text-[13px]">
            <p className="truncate font-semibold">
              {car.name} <span className="font-mono text-[11.5px] font-normal text-muted-foreground">{car.plate}</span>
            </p>
            <p className="flex items-center gap-1.5 tabular text-muted-foreground">
              <CalendarClock className="size-3.5" />
              {DateUtil.window(b, lang)}
            </p>
          </div>
        </div>
      </div>

      {!conflict.ok && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-destructive-soft p-3 text-[13px] font-medium text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {t('conflict_warn', { reason: conflict.reason })}
        </p>
      )}

      {mode === 'approve' && b.needDriver && (
        <div className="mt-5">
          <p className="mb-2 text-[14px] font-semibold">{t('assign_q')}</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('assign_q')}>
            {(
              [
                { v: 'yes', icon: UserRound, title: t('assign_yes'), desc: t('assign_yes_desc') },
                { v: 'no', icon: CarFront, title: t('assign_no'), desc: t('assign_no_desc') },
              ] as const
            ).map(o => (
              <button
                key={o.v}
                type="button"
                role="radio"
                aria-checked={assign === o.v}
                onClick={() => setAssign(o.v)}
                className={cn(
                  'flex items-start gap-2.5 rounded-2xl border-2 p-3 text-left transition-all',
                  assign === o.v ? 'border-primary bg-primary-soft/60' : 'border-transparent bg-card ring-1 ring-border'
                )}
              >
                <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', assign === o.v ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                  <o.icon className="size-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold leading-snug">{o.title}</span>
                  <span className="block text-[11.5px] leading-snug text-muted-foreground">{o.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'approve' && b.needDriver && assign === 'yes' && (
        <div className="mt-4 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <DriverSelect b={b} value={driverId} onChange={setDriverId} />
        </div>
      )}

      {mode === 'reject' && (
        <div className="mt-5">
          <Field label={t('reject_reason')} htmlFor="rj-reason" required>
            <Textarea id="rj-reason" autoFocus value={reason} onChange={e => setReason(e.target.value)} placeholder={t('reject_reason_ph')} maxLength={250} />
          </Field>
        </div>
      )}
    </Sheet>
  );
}
