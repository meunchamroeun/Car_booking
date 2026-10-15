import { FleetData, Booking } from '@/types';
import { DateUtil } from '@/lib/date-utils';

/**
 * Seed data for the demo. Shapes match the API contract in docs/API.md,
 * so the backend can return exactly this JSON from its endpoints.
 * Dates are relative to "today" so the demo always looks live.
 */
export function getDefaultMockData(): FleetData {
  const today = DateUtil.todayStr();
  const d = (offset: number) => DateUtil.addDays(today, offset);
  const hh = (h: number) => `${DateUtil.pad(h)}:00`;

  // Keep "live" trips around the current hour so the demo always has something
  // on the road. Outside office hours they move to tomorrow.
  const hour = new Date().getHours();
  const office = hour >= 8 && hour < 16;
  const liveDate = office ? today : d(1);
  const liveStart = office ? Math.max(8, hour - 1) : 9;
  const laterStart = office ? Math.min(hour + 2, 15) : 13;

  const users: FleetData['users'] = [
    { id: 'u1', name: 'Sokha Chan', email: 'sokha.chan@oone.bz', dept: 'Sales & Distribution', role: 'Employee', phone: '012 998 112', initials: 'SC' },
    { id: 'u2', name: 'Srey Neath', email: 'srey.neath@oone.bz', dept: 'Technical Services', role: 'Employee', phone: '097 554 321', initials: 'SN' },
    { id: 'u3', name: 'Piseth Roeun', email: 'piseth.roeun@oone.bz', dept: 'Quality Assurance', role: 'Employee', phone: '012 445 778', initials: 'PR' },
    { id: 'u4', name: 'Sophea Lim', email: 'sophea.lim@oone.bz', dept: 'Operations Manager', role: 'Approver', phone: '089 112 334', initials: 'SL' },
    { id: 'u5', name: 'Rithy Kong', email: 'rithy.kong@oone.bz', dept: 'Fleet Transportation', role: 'Driver', driverId: 'd1', phone: '012 889 001', initials: 'RK' },
    { id: 'u6', name: 'Bona Sam', email: 'bona.sam@oone.bz', dept: 'Fleet Transportation', role: 'Driver', driverId: 'd2', phone: '098 776 554', initials: 'BS' },
    { id: 'u7', name: 'Chanthy Ouk', email: 'chanthy.ouk@oone.bz', dept: 'Fleet Administration', role: 'Admin', phone: '012 333 444', initials: 'CO' },
  ];

  const drivers: FleetData['drivers'] = [
    { id: 'd1', name: 'Rithy Kong', phone: '012 889 001', status: 'Active', licenseNo: 'B-10293' },
    { id: 'd2', name: 'Bona Sam', phone: '098 776 554', status: 'Active', licenseNo: 'B-22871' },
    { id: 'd3', name: 'Vireak Chea', phone: '077 334 221', status: 'Active', licenseNo: 'C-30112' },
    { id: 'd4', name: 'Dara Heng', phone: '011 223 344', status: 'OffDuty', licenseNo: 'B-44120' },
  ];

  // Photos: Creative Commons images from Wikimedia Commons (credits shown in Profile → Photo credits).
  // Replace with the company's own vehicle photos in production.
  const photo = (path: string) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/960px-${path.split('/').pop()}`;

  const cars: FleetData['cars'] = [
    { id: 'c1', name: 'Toyota Camry Hybrid', plate: '2AB-1228', type: 'Sedan', seats: 4, status: 'Active', color: '#E9E4EA', fuel: 'Hybrid', odometer: 42180, imageUrl: photo('a/ac/2018_Toyota_Camry_%28ASV70R%29_Ascent_sedan_%282018-08-27%29_01.jpg'), imageCredit: 'EurovisionNim, CC BY-SA 4.0, via Wikimedia Commons' },
    { id: 'c2', name: 'Toyota Fortuner 4x4', plate: '2AC-2441', type: 'SUV', seats: 7, status: 'Active', color: '#162447', fuel: 'Diesel', odometer: 68510, imageUrl: photo('6/66/2015_Toyota_Fortuner_%28New_Zealand%29.jpg'), imageCredit: 'NZ Car Freak, CC BY-SA 4.0, via Wikimedia Commons' },
    { id: 'c3', name: 'Ford Ranger XLT', plate: '3AE-3889', type: 'Pickup', seats: 5, status: 'Active', color: '#5B657E', fuel: 'Diesel', odometer: 91240, imageUrl: photo('3/3d/Ford_Ranger_2.0_EcoBlue_4WD_Wildtrak_X_%28IV%29_%E2%80%93_f_12102024.jpg'), imageCredit: 'M 93, CC BY-SA 3.0 de, via Wikimedia Commons' },
    { id: 'c4', name: 'Toyota Hiace Commuter', plate: '2BA-4102', type: 'Van', seats: 12, status: 'Active', color: '#F4F2F5', fuel: 'Diesel', odometer: 120330, imageUrl: photo('8/80/2020_Toyota_HiAce_%28front%29.jpg'), imageCredit: 'User3204, CC BY 4.0, via Wikimedia Commons' },
    { id: 'c5', name: 'Mazda CX-5 GT', plate: '2AF-5553', type: 'SUV', seats: 5, status: 'Active', color: '#875A7B', fuel: 'Petrol', odometer: 23800, imageUrl: photo('a/a5/2024_Mazda_CX-5_2.5_S_Select_in_Platinum_Quartz_Metallic%2C_front_right.jpg'), imageCredit: 'Mr.choppers, CC BY-SA 3.0, via Wikimedia Commons' },
    { id: 'c6', name: 'Ford Everest Titanium', plate: '2AG-6778', type: 'SUV', seats: 7, status: 'Active', color: '#2B2F3A', fuel: 'Diesel', odometer: 55120, imageUrl: photo('a/ab/Ford_Everest_3.0_V6_Turbo_Diesel_4WD_Platinum_%28III%29_%E2%80%93_f_02012026.jpg'), imageCredit: 'M 93, CC BY-SA 3.0 de, via Wikimedia Commons' },
    { id: 'c7', name: 'Toyota Hilux Revo', plate: '3AB-7331', type: 'Pickup', seats: 5, status: 'Active', color: '#C9CDD6', fuel: 'Diesel', odometer: 77410, imageUrl: photo('1/1b/2016_Toyota_HiLux_Invincible_D-4D_4WD_2.4_Front.jpg'), imageCredit: 'Vauxford, CC BY-SA 4.0, via Wikimedia Commons' },
    {
      id: 'c8',
      name: 'Hyundai Staria VIP',
      plate: '2BC-8990',
      type: 'Van',
      seats: 9,
      status: 'Maintenance',
      color: '#B26EA0',
      fuel: 'Diesel',
      odometer: 30060,
      imageUrl: photo('7/75/Hyundai_Staria_1X7A0321.jpg'),
      imageCredit: 'Alexander Migl, CC BY-SA 4.0, via Wikimedia Commons',
      maintenance: {
        mode: 'manual',
        reason: 'Suspension check & 30,000 km brake inspection',
        estimatedDate: d(1),
        workshop: 'OONE Fleet Workshop',
        setAt: `${today} 07:00`,
        setBy: 'Chanthy Ouk',
        setByRole: 'Admin',
      },
    },
  ];

  const base = (b: Partial<Booking> & Pick<Booking, 'id' | 'carId' | 'requesterId' | 'startDate' | 'startTime' | 'endTime' | 'purpose' | 'status'>): Booking => ({
    endDate: b.startDate,
    originalEndTime: b.endTime,
    needDriver: false,
    driverId: null,
    destination: '',
    passengers: 1,
    taskStatus: null,
    approverId: null,
    decisionAt: null,
    createdAt: `${d(-1)} 16:00`,
    ...b,
  });

  const bookings: Booking[] = [
    // Extra approved trips so every vehicle shows who has it booked
    base({ id: 'BK-0022', carId: 'c7', requesterId: 'u2', startDate: d(2), startTime: '09:00', endTime: '11:00', purpose: 'Spare parts pickup for tower maintenance', destination: 'Russey Keo Warehouse', passengers: 1, status: 'Approved', approverId: 'u4', decisionAt: `${today} 11:20` }),
    base({ id: 'BK-0021', carId: 'c6', requesterId: 'u4', startDate: d(2), startTime: '13:00', endTime: '17:00', purpose: 'Partner contract signing', destination: 'Diamond Island Office', passengers: 3, status: 'Approved', approverId: 'u7', decisionAt: `${today} 11:05` }),
    base({ id: 'BK-0020', carId: 'c3', requesterId: 'u1', startDate: d(2), startTime: '08:00', endTime: '12:00', purpose: 'Deliver demo units to distributor', destination: 'Kampong Cham Road', passengers: 2, status: 'Approved', approverId: 'u4', decisionAt: `${today} 10:50` }),
    base({ id: 'BK-0019', carId: 'c2', requesterId: 'u3', startDate: d(2), startTime: '10:00', endTime: '15:00', purpose: 'Factory quality audit with client team', destination: 'Phnom Penh SEZ', passengers: 5, needDriver: true, driverId: 'd1', status: 'Approved', taskStatus: 'Assigned', approverId: 'u4', decisionAt: `${today} 10:40` }),
    base({ id: 'BK-0018', carId: 'c1', requesterId: 'u2', startDate: d(2), startTime: '08:00', endTime: '10:00', purpose: 'Customer router installation', destination: 'Toul Tom Poung', passengers: 2, status: 'Approved', approverId: 'u4', decisionAt: `${today} 10:30` }),
    base({ id: 'BK-0017', carId: 'c4', requesterId: 'u3', startDate: liveDate, startTime: '08:00', endTime: '10:00', purpose: 'Staff shuttle to QA training centre', destination: 'Tuol Kork Training Centre', passengers: 9, needDriver: true, driverId: 'd3', status: 'Approved', taskStatus: 'Assigned', approverId: 'u4', decisionAt: `${d(-1)} 16:40` }),
    base({ id: 'BK-0016', carId: 'c7', requesterId: 'u1', startDate: liveDate, startTime: '15:00', endTime: '17:00', purpose: 'Collect signed documents from client', destination: 'Chamkar Mon', passengers: 1, status: 'Approved', approverId: 'u4', decisionAt: `${d(-1)} 16:30` }),
    base({ id: 'BK-0015', carId: 'c7', requesterId: 'u4', startDate: liveDate, startTime: '10:00', endTime: '12:00', purpose: 'Bank meeting for project financing', destination: 'Daun Penh', passengers: 2, status: 'Approved', approverId: 'u7', decisionAt: `${d(-1)} 16:10` }),
    base({ id: 'BK-0014', carId: 'c5', requesterId: 'u2', startDate: liveDate, startTime: '14:00', endTime: '16:00', purpose: 'Signal survey at new site', destination: 'Prek Pnov', passengers: 3, needDriver: true, driverId: 'd3', status: 'Approved', taskStatus: 'Assigned', approverId: 'u4', decisionAt: `${d(-1)} 15:50` }),
    base({ id: 'BK-0013', carId: 'c5', requesterId: 'u3', startDate: liveDate, startTime: '08:00', endTime: '10:00', purpose: 'Incoming material inspection', destination: 'Por Sen Chey', passengers: 1, status: 'Approved', approverId: 'u4', decisionAt: `${d(-1)} 15:40` }),
    base({ id: 'BK-0012', carId: 'c5', requesterId: 'u4', startDate: d(2), startTime: '08:00', endTime: '17:00', purpose: 'Regional sales review with Siem Reap distributor', destination: 'Siem Reap Branch', passengers: 3, needDriver: true, status: 'Pending', createdAt: `${today} 10:05` }),
    base({ id: 'BK-0011', carId: 'c4', requesterId: 'u2', startDate: liveDate, startTime: hh(laterStart), endTime: hh(laterStart + 2), purpose: 'Team transfer to client site for system installation', destination: 'Chbar Ampov Office', passengers: 8, needDriver: true, status: 'Pending', createdAt: `${today} 09:40` }),
    base({ id: 'BK-0010', carId: 'c6', requesterId: 'u1', startDate: d(1), startTime: '08:00', endTime: '12:00', purpose: 'Technical inspection visit with ministry delegation', destination: 'Regional Treatment Plant', passengers: 4, needDriver: true, status: 'Pending', createdAt: `${today} 09:30` }),
    base({ id: 'BK-0009', carId: 'c6', requesterId: 'u3', startDate: d(1), startTime: '13:00', endTime: '17:00', purpose: 'Supplier audit — packaging quality check', destination: 'Kandal Industrial Zone', passengers: 2, needDriver: true, driverId: 'd2', status: 'Approved', taskStatus: 'Assigned', approverId: 'u4', decisionAt: `${today} 08:10` }),
    base({ id: 'BK-0008', carId: 'c2', requesterId: 'u2', startDate: liveDate, startTime: hh(liveStart), endTime: hh(liveStart + 3), purpose: 'Router replacement at customer data room', destination: 'Toul Kork Customer Site', passengers: 2, needDriver: true, driverId: 'd2', status: 'Approved', taskStatus: office ? 'In Progress' : 'Assigned', approverId: 'u4', decisionAt: `${d(-1)} 17:20`, startedAt: office ? `${today} ${hh(liveStart)}` : undefined }),
    base({ id: 'BK-0007', carId: 'c3', requesterId: 'u3', startDate: liveDate, startTime: hh(laterStart), endTime: hh(laterStart + 3), purpose: 'Delivery of telemetry devices to Chroy Changvar depot', destination: 'Chroy Changvar Depot', passengers: 3, needDriver: true, driverId: 'd1', status: 'Approved', taskStatus: 'Assigned', approverId: 'u4', decisionAt: `${today} 08:45` }),
    base({ id: 'BK-0006', carId: 'c1', requesterId: 'u1', startDate: liveDate, startTime: hh(liveStart), endTime: hh(liveStart + 4), purpose: 'Client meeting & product demo in Sen Sok', destination: 'Sen Sok Business Park', passengers: 2, status: 'Approved', approverId: 'u4', decisionAt: `${d(-1)} 15:30` }),
    base({ id: 'BK-0005', carId: 'c7', requesterId: 'u1', startDate: d(-2), startTime: '09:00', endTime: '15:00', purpose: 'Equipment pickup from warehouse', destination: 'Por Sen Chey Warehouse', passengers: 1, status: 'Rejected', approverId: 'u4', decisionAt: `${d(-3)} 11:00`, rejectReason: 'Vehicle reserved for priority delivery — please use the Hilux next week.' }),
    base({ id: 'BK-0004', carId: 'c5', requesterId: 'u2', startDate: d(-1), startTime: '10:00', endTime: '15:00', purpose: 'Site survey for new tower installation', destination: 'Takhmao', passengers: 2, status: 'Completed', approverId: 'u4', decisionAt: `${d(-2)} 09:00`, completedAt: `${d(-1)} 15:00`, actualEndTime: '15:00', endOdometer: '23800' }),
    base({ id: 'BK-0003', carId: 'c3', requesterId: 'u1', startDate: d(-3), startTime: '08:00', endTime: '12:00', originalEndTime: '12:00', purpose: 'Customer onboarding visit', destination: 'Russey Keo', passengers: 2, needDriver: true, driverId: 'd1', status: 'Completed', taskStatus: 'Completed', approverId: 'u4', decisionAt: `${d(-4)} 14:00`, completedAt: `${d(-3)} 10:30`, actualEndTime: '10:30', returnedEarly: true, endOdometer: '91240', completionNotes: 'Meeting finished early.' }),
    base({ id: 'BK-0002', carId: 'c6', requesterId: 'u3', startDate: d(-4), startTime: '13:00', endTime: '17:00', purpose: 'Training session at partner office', destination: 'BKK1', passengers: 4, status: 'Cancelled', cancelReason: 'Training moved online.' }),
    base({ id: 'BK-0001', carId: 'c1', requesterId: 'u2', startDate: d(-5), startTime: '08:00', endTime: '17:00', purpose: 'Full-day field maintenance round', destination: 'Kampong Speu', passengers: 2, needDriver: true, driverId: 'd2', status: 'Completed', taskStatus: 'Completed', approverId: 'u4', decisionAt: `${d(-6)} 10:00`, completedAt: `${d(-5)} 17:00`, actualEndTime: '17:00', endOdometer: '42180' }),
  ];

  const notifications: FleetData['notifications'] = [
    { id: 'n1', userId: 'u4', kind: 'request', title: 'New booking request', text: `Srey Neath requested Toyota Hiace · ${DateUtil.friendly(liveDate)} ${hh(laterStart)}–${hh(laterStart + 2)}`, time: 'Today 09:40', at: `${today} 09:40`, read: false, bookingId: 'BK-0011' },
    { id: 'n2', userId: 'u4', kind: 'request', title: 'New booking request', text: 'Sokha Chan requested Ford Everest for tomorrow 08:00–12:00', time: 'Today 09:30', at: `${today} 09:30`, read: false, bookingId: 'BK-0010' },
    { id: 'n3', userId: 'u7', kind: 'request', title: 'Approval needed', text: 'Sophea Lim requested Mazda CX-5 — managers need an Admin to approve their own bookings.', time: 'Today 10:05', at: `${today} 10:05`, read: false, bookingId: 'BK-0012' },
    { id: 'n4', userId: 'u1', kind: 'approved', title: 'Booking approved', text: 'BK-0006 Toyota Camry Hybrid was approved by Sophea Lim.', time: 'Yesterday 15:30', at: `${d(-1)} 15:30`, read: false, bookingId: 'BK-0006' },
    { id: 'n5', userId: 'u1', kind: 'rejected', title: 'Booking rejected', text: 'BK-0005 was rejected: vehicle reserved for priority delivery.', time: '3 days ago', at: `${d(-3)} 11:00`, read: true, bookingId: 'BK-0005' },
    { id: 'n6', userId: 'u5', kind: 'assigned', title: 'New driving assignment', text: `Drive Piseth Roeun to Chroy Changvar Depot · ${DateUtil.friendly(liveDate)} ${hh(laterStart)}–${hh(laterStart + 3)}.`, time: 'Today 08:45', at: `${today} 08:45`, read: false, bookingId: 'BK-0007' },
    { id: 'n7', userId: 'u6', kind: 'assigned', title: 'New driving assignment', text: 'Drive Piseth Roeun to Kandal Industrial Zone tomorrow 13:00–17:00.', time: 'Today 08:10', at: `${today} 08:10`, read: false, bookingId: 'BK-0009' },
    { id: 'n8', userId: 'u7', kind: 'maintenance', title: 'Vehicle in service', text: 'Hyundai Staria VIP is in the workshop until tomorrow.', time: 'Today 07:00', at: `${today} 07:00`, read: true },
  ];

  return { users, cars, drivers, bookings, notifications };
}
