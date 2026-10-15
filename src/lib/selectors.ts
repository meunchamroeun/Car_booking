import { Booking, FleetData } from '@/types';
import { DateUtil } from '@/lib/date-utils';
import { isCarInMaintenance, occupyingBookings } from '@/lib/fleet-service';

const byTime = (a: Booking, b: Booking) => (a.startDate + a.startTime).localeCompare(b.startDate + b.startTime);

const startStamp = (b: Booking) => DateUtil.stamp(b.startDate, b.startTime);
const endStamp = (b: Booking) => DateUtil.stamp(b.endDate || b.startDate, b.endTime);

export function isLive(b: Booking): boolean {
  if (b.status !== 'Approved') return false;
  if (b.taskStatus === 'In Progress') return true;
  if (b.needDriver) return false;
  const now = DateUtil.nowStamp();
  return startStamp(b) <= now && now < endStamp(b);
}

/** Approved/pending and not yet over. */
export function isUpcoming(b: Booking): boolean {
  if (b.status !== 'Approved' && b.status !== 'Pending') return false;
  if (b.taskStatus === 'In Progress' || (b.status === 'Pending' && (b.endDate || b.startDate) >= DateUtil.todayStr())) return true;
  return endStamp(b) > DateUtil.nowStamp();
}

export function myTrips(data: FleetData, userId: string) {
  const mine = data.bookings.filter(b => b.requesterId === userId);
  const live = mine.find(isLive);
  const upcoming = mine.filter(b => b !== live && isUpcoming(b)).sort(byTime);
  const nextApproved = upcoming.find(b => b.status === 'Approved');
  return { all: mine, live, upcoming, hero: live ?? nextApproved };
}

export function driverTrips(data: FleetData, driverId?: string | null) {
  const mine = data.bookings.filter(b => driverId && b.driverId === driverId && b.status !== 'Cancelled' && b.status !== 'Rejected');
  const active = mine.filter(b => b.status === 'Approved').sort(byTime);
  const done = mine.filter(b => b.status === 'Completed').sort((a, b) => -byTime(a, b));
  const today = DateUtil.todayStr();
  const weekAgo = DateUtil.addDays(today, -6);
  return {
    active,
    done,
    hero: active.find(b => b.taskStatus === 'In Progress') ?? active[0],
    todayCount: mine.filter(b => b.startDate === today).length,
    weekDone: done.filter(b => b.startDate >= weekAgo).length,
  };
}

export function fleetStats(data: FleetData, date = DateUtil.todayStr()) {
  const inService = data.cars.filter(c => isCarInMaintenance(c, date));
  const inUse = data.bookings.filter(isLive);
  const inUseCars = new Set(inUse.map(b => b.carId));
  const available = data.cars.filter(c => !inService.includes(c) && !inUseCars.has(c.id));
  const tripsToday = data.bookings.filter(b => b.startDate === date && (b.status === 'Approved' || b.status === 'Completed'));
  const span = 10 * 60;
  const utilisation = data.cars.map(c => {
    const occ = occupyingBookings(data, c.id, date, true);
    const mins = occ.reduce((s, b) => s + Math.max(0, DateUtil.toMins(b.endTime) - DateUtil.toMins(b.startTime)), 0);
    return { car: c, bookings: occ, pct: Math.min(100, Math.round((mins / span) * 100)), maintenance: inService.includes(c) };
  });
  return {
    available,
    inUse,
    inService,
    pending: data.bookings.filter(b => b.status === 'Pending'),
    tripsToday,
    utilisation,
    avgUtil: Math.round(utilisation.filter(u => !u.maintenance).reduce((s, u) => s + u.pct, 0) / Math.max(1, utilisation.filter(u => !u.maintenance).length)),
  };
}
