'use client';

import * as React from 'react';
import { AlertTriangle, CheckCircle2, Pencil, Wrench } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Segmented } from '@/components/ui/segmented';
import { Field, Input, Textarea } from '@/components/ui/input';
import { CarPhoto } from '@/components/common/car-photo';

export function MaintenanceSheet({ open, carId, defaultMode }: { open: boolean; carId?: string; defaultMode?: 'manual' | 'scheduled' }) {
  const { cars, bookings, t, lang, closeSheet, setMaintenance, clearMaintenance, isCarInMaintenance } = useApp();
  const car = cars.find(c => c.id === carId);

  const [editing, setEditing] = React.useState(false);
  const [mode, setMode] = React.useState<'manual' | 'scheduled'>('manual');
  const [reason, setReason] = React.useState('');
  const [workshop, setWorkshop] = React.useState('OONE Fleet Workshop');
  const [estimated, setEstimated] = React.useState(DateUtil.tomorrowStr());
  const [from, setFrom] = React.useState(DateUtil.tomorrowStr());
  const [to, setTo] = React.useState(DateUtil.tomorrowStr());
  const [fromTime, setFromTime] = React.useState('08:00');
  const [toTime, setToTime] = React.useState('17:30');

  React.useEffect(() => {
    if (!open || !car) return;
    const m = car.maintenance;
    setEditing(!m);
    setMode(defaultMode ?? m?.mode ?? 'manual');
    setReason(m?.reason ?? '');
    setWorkshop(m?.workshop ?? 'OONE Fleet Workshop');
    setEstimated(m?.estimatedDate ?? DateUtil.tomorrowStr());
    setFrom(m?.startDate ?? DateUtil.tomorrowStr());
    setTo(m?.endDate ?? DateUtil.tomorrowStr());
    setFromTime(m?.startTime ?? '08:00');
    setToTime(m?.endTime ?? '17:30');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, carId]);

  if (!car) return null;
  const m = car.maintenance;
  const inService = isCarInMaintenance(car.id, DateUtil.todayStr());

  const range = mode === 'manual' ? [DateUtil.todayStr(), estimated || DateUtil.todayStr()] : [from, to];
  const affected = bookings.filter(b => b.carId === car.id && (b.status === 'Approved' || b.status === 'Pending') && b.startDate >= range[0] && b.startDate <= range[1]);

  const save = () =>
    setMaintenance(car.id, mode === 'manual' ? { mode, reason, workshop, estimatedDate: estimated } : { mode, reason, workshop, startDate: from, endDate: to, startTime: fromTime, endTime: toTime });

  return (
    <Sheet
      open={open}
      onOpenChange={o => !o && closeSheet()}
      title={t('set_service_title')}
      footer={
        editing ? (
          <div className="flex gap-2">
            {m && (
              <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>
                {t('back')}
              </Button>
            )}
            <Button className="flex-[1.6]" disabled={!reason.trim()} onClick={save}>
              <Wrench /> {t('save_service')}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditing(true)}>
              <Pencil /> {t('manage')}
            </Button>
            <Button variant="success" className="flex-[1.6]" onClick={() => clearMaintenance(car.id)}>
              <CheckCircle2 /> {t('back_in_service')}
            </Button>
          </div>
        )
      }
    >
      <div className="flex items-center gap-3 rounded-2xl bg-muted p-3">
        <CarPhoto car={car} className="h-16 w-24 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{car.name}</p>
          <p className="font-mono text-[12px] text-muted-foreground">{car.plate}</p>
          <Badge tone={inService ? 'warning' : 'success'} dot className="mt-1">
            {inService ? t('st_service') : t('st_available')}
          </Badge>
        </div>
      </div>

      {m && !editing && (
        <div className="mt-4 rounded-2xl border border-warning/30 bg-warning-soft p-4 text-[13.5px]">
          <p className="font-semibold text-warning">{m.reason}</p>
          <p className="mt-1 text-foreground/80">
            {m.mode === 'manual'
              ? `${t('est_return')}: ${m.estimatedDate ? DateUtil.friendly(m.estimatedDate, lang) : '—'}`
              : `${DateUtil.friendly(m.startDate!, lang)} ${m.startTime} → ${DateUtil.friendly(m.endDate!, lang)} ${m.endTime}`}
          </p>
          <p className="text-foreground/80">
            {t('workshop')}: {m.workshop ?? '—'}
          </p>
          <p className="mt-2 text-[12px] text-muted-foreground">
            {t('service_by', { name: m.setBy ?? '—' })} · {m.setAt}
          </p>
        </div>
      )}

      {editing && (
        <div className="mt-4 space-y-3.5">
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'manual', label: t('mode_manual') },
              { value: 'scheduled', label: t('mode_scheduled') },
            ]}
          />
          <p className="px-1 text-[12.5px] text-muted-foreground">{mode === 'manual' ? t('mode_manual_desc') : t('mode_scheduled_desc')}</p>
          <Field label={t('issue')} htmlFor="mt-reason" required>
            <Textarea id="mt-reason" value={reason} onChange={e => setReason(e.target.value)} placeholder={t('issue_ph')} maxLength={200} className="min-h-[72px]" />
          </Field>
          <Field label={t('workshop')} htmlFor="mt-ws">
            <Input id="mt-ws" value={workshop} onChange={e => setWorkshop(e.target.value)} />
          </Field>
          {mode === 'manual' ? (
            <Field label={t('est_return')} htmlFor="mt-est">
              <Input id="mt-est" type="date" min={DateUtil.todayStr()} value={estimated} onChange={e => setEstimated(e.target.value)} />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <Field label={t('from_date')} htmlFor="mt-from">
                <Input id="mt-from" type="date" min={DateUtil.todayStr()} value={from} onChange={e => (setFrom(e.target.value), e.target.value > to && setTo(e.target.value))} />
              </Field>
              <Field label={t('to_date')} htmlFor="mt-to">
                <Input id="mt-to" type="date" min={from} value={to} onChange={e => setTo(e.target.value)} />
              </Field>
              <Input type="time" step={1800} value={fromTime} onChange={e => setFromTime(e.target.value)} aria-label={t('start_time')} />
              <Input type="time" step={1800} value={toTime} onChange={e => setToTime(e.target.value)} aria-label={t('end_time')} />
            </div>
          )}
          {affected.length > 0 && (
            <p className="flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-[12.5px] font-medium text-warning">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {affected.length} booking(s) in this window will be notified: {affected.map(b => b.id).join(', ')}
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}
