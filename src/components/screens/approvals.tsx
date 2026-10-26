'use client';

import * as React from 'react';
import { AlertTriangle, CarFront, Check, ClipboardCheck, Pencil, UserRound, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { canReview } from '@/lib/permissions';
import { DateUtil } from '@/lib/date-utils';
import { PageHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { EmptyState } from '@/components/ui/empty';
import { DateKeyIn } from '@/components/ui/date-key-in';
import { RangeCalendar } from '@/components/ui/range-calendar';
import { TripCard } from '@/components/common/trip-card';
import { DriverCardSelect } from '@/components/common/driver-card-select';
import { Booking } from '@/types';
import { cn } from '@/lib/utils';

export function ApprovalsScreen() {
  const { bookings, currentUser, t, lang } = useApp();
  const [filter, setFilter] = React.useState<'pending' | 'decided'>('pending');
  const [dateMode, setDateMode] = React.useState<'all' | 'today' | 'tomorrow' | 'custom'>('all');
  const [customDate, setCustomDate] = React.useState('');
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  const today = React.useMemo(() => DateUtil.todayStr(), []);
  const tomorrow = React.useMemo(() => DateUtil.addDays(today, 1), [today]);

  const targetDate = dateMode === 'today' ? today : dateMode === 'tomorrow' ? tomorrow : dateMode === 'custom' ? customDate : null;

  const matchesDate = (b: Booking) => {
    if (!targetDate) return true;
    const end = b.endDate || b.startDate;
    return b.startDate <= targetDate && end >= targetDate;
  };

  const pending = bookings
    .filter(b => canReview(currentUser, b))
    .sort((a, b) => (a.startDate + a.startTime).localeCompare(b.startDate + b.startTime));
  const decided = bookings
    // Requests this approver said yes to (still upcoming, in use, or already completed)
    .filter(b => (b.status === 'Approved' || b.status === 'Completed') && b.approverId && b.requesterId !== currentUser.id)
    .filter(b => currentUser.role === 'Admin' || b.approverId === currentUser.id)
    .sort((a, b) => (b.decisionAt ?? '').localeCompare(a.decisionAt ?? ''));

  const pendingCount = pending.filter(matchesDate).length;
  const list = (filter === 'pending' ? pending : decided).filter(matchesDate);

  return (
    <div>
      <PageHeader title={t('approvals_title')} subtitle={t('approvals_sub')} />
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'pending', label: t('f_pending'), count: pendingCount },
          { value: 'decided', label: t('st_Approved') },
        ]}
      />

      {/* Date Filter: All | Today | Tomorrow | Pick Date */}
      <div className="mt-3 grid grid-cols-[auto_1fr_1fr_1.35fr] gap-0.5 rounded-xl bg-muted/60 p-0.5" role="radiogroup" aria-label={t('filter_by_date')}>
        <button
          type="button"
          role="radio"
          aria-checked={dateMode === 'all'}
          onClick={() => {
            setDateMode('all');
            setCalendarOpen(false);
          }}
          className={cn(
            'h-8 rounded-[10px] px-2.5 text-[12px] transition-all',
            dateMode === 'all'
              ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
          )}
        >
          {t('period_all')}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={dateMode === 'today'}
          onClick={() => {
            setDateMode('today');
            setCalendarOpen(false);
          }}
          className={cn(
            'h-8 rounded-[10px] text-[12px] transition-all',
            dateMode === 'today'
              ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
          )}
        >
          {t('today')}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={dateMode === 'tomorrow'}
          onClick={() => {
            setDateMode('tomorrow');
            setCalendarOpen(false);
          }}
          className={cn(
            'h-8 rounded-[10px] text-[12px] transition-all',
            dateMode === 'tomorrow'
              ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
          )}
        >
          {t('tomorrow')}
        </button>
        <DateKeyIn
          value={customDate || today}
          min={today}
          active={dateMode === 'custom'}
          open={calendarOpen}
          onChange={d => {
            setCustomDate(d);
            setDateMode('custom');
            setCalendarOpen(false);
          }}
          onToggle={() => setCalendarOpen(o => !o)}
          onOpen={() => setCalendarOpen(true)}
          label={t('key_in_date')}
          placeholder={t('date_ph')}
          pickLabel={t('select_date')}
        />
      </div>

      {/* Calendar to pick a custom date */}
      {calendarOpen && (
        <div className="mt-2 animate-in fade-in-0 zoom-in-95">
          <RangeCalendar
            mode="single"
            start={customDate || today}
            end={customDate || today}
            min={today}
            lang={lang}
            onChange={s => {
              setCustomDate(s);
              setDateMode('custom');
              setCalendarOpen(false);
            }}
            onDone={() => setCalendarOpen(false)}
            labels={{
              pickStart: t('cal_pick_start'),
              pickSingle: t('cal_pick_single'),
              pickEnd: t('cal_pick_end'),
              booked: t('cal_booked'),
              unavailable: t('unavailable'),
              prev: t('a11y_prev_month'),
              next: t('a11y_next_month'),
            }}
          />
        </div>
      )}

      <div className="mt-4 space-y-3">
        {list.length === 0 && (
          <EmptyState
            icon={<ClipboardCheck />}
            title={t('all_caught_up')}
            desc={dateMode !== 'all' ? t('no_history_desc') : t('all_caught_up_desc')}
          />
        )}
        {list.map(b => (filter === 'decided' ? <TripCard key={b.id} b={b} perspective="reviewer" /> : <PendingCard key={b.id} b={b} />))}
      </div>
    </div>
  );
}

/**
 * A pending request with everything needed to decide on the card itself.
 * Requests that asked for a driver must answer "Assign a company driver?" first:
 * Yes → pick a free driver here, No → approve as self-drive.
 */
function PendingCard({ b }: { b: Booking }) {
  const app = useApp();
  const { t, openSheet, approveBooking, checkConflict } = app;
  const [assign, setAssign] = React.useState<'yes' | 'no' | null>(null);
  const [driverId, setDriverId] = React.useState<string | null>(null);
  const conflict = checkConflict(b.carId, b.startDate, b.startTime, b.endTime, b.id, b.endDate);

  const ready = conflict.ok && (!b.needDriver || assign === 'no' || (assign === 'yes' && !!driverId));
  const approve = () => approveBooking(b.id, assign === 'yes' ? driverId : null, !b.needDriver || assign === 'yes');

  const choice = b.needDriver ? (
    <div onClick={e => e.stopPropagation()} className="mt-1">
      <DriverCardSelect
        b={b}
        driverId={driverId}
        assign={assign}
        onSelectDriver={id => {
          setAssign('yes');
          setDriverId(id);
        }}
        onSelectNoDriver={() => {
          setAssign('no');
          setDriverId(null);
        }}
      />
    </div>
  ) : null;

  return (
    <div className="space-y-0">
      <TripCard
        b={b}
        perspective="reviewer"
        onClick={() => openSheet({ type: 'review', id: b.id })}
        beforeFooter={choice}
        footer={
          <>
            <Button variant="outline" size="sm" className="h-10 w-10 shrink-0 px-0" aria-label={t('edit')} onClick={() => openSheet({ type: 'book', editId: b.id })}>
              <Pencil />
            </Button>
            <Button variant="destructive-soft" size="sm" className="h-10 flex-1" onClick={() => openSheet({ type: 'review', id: b.id, mode: 'reject' })}>
              <X /> {t('reject')}
            </Button>
            <Button size="sm" className="h-10 flex-[1.4]" disabled={!ready} onClick={approve}>
              <Check /> {t('approve')}
            </Button>
          </>
        }
      />
      {!conflict.ok && (
        <p className="mx-2 -mt-1 flex items-center gap-1.5 rounded-b-xl bg-destructive-soft px-3 pb-2 pt-3 text-[12.5px] font-medium text-destructive">
          <AlertTriangle className="size-3.5 shrink-0" /> {t('conflict_warn', { reason: conflict.reason })}
        </p>
      )}
    </div>
  );
}
