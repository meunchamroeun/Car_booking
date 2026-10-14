'use client';

import * as React from 'react';
import { BellOff, CheckCircle2, ClipboardList, Info, Route, Wrench, XCircle } from 'lucide-react';
import { useApp } from '@/lib/store';
import { NotificationItem } from '@/types';
import { Sheet } from '@/components/ui/sheet';
import { EmptyState } from '@/components/ui/empty';
import { cn } from '@/lib/utils';

const KIND: Record<NonNullable<NotificationItem['kind']>, { icon: typeof Info; tone: string }> = {
  request: { icon: ClipboardList, tone: 'bg-warning-soft text-warning' },
  approved: { icon: CheckCircle2, tone: 'bg-success-soft text-success' },
  completed: { icon: CheckCircle2, tone: 'bg-success-soft text-success' },
  rejected: { icon: XCircle, tone: 'bg-destructive-soft text-destructive' },
  cancelled: { icon: XCircle, tone: 'bg-muted text-muted-foreground' },
  assigned: { icon: Route, tone: 'bg-info-soft text-info' },
  maintenance: { icon: Wrench, tone: 'bg-warning-soft text-warning' },
  info: { icon: Info, tone: 'bg-primary-soft text-primary' },
};

export function NotificationsSheet({ open }: { open: boolean }) {
  const { notifications, bookings, currentUser, t, closeSheet, openSheet, markNotificationsRead } = useApp();
  const mine = notifications.filter(n => n.userId === currentUser.id);
  // Snapshot unread ids on open so they stay highlighted while the sheet is visible
  const [unread, setUnread] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!open) return;
    setUnread(new Set(mine.filter(n => !n.read).map(n => n.id)));
    if (mine.some(n => !n.read)) markNotificationsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={o => !o && closeSheet()} title={t('notifications')}>
      {mine.length === 0 ? (
        <EmptyState icon={<BellOff />} title={t('no_notifs')} />
      ) : (
        <ul className="-mx-2 space-y-1">
          {mine.map(n => {
            const k = KIND[n.kind ?? 'info'];
            const target = n.bookingId && bookings.find(b => b.id === n.bookingId);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  disabled={!target}
                  onClick={() => target && openSheet({ type: currentUser.role !== 'Employee' && target.status === 'Pending' && target.requesterId !== currentUser.id ? 'review' : 'booking', id: target.id })}
                  className={cn('flex w-full gap-3 rounded-2xl p-3 text-left transition-colors enabled:hover:bg-muted', unread.has(n.id) && 'bg-primary-soft/50')}
                >
                  <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', k.tone)}>
                    <k.icon className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[14px] font-semibold">{n.title}</span>
                      <span className="shrink-0 text-[11.5px] text-muted-foreground">{n.time}</span>
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">{n.text}</span>
                  </span>
                  {unread.has(n.id) && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
