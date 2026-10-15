'use client';

import * as React from 'react';
import { AlertTriangle, CarFront, Check, ClipboardCheck, UserRound, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { canReview } from '@/lib/permissions';
import { PageHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { EmptyState } from '@/components/ui/empty';
import { TripCard } from '@/components/common/trip-card';
import { Avatar } from '@/components/ui/avatar';
import { isDriverBusy } from '@/lib/fleet-service';
import { Booking } from '@/types';
import { cn } from '@/lib/utils';

export function ApprovalsScreen() {
  const { bookings, currentUser, t } = useApp();
  const [filter, setFilter] = React.useState<'pending' | 'decided'>('pending');

  const pending = bookings
    .filter(b => canReview(currentUser, b))
    .sort((a, b) => (a.startDate + a.startTime).localeCompare(b.startDate + b.startTime));
  const decided = bookings
    .filter(b => (b.status === 'Approved' || b.status === 'Rejected' || b.status === 'Completed') && b.approverId && b.requesterId !== currentUser.id)
    .filter(b => currentUser.role === 'Admin' || b.approverId === currentUser.id)
    .sort((a, b) => (b.decisionAt ?? '').localeCompare(a.decisionAt ?? ''));
  const list = filter === 'pending' ? pending : decided;

  return (
    <div>
      <PageHeader title={t('approvals_title')} subtitle={t('approvals_sub')} />
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'pending', label: t('f_pending'), count: pending.length },
          { value: 'decided', label: t('f_decided') },
        ]}
      />
      <div className="mt-4 space-y-3">
        {list.length === 0 && <EmptyState icon={<ClipboardCheck />} title={t('all_caught_up')} desc={t('all_caught_up_desc')} />}
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
  const { drivers, t, openSheet, approveBooking, checkConflict } = app;
  const [assign, setAssign] = React.useState<'yes' | 'no' | null>(null);
  const [driverId, setDriverId] = React.useState<string | null>(null);
  const conflict = checkConflict(b.carId, b.startDate, b.startTime, b.endTime, b.id, b.endDate);

  const driverState = (dId: string) => {
    const d = drivers.find(x => x.id === dId)!;
    if (d.status !== 'Active') return { ok: false, label: t('driver_off') };
    const busy = isDriverBusy(app, dId, b);
    return busy ? { ok: false, label: t('driver_busy', { start: busy.startTime, end: busy.endTime }) } : { ok: true, label: t('driver_free') };
  };

  const pickYes = () => {
    setAssign('yes');
    if (!driverId) setDriverId(drivers.find(d => driverState(d.id).ok)?.id ?? null);
  };

  const ready = conflict.ok && (!b.needDriver || assign === 'no' || (assign === 'yes' && !!driverId));
  const approve = () => approveBooking(b.id, assign === 'yes' ? driverId : null, !b.needDriver || assign === 'yes');

  const choice = b.needDriver ? (
    <div onClick={e => e.stopPropagation()}>
      <p className="mb-2 text-[13.5px] font-semibold">
        {t('assign_q')} <span className="text-destructive">*</span>
      </p>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('assign_q')}>
        {(
          [
            { v: 'yes', icon: UserRound, label: t('assign_yes'), onClick: pickYes },
            { v: 'no', icon: CarFront, label: t('assign_no'), onClick: () => setAssign('no') },
          ] as const
        ).map(o => (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={assign === o.v}
            onClick={o.onClick}
            className={cn(
              'flex h-11 items-center justify-center gap-2 rounded-xl border-2 px-2 text-[13px] font-semibold transition-all',
              assign === o.v ? 'border-primary bg-primary-soft text-primary' : 'border-transparent bg-muted/60 text-foreground/80 hover:bg-muted'
            )}
          >
            <o.icon className="size-4 shrink-0" />
            {o.label}
          </button>
        ))}
      </div>

      {assign === 'yes' && (
        <div className="mt-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <p className="mb-1.5 text-[12.5px] font-semibold text-muted-foreground">{t('choose_driver')}</p>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5" role="radiogroup" aria-label={t('choose_driver')}>
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
                    'flex shrink-0 items-center gap-2 rounded-full border-2 py-1 pl-1 pr-3 text-left transition-all disabled:opacity-45',
                    active ? 'border-primary bg-primary-soft' : 'border-transparent bg-muted/60'
                  )}
                >
                  <Avatar initials={d.name.split(' ').map(x => x[0]).join('')} seed={d.id} className="size-7 text-[10.5px]" />
                  <span className="leading-tight">
                    <span className="block text-[12.5px] font-semibold">{d.name}</span>
                    <span className={cn('block text-[10.5px]', st.ok ? 'text-success' : 'text-muted-foreground')}>{st.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {assign === 'no' && <p className="mt-2 text-[12px] text-muted-foreground">{t('assign_no_desc')}</p>}
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
            <Button variant="destructive-soft" size="sm" className="h-10 flex-1" onClick={() => openSheet({ type: 'review', id: b.id })}>
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
