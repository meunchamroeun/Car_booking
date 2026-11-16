// Use the installed TypeScript compiler; no test-only runtime dependency.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : name, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
}).outputText, filename);
const svc = require('../src/lib/fleet-service.ts');
const { DateUtil } = require('../src/lib/date-utils.ts');
DateUtil.nowStamp = () => '2026-11-05 08:00';
DateUtil.todayStr = () => '2026-11-05';
const admin = { id: 'admin', name: 'Admin', role: 'Admin' };
const driver = { id: 'driver-user', name: 'Driver', role: 'Driver', driverId: 'd1' };
const booking = { id: 'B1', carId: 'c1', requesterId: 'employee', startDate: '2026-11-01', startTime: '09:00', endDate: '2026-11-05', endTime: '17:00', status: 'Approved', driverId: 'd1', needDriver: true, taskStatus: 'Assigned' };
const car = { id: 'c1', name: 'Car', status: 'Active' };
const data = { users: [admin, driver, { id: 'manager', role: 'Approver' }, { id: 'employee', role: 'Employee' }], cars: [car], drivers: [], bookings: [booking], notifications: [] };
const scheduled = { mode: 'scheduled', reason: 'Service', startDate: '2026-11-05', endDate: '2026-11-05', startTime: '08:00', endTime: '18:00' };

test('day 1–5 booking is affected by day 5 maintenance; preserve booking and notify each recipient with booking link', () => {
  const result = svc.setMaintenance(data, admin, 'c1', scheduled).data;
  assert.deepEqual(result.bookings, data.bookings);
  assert.deepEqual(result.notifications.map(n => n.userId).sort(), ['admin', 'driver-user', 'employee', 'manager']);
  assert.ok(result.notifications.every(n => n.bookingId === 'B1'));
  assert.throws(() => svc.startTask(result, driver, 'B1'), e => e.msg.key === 'conflict_maint');
  assert.equal(svc.checkConflict(result, 'c1', booking.startDate, booking.startTime, booking.endTime, 'B1', booking.endDate).maintenance, true);
});
test('half-open boundaries: service at return time or ending at pickup does not conflict', () => {
  assert.equal(svc.maintenanceOverlaps({ ...scheduled, startTime: '17:00' }, booking), false);
  assert.equal(svc.maintenanceOverlaps({ ...scheduled, startDate: '2026-11-01', endDate: '2026-11-01', startTime: '08:00', endTime: '09:00' }, booking), false);
});
test('multi-day service respects first and last times, including overnight overlap', () => {
  const m = { ...scheduled, startDate: '2026-11-03', endDate: '2026-11-05', startTime: '12:00', endTime: '10:00' };
  const window = (day, startTime, endTime) => ({ startDate: day, endDate: day, startTime, endTime });
  assert.equal(svc.maintenanceOverlaps(m, window('2026-11-03', '08:00', '12:00')), false);
  assert.equal(svc.maintenanceOverlaps(m, window('2026-11-04', '00:00', '23:59')), true);
  assert.equal(svc.maintenanceOverlaps(m, window('2026-11-05', '10:00', '11:00')), false);
});
test('manual maintenance includes ongoing and all future bookings, even beyond estimated return', () => {
  const future = { ...booking, id: 'future', startDate: '2026-12-01', endDate: '2026-12-02' };
  const past = { ...booking, id: 'past', endDate: '2026-11-04' };
  const result = svc.setMaintenance({ ...data, bookings: [booking, future, past] }, admin, 'c1', { mode: 'manual', reason: 'Repair', estimatedDate: '2026-11-06' }).data;
  assert.deepEqual([...new Set(result.notifications.map(n => n.bookingId))], ['B1', 'future']);
  assert.equal(svc.hasMaintenanceConflict(result.cars[0], future), true);
  assert.equal(svc.hasMaintenanceConflict(svc.clearMaintenance(result, admin, 'c1').data.cars[0], future), false);
});
test('only pending and approved bookings on this car are affected', () => {
  const bookings = ['Pending', 'Approved', 'Completed', 'Rejected', 'Cancelled'].map(status => ({ ...booking, id: status, status }));
  bookings.push({ ...booking, id: 'other-car', carId: 'c2' });
  assert.deepEqual(svc.affectedMaintenanceBookings({ bookings }, 'c1', scheduled).map(b => b.id), ['Pending', 'Approved']);
});
test('scheduled windows expire without stale Maintenance status blocking later days', () => {
  const oldCar = { ...car, status: 'Maintenance', maintenance: scheduled };
  assert.equal(svc.isCarInMaintenance(oldCar, '2026-11-05', '10:00', '11:00'), true);
  assert.equal(svc.isCarInMaintenance(oldCar, '2026-11-06'), false);
  const result = svc.setMaintenance(data, admin, 'c1', scheduled).data;
  assert.equal(result.cars[0].status, 'Active');
});
test('reject invalid windows and unauthorized changes without mutating input', () => {
  for (const patch of [{ endTime: '08:00' }, { endTime: '07:00' }, { endDate: '2026-11-04' }, { startTime: '25:00' }, { startDate: '2026-02-30' }]) {
    assert.throws(() => svc.setMaintenance(data, admin, 'c1', { ...scheduled, ...patch }), e => e.msg.key === 'err_maint_dates');
  }
  assert.throws(() => svc.setMaintenance(data, driver, 'c1', scheduled), e => e.msg.key === 'err_maint_role');
  assert.equal(data.cars[0].maintenance, undefined);
});
test('legacy date-only schedule blocks the entire last day', () => {
  const m = { ...scheduled, startTime: undefined, endTime: undefined };
  assert.equal(svc.maintenanceOverlaps(m, { ...booking, startDate: '2026-11-05', startTime: '23:59', endDate: '2026-11-06', endTime: '00:00' }), true);
});
test('ongoing trips can still return or complete while maintenance is active', () => {
  const result = svc.setMaintenance({ ...data, bookings: [{ ...booking, taskStatus: 'In Progress' }] }, admin, 'c1', scheduled).data;
  for (const actor of [admin, driver, { id: 'employee', role: 'Employee' }]) {
    const returned = svc.returnVehicle(result, actor, 'B1', { returnTime: '10:00' }).data;
    assert.equal(returned.bookings[0].status, 'Completed');
    assert.equal(returned.bookings[0].returnedEarly, true);
    assert.equal(svc.isCarInMaintenance(returned.cars[0], '2026-11-05', '11:00', '12:00'), true);
  }
});
test('a pending booking cannot be approved through a maintenance conflict', () => {
  const result = svc.setMaintenance({ ...data, bookings: [{ ...booking, status: 'Pending', needDriver: false, driverId: null }] }, admin, 'c1', scheduled).data;
  assert.throws(() => svc.approveBooking(result, admin, 'B1', null), e => e.msg.key === 'conflict_maint');
});

const { isDepartureBlocked } = require('../src/lib/selectors.ts');
test('departure changes exactly at 08:00 and clears after maintenance resolution', () => {
  const due = { ...booking, startDate: '2026-11-05', startTime: '08:00' };
  const unavailable = { ...car, maintenance: scheduled };
  assert.equal(isDepartureBlocked(due, unavailable, '2026-11-05 07:59'), false);
  assert.equal(isDepartureBlocked(due, unavailable, '2026-11-05 08:00'), true);
  assert.equal(isDepartureBlocked(due, unavailable, '2026-11-05 10:00'), true);
  assert.equal(isDepartureBlocked(due, car, '2026-11-05 08:00'), false);
  assert.equal(isDepartureBlocked(due, unavailable, '2026-11-05 17:00'), false);
  for (const status of ['Pending', 'Completed', 'Cancelled', 'Rejected']) {
    assert.equal(isDepartureBlocked({ ...due, status }, unavailable, '2026-11-05 08:00'), false);
  }
});
test('actual started trips are not relabeled as unable to start', () => {
  const unavailable = { ...car, maintenance: scheduled };
  assert.equal(isDepartureBlocked({ ...booking, taskStatus: 'In Progress' }, unavailable), false);
  assert.equal(isDepartureBlocked({ ...booking, startedAt: '2026-11-01 09:00' }, unavailable), false);
});

const { myTrips } = require('../src/lib/selectors.ts');
const homeEmployee = { id: 'employee', name: 'Employee', role: 'Employee' };
const homeFixture = {
  ...data,
  cars: [{ ...car, seats: 5, maintenance: scheduled }, { ...car, id: 'c2', seats: 5 }],
};
const homeRequest = { carId: 'c2', date: '2026-11-05', endDate: '2026-11-05', startTime: '09:00', endTime: '17:00', purpose: 'New trip', destination: '', passengers: 1, needDriver: false };

test('new overlapping booking atomically cancels old maintenance request and updates Home', () => {
  const result = svc.createBooking(homeFixture, homeEmployee, homeRequest);
  const old = result.data.bookings.find(b => b.id === 'B1');
  assert.deepEqual(old, { ...booking, status: 'Cancelled', taskStatus: null, cancelReason: old.cancelReason, replacedByBookingId: result.bookingId });
  assert.ok(old.cancelReason.includes(result.bookingId));
  assert.equal(old.status, 'Cancelled');
  assert.equal(old.taskStatus, null);
  assert.equal(old.driverId, 'd1');
  assert.ok(result.data.bookings.some(b => b.id === old.id));
  assert.equal(myTrips(result.data, 'employee').hero.id, result.bookingId);
  assert.equal(result.data.notifications.some(n => n.kind === 'cancelled' && n.bookingId === old.id), true);
  assert.ok(result.data.notifications.some(n => n.kind === 'cancelled' && n.userId === 'driver-user'));
  assert.equal(homeFixture.bookings[0].replacedByBookingId, undefined);
});
test('cancelled old booking stays cancelled after reload and new request outcomes', () => {
  const result = svc.createBooking(homeFixture, homeEmployee, homeRequest);
  const persisted = JSON.parse(JSON.stringify(result.data));
  assert.equal(myTrips(persisted, 'employee').hero.id, result.bookingId);
  for (const status of ['Completed', 'Rejected', 'Cancelled']) {
    const changed = { ...persisted, bookings: persisted.bookings.map(b => b.id === result.bookingId ? { ...b, status } : b) };
    assert.equal(myTrips(changed, 'employee').hero, undefined);
    assert.equal(changed.bookings.find(b => b.id === 'B1').status, 'Cancelled');
  }
  assert.equal(myTrips({ ...persisted, bookings: persisted.bookings.filter(b => b.id !== result.bookingId) }, 'employee').hero, undefined);
});
test('neither the old card nor an expired new Pending card appears at their shared end time', () => {
  const result = svc.createBooking(homeFixture, homeEmployee, homeRequest);
  const originalNow = DateUtil.nowStamp;
  try {
    DateUtil.nowStamp = () => '2026-11-05 16:59';
    assert.equal(myTrips(result.data, 'employee').hero.id, result.bookingId);
    DateUtil.nowStamp = () => '2026-11-05 17:00';
    assert.equal(myTrips(result.data, 'employee').hero, undefined);
    DateUtil.nowStamp = () => '2026-11-05 17:01';
    assert.equal(myTrips(result.data, 'employee').hero, undefined);
  } finally { DateUtil.nowStamp = originalNow; }
});
test('unrelated dates, other users, normal bookings and actually started trips are not cancelled', () => {
  const rows = [
    { ...booking, id: 'other-user', requesterId: 'other' },
    { ...booking, id: 'started', startedAt: '2026-11-01 09:00' },
    { ...booking, id: 'driving', taskStatus: 'In Progress' },
    { ...booking, id: 'different-dates', startDate: '2026-11-06', endDate: '2026-11-06' },
    { ...booking, id: 'healthy-car', carId: 'c3' },
    { ...booking, id: 'completed', status: 'Completed' },
  ];
  const result = svc.createBooking({ ...homeFixture, cars: [...homeFixture.cars, { ...car, id: 'c3' }], bookings: rows }, homeEmployee, homeRequest);
  for (const old of rows) assert.deepEqual(result.data.bookings.find(b => b.id === old.id), old);
});
test('touching time boundaries and failed requests do not cancel old bookings', () => {
  const before = JSON.stringify(homeFixture);
  const result = svc.createBooking(homeFixture, homeEmployee, { ...homeRequest, startTime: '17:00', endTime: '18:00' });
  assert.equal(result.data.bookings.find(b => b.id === 'B1').replacedByBookingId, undefined);
  assert.throws(() => svc.createBooking(homeFixture, homeEmployee, { ...homeRequest, purpose: '' }));
  assert.equal(JSON.stringify(homeFixture), before);
});
test('approved new card also expires at exact end and cannot expose its cancelled predecessor', () => {
  const result = svc.createBooking(homeFixture, homeEmployee, homeRequest);
  const approved = { ...result.data, bookings: result.data.bookings.map(b => b.id === result.bookingId ? { ...b, status: 'Approved' } : b) };
  const originalNow = DateUtil.nowStamp;
  try {
    DateUtil.nowStamp = () => '2026-11-05 16:59';
    assert.equal(myTrips(approved, 'employee').hero.id, result.bookingId);
    DateUtil.nowStamp = () => '2026-11-05 17:00';
    assert.equal(myTrips(approved, 'employee').hero, undefined);
  } finally { DateUtil.nowStamp = originalNow; }
});

test('creation can reschedule same maintenance car outside its maintenance interval and cancels its old occupancy', () => {
  const fixture = { ...homeFixture, cars: homeFixture.cars.map(c => c.id === 'c1' ? { ...c, maintenance: { ...scheduled, startTime: '15:00', endTime: '18:00' } } : c) };
  const result = svc.createBooking(fixture, homeEmployee, { ...homeRequest, carId: 'c1', endTime: '12:00' });
  assert.equal(result.data.bookings.find(b => b.id === 'B1').status, 'Cancelled');
  assert.equal(result.data.bookings[0].status, 'Pending');
  const before = JSON.stringify(fixture);
  assert.throws(() => svc.createBooking(fixture, homeEmployee, { ...homeRequest, carId: 'c1' }), e => e.msg.key === 'conflict_maint');
  assert.equal(JSON.stringify(fixture), before);
});
test('all matching own Pending/Approved conflicts are cancelled, and each cancellation is notified once per recipient', () => {
  const fixture = { ...homeFixture, bookings: [booking, { ...booking, id: 'B2', status: 'Pending', approverId: null }] };
  const result = svc.createBooking(fixture, homeEmployee, homeRequest);
  assert.equal(result.data.bookings.filter(b => b.status === 'Cancelled').length, 2);
  for (const id of ['B1', 'B2']) {
    assert.equal(result.data.notifications.filter(n => n.bookingId === id && n.userId === 'employee' && n.kind === 'cancelled').length, 1);
  }
  assert.equal(result.message.key, 'msg_requested_auto_cancel');
});
test('past new requests and conflicts with healthy bookings cannot cancel originals', () => {
  const before = JSON.stringify(homeFixture);
  assert.throws(() => svc.createBooking(homeFixture, homeEmployee, { ...homeRequest, startTime: '06:00', endTime: '07:00' }), e => e.msg.key === 'err_past');
  assert.equal(JSON.stringify(homeFixture), before);
  const healthy = { ...booking, id: 'healthy', carId: 'c2', requesterId: 'someone-else' };
  const fixture = { ...homeFixture, bookings: [booking, healthy] };
  const snapshot = JSON.stringify(fixture);
  assert.throws(() => svc.createBooking(fixture, homeEmployee, homeRequest), e => e.msg.key === 'conflict_booked');
  assert.equal(JSON.stringify(fixture), snapshot);
});
