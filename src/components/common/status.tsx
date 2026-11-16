'use client';

import { Booking } from '@/types';
import { Badge, BadgeTone } from '@/components/ui/badge';
import { useApp } from '@/lib/store';
import { hasMaintenanceConflict } from '@/lib/fleet-service';
import { isDepartureBlocked, isLive } from '@/lib/selectors';

export function bookingTone(b: Booking): BadgeTone {
  if (b.status === 'Approved') return isLive(b) ? 'info' : 'success';
  if (b.status === 'Pending') return 'warning';
  // Rejected and Cancelled both end the request, so they share the same red
  if (b.status === 'Rejected' || b.status === 'Cancelled') return 'danger';
  // Finished bookings (incl. returned early) read as done: green
  if (b.status === 'Completed') return 'success';
  return 'neutral';
}

export function BookingStatusBadge({ b, showMaintenanceConflict = true }: { b: Booking; showMaintenanceConflict?: boolean }) {
  const { t, cars } = useApp();
  const maintenanceConflict = (b.status === 'Approved' || b.status === 'Pending') &&
    hasMaintenanceConflict(cars.find(c => c.id === b.carId), b);
  const blocked = isDepartureBlocked(b, cars.find(c => c.id === b.carId));
  const attention = b.status === 'Approved' && maintenanceConflict && b.taskStatus !== 'In Progress' && !b.startedAt;
  const label =
    attention ? t(blocked ? 'maint_cannot_start' : 'maint_action_required') :
    // Self-drive bookings within their time and driver trips that have started both read "In use"
    b.status === 'Approved' && isLive(b) && !blocked
      ? t('st_In Progress')
      : b.status === 'Completed' && b.returnedEarly
        ? t('st_early')
        : t(`st_${b.status}`);
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge tone={attention ? 'warning' : bookingTone(b)} dot>{label}</Badge>
      {showMaintenanceConflict && maintenanceConflict && !attention && <Badge tone="warning">{t('maint_conflict_badge')}</Badge>}
    </span>
  );
}
