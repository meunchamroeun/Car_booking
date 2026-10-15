import { AppTab, Booking, User, UserRole } from '@/types';
import { DateUtil } from '@/lib/date-utils';

/**
 * Role-based access control.
 * Mirror this table on the backend: every action below should be enforced
 * server-side as a policy check, the frontend only uses it to hide UI.
 */
export type Permission =
  | 'booking.create'
  | 'booking.view_own'
  | 'booking.view_all'
  | 'booking.approve'
  | 'task.view_own'
  | 'task.view_all'
  | 'task.execute'
  | 'fleet.manage'
  | 'vehicle.maintenance'
  | 'driver.manage'
  | 'demo.reset';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Employee: ['booking.create', 'booking.view_own'],
  Driver: ['task.view_own', 'task.execute'],
  Approver: ['booking.create', 'booking.view_own', 'booking.view_all', 'booking.approve', 'task.view_all', 'vehicle.maintenance'],
  Admin: [
    'booking.create',
    'booking.view_own',
    'booking.view_all',
    'booking.approve',
    'task.view_all',
    'fleet.manage',
    'vehicle.maintenance',
    'driver.manage',
    'demo.reset',
  ],
};

export function can(user: User, permission: Permission): boolean {
  return ROLE_PERMISSIONS[user.role].includes(permission);
}

/** Bottom navigation per role — each role sees only the screens it needs. */
export const ROLE_TABS: Record<UserRole, AppTab[]> = {
  Employee: ['home', 'trips', 'profile'],
  Driver: ['home', 'tasks', 'vehicles', 'profile'],
  Approver: ['home', 'approvals', 'trips', 'profile'],
  Admin: ['home', 'approvals', 'vehicles', 'fleet', 'profile'],
};

export const ROLE_DEFAULT_TAB: Record<UserRole, AppTab> = {
  Employee: 'home',
  Driver: 'home',
  Approver: 'home',
  Admin: 'home',
};

/* ── Booking-level rules (same logic should live in the API) ───────────── */

/** Requester can cancel while pending, or approved but not started yet. */
export function canCancel(user: User, b: Booking): boolean {
  if (b.requesterId !== user.id) return false;
  if (b.status === 'Pending') return true;
  return b.status === 'Approved' && b.taskStatus !== 'In Progress';
}

/** Approvers can't approve their own request — an Admin must. */
export function canReview(user: User, b: Booking): boolean {
  if (b.status !== 'Pending' || !can(user, 'booking.approve')) return false;
  if (user.role === 'Approver' && b.requesterId === user.id) return false;
  return true;
}

/**
 * The person who booked (or a fleet admin) can end the booking early on its day —
 * for self-drive and driver bookings alike. On driver bookings the driver is notified;
 * the driver can still close it themselves with "Mark complete".
 */
export function canReturnEarly(user: User, b: Booking): boolean {
  if (b.status !== 'Approved') return false;
  const today = DateUtil.todayStr();
  if (b.startDate > today || (b.endDate || b.startDate) < today) return false;
  return b.requesterId === user.id || can(user, 'fleet.manage');
}

export function canStartTask(user: User, b: Booking): boolean {
  return (
    user.role === 'Driver' &&
    b.driverId === user.driverId &&
    b.status === 'Approved' &&
    b.taskStatus === 'Assigned' &&
    b.startDate <= DateUtil.todayStr()
  );
}

export function canCompleteTask(user: User, b: Booking): boolean {
  return user.role === 'Driver' && b.driverId === user.driverId && b.taskStatus === 'In Progress';
}

export function canShowPass(user: User, b: Booking): boolean {
  return b.status === 'Approved' && (b.requesterId === user.id || b.driverId === user.driverId);
}
