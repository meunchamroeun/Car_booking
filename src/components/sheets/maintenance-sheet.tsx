'use client';

import * as React from 'react';
import { AlertTriangle, CheckCircle2, Pencil, Wrench } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Segmented } from '@/components/ui/segmented';
import { Field, Textarea } from '@/components/ui/input';
import { CarPhoto } from '@/components/common/car-photo';
import { DateBox } from '@/components/ui/date-box';
import { RangeCalendar } from '@/components/ui/range-calendar';
import { TimeField } from '@/components/ui/time-field';

export function MaintenanceSheet({ open, carId, defaultMode }: { open: boolean; carId?: string; defaultMode?: 'manual' | 'scheduled' }) {
  const { cars, bookings, t, lang, closeSheet, setMaintenance, clearMaintenance, isCarInMaintenance } = useApp();
  const car = cars.find(c => c.id === carId);

  const [editing, setEditing] = React.useState(false);
  const [mode, setMode] = React.useState<'manual' | 'scheduled'>('manual');
  const [reason, setReason] = React.useState('');
  const [estimated, setEstimated] = React.useState(DateUtil.tomorrowStr());
  const [from, setFrom] = React.useState(DateUtil.tomorrowStr());
  const [to, setTo] = React.useState(DateUtil.tomorrowStr());
  const [fromTime, setFromTime] = React.useState('08:00');
  const [toTime, setToTime] = React.useState('17:30');
  const [picker, setPicker] = React.useState<'dates' | 'from' | 'to' | null>(null);
  const togglePicker = (p: 'dates') => setPicker(cur => (cur === p ? null : p));

  React.useEffect(() => {
    if (!open || !car) return;
    const m = car.maintenance;
    setEditing(!m);
    setMode(defaultMode ?? m?.mode ?? 'manual');
    setReason(m?.reason ?? '');
    setEstimated(m?.estimatedDate ?? DateUtil.tomorrowStr());
    setFrom(m?.startDate ?? DateUtil.tomorrowStr());
    setTo(m?.endDate ?? DateUtil.tomorrowStr());
    setFromTime(m?.startTime ?? '08:00');
    setToTime(m?.endTime ?? '17:30');
    setPicker(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, carId]);

  if (!car) return null;
  const m = car.maintenance;
  const inService = isCarInMaintenance(car.id, DateUtil.todayStr());

  // Dot days that already have bookings for this car, so the impact of the service window is visible
  const markDay = (d: string) =>
    bookings.some(b => b.carId === car.id && (b.status === 'Approved' || b.status === 'Pending') && b.startDate <= d && d <= (b.endDate || b.startDate)) ? ('booked' as const) : undefined;

  const range = mode === 'manual' ? [DateUtil.todayStr(), estimated || DateUtil.todayStr()] : [from, to];
  const affected = bookings.filter(b => b.carId === car.id && (b.status === 'Approved' || b.status === 'Pending') && b.startDate >= range[0] && b.startDate <= range[1]);

  const save = () =>
    setMaintenance(car.id, mode === 'manual' ? { mode, reason, estimatedDate: estimated } : { mode, reason, startDate: from, endDate: to, startTime: fromTime, endTime: toTime });

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
        <CarPhoto car={car} zoomable className="h-16 w-24 shrink-0 rounded-xl" />
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
          <p className="mt-2 text-[12px] text-muted-foreground">
            {t('service_by', { name: m.setBy ?? '—' })} · {m.setAt}
          </p>
        </div>
      )}

      {editing && (
        <div className="mt-4 space-y-3.5">
          <Segmented
            value={mode}
            onChange={m => (setMode(m), setPicker(null))}
            options={[
              { value: 'manual', label: t('mode_manual') },
              { value: 'scheduled', label: t('mode_scheduled') },
            ]}
          />
          <p className="px-1 text-[12.5px] text-muted-foreground">{mode === 'manual' ? t('mode_manual_desc') : t('mode_scheduled_desc')}</p>
          <Field label={t('issue')} htmlFor="mt-reason" required>
            <Textarea id="mt-reason" value={reason} onChange={e => setReason(e.target.value)} placeholder={t('issue_ph')} maxLength={200} className="min-h-[72px]" />
          </Field>
          {mode === 'manual' ? (
            <div className="space-y-2">
              <DateBox label={t('est_return')} value={estimated} lang={lang} active={picker === 'dates'} onClick={() => togglePicker('dates')} />
              {picker === 'dates' && (
                <RangeCalendar
                  mode="single"
                  start={estimated}
                  end={estimated}
                  min={DateUtil.todayStr()}
                  maxDays={90}
                  lang={lang}
                  markDay={markDay}
                  onChange={d => setEstimated(d)}
                  onDone={() => setPicker(null)}
                  labels={{ pickStart: t('cal_pick_start'), pickEnd: t('cal_pick_end'), pickSingle: t('cal_pick_single'), booked: t('cal_has_booking'), unavailable: t('unavailable'), prev: t('a11y_prev_month'), next: t('a11y_next_month') }}
                />
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <DateBox label={t('from_date')} value={from} lang={lang} active={picker === 'dates'} onClick={() => togglePicker('dates')} />
                <DateBox label={t('to_date')} value={to} lang={lang} active={picker === 'dates'} onClick={() => togglePicker('dates')} />
              </div>
              {picker === 'dates' && (
                <RangeCalendar
                  start={from}
                  end={to}
                  min={DateUtil.todayStr()}
                  maxDays={60}
                  lang={lang}
                  markDay={markDay}
                  onChange={(s, e) => (setFrom(s), setTo(e))}
                  onDone={() => setPicker(null)}
                  labels={{ pickStart: t('cal_pick_start'), pickEnd: t('cal_pick_end'), booked: t('cal_has_booking'), unavailable: t('unavailable'), prev: t('a11y_prev_month'), next: t('a11y_next_month') }}
                />
              )}
              <div className="grid grid-cols-2 gap-2">
                <TimeField label={t('start_time')} value={fromTime} onChange={setFromTime} open={picker === 'from'} onOpenChange={o => setPicker(o ? 'from' : null)} />
                <TimeField
                  label={t('end_time')}
                  value={toTime}
                  onChange={setToTime}
                  open={picker === 'to'}
                  onOpenChange={o => setPicker(o ? 'to' : null)}
                  invalid={DateUtil.stamp(to, toTime) <= DateUtil.stamp(from, fromTime)}
                />
              </div>
            </div>
          )}
          {affected.length > 0 && (
            <p className="flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-[12.5px] font-medium text-warning">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {t('maint_affected', { n: affected.length, ids: affected.map(b => b.id).join(', ') })}
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}
