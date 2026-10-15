'use client';

import * as React from 'react';
import { BellOff, CheckCheck, CheckCircle2, ChevronRight, ClipboardList, Info, Route, Wrench, XCircle } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { canReview } from '@/lib/permissions';
import { NotificationItem } from '@/types';
import { Sheet } from '@/components/ui/sheet';
import { Segmented } from '@/components/ui/segmented';
import { EmptyState } from '@/components/ui/empty';
import { BookingStatusBadge } from '@/components/common/status';
import { CarPhoto } from '@/components/common/car-photo';
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

/** Newest first; items without a timestamp (old saved data) go last in their original order. */
const stampOf = (n: NotificationItem) => n.at ?? '';

export function NotificationsSheet({ open }: { open: boolean }) {
  const { notifications, bookings, cars, currentUser, t, lang, closeSheet, openSheet, markNotificationsRead, markNotificationRead } = useApp();
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');
  React.useEffect(() => {
    if (open) setFilter('all');
  }, [open]);

  const mine = notifications.filter(n => n.userId === currentUser.id).sort((a, b) => stampOf(b).localeCompare(stampOf(a)));
  const unreadCount = mine.filter(n => !n.read).length;
  const list = filter === 'unread' ? mine.filter(n => !n.read) : mine;

  // Group by day: Today / Yesterday / "Tue 13 Oct"
  const groups: { label: string; items: NotificationItem[] }[] = [];
  for (const n of list) {
    const day = n.at?.split(' ')[0];
    const label = day ? DateUtil.friendly(day, lang) : t('earlier');
    const g = groups.find(x => x.label === label);
    if (g) g.items.push(n);
    else groups.push({ label, items: [n] });
  }

  const openItem = (n: NotificationItem) => {
    if (!n.read) markNotificationRead(n.id);
    const b = n.bookingId && bookings.find(x => x.id === n.bookingId);
    if (b) openSheet({ type: canReview(currentUser, b) ? 'review' : 'booking', id: b.id });
  };

  return (
    <Sheet
      fullScreen
      open={open}
      onOpenChange={o => !o && closeSheet()}
      title={t('notifications')}
      description={unreadCount ? t('notif_unread_n', { n: unreadCount }) : t('all_caught_up')}
      headerAction={
        <button
          type="button"
          onClick={markNotificationsRead}
          disabled={!unreadCount}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold text-primary transition-colors hover:bg-primary-soft disabled:text-muted-foreground disabled:opacity-50"
        >
          <CheckCheck className="size-4" /> {t('mark_read')}
        </button>
      }
    >
      <Segmented
        className="mb-4"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('notif_all'), count: mine.length },
          { value: 'unread', label: t('notif_unread'), count: unreadCount },
        ]}
      />

      {list.length === 0 ? (
        <EmptyState icon={<BellOff />} title={filter === 'unread' ? t('all_caught_up') : t('no_notifs')} className="mt-2" />
      ) : (
        <div className="space-y-4">
          {groups.map(g => (
            <section key={g.label}>
              <h3 className="mb-1.5 px-1 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</h3>
              <ul className="overflow-hidden rounded-2xl border bg-card">
                {g.items.map((n, i) => {
                  const k = KIND[n.kind ?? 'info'];
                  const b = n.bookingId ? bookings.find(x => x.id === n.bookingId) : undefined;
                  const car = b && cars.find(c => c.id === b.carId);
                  const action = b ? (canReview(currentUser, b) ? t('review') : t('notif_view')) : null;
                  return (
                    <li key={n.id} className={cn(i > 0 && 'border-t')}>
                      <button
                        type="button"
                        onClick={() => openItem(n)}
                        className={cn('block w-full px-4 py-3.5 text-left transition-colors hover:bg-muted/50', !n.read && 'bg-primary-soft/40')}
                      >
                        <span className="flex gap-3">
                          <span className={cn('relative flex size-11 shrink-0 items-center justify-center rounded-2xl', k.tone)}>
                            <k.icon className="size-5" />
                            {!n.read && <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-card bg-primary" aria-label="unread" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className={cn('truncate text-[14.5px]', n.read ? 'font-medium' : 'font-bold')}>{n.title}</span>
                              <span className="shrink-0 text-[11.5px] tabular text-muted-foreground">{n.at ? DateUtil.relative(n.at, lang) : n.time}</span>
                            </span>
                            <span className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground">{n.text}</span>
                          </span>
                        </span>

                        {/* Related booking — full width so car name and time aren't cut off */}
                        {b && car && (
                          <span className="mt-2.5 flex items-center gap-3 rounded-xl border bg-background p-2.5">
                            <CarPhoto car={car} className="h-12 w-[72px] shrink-0 rounded-lg" />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-start justify-between gap-2">
                                <span className="min-w-0 text-[13.5px] font-semibold leading-snug text-foreground">{car.name}</span>
                                <BookingStatusBadge b={b} />
                              </span>
                              <span className="mt-0.5 block text-[12px] tabular text-muted-foreground">
                                <span className="font-mono">{b.id}</span> · {DateUtil.window(b, lang)}
                              </span>
                            </span>
                          </span>
                        )}
                        {action && (
                          <span className="mt-2 flex items-center justify-end gap-0.5 text-[12.5px] font-semibold text-primary">
                            {action} <ChevronRight className="size-3.5" />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Sheet>
  );
}
