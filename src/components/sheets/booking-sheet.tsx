'use client';

import * as React from 'react';
import { CalendarClock, CarFront, Check, CheckCircle2, ClipboardCheck, FileText, MapPin, Phone, RotateCcw, Route, UserRound, XCircle } from 'lucide-react';
import { useApp } from '@/lib/store';
import { isLive } from '@/lib/selectors';
import { DateUtil } from '@/lib/date-utils';
import { canCancel, canCompleteTask, canReturnEarly, canReview, canShowPass, canStartTask } from '@/lib/permissions';
import { Booking } from '@/types';
import { InfoRow, Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { BookingStatusBadge } from '@/components/common/status';
import { CarPhoto } from '@/components/common/car-photo';
import { cn } from '@/lib/utils';

export function BookingSheet({ open, id }: { open: boolean; id?: string }) {
  const app = useApp();
  const { bookings, cars, users, drivers, currentUser, t, lang, closeSheet, openSheet, cancelBooking, startTask } = app;
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  React.useEffect(() => setConfirmCancel(false), [open, id]);

  const b = bookings.find(x => x.id === id);
  if (!b) return null;

  const car = cars.find(c => c.id === b.carId)!;
  const requester = users.find(u => u.id === b.requesterId);
  const driver = drivers.find(d => d.id === b.driverId);
  const approver = users.find(u => u.id === b.approverId);
  const isMine = b.requesterId === currentUser.id;

  const actions: React.ReactNode[] = [];
  if (canReview(currentUser, b))
    actions.push(
      <Button key="review" className="flex-1" onClick={() => openSheet({ type: 'review', id: b.id })}>
        <ClipboardCheck /> {t('review')}
      </Button>
    );
  if (canStartTask(currentUser, b))
    actions.push(
      <Button key="start" className="flex-1" onClick={() => startTask(b.id)}>
        <Route /> {t('start_trip')}
      </Button>
    );
  if (canCompleteTask(currentUser, b))
    actions.push(
      <Button key="complete" variant="success" className="flex-1" onClick={() => openSheet({ type: 'return', id: b.id, mode: 'complete' })}>
        <CheckCircle2 /> {t('complete_trip')}
      </Button>
    );
  if (canReturnEarly(currentUser, b))
    actions.push(
      <Button key="return" variant="navy" className="flex-1" onClick={() => openSheet({ type: 'return', id: b.id, mode: 'early' })}>
        <RotateCcw /> {t('return_early')}
      </Button>
    );
  if (canCancel(currentUser, b))
    actions.push(
      confirmCancel ? (
        <Button key="cancel" variant="destructive" className="flex-1" onClick={() => cancelBooking(b.id)}>
          {t('confirm')}
        </Button>
      ) : (
        <Button key="cancel" variant="destructive-soft" className={cn(actions.length ? '' : 'flex-1')} onClick={() => setConfirmCancel(true)}>
          <XCircle /> {t('cancel_booking')}
        </Button>
      )
    );

  return (
    <Sheet
      open={open}
      onOpenChange={o => !o && closeSheet()}
      title={
        <span className="flex items-center gap-2">
          {t('booking')} <span className="font-mono text-[15px] text-muted-foreground">{b.id}</span>
        </span>
      }
      footer={
        actions.length > 0 && (
          <div className="space-y-2">
            {confirmCancel && <p className="text-center text-[12.5px] font-medium text-destructive">{t('cancel_confirm')}</p>}
            <div className="flex gap-2">{actions}</div>
          </div>
        )
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <BookingStatusBadge b={b} />
        <span className="text-[12px] text-muted-foreground">{b.createdAt}</span>
      </div>

      {canShowPass(currentUser, b) ? <Pass b={b} /> : (
        <div className="flex items-center gap-3 rounded-2xl bg-muted p-3">
          <CarPhoto car={car} zoomable className="h-16 w-24 shrink-0 rounded-xl" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{car.name}</p>
            <p className="font-mono text-[12px] text-muted-foreground">{car.plate}</p>
          </div>
        </div>
      )}

      {(b.rejectReason || b.cancelReason) && (
        <div className="mt-3 rounded-xl bg-destructive-soft p-3 text-[13px] text-destructive">
          <p className="font-semibold">{b.rejectReason ? t('rejected_by', { name: approver?.name ?? '' }) : t('st_Cancelled')}</p>
          <p className="mt-0.5 opacity-90">{b.rejectReason ?? b.cancelReason}</p>
        </div>
      )}

      <div className="mt-2 divide-y">
        <InfoRow icon={<CalendarClock />} label={t('schedule')}>
          <span className="tabular">
            {DateUtil.window(b, lang)}
          </span>
          {b.returnedEarly && b.originalEndTime && (
            <span className="ml-1.5 text-[12px] font-medium text-muted-foreground line-through">{b.originalEndTime}</span>
          )}
        </InfoRow>
        <InfoRow icon={<MapPin />} label={t('route')}>
          {t('depot')} → {b.destination || '—'}
        </InfoRow>
        {!isMine && requester && (
          <InfoRow icon={<UserRound />} label={t('requester')}>
            <span className="flex items-center justify-between gap-2">
              <span>
                {requester.name} <span className="font-normal text-muted-foreground">· {requester.dept}</span>
              </span>
              <a href={`tel:${requester.phone.replace(/\s/g, '')}`} className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary" aria-label={t('call')}>
                <Phone className="size-4" />
              </a>
            </span>
          </InfoRow>
        )}
        <InfoRow icon={<CarFront />} label={t('driver')}>
          {b.needDriver ? (
            driver ? (
              <span className="flex items-center justify-between gap-2">
                <span>{driver.name}</span>
                <a href={`tel:${driver.phone.replace(/\s/g, '')}`} className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary" aria-label={t('call')}>
                  <Phone className="size-4" />
                </a>
              </span>
            ) : (
              <span className="font-medium text-muted-foreground">{t('awaiting_driver')}</span>
            )
          ) : (
            t('self_drive')
          )}
        </InfoRow>
        <InfoRow icon={<FileText />} label={t('purpose')}>
          <span className="font-medium">{b.purpose}</span>
          <span className="block text-[12.5px] font-normal text-muted-foreground">{t('pax', { n: b.passengers })}</span>
        </InfoRow>
        {(b.completionNotes || b.autoCompleted) && (
          <InfoRow icon={<FileText />} label={t('notes')}>
            <span className="font-medium">{b.completionNotes || t('auto_completed_note')}</span>
          </InfoRow>
        )}
      </div>

      <Progress b={b} approverName={approver?.name} />
    </Sheet>
  );
}

/**
 * Booking progress: steps appear one after another, a coloured line grows through
 * the finished steps, finished dots pop in with a check, and the current step pulses.
 */
function Progress({ b, approverName }: { b: Booking; approverName?: string }) {
  const { t, lang } = useApp();
  const rejected = b.status === 'Rejected';
  const cancelled = b.status === 'Cancelled';
  const steps: { label: string; at?: string | null; done: boolean; bad?: boolean }[] = [
    { label: t('ev_requested'), at: b.createdAt, done: true },
    {
      label: rejected ? t('rejected_by', { name: approverName ?? '' }) : b.decisionAt ? t('approved_by', { name: approverName ?? '' }) : t('pending_review'),
      at: b.decisionAt,
      done: !!b.decisionAt,
      bad: rejected,
    },
    ...(rejected
      ? []
      : cancelled
        ? [{ label: t('st_Cancelled'), at: null, done: true, bad: true }]
        : [
            { label: t('ev_started'), at: b.startedAt, done: !!b.startedAt || b.status === 'Completed' },
            { label: b.returnedEarly ? t('st_early') : t('ev_completed'), at: b.completedAt, done: b.status === 'Completed' },
          ]),
  ];
  const lastDone = steps.reduce((acc, s, i) => (s.done ? i : acc), 0);
  const current = steps.findIndex(s => !s.done); // -1 when everything is finished
  const live = isLive(b);
  const STEP = 0.14; // seconds between steps
  // Row height is fixed so the growing line can stop exactly at the last finished dot
  const ROW = 56;

  return (
    <div className="mt-4 rounded-2xl border bg-card p-4">
      <p className="mb-3 text-[13px] font-semibold text-muted-foreground">{t('timeline_title')}</p>
      <ol className="relative">
        {/* grey track */}
        <span className="absolute left-[11px] top-3 w-0.5 rounded-full bg-border" style={{ height: (steps.length - 1) * ROW }} aria-hidden />
        {/* coloured progress, grows from the top */}
        {lastDone > 0 && (
          <span
            className={cn('absolute left-[11px] top-3 w-0.5 origin-top animate-grow-y rounded-full', steps[lastDone].bad ? 'bg-destructive' : 'bg-success')}
            style={{ height: lastDone * ROW, animationDelay: '0.15s' }}
            aria-hidden
          />
        )}
        {steps.map((s, i) => {
          const isCurrent = i === current;
          return (
            <li
              key={i}
              className="relative flex gap-3 animate-in fade-in-0 slide-in-from-left-2 duration-500 fill-mode-both"
              style={{ height: i === steps.length - 1 ? undefined : ROW, animationDelay: `${i * STEP}s` }}
            >
              <span className="relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center">
                {isCurrent && <span className="absolute inset-0 animate-ping_soft rounded-full bg-primary" />}
                <span
                  className={cn(
                    'relative flex size-6 items-center justify-center rounded-full border-2 border-card',
                    s.bad ? 'bg-destructive text-white' : s.done ? 'bg-success text-white' : isCurrent ? 'bg-primary' : 'bg-muted',
                    (s.done || s.bad) && 'animate-pop'
                  )}
                  style={{ animationDelay: `${0.15 + i * STEP}s` }}
                >
                  {s.bad ? <XCircle className="size-3.5" /> : s.done ? <Check className="size-3.5" strokeWidth={3} /> : isCurrent ? <span className="size-2 rounded-full bg-primary-foreground" /> : null}
                </span>
              </span>
              <div className="min-w-0 pb-2">
                <p className={cn('text-[14px] font-semibold leading-snug', !s.done && !isCurrent && 'text-muted-foreground', isCurrent && 'text-primary')}>{s.label}</p>
                {s.at ? (
                  <p className="text-[12px] tabular text-muted-foreground">{DateUtil.relative(s.at, lang)}</p>
                ) : isCurrent ? (
                  <p className="text-[12px] text-muted-foreground">{live ? t('ev_waiting') : t('ev_next')}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Digital vehicle pass with a deterministic QR-style code for the guard house. */
function Pass({ b }: { b: Booking }) {
  const { cars, users, t, lang } = useApp();
  const car = cars.find(c => c.id === b.carId)!;
  const requester = users.find(u => u.id === b.requesterId);
  return (
    <div className="hero-pattern overflow-hidden rounded-[22px] bg-navy text-navy-foreground">
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-wider text-white/55">{t('pass_title')}</p>
          <p className="text-[17px] font-bold">{car.name}</p>
          <p className="font-mono text-[12.5px] text-white/70">{car.plate}</p>
        </div>
        <CarPhoto car={car} zoomable className="h-16 w-24 shrink-0 rounded-xl ring-1 ring-white/20" />
      </div>
      <div className="relative mx-4 mt-3 flex items-center justify-center rounded-2xl bg-white p-3">
        <QrCode value={`${b.id}|${car.plate}|${b.startDate}`} />
        <span className="pointer-events-none absolute inset-x-6 h-0.5 animate-scan rounded-full bg-[hsl(var(--accent))] shadow-[0_0_12px_hsl(var(--accent))]" />
      </div>
      <p className="px-4 pt-2 text-center text-[11.5px] text-white/60">{t('pass_hint')}</p>
      <div className="relative mt-3 border-t border-dashed border-white/20 px-4 py-3">
        <span className="absolute -left-3 -top-3 size-6 rounded-full bg-background" />
        <span className="absolute -right-3 -top-3 size-6 rounded-full bg-background" />
        <div className="grid grid-cols-3 gap-2 text-[12px]">
          <div>
            <p className="text-white/55">{t('date')}</p>
            <p className="font-semibold">
              {DateUtil.friendly(b.startDate, lang)}
              {b.endDate && b.endDate !== b.startDate && ` → ${DateUtil.friendly(b.endDate, lang)}`}
            </p>
          </div>
          <div>
            <p className="text-white/55">{t('schedule')}</p>
            <p className="font-semibold tabular">
              {b.startTime}–{b.endTime}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-white/55">{t('passenger')}</p>
            <p className="truncate font-semibold">{requester?.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QrCode({ value, size = 25 }: { value: string; size?: number }) {
  const { t } = useApp();
  const cells = React.useMemo(() => {
    let h = 2166136261;
    for (const ch of value) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const rand = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
    const finder = (x: number, y: number) => {
      for (const [fx, fy] of [[0, 0], [size - 7, 0], [0, size - 7]]) {
        const dx = x - fx;
        const dy = y - fy;
        if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) {
          const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
          return ring === 3 || ring <= 1 ? 1 : 0;
        }
        if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) return 0;
      }
      return null;
    };
    const out: [number, number][] = [];
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const f = finder(x, y);
        if (f === 1 || (f === null && rand() > 0.52)) out.push([x, y]);
      }
    return out;
  }, [value, size]);
  return (
    <svg viewBox={`-1 -1 ${size + 2} ${size + 2}`} className="size-36" shapeRendering="crispEdges" aria-label={t('a11y_qr')}>
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#162447" />
      ))}
    </svg>
  );
}

