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
