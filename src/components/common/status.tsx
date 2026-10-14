'use client';

import { Booking } from '@/types';
import { Badge, BadgeTone } from '@/components/ui/badge';
import { useApp } from '@/lib/store';

export function bookingTone(b: Booking): BadgeTone {
  if (b.status === 'Approved') return b.taskStatus === 'In Progress' ? 'info' : 'success';
  if (b.status === 'Pending') return 'warning';
  if (b.status === 'Rejected') return 'danger';
  if (b.status === 'Completed') return 'neutral';
  return 'neutral';
}

export function BookingStatusBadge({ b }: { b: Booking }) {
  const { t } = useApp();
  const label =
    b.status === 'Approved' && b.taskStatus === 'In Progress'
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
