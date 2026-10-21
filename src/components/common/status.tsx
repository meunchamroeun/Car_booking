'use client';

import { Booking } from '@/types';
import { Badge, BadgeTone } from '@/components/ui/badge';
import { useApp } from '@/lib/store';
import { isLive } from '@/lib/selectors';

export function bookingTone(b: Booking): BadgeTone {
  if (b.status === 'Approved') return isLive(b) ? 'info' : 'success';
  if (b.status === 'Pending') return 'warning';
  // Rejected and Cancelled both end the request, so they share the same red
  if (b.status === 'Rejected' || b.status === 'Cancelled') return 'danger';
  // Finished bookings (incl. returned early) read as done: green
  if (b.status === 'Completed') return 'success';
  return 'neutral';
}

export function BookingStatusBadge({ b }: { b: Booking }) {
  const { t } = useApp();
  const label =
    // Self-drive bookings within their time and driver trips that have started both read "In use"
    b.status === 'Approved' && isLive(b)
      ? t('st_In Progress')
      : b.status === 'Completed' && b.returnedEarly
        ? t('st_early')
        : t(`st_${b.status}`);
  return (
    <Badge tone={bookingTone(b)} dot>
      {label}
    </Badge>
  );
}
