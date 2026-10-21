import { Booking, Car, FleetData, Msg, MsgVar, NotificationItem, User } from '@/types';
import { translate } from '@/lib/i18n';
import { DateUtil } from '@/lib/date-utils';
import { can, canCancel, canCompleteTask, canEdit, canReturnEarly, canReview, canStartTask } from '@/lib/permissions';

/**
 * Business logic for the fleet booking app, written as pure functions.
 *
 * Each exported command maps 1:1 to a backend endpoint (see docs/API.md).
 * It takes the current dataset + the acting user, validates permissions and
 * business rules, and returns the next dataset. To connect a real backend,
 * replace the body of each store action with a fetch() to the matching
 * endpoint and keep these rules on the server.
 */

/** Rule violation; `msg` is translatable, `message` is the English text (for logs). */
export class ServiceError extends Error {
  constructor(public msg: Msg) {
    super(translate('en', msg.key, msg.vars));
  }
}

type Result = { data: FleetData; message: Msg; bookingId?: string };

const fail = (key: string, vars?: Record<string, MsgVar>): never => {
  throw new ServiceError({ key, vars });
};
const msg = (key: string, vars?: Record<string, MsgVar>): Msg => ({ key, vars });
const winOf = (b: { startDate: string; startTime: string; endDate?: string; endTime: string }) => ({ win: b });

let seq = 0;
const nid = () => `n${Date.now()}${seq++}`;

/** Notifications store translation keys (+ English fallback text) so each reader sees their language. */
function notify(
  userIds: string[],
  n: Pick<NotificationItem, 'kind' | 'bookingId'> & { titleKey: string; textKey: string; vars?: Record<string, MsgVar> }
): NotificationItem[] {
  const title = translate('en', n.titleKey, n.vars);
  const text = translate('en', n.textKey, n.vars);
  return [...new Set(userIds)].map(userId => ({ ...n, title, text, id: nid(), userId, time: 'Just now', at: DateUtil.nowStamp(), read: false }));
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

const findBooking = (data: FleetData, id: string) => data.bookings.find(b => b.id === id) ?? fail('err_booking_not_found');

/* ── Queries ───────────────────────────────────────────────────────────── */

const endDateOf = (b: Pick<Booking, 'startDate' | 'endDate'>) => b.endDate || b.startDate;
const spanOf = (b: Pick<Booking, 'startDate' | 'startTime' | 'endDate' | 'endTime'>) =>
  [DateUtil.stamp(b.startDate, b.startTime), DateUtil.stamp(endDateOf(b), b.endTime)] as const;
const overlaps = (a: readonly [string, string], b: readonly [string, string]) => a[0] < b[1] && b[0] < a[1];

/**
 * Bookings that hold the vehicle on `date`. Only Approved ones: once a booking is completed
 * (returned early or at its end time) the car is Available again and the booking disappears
 * from the car's bar. `includeCompleted` keeps them for usage statistics.
 * Multi-day bookings are clipped to that day so they draw correctly on a single-day bar.
 */
export function occupyingBookings(data: FleetData, carId: string, date: string, includeCompleted = false): Booking[] {
  return data.bookings
    .filter(b => b.carId === carId && b.startDate <= date && date <= endDateOf(b))
    .filter(b => b.status === 'Approved' || (includeCompleted && b.status === 'Completed' && b.actualEndTime))
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

export function checkConflict(
  data: FleetData,
  carId: string,
  date: string,
  start: string,
  end: string,
  excludeId?: string,
  endDate: string = date
): { ok: true } | { ok: false; reason: string; msg: Msg; maintenance?: boolean } {
  const car = data.cars.find(c => c.id === carId);
  const days = DateUtil.dateRange(date, endDate);
  const inService = days.some(d =>
    isCarInMaintenance(car, d, d === date ? start : '00:00', d === endDate ? end : '23:59')
  );
  if (inService) {
    const m = msg('conflict_maint', { reason: car?.maintenance?.reason ?? '' });
    return { ok: false, maintenance: true, msg: m, reason: translate('en', m.key, m.vars) };
  }
  const want = [DateUtil.stamp(date, start), DateUtil.stamp(endDate, end)] as const;
  const clash = data.bookings.find(b => b.id !== excludeId && b.carId === carId && b.status === 'Approved' && overlaps(want, spanOf(b)));
  if (clash) {
    const who = data.users.find(u => u.id === clash.requesterId)?.name ?? 'a colleague';
    const m = msg('conflict_booked', { win: winOf(clash), name: who });
    return { ok: false, msg: m, reason: translate('en', m.key, m.vars) };
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
  if (!can(actor, 'booking.create')) fail('err_role_cannot_book');
  const car = data.cars.find(c => c.id === input.carId) ?? fail('err_choose_vehicle');
  if (!input.purpose.trim()) fail('err_purpose');
  const endDate = input.endDate || input.date;
  if (input.date < DateUtil.todayStr()) fail('err_past');
  if (endDate < input.date) fail('err_end_date');
  if (DateUtil.dayDiff(input.date, endDate) > 14) fail('max_days');
  if (DateUtil.stamp(endDate, input.endTime) <= DateUtil.stamp(input.date, input.startTime)) fail('err_end_time');
  if (input.passengers > car.seats) fail('err_seats', { car: car.name, n: car.seats });
  const conflict = checkConflict(data, input.carId, input.date, input.startTime, input.endTime, undefined, endDate);
  if (!conflict.ok) throw new ServiceError(conflict.msg);

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
    titleKey: 'nt_request_title',
    textKey: 'nt_request_text',
    vars: { name: actor.name, car: car.name, win: winOf({ startDate: input.date, startTime: input.startTime, endDate, endTime: input.endTime }) },
  });

  return {
    data: { ...data, bookings: [booking, ...data.bookings], notifications: [...notifs, ...data.notifications] },
    message: msg('msg_requested', { id }),
    bookingId: id,
  };
}

export interface UpdateBookingInput {
  carId: string;
  date: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  purpose: string;
  needDriver: boolean;
  /** Approved bookings only: the company driver (kept if left out). */
  driverId?: string | null;
}

/**
 * PATCH /bookings/:id  — change car, dates, times, purpose or driver.
 * Requester: own Pending request. Manager: Pending, or Approved before it starts (see canEdit).
 * The booking keeps its status; the other side is notified.
 */
export function updateBooking(data: FleetData, actor: User, id: string, input: UpdateBookingInput): Result {
  const b = findBooking(data, id);
  if (!canEdit(actor, b)) fail('err_cannot_edit');
  const car = data.cars.find(c => c.id === input.carId) ?? fail('err_choose_vehicle');
  if (!input.purpose.trim()) fail('err_purpose');
  const endDate = input.endDate || input.date;
  if (endDate < input.date) fail('err_end_date');
  if (DateUtil.dayDiff(input.date, endDate) > 14) fail('max_days');
  if (DateUtil.stamp(endDate, input.endTime) <= DateUtil.stamp(input.date, input.startTime)) fail('err_end_time');
  if (DateUtil.stamp(endDate, input.endTime) <= DateUtil.nowStamp()) fail('err_past');
  const conflict = checkConflict(data, car.id, input.date, input.startTime, input.endTime, id, endDate);
  if (!conflict.ok) throw new ServiceError(conflict.msg);

  const win = { startDate: input.date, startTime: input.startTime, endDate, endTime: input.endTime };
  // An approved booking with a company driver needs a free, active driver for the new time
  let driverId: string | null = null;
  if (b.status === 'Approved' && input.needDriver) {
    driverId = input.driverId === undefined ? b.driverId : input.driverId;
    if (!driverId) fail('err_assign_driver');
    const driver = data.drivers.find(x => x.id === driverId) ?? fail('err_driver_not_found');
    if (driver.status !== 'Active') fail('err_driver_off', { name: driver.name });
    const busy = isDriverBusy(data, driver.id, { id, ...win });
    if (busy) fail('err_driver_busy', { name: driver.name, start: busy.startTime, end: busy.endTime });
  }

  const vars = { name: actor.name, id, car: carLabel(data, car.id), win: winOf(win) };
  const byRequester = actor.id === b.requesterId;
  const newDriverUser = driverId && driverId !== b.driverId ? driverUserId(data, driverId) : null;
  const notifs = [
    // Manager changed it → tell the requester; requester changed a pending request → tell the reviewers
    ...notify(byRequester ? (actor.role === 'Approver' ? admins(data) : reviewers(data, actor.id)) : [b.requesterId], {
      kind: byRequester ? 'request' : 'info',
      bookingId: id,
      titleKey: byRequester ? 'nt_req_edited_title' : 'nt_edited_title',
      textKey: byRequester ? 'nt_req_edited_text' : 'nt_edited_text',
      vars,
    }),
    ...notify(newDriverUser ? [newDriverUser] : [], {
      kind: 'assigned',
      bookingId: id,
      titleKey: 'nt_assigned_title',
      textKey: 'nt_assigned_text',
      vars: { name: data.users.find(u => u.id === b.requesterId)?.name ?? '', dest: b.destination || '—', win: winOf(win) },
    }),
  ];

  return {
    data: {
      ...data,
      bookings: patchBooking(data, id, {
        carId: car.id,
        startDate: input.date,
        endDate,
        startTime: input.startTime,
        endTime: input.endTime,
        originalEndTime: input.endTime,
        purpose: input.purpose.trim(),
        needDriver: input.needDriver,
        ...(b.status === 'Approved' ? { driverId, taskStatus: driverId ? ('Assigned' as const) : null } : {}),
      }),
      notifications: [...notifs, ...data.notifications],
    },
    message: msg('msg_updated', { id }),
  };
}

/**
 * POST /bookings/:id/approve  { driverId?, assignDriver? }
 * For a request that asked for a driver, the approver decides: assign one (driverId) or
 * approve without a driver (assignDriver: false) — the booking then becomes self-drive.
 */
export function approveBooking(data: FleetData, actor: User, id: string, driverId: string | null, assignDriver = true): Result {
  const b = findBooking(data, id);
  if (!canReview(actor, b)) fail('err_not_allowed_approve');
  const withDriver = b.needDriver && assignDriver;
  if (withDriver) {
    if (!driverId) fail('err_assign_driver');
    const driver = data.drivers.find(x => x.id === driverId) ?? fail('err_driver_not_found');
    if (driver.status !== 'Active') fail('err_driver_off', { name: driver.name });
    const busy = isDriverBusy(data, driverId!, b);
    if (busy) fail('err_driver_busy', { name: driver.name, start: busy.startTime, end: busy.endTime });
  }
  const conflict = checkConflict(data, b.carId, b.startDate, b.startTime, b.endTime, b.id, endDateOf(b));
  if (!conflict.ok) throw new ServiceError(conflict.msg);

  const driver = withDriver ? data.drivers.find(x => x.id === driverId) : undefined;
  const requester = data.users.find(u => u.id === b.requesterId);
  const noDriverGiven = b.needDriver && !withDriver;
  const notifs = [
    ...notify([b.requesterId], {
      kind: 'approved',
      bookingId: id,
      titleKey: 'nt_approved_title',
      textKey: driver ? 'nt_approved_text_driver' : noDriverGiven ? 'nt_approved_text_nodriver' : 'nt_approved_text_self',
      vars: { id, car: carLabel(data, b.carId), by: actor.name, driver: driver?.name ?? '' },
    }),
    ...notify([driverUserId(data, driver?.id ?? null)].filter(Boolean) as string[], {
      kind: 'assigned',
      bookingId: id,
      titleKey: 'nt_assigned_title',
      textKey: 'nt_assigned_text',
      vars: { name: requester?.name ?? '', dest: b.destination || '—', win: winOf(b) },
    }),
  ];

  return {
    data: {
      ...data,
      bookings: patchBooking(data, id, {
        status: 'Approved',
        // Approved without a driver → it becomes a self-drive booking
        needDriver: !!driver,
        driverId: driver?.id ?? null,
        taskStatus: driver ? 'Assigned' : null,
        approverId: actor.id,
        decisionAt: DateUtil.nowStamp(),
      }),
      notifications: [...notifs, ...data.notifications],
    },
    message: driver ? msg('msg_approved_driver', { id, name: driver.name }) : noDriverGiven ? msg('msg_approved_nodriver', { id }) : msg('msg_approved', { id }),
  };
}

/** POST /bookings/:id/reject  { reason } */
export function rejectBooking(data: FleetData, actor: User, id: string, reason: string): Result {
  const b = findBooking(data, id);
  if (!canReview(actor, b)) fail('err_not_allowed_reject');
  if (!reason.trim()) fail('err_reject_reason');
  return {
    data: {
      ...data,
      bookings: patchBooking(data, id, { status: 'Rejected', rejectReason: reason.trim(), approverId: actor.id, decisionAt: DateUtil.nowStamp() }),
      notifications: [
        ...notify([b.requesterId], { kind: 'rejected', bookingId: id, titleKey: 'nt_rejected_title', textKey: 'nt_rejected_text', vars: { id, reason: reason.trim() } }),
        ...data.notifications,
      ],
    },
    message: msg('msg_rejected', { id }),
  };
}

/** POST /bookings/:id/cancel  { reason? } */
export function cancelBooking(data: FleetData, actor: User, id: string, reason?: string): Result {
  const b = findBooking(data, id);
  if (!canCancel(actor, b)) fail('err_cannot_cancel');
  const to = b.status === 'Approved' ? [b.approverId, driverUserId(data, b.driverId)] : reviewers(data, actor.id);
  return {
    data: {
      ...data,
      bookings: patchBooking(data, id, { status: 'Cancelled', taskStatus: null, cancelReason: reason?.trim() || undefined }),
      notifications: [
        ...notify(to.filter(Boolean) as string[], {
          kind: 'cancelled',
          bookingId: id,
          titleKey: 'nt_cancelled_title',
          textKey: reason?.trim() ? 'nt_cancelled_text_note' : 'nt_cancelled_text',
          vars: { name: actor.name, id, car: carLabel(data, b.carId), win: winOf(b), reason: reason?.trim() ?? '' },
        }),
        ...data.notifications,
      ],
    },
    message: msg('msg_cancelled', { id }),
  };
}

/** POST /tasks/:id/start */
export function startTask(data: FleetData, actor: User, id: string): Result {
  const b = findBooking(data, id);
  if (!canStartTask(actor, b)) fail('err_cannot_start');
  return {
    data: {
      ...data,
      bookings: patchBooking(data, id, { taskStatus: 'In Progress', startedAt: DateUtil.nowStamp() }),
      notifications: [
        ...notify([b.requesterId], { kind: 'info', bookingId: id, titleKey: 'nt_started_title', textKey: 'nt_started_text', vars: { name: actor.name, id } }),
        ...data.notifications,
      ],
    },
    message: msg('msg_started', { id }),
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
  if (!isDriver && !canReturnEarly(actor, b)) fail('err_cannot_complete');
  const returnDay = endDateOf(b) > DateUtil.todayStr() ? DateUtil.todayStr() : endDateOf(b);
  if (DateUtil.stamp(returnDay, input.returnTime) <= DateUtil.stamp(b.startDate, b.startTime)) fail('err_return_time');

  const planned = b.originalEndTime || b.endTime;
  const early = DateUtil.stamp(returnDay, input.returnTime) < DateUtil.stamp(endDateOf(b), planned);
  const car = data.cars.find(c => c.id === b.carId);
  const odo = Number(input.odometer);
  if (input.odometer && car?.odometer && odo < car.odometer) fail('err_odometer', { km: car.odometer.toLocaleString() });

  // Requester, assigned driver, approver and admins — minus whoever did it
  const to = [b.requesterId, driverUserId(data, b.driverId), b.approverId, ...admins(data)].filter(x => x && x !== actor.id) as string[];
  const notifs = notify(to, {
    kind: 'completed',
    bookingId: id,
    titleKey: early ? 'nt_early_title' : 'nt_done_title',
    textKey: early ? 'nt_early_text' : 'nt_done_text',
    vars: { id, car: carLabel(data, b.carId), time: input.returnTime, planned },
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
    message: early ? msg('msg_returned_early', { h: DateUtil.diffHours(input.returnTime, planned) }) : msg('msg_completed', { id }),
  };
}

/** PUT /vehicles/:id/maintenance */
export function setMaintenance(
  data: FleetData,
  actor: User,
  carId: string,
  m: { mode: 'manual' | 'scheduled'; reason: string; estimatedDate?: string; startDate?: string; startTime?: string; endDate?: string; endTime?: string }
): Result {
  if (!can(actor, 'vehicle.maintenance')) fail('err_maint_role');
  if (!m.reason.trim()) fail('err_maint_reason');
  const today = DateUtil.todayStr();
  if (m.mode === 'scheduled' && (!m.startDate || !m.endDate || m.endDate < m.startDate)) fail('err_maint_dates');
  const goesOfflineNow = m.mode === 'manual' || (m.startDate! <= today && today <= m.endDate!);
  const car = data.cars.find(c => c.id === carId) ?? fail('err_vehicle_not_found');

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
          { kind: 'maintenance', titleKey: 'nt_unavail_title', textKey: 'nt_unavail_text', vars: { car: car.name, reason: m.reason.trim() } }
        ),
        ...data.notifications,
      ],
    },
    message: goesOfflineNow ? msg('msg_maint_now', { car: car.name }) : msg('msg_maint_scheduled', { car: car.name }),
  };
}

/** DELETE /vehicles/:id/maintenance */
export function clearMaintenance(data: FleetData, actor: User, carId: string): Result {
  if (!can(actor, 'vehicle.maintenance')) fail('err_maint_role');
  const car = data.cars.find(c => c.id === carId) ?? fail('err_vehicle_not_found');
  return {
    data: { ...data, cars: data.cars.map(c => (c.id === carId ? { ...c, status: 'Active', maintenance: null } : c)) },
    message: msg('msg_available_again', { car: car.name }),
  };
}

/** PATCH /drivers/:id  { status } */
export function toggleDriverDuty(data: FleetData, actor: User, driverId: string): Result {
  if (!can(actor, 'driver.manage')) fail('err_driver_role');
  const d = data.drivers.find(x => x.id === driverId) ?? fail('err_driver_not_found');
  const next = d.status === 'Active' ? 'OffDuty' : 'Active';
  return {
    data: { ...data, drivers: data.drivers.map(x => (x.id === driverId ? { ...x, status: next } : x)) },
    message: msg(next === 'Active' ? 'msg_driver_on' : 'msg_driver_off', { name: d.name }),
  };
}

/**
 * Scheduled job (backend: run every minute, e.g. cron).
 * Approved bookings whose end time has passed are completed automatically, so the car
 * becomes available again even if nobody pressed "Return" / "Mark complete".
 */
export function autoCompleteExpired(data: FleetData, now = DateUtil.nowStamp()): { data: FleetData; ended: Booking[] } {
  const ended = data.bookings.filter(b => b.status === 'Approved' && DateUtil.stamp(endDateOf(b), b.endTime) <= now);
  if (!ended.length) return { data, ended };
  const ids = new Set(ended.map(b => b.id));

  const notifs = ended.flatMap(b => {
    const car = carLabel(data, b.carId);
    return notify([b.requesterId, driverUserId(data, b.driverId)].filter(Boolean) as string[], {
      kind: 'completed',
      bookingId: b.id,
      titleKey: 'nt_ended_title',
      textKey: 'nt_ended_text',
      vars: { id: b.id, car, time: b.endTime },
    });
  });

  return {
    ended,
    data: {
      ...data,
      bookings: data.bookings.map(b =>
        ids.has(b.id)
          ? {
              ...b,
              status: 'Completed' as const,
              taskStatus: b.needDriver ? ('Completed' as const) : null,
              originalEndTime: b.originalEndTime || b.endTime,
              actualEndTime: b.endTime,
              returnedEarly: false,
              completedAt: DateUtil.stamp(endDateOf(b), b.endTime),
              autoCompleted: true,
            }
          : b
      ),
      notifications: [...notifs, ...data.notifications],
    },
  };
}
