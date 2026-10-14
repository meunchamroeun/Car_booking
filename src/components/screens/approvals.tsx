'use client';

import * as React from 'react';
import { AlertTriangle, Check, ClipboardCheck, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { canReview } from '@/lib/permissions';
import { PageHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { EmptyState } from '@/components/ui/empty';
import { TripCard } from '@/components/common/trip-card';

export function ApprovalsScreen() {
  const { bookings, currentUser, t, openSheet, approveBooking, checkConflict } = useApp();
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
        {list.map(b => {
          if (filter === 'decided') return <TripCard key={b.id} b={b} perspective="reviewer" />;
          const conflict = checkConflict(b.carId, b.startDate, b.startTime, b.endTime, b.id, b.endDate);
          return (
            <div key={b.id} className="space-y-0">
              <TripCard
                b={b}
                perspective="reviewer"
                onClick={() => openSheet({ type: 'review', id: b.id })}
                footer={
                  <>
                    <Button variant="destructive-soft" size="sm" className="h-10 flex-1" onClick={() => openSheet({ type: 'review', id: b.id })}>
                      <X /> {t('reject')}
                    </Button>
                    <Button
                      size="sm"
                      className="h-10 flex-[1.4]"
                      disabled={!conflict.ok}
                      onClick={() => (b.needDriver ? openSheet({ type: 'review', id: b.id }) : approveBooking(b.id, null))}
                    >
                      <Check /> {b.needDriver ? t('choose_driver') : t('approve')}
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
        })}
      </div>
    </div>
  );
}
