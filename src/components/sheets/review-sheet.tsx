'use client';

import * as React from 'react';
import { AlertTriangle, CalendarClock, Check, MapPin, Users, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { isDriverBusy } from '@/lib/fleet-service';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Field, Textarea } from '@/components/ui/input';
import { CarArt } from '@/components/common/car-art';
import { cn } from '@/lib/utils';

export function ReviewSheet({ open, id }: { open: boolean; id?: string }) {
  const app = useApp();
  const { bookings, cars, users, drivers, t, lang, closeSheet, approveBooking, rejectBooking, checkConflict } = app;
  const b = bookings.find(x => x.id === id);

  const [mode, setMode] = React.useState<'approve' | 'reject'>('approve');
  const [driverId, setDriverId] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState('');

  const driverState = React.useCallback(
    (dId: string) => {
      const d = drivers.find(x => x.id === dId)!;
      if (d.status !== 'Active') return { ok: false, label: t('driver_off') };
      const busy = b && isDriverBusy(app, dId, b);
      if (busy) return { ok: false, label: t('driver_busy', { start: busy.startTime, end: busy.endTime }) };
      return { ok: true, label: t('driver_free') };
    },
    [app, b, drivers, t]
  );

  React.useEffect(() => {
    if (!open || !b) return;
    setMode('approve');
    setReason('');
    setDriverId(b.needDriver ? drivers.find(d => driverState(d.id).ok)?.id ?? null : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  if (!b) return null;
  const car = cars.find(c => c.id === b.carId)!;
  const requester = users.find(u => u.id === b.requesterId)!;
  const conflict = checkConflict(b.carId, b.startDate, b.startTime, b.endTime, b.id, b.endDate);

  return (
    <Sheet
      open={open}
      onOpenChange={o => !o && closeSheet()}
      title={t('review')}
      description={b.id}
      footer={
        mode === 'approve' ? (
          <div className="flex gap-2">
            <Button variant="destructive-soft" className="flex-1" onClick={() => setMode('reject')}>
              <X /> {t('reject')}
            </Button>
            <Button className="flex-[1.6]" disabled={!conflict.ok || (b.needDriver && !driverId)} onClick={() => approveBooking(b.id, driverId)}>
              <Check /> {t('approve')}
            </Button>
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
          <div className="w-20 shrink-0">
            <CarArt type={car.type} color={car.color} />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5 text-[13px]">
            <p className="truncate font-semibold">
              {car.name} <span className="font-mono text-[11.5px] font-normal text-muted-foreground">{car.plate}</span>
            </p>
            <p className="flex items-center gap-1.5 tabular text-muted-foreground">
              <CalendarClock className="size-3.5" />
              {DateUtil.window(b, lang)}
            </p>
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-3.5" />
              <span className="truncate">{b.destination || '—'}</span>
              <Users className="ml-1 size-3.5" />
              {b.passengers}
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
          <p className="mb-2 text-[13px] font-semibold text-muted-foreground">{t('choose_driver')}</p>
          <div className="space-y-2" role="radiogroup" aria-label={t('choose_driver')}>
            {drivers.map(d => {
              const st = driverState(d.id);
              const active = driverId === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={!st.ok}
                  onClick={() => setDriverId(d.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all disabled:opacity-50',
                    active ? 'border-primary bg-primary-soft/50' : 'border-transparent bg-card ring-1 ring-border'
                  )}
                >
                  <Avatar initials={d.name.split(' ').map(x => x[0]).join('')} seed={d.id} className="size-9 text-[12px]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold">{d.name}</p>
                    <p className="text-[12px] text-muted-foreground">{d.phone}</p>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', st.ok ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground')}>{st.label}</span>
                  <span className={cn('flex size-5 items-center justify-center rounded-full border-2', active ? 'border-primary bg-primary' : 'border-input')}>
                    {active && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mode === 'reject' && (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {['reject_quick_1', 'reject_quick_2', 'reject_quick_3'].map(k => (
              <button key={k} type="button" onClick={() => setReason(t(k))} className="rounded-full border bg-card px-3 py-1.5 text-[12.5px] font-medium hover:bg-muted">
                {t(k)}
              </button>
            ))}
          </div>
          <Field label={t('reject_reason')} htmlFor="rj-reason" required>
            <Textarea id="rj-reason" autoFocus value={reason} onChange={e => setReason(e.target.value)} placeholder={t('reject_reason_ph')} maxLength={250} />
          </Field>
        </div>
      )}
    </Sheet>
  );
}
