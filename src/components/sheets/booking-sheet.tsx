'use client';

import * as React from 'react';
import { CalendarClock, CarFront, Check, CheckCircle2, ClipboardCheck, Copy, ExternalLink, FileText, Pencil, Phone, RotateCcw, Route, UserRound, X, XCircle } from 'lucide-react';
import { useApp } from '@/lib/store';
import { isLive } from '@/lib/selectors';
import { DateUtil } from '@/lib/date-utils';
import { canCancel, canCompleteTask, canEdit, canReturnEarly, canReview, canStartTask } from '@/lib/permissions';
import { Booking } from '@/types';
import { InfoRow, Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { BookingStatusBadge } from '@/components/common/status';
import { CarPhoto } from '@/components/common/car-photo';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/telegram';

export function BookingSheet({ open, id }: { open: boolean; id?: string }) {
  const app = useApp();
  const { bookings, cars, users, drivers, currentUser, t, lang, closeSheet, openSheet, cancelBooking, startTask } = app;
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [cancelNote, setCancelNote] = React.useState('');
  React.useEffect(() => {
    setConfirmCancel(false);
    setCancelNote('');
  }, [open, id]);

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
  if (canEdit(currentUser, b))
    actions.push(
      <Button key="edit" variant="outline" className={cn(actions.length ? '' : 'flex-1')} onClick={() => openSheet({ type: 'book', editId: b.id })}>
        <Pencil /> {t('edit')}
      </Button>
    );
  if (canCancel(currentUser, b))
    actions.push(
      confirmCancel ? (
        <React.Fragment key="cancel">
          <Button variant="outline" className="flex-1" onClick={() => setConfirmCancel(false)}>
            {t('keep_booking')}
          </Button>
          <Button variant="destructive" className="flex-1" onClick={() => cancelBooking(b.id, cancelNote)}>
            <XCircle /> {t('confirm_cancel')}
          </Button>
        </React.Fragment>
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
            {/* Cancelling: optional note, sent to the manager / driver and kept on the booking */}
            {confirmCancel && (
              <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-bottom-1">
                <p className="text-[12.5px] font-medium text-destructive">{t('cancel_confirm')}</p>
                <Textarea
                  value={cancelNote}
                  onChange={e => setCancelNote(e.target.value)}
                  placeholder={t('cancel_note_ph')}
                  aria-label={t('cancel_note')}
                  maxLength={200}
                  rows={2}
                  autoFocus
                  className="min-h-0 text-[13px]"
                />
              </div>
            )}
            <div className="flex gap-2">{confirmCancel ? actions.filter(a => (a as React.ReactElement).key === 'cancel') : actions}</div>
          </div>
        )
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="font-normal text-muted-foreground">{t('status_label')} :</span>
          <BookingStatusBadge b={b} />
        </div>
        <div className="tabular text-muted-foreground">
          <span>{t('request_date')} : </span>
          <span className="font-medium text-foreground/85">{DateUtil.relative(b.createdAt, lang)}</span>
        </div>
      </div>

      {(
        <div className="flex items-center gap-3 rounded-2xl bg-muted p-3">
          <CarPhoto car={car} zoomable className="h-16 w-24 shrink-0 rounded-xl" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{car.name}</p>
            <span className="inline-block mt-0.5 rounded-[5px] border border-[#163280] bg-background/80 px-1.5 py-[1.5px] font-mono text-[11px] font-semibold text-foreground/85 shadow-2xs leading-none">
              {car.plate}
            </span>
          </div>
        </div>
      )}

      {/* Why it was rejected / cancelled: who and when, then the reason in plain readable text */}
      {(b.rejectReason || b.cancelReason) && (
        <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive-soft/60 p-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <XCircle className="size-3.5" />
            </span>
            <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-destructive">
              {b.rejectReason ? t('rejected_by', { name: approver?.name ?? '' }) : t('cancel_note')}
            </p>
            {b.rejectReason && b.decisionAt && <span className="shrink-0 text-[11px] tabular text-muted-foreground">{DateUtil.relative(b.decisionAt, lang)}</span>}
          </div>
          <p className="mt-2 border-l-2 border-destructive/40 pl-2.5 text-[13px] leading-snug text-foreground/85">{b.rejectReason ?? b.cancelReason}</p>
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
        {!isMine && requester && (
          <InfoRow icon={<UserRound />} label={t('requester')}>
            <span className="flex items-center justify-between gap-2">
              <span>{requester.name}</span>
              {requester.phone && (
                <a href={`tel:${requester.phone.replace(/\s/g, '')}`} className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary" aria-label={t('call')}>
                  <Phone className="size-4" />
                </a>
              )}
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
              <span className="font-medium text-muted-foreground">{t('with_driver')}</span>
            )
          ) : (
            t('driver_needed_no')
          )}
        </InfoRow>
        <InfoRow icon={<FileText />} label={t('purpose')}>
          <span className="font-medium">{b.purpose}</span>
        </InfoRow>
        {(b.completionNotes || b.autoCompleted) && (
          <InfoRow icon={<FileText />} label={t('notes')}>
            <span className="font-medium">{b.completionNotes || t('auto_completed_note')}</span>
          </InfoRow>
        )}
      </div>

      <Progress b={b} approverName={approver?.name} requesterName={requester?.name} />
    </Sheet>
  );
}

/**
 * Booking progress: steps appear one after another, a coloured line grows through
 * the finished steps, finished dots pop in with a check, and the current step pulses.
 */
function Progress({ b, approverName, requesterName }: { b: Booking; approverName?: string; requesterName?: string }) {
  const { t, lang, users, currentUser } = useApp();
  const rawReqName = requesterName ?? users.find(u => u.id === b.requesterId)?.name;
  const isMine = b.requesterId === currentUser?.id;
  const reqName = rawReqName || undefined;
  const rejected = b.status === 'Rejected';
  const cancelled = b.status === 'Cancelled';
  const steps: { label: string; at?: string | null; done: boolean; bad?: boolean }[] = [
    { label: reqName ? t('requested_by', { name: reqName }) : t('ev_requested'), at: b.createdAt, done: true },
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

