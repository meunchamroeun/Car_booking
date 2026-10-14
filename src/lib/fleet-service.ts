import { Booking, Car, FleetData, NotificationItem, User } from '@/types';
import { DateUtil } from '@/lib/date-utils';
import { can, canCancel, canCompleteTask, canReturnEarly, canReview, canStartTask } from '@/lib/permissions';

/**
 * Business logic for the fleet booking app, written as pure functions.
 *
 * Each exported command maps 1:1 to a backend endpoint (see docs/API.md).
 * It takes the current dataset + the acting user, validates permissions and
 * business rules, and returns the next dataset. To connect a real backend,
 * replace the body of each store action with a fetch() to the matching
 * endpoint and keep these rules on the server.
 */

export class ServiceError extends Error {}

type Result = { data: FleetData; message: string; bookingId?: string };

const fail = (msg: string): never => {
  throw new ServiceError(msg);
};

let seq = 0;
const nid = () => `n${Date.now()}${seq++}`;

function notify(userIds: string[], n: Omit<NotificationItem, 'id' | 'userId' | 'time' | 'read'>): NotificationItem[] {
  return [...new Set(userIds)].map(userId => ({ ...n, id: nid(), userId, time: 'Just now', read: false }));
}

const reviewers = (data: FleetData, exclude?: string) =>
  data.users.filter(u => (u.role === 'Approver' || u.role === 'Admin') && u.id !== exclude).map(u => u.id);

const admins = (data: FleetData) => data.users.filter(u => u.role === 'Admin').map(u => u.id);

const driverUserId = (data: FleetData, driverId: string | null) =>
  driverId ? data.users.find(u => u.driverId === driverId)?.id : undefined;

const carLabel = (data: FleetData, carId: string) => {
  const c = data.cars.find(x => x.id === carId);
  return c ? c.name : 'vehicle';
};

const patchBooking = (data: FleetData, id: string, patch: Partial<Booking>): Booking[] =>
  data.bookings.map(b => (b.id === id ? { ...b, ...patch } : b));

const findBooking = (data: FleetData, id: string) => data.bookings.find(b => b.id === id) ?? fail('Booking not found.');

/* ── Queries ───────────────────────────────────────────────────────────── */

const endDateOf = (b: Pick<Booking, 'startDate' | 'endDate'>) => b.endDate || b.startDate;
const spanOf = (b: Pick<Booking, 'startDate' | 'startTime' | 'endDate' | 'endTime'>) =>
  [DateUtil.stamp(b.startDate, b.startTime), DateUtil.stamp(endDateOf(b), b.endTime)] as const;
const overlaps = (a: readonly [string, string], b: readonly [string, string]) => a[0] < b[1] && b[0] < a[1];

/**
 * Bookings that occupy the vehicle on `date` (approved, or completed-early which keeps its shortened slot).
 * Multi-day bookings are clipped to that day so they draw correctly on a single-day bar.
 */
export function occupyingBookings(data: FleetData, carId: string, date: string): Booking[] {
  return data.bookings
    .filter(b => b.carId === carId && b.startDate <= date && date <= endDateOf(b))
    .filter(b => b.status === 'Approved' || (b.status === 'Completed' && b.actualEndTime))
    .map(b => ({
      ...b,
      startTime: b.startDate < date ? '00:00' : b.startTime,
      endTime: endDateOf(b) > date ? '23:59' : b.endTime,
    }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function isCarInMaintenance(car: Car | undefined, date: string, start?: string, end?: string): boolean {
  if (!car) return false;
  if (car.status === 'Maintenance') return true;
  const m = car.maintenance;
  if (m?.mode === 'scheduled' && m.startDate) {
    const e = m.endDate || m.startDate;
    if (date < m.startDate || date > e) return false;
    if (start && end && m.startDate === e && m.startTime && m.endTime) {
      return DateUtil.isOverlap(start, end, m.startTime, m.endTime);
    }
    return true;
  }
  return false;
}

/** Human label for a booking window, e.g. "Fri 16 Oct 13:00 → Sat 17 Oct 12:00" or "16 Oct 09:00–13:00". */
function windowLabel(b: Pick<Booking, 'startDate' | 'startTime' | 'endDate' | 'endTime'>) {
  return endDateOf(b) === b.startDate
    ? `${DateUtil.friendly(b.startDate)} ${b.startTime}–${b.endTime}`
    : `${DateUtil.friendly(b.startDate)} ${b.startTime} → ${DateUtil.friendly(endDateOf(b))} ${b.endTime}`;
}

export function checkConflict(
  data: FleetData,
  carId: string,
  date: string,
  start: string,
  end: string,
  excludeId?: string,
  endDate: string = date
): { ok: true } | { ok: false; reason: string; maintenance?: boolean } {
  const car = data.cars.find(c => c.id === carId);
  const days = DateUtil.dateRange(date, endDate);
  const inService = days.some(d =>
    isCarInMaintenance(car, d, d === date ? start : '00:00', d === endDate ? end : '23:59')
  );
  if (inService) {
    return { ok: false, maintenance: true, reason: `In service: ${car?.maintenance?.reason ?? 'maintenance'}` };
  }
  const want = [DateUtil.stamp(date, start), DateUtil.stamp(endDate, end)] as const;
  const clash = data.bookings.find(b => b.id !== excludeId && b.carId === carId && b.status === 'Approved' && overlaps(want, spanOf(b)));
  if (clash) {
    const who = data.users.find(u => u.id === clash.requesterId)?.name ?? 'a colleague';
    return { ok: false, reason: `Already booked ${windowLabel(clash)} by ${who}.` };
  }
  return { ok: true };
}

/** Driver is busy if they have another approved, unfinished booking overlapping this window. */
export function isDriverBusy(data: FleetData, driverId: string, b: Pick<Booking, 'id' | 'startDate' | 'startTime' | 'endDate' | 'endTime'>): Booking | undefined {
  return data.bookings.find(x => x.id !== b.id && x.driverId === driverId && x.status === 'Approved' && overlaps(spanOf(b), spanOf(x)));
}

/* ── Commands ──────────────────────────────────────────────────────────── */

export interface CreateBookingInput {
  carId: string;
  date: string;
  /** Last day of the booking; defaults to `date` (single-day). */
  endDate?: string;
  startTime: string;
  endTime: string;
  purpose: string;
  destination: string;
  passengers: number;
  needDriver: boolean;
}

/** POST /bookings */
export function createBooking(data: FleetData, actor: User, input: CreateBookingInput): Result {
  if (!can(actor, 'booking.create')) fail('Your role cannot request vehicles.');
  const car = data.cars.find(c => c.id === input.carId) ?? fail('Please choose a vehicle.');
  if (!input.purpose.trim()) fail('Please describe the purpose of the booking.');
  const endDate = input.endDate || input.date;
  if (input.date < DateUtil.todayStr()) fail('You cannot book a past date.');
  if (endDate < input.date) fail('End date must be on or after the start date.');
  if (DateUtil.dayDiff(input.date, endDate) > 14) fail('Bookings can be at most 14 days.');
  if (DateUtil.stamp(endDate, input.endTime) <= DateUtil.stamp(input.date, input.startTime)) fail('End time must be after start time.');
  if (input.passengers > car.seats) fail(`${car.name} seats ${car.seats}. Choose a bigger vehicle.`);
  const conflict = checkConflict(data, input.carId, input.date, input.startTime, input.endTime, undefined, endDate);
  if (!conflict.ok) fail(conflict.reason);

  const max = data.bookings.reduce((m, b) => Math.max(m, Number(b.id.replace(/\D/g, '')) || 0), 0);
  const id = `BK-${String(max + 1).padStart(4, '0')}`;

  const booking: Booking = {
    id,
    carId: car.id,
    requesterId: actor.id,
    startDate: input.date,
    endDate,
    startTime: input.startTime,
    endTime: input.endTime,
    originalEndTime: input.endTime,
    purpose: input.purpose.trim(),
    destination: input.destination.trim(),
    passengers: input.passengers,
    needDriver: input.needDriver,
    driverId: null,
    status: 'Pending',
    taskStatus: null,
    approverId: null,
    decisionAt: null,
    createdAt: DateUtil.nowStamp(),
  };

  // Approvers can't approve their own booking, so their requests go to Admins only.
  const to = actor.role === 'Approver' ? admins(data) : reviewers(data, actor.id);
  const notifs = notify(to, {
    kind: 'request',
    bookingId: id,
    title: 'New booking request',
    text: `${actor.name} requested ${car.name} · ${windowLabel({ startDate: input.date, startTime: input.startTime, endDate, endTime: input.endTime })}`,
  });

  return {
    data: { ...data, bookings: [booking, ...data.bookings], notifications: [...notifs, ...data.notifications] },
    message: `Request ${id} sent for approval`,
    bookingId: id,
  };
}

/** POST /bookings/:id/approve  { driverId? } */
export function approveBooking(data: FleetData, actor: User, id: string, driverId: string | null): Result {
  const b = findBooking(data, id);
  if (!canReview(actor, b)) fail('You are not allowed to approve this request.');
  if (b.needDriver) {
    if (!driverId) fail('Assign a driver before approving.');
    const driver = data.drivers.find(x => x.id === driverId) ?? fail('Driver not found.');
    if (driver.status !== 'Active') fail(`${driver.name} is off duty.`);
    const busy = isDriverBusy(data, driverId!, b);
    if (busy) fail(`${driver.name} is already driving ${busy.startTime}–${busy.endTime}.`);
  }
  const conflict = checkConflict(data, b.carId, b.startDate, b.startTime, b.endTime, b.id, endDateOf(b));
  if (!conflict.ok) fail(conflict.reason);

  const driver = b.needDriver ? data.drivers.find(x => x.id === driverId) : undefined;
  const requester = data.users.find(u => u.id === b.requesterId);
  const notifs = [
    ...notify([b.requesterId], {
      kind: 'approved',
      bookingId: id,
      title: 'Booking approved',
      text: `${id} · ${carLabel(data, b.carId)} approved by ${actor.name}.${driver ? ` Driver: ${driver.name}.` : ' Self-drive.'}`,
    }),
    ...notify([driverUserId(data, driver?.id ?? null)].filter(Boolean) as string[], {
      kind: 'assigned',
      bookingId: id,
      title: 'New driving assignment',
      text: `Drive ${requester?.name ?? 'staff'} to ${b.destination || 'field mission'} · ${DateUtil.friendly(b.startDate)} ${b.startTime}–${b.endTime}.`,
    }),
  ];

  return {
    data: {
      ...data,
      bookings: patchBooking(data, id, {
        status: 'Approved',
        driverId: driver?.id ?? null,
        taskStatus: driver ? 'Assigned' : null,
        approverId: actor.id,
        decisionAt: DateUtil.nowStamp(),
      }),
      notifications: [...notifs, ...data.notifications],
    },
    message: driver ? `${id} approved · ${driver.name} assigned` : `${id} approved`,
  };
}

/** POST /bookings/:id/reject  { reason } */
export function rejectBooking(data: FleetData, actor: User, id: string, reason: string): Result {
  const b = findBooking(data, id);
  if (!canReview(actor, b)) fail('You are not allowed to reject this request.');
  if (!reason.trim()) fail('Please give a reason so the requester knows what to change.');
  return {
    data: {
      ...data,
      bookings: patchBooking(data, id, { status: 'Rejected', rejectReason: reason.trim(), approverId: actor.id, decisionAt: DateUtil.nowStamp() }),
      notifications: [
        ...notify([b.requesterId], { kind: 'rejected', bookingId: id, title: 'Booking rejected', text: `${id} was rejected: "${reason.trim()}"` }),
        ...data.notifications,
      ],
    },
    message: `${id} rejected`,
  };
}

/** POST /bookings/:id/cancel  { reason? } */
export function cancelBooking(data: FleetData, actor: User, id: string, reason?: string): Result {
  const b = findBooking(data, id);
  if (!canCancel(actor, b)) fail('This booking can no longer be cancelled.');
  const to = b.status === 'Approved' ? [b.approverId, driverUserId(data, b.driverId)] : reviewers(data, actor.id);
  return {
    data: {
      ...data,
      bookings: patchBooking(data, id, { status: 'Cancelled', taskStatus: null, cancelReason: reason?.trim() || undefined }),
      notifications: [
        ...notify(to.filter(Boolean) as string[], {
          kind: 'cancelled',
          bookingId: id,
          title: 'Booking cancelled',
          text: `${actor.name} cancelled ${id} · ${carLabel(data, b.carId)} ${DateUtil.friendly(b.startDate)} ${b.startTime}–${b.endTime}.`,
        }),
        ...data.notifications,
      ],
    },
    message: `${id} cancelled · slot released`,
  };
}

/** POST /tasks/:id/start */
export function startTask(data: FleetData, actor: User, id: string): Result {
  const b = findBooking(data, id);
  if (!canStartTask(actor, b)) fail('This booking cannot be started yet.');
  return {
    data: {
      ...data,
      bookings: patchBooking(data, id, { taskStatus: 'In Progress', startedAt: DateUtil.nowStamp() }),
      notifications: [
        ...notify([b.requesterId], { kind: 'info', bookingId: id, title: 'Your driver is on the way', text: `${actor.name} started driving for ${id}.` }),
        ...data.notifications,
      ],
    },
    message: `${id} · driving started`,
  };
}

/**
 * POST /tasks/:id/complete    (driver)    { returnTime, odometer, notes }
 * POST /bookings/:id/return   (self-drive) { returnTime, notes }
 * Returning before the planned end shortens the booking and frees the rest of the slot.
 */
export function returnVehicle(
  data: FleetData,
  actor: User,
  id: string,
  input: { returnTime: string; odometer?: string; notes?: string }
): Result {
  const b = findBooking(data, id);
  const isDriver = canCompleteTask(actor, b);
  if (!isDriver && !canReturnEarly(actor, b)) fail('You cannot complete this booking.');
  const returnDay = endDateOf(b) > DateUtil.todayStr() ? DateUtil.todayStr() : endDateOf(b);
  if (DateUtil.stamp(returnDay, input.returnTime) <= DateUtil.stamp(b.startDate, b.startTime)) fail('Return time must be after the booking start.');

  const planned = b.originalEndTime || b.endTime;
  const early = DateUtil.stamp(returnDay, input.returnTime) < DateUtil.stamp(endDateOf(b), planned);
  const car = data.cars.find(c => c.id === b.carId);
  const odo = Number(input.odometer);
  if (input.odometer && car?.odometer && odo < car.odometer) fail(`Odometer can't be lower than ${car.odometer.toLocaleString()} km.`);

  const to = [b.requesterId, b.approverId, ...admins(data)].filter(x => x && x !== actor.id) as string[];
  const notifs = notify(to, {
    kind: 'completed',
    bookingId: id,
    title: early ? 'Vehicle returned early' : 'Booking completed',
    text: early
      ? `${carLabel(data, b.carId)} returned at ${input.returnTime} (planned ${planned}). Free from ${input.returnTime} for others.`
      : `${id} · ${carLabel(data, b.carId)} completed at ${input.returnTime}.`,
  });

  return {
    data: {
      ...data,
      cars: odo && car ? data.cars.map(c => (c.id === car.id ? { ...c, odometer: odo } : c)) : data.cars,
      bookings: patchBooking(data, id, {
        status: 'Completed',
        taskStatus: b.needDriver ? 'Completed' : null,
        originalEndTime: planned,
        actualEndTime: input.returnTime,
        endTime: input.returnTime,
        returnedEarly: early,
        endDate: returnDay,
        completedAt: `${returnDay} ${input.returnTime}`,
        endOdometer: input.odometer || b.endOdometer,
        completionNotes: input.notes?.trim() || b.completionNotes,
      }),
      notifications: [...notifs, ...data.notifications],
    },
    message: early ? `Returned early · ${DateUtil.diffHours(input.returnTime, planned)}h released for colleagues` : `${id} completed`,
  };
}

/** PUT /vehicles/:id/maintenance */
export function setMaintenance(
  data: FleetData,
  actor: User,
  carId: string,
  m: { mode: 'manual' | 'scheduled'; reason: string; workshop?: string; estimatedDate?: string; startDate?: string; startTime?: string; endDate?: string; endTime?: string }
): Result {
  if (!can(actor, 'fleet.manage')) fail('Only fleet admins can change vehicle status.');
  if (!m.reason.trim()) fail('Describe the issue or service.');
  const today = DateUtil.todayStr();
  if (m.mode === 'scheduled' && (!m.startDate || !m.endDate || m.endDate < m.startDate)) fail('Check the service dates.');
  const goesOfflineNow = m.mode === 'manual' || (m.startDate! <= today && today <= m.endDate!);
  const car = data.cars.find(c => c.id === carId) ?? fail('Vehicle not found.');

  // Approved trips that now collide with the service window
  const affected = data.bookings.filter(
    b =>
      b.carId === carId &&
      (b.status === 'Approved' || b.status === 'Pending') &&
      (m.mode === 'manual' ? b.startDate >= today && b.startDate <= (m.estimatedDate || today) : b.startDate >= m.startDate! && b.startDate <= m.endDate!)
  );

  return {
    data: {
      ...data,
      cars: data.cars.map(c =>
        c.id === carId
          ? {
              ...c,
              status: goesOfflineNow ? 'Maintenance' : c.status,
              maintenance: {
                ...m,
                reason: m.reason.trim(),
                workshop: m.workshop || 'OONE Fleet Workshop',
                estimatedDate: m.estimatedDate || null,
                setAt: DateUtil.nowStamp(),
                setBy: actor.name,
                setByRole: actor.role,
              },
            }
          : c
      ),
      notifications: [
        ...notify(
          affected.map(b => b.requesterId),
          { kind: 'maintenance', title: 'Vehicle unavailable', text: `${car.name} will be in service (${m.reason.trim()}). Please re-book another vehicle.` }
        ),
        ...data.notifications,
      ],
    },
    message: goesOfflineNow ? `${car.name} is now in service` : `Service scheduled for ${car.name}`,
  };
}

/** DELETE /vehicles/:id/maintenance */
export function clearMaintenance(data: FleetData, actor: User, carId: string): Result {
  if (!can(actor, 'fleet.manage')) fail('Only fleet admins can change vehicle status.');
  const car = data.cars.find(c => c.id === carId) ?? fail('Vehicle not found.');
  return {
    data: { ...data, cars: data.cars.map(c => (c.id === carId ? { ...c, status: 'Active', maintenance: null } : c)) },
    message: `${car.name} is back in service`,
  };
}

/** PATCH /drivers/:id  { status } */
export function toggleDriverDuty(data: FleetData, actor: User, driverId: string): Result {
  if (!can(actor, 'driver.manage')) fail('Only fleet admins can manage drivers.');
  const d = data.drivers.find(x => x.id === driverId) ?? fail('Driver not found.');
  const next = d.status === 'Active' ? 'OffDuty' : 'Active';
  return {
    data: { ...data, drivers: data.drivers.map(x => (x.id === driverId ? { ...x, status: next } : x)) },
    message: `${d.name} is ${next === 'Active' ? 'on duty' : 'off duty'}`,
  };
}
