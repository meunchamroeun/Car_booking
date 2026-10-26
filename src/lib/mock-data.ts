import { FleetData, Booking, MsgVar } from '@/types';
import { translate } from '@/lib/i18n';
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
    {
      id: 'u5',
      name: 'Somnang Chun',
      nameKm: 'ជុន សំណាង',
      email: 'somnang.chun@oone.bz',
      dept: 'Fleet Transportation',
      role: 'Driver',
      driverId: 'd1',
      phone: '012 889 001',
      initials: 'SC',
      avatarUrl: 'https://storage-api.e-power.bz/oone-attachment-bk/2026/09/25/d3b0ee99-88ed-48cb-a15e-e30520feebb8_639acd3e-837c-49de-9721-20f7d14d3c18_oone_1797_529e52dba01643059a0becf80f119010.jpg',
    },
    {
      id: 'u6',
      name: 'Samean Prum',
      nameKm: 'ព្រំ សាមាន',
      email: 'samean.prum@oone.bz',
      dept: 'Fleet Transportation',
      role: 'Driver',
      driverId: 'd2',
      phone: '098 776 554',
      initials: 'SP',
      avatarUrl: 'https://storage-api.e-power.bz/oone-attachment-bk/2026/09/25/cf7bffee-cba5-4090-bbdf-171b03799de5_e3d68990-480f-4f89-b745-e101dbe6f44a_oone_1802_7388f19aaa9f4518bf5cc43ef18df86d.jpg',
    },
    { id: 'u7', name: 'Chanthy Ouk', email: 'chanthy.ouk@oone.bz', dept: 'Fleet Administration', role: 'Admin', phone: '012 333 444', initials: 'CO' },
    {
      id: 'u8',
      name: 'Sinoun Net',
      nameKm: 'ណែត ស៊ីនួន',
      email: 'sinoun.net@oone.bz',
      dept: 'Fleet Transportation',
      role: 'Driver',
      driverId: 'd3',
      phone: '077 334 221',
      initials: 'SN',
      avatarUrl: 'https://storage-api.e-power.bz/oone-attachment-bk/2026/09/25/fdd9a31d-7a91-4fbf-a7b8-88bb346f4dca_f09813c1-42a4-4498-9c69-73001e6d6f37_oone_1796_49b887a4b93a4c078a24513d8f48db7c.jpg',
    },
  ];

  const drivers: FleetData['drivers'] = [
    {
      id: 'd1',
      name: 'Somnang Chun',
      nameKm: 'ជុន សំណាង',
      phone: '012 889 001',
      status: 'Active',
      licenseNo: 'B-10293',
      avatarUrl: 'https://storage-api.e-power.bz/oone-attachment-bk/2026/09/25/d3b0ee99-88ed-48cb-a15e-e30520feebb8_639acd3e-837c-49de-9721-20f7d14d3c18_oone_1797_529e52dba01643059a0becf80f119010.jpg',
    },
    {
      id: 'd2',
      name: 'Samean Prum',
      nameKm: 'ព្រំ សាមាន',
      phone: '098 776 554',
      status: 'Active',
      licenseNo: 'B-22871',
      avatarUrl: 'https://storage-api.e-power.bz/oone-attachment-bk/2026/09/25/cf7bffee-cba5-4090-bbdf-171b03799de5_e3d68990-480f-4f89-b745-e101dbe6f44a_oone_1802_7388f19aaa9f4518bf5cc43ef18df86d.jpg',
    },
    {
      id: 'd3',
      name: 'Sinoun Net',
      nameKm: 'ណែត ស៊ីនួន',
      phone: '077 334 221',
      status: 'Active',
      licenseNo: 'B-30112',
      avatarUrl: 'https://storage-api.e-power.bz/oone-attachment-bk/2026/09/25/fdd9a31d-7a91-4fbf-a7b8-88bb346f4dca_f09813c1-42a4-4498-9c69-73001e6d6f37_oone_1796_49b887a4b93a4c078a24513d8f48db7c.jpg',
    },
  ];

  const cars: FleetData['cars'] = [
    {
      id: 'c1',
      name: 'Hyundai Santa Fe',
      plate: 'PP-2AX 7664',
      type: 'SUV',
      seats: 7,
      status: 'Active',
      color: '#1A1A1A',
      fuel: 'Diesel',
      odometer: 38200,
      imageUrl: 'https://storage-api.e-power.bz/oone-attachment-bk/2026/10/16/eacf2292-cbb4-4f84-827e-8d01e62d33aa_IMG_0877.PNG',
      imageCredit: 'OONE Resource Booking',
    },
    {
      id: 'c2',
      name: 'Hyundai Santa Fe',
      plate: 'PP-2BE 0988',
      type: 'SUV',
      seats: 7,
      status: 'Active',
      color: '#1A1A1A',
      fuel: 'Diesel',
      odometer: 52100,
      imageUrl: 'https://storage-api.e-power.bz/oone-attachment-bk/2026/10/16/a9c0392b-dbcd-4b40-8ec2-2cd40c098e20_0988.jpg',
      imageCredit: 'OONE Resource Booking',
    },
    {
      id: 'c3',
      name: 'JAC Pick-Up T9',
      plate: 'PP-2CI 0732',
      type: 'Pickup',
      seats: 5,
      status: 'Active',
      color: '#4A5568',
      fuel: 'Diesel',
      odometer: 21400,
      imageUrl: 'https://storage-api.e-power.bz/oone-attachment-bk/2026/10/16/563a05f1-89ee-4c76-b075-02750a93ebe6_jac-t9-pickup.jpg',
      imageCredit: 'OONE Resource Booking',
    },
    {
      id: 'c4',
      name: 'EV DongFeng Nano Box',
      plate: 'PP-2CB 0733',
      type: 'Sedan',
      seats: 4,
      status: 'Active',
      color: '#2DD4BF',
      fuel: 'EV',
      odometer: 14850,
      imageUrl: 'https://storage-api.e-power.bz/oone-attachment-bk/2026/10/16/b1f12040-4379-4a46-81a4-ff3253fa9e8d_dongfeng-nano-box.jpg',
      imageCredit: 'OONE Resource Booking',
    },
    {
      id: 'c5',
      name: 'EV-JAC',
      plate: 'PP-2CO 3226',
      type: 'Sedan',
      seats: 5,
      status: 'Active',
      color: '#FFFFFF',
      fuel: 'EV',
      odometer: 18600,
      imageUrl: 'https://storage-api.e-power.bz/oone-attachment-bk/2026/10/16/9a8b6d3b-4aee-49ec-addb-7fe9dfd63515_ev-jac.jpg',
      imageCredit: 'OONE Resource Booking',
    },
  ];

  const minusMinutes = (stamp: string, mins: number) => {
    const [date, time] = stamp.split(' ');
    const [y, mo, da] = date.split('-').map(Number);
    const [h, mi] = time.split(':').map(Number);
    const dt = new Date(y, mo - 1, da, h, mi - mins);
    return `${DateUtil.toDateStr(dt)} ${DateUtil.pad(dt.getHours())}:${DateUtil.pad(dt.getMinutes())}`;
  };

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
    // Requested ~40 min before the decision so the Progress timeline reads in order
    createdAt: b.decisionAt ? minusMinutes(b.decisionAt, 40) : `${d(-1)} 16:00`,
    ...b,
  });

  const bookings: Booking[] = [
    // Extra approved trips so every vehicle shows who has it booked
    base({ id: 'BK-0022', carId: 'c3', requesterId: 'u2', startDate: d(2), startTime: '13:00', endTime: '16:00', purpose: 'Spare parts pickup for tower maintenance', destination: 'Russey Keo Warehouse', passengers: 1, status: 'Approved', approverId: 'u4', decisionAt: `${today} 11:20` }),
    base({ id: 'BK-0021', carId: 'c4', requesterId: 'u4', startDate: d(2), startTime: '13:00', endTime: '17:00', purpose: 'Partner contract signing', destination: 'Diamond Island Office', passengers: 3, status: 'Approved', approverId: 'u7', decisionAt: `${today} 11:05` }),
    base({ id: 'BK-0020', carId: 'c3', requesterId: 'u1', startDate: d(2), startTime: '08:00', endTime: '12:00', purpose: 'Deliver demo units to distributor', destination: 'Kampong Cham Road', passengers: 2, status: 'Approved', approverId: 'u4', decisionAt: `${today} 10:50` }),
    base({ id: 'BK-0019', carId: 'c2', requesterId: 'u3', startDate: d(2), startTime: '10:00', endTime: '15:00', purpose: 'Factory quality audit with client team', destination: 'Phnom Penh SEZ', passengers: 5, needDriver: true, driverId: 'd1', status: 'Approved', taskStatus: 'Assigned', approverId: 'u4', decisionAt: `${today} 10:40` }),
    base({ id: 'BK-0018', carId: 'c1', requesterId: 'u2', startDate: d(2), startTime: '08:00', endTime: '10:00', purpose: 'Customer router installation', destination: 'Toul Tom Poung', passengers: 2, status: 'Approved', approverId: 'u4', decisionAt: `${today} 10:30` }),
    base({ id: 'BK-0017', carId: 'c4', requesterId: 'u3', startDate: liveDate, startTime: '08:00', endTime: '10:00', purpose: 'Staff shuttle to QA training centre', destination: 'Tuol Kork Training Centre', passengers: 3, needDriver: true, driverId: 'd3', status: 'Approved', taskStatus: 'Assigned', approverId: 'u4', decisionAt: `${d(-1)} 16:40` }),
    base({ id: 'BK-0016', carId: 'c1', requesterId: 'u1', startDate: liveDate, startTime: '15:00', endTime: '17:00', purpose: 'Collect signed documents from client', destination: 'Chamkar Mon', passengers: 1, status: 'Approved', approverId: 'u4', decisionAt: `${d(-1)} 16:30` }),
    base({ id: 'BK-0015', carId: 'c2', requesterId: 'u4', startDate: liveDate, startTime: '14:00', endTime: '16:00', purpose: 'Bank meeting for project financing', destination: 'Daun Penh', passengers: 2, status: 'Approved', approverId: 'u7', decisionAt: `${d(-1)} 16:10` }),
    base({ id: 'BK-0014', carId: 'c5', requesterId: 'u2', startDate: liveDate, startTime: '14:00', endTime: '16:00', purpose: 'Signal survey at new site', destination: 'Prek Pnov', passengers: 3, needDriver: true, driverId: 'd3', status: 'Approved', taskStatus: 'Assigned', approverId: 'u4', decisionAt: `${d(-1)} 15:50` }),
    base({ id: 'BK-0013', carId: 'c5', requesterId: 'u3', startDate: liveDate, startTime: '08:00', endTime: '10:00', purpose: 'Incoming material inspection', destination: 'Por Sen Chey', passengers: 1, status: 'Approved', approverId: 'u4', decisionAt: `${d(-1)} 15:40` }),
    base({ id: 'BK-0012', carId: 'c5', requesterId: 'u4', startDate: d(2), startTime: '11:00', endTime: '16:00', purpose: 'Regional sales review with Siem Reap distributor', destination: 'Siem Reap Branch', passengers: 3, needDriver: true, status: 'Pending', createdAt: `${today} 10:05` }),
    base({ id: 'BK-0011', carId: 'c4', requesterId: 'u2', startDate: liveDate, startTime: hh(laterStart), endTime: hh(laterStart + 2), purpose: 'Team transfer to client site for system installation', destination: 'Chbar Ampov Office', passengers: 3, needDriver: true, status: 'Pending', createdAt: `${today} 09:40` }),
    base({ id: 'BK-0010', carId: 'c2', requesterId: 'u1', startDate: d(1), startTime: '08:00', endTime: '12:00', purpose: 'Technical inspection visit with ministry delegation', destination: 'Regional Treatment Plant', passengers: 4, needDriver: true, status: 'Pending', createdAt: `${today} 09:30` }),
    base({ id: 'BK-0009', carId: 'c1', requesterId: 'u3', startDate: d(1), startTime: '13:00', endTime: '17:00', purpose: 'Supplier audit — packaging quality check', destination: 'Kandal Industrial Zone', passengers: 2, needDriver: true, driverId: 'd2', status: 'Approved', taskStatus: 'Assigned', approverId: 'u4', decisionAt: `${today} 08:10` }),
    base({ id: 'BK-0008', carId: 'c2', requesterId: 'u2', startDate: liveDate, startTime: hh(liveStart), endTime: hh(liveStart + 3), purpose: 'Router replacement at customer data room', destination: 'Toul Kork Customer Site', passengers: 2, needDriver: true, driverId: 'd2', status: 'Approved', taskStatus: office ? 'In Progress' : 'Assigned', approverId: 'u4', decisionAt: `${d(-1)} 17:20`, startedAt: office ? `${today} ${hh(liveStart)}` : undefined }),
    base({ id: 'BK-0007', carId: 'c3', requesterId: 'u3', startDate: liveDate, startTime: hh(laterStart), endTime: hh(laterStart + 3), purpose: 'Delivery of telemetry devices to Chroy Changvar depot', destination: 'Chroy Changvar Depot', passengers: 3, needDriver: true, driverId: 'd1', status: 'Approved', taskStatus: 'Assigned', approverId: 'u4', decisionAt: `${today} 08:45` }),
    base({ id: 'BK-0006', carId: 'c1', requesterId: 'u1', startDate: liveDate, startTime: hh(liveStart), endTime: hh(liveStart + 4), purpose: 'Client meeting & product demo in Sen Sok', destination: 'Sen Sok Business Park', passengers: 2, status: 'Approved', approverId: 'u4', decisionAt: `${d(-1)} 15:30` }),
    base({ id: 'BK-0005', carId: 'c3', requesterId: 'u1', startDate: d(-2), startTime: '09:00', endTime: '15:00', purpose: 'Equipment pickup from warehouse', destination: 'Por Sen Chey Warehouse', passengers: 1, status: 'Rejected', approverId: 'u4', decisionAt: `${d(-3)} 11:00`, rejectReason: 'Vehicle reserved for priority delivery — please use the JAC pickup next week.' }),
    base({ id: 'BK-0004', carId: 'c5', requesterId: 'u2', startDate: d(-1), startTime: '10:00', endTime: '15:00', purpose: 'Site survey for new tower installation', destination: 'Takhmao', passengers: 2, status: 'Completed', approverId: 'u4', decisionAt: `${d(-2)} 09:00`, completedAt: `${d(-1)} 15:00`, actualEndTime: '15:00', endOdometer: '18600' }),
    base({ id: 'BK-0003', carId: 'c3', requesterId: 'u1', startDate: d(-3), startTime: '08:00', endTime: '12:00', originalEndTime: '12:00', purpose: 'Customer onboarding visit', destination: 'Russey Keo', passengers: 2, needDriver: true, driverId: 'd1', status: 'Completed', taskStatus: 'Completed', approverId: 'u4', decisionAt: `${d(-4)} 14:00`, completedAt: `${d(-3)} 10:30`, actualEndTime: '10:30', returnedEarly: true, endOdometer: '21400', completionNotes: 'Meeting finished early.' }),
    base({ id: 'BK-0002', carId: 'c2', requesterId: 'u3', startDate: d(-4), startTime: '13:00', endTime: '17:00', purpose: 'Training session at partner office', destination: 'BKK1', passengers: 4, status: 'Cancelled', cancelReason: 'Training moved online.' }),
    base({ id: 'BK-0001', carId: 'c1', requesterId: 'u2', startDate: d(-5), startTime: '08:00', endTime: '17:00', purpose: 'Full-day field maintenance round', destination: 'Kampong Speu', passengers: 2, needDriver: true, driverId: 'd2', status: 'Completed', taskStatus: 'Completed', approverId: 'u4', decisionAt: `${d(-6)} 10:00`, completedAt: `${d(-5)} 17:00`, actualEndTime: '17:00', endOdometer: '38200' }),
  ];

  // Seed notifications use translation keys (English title/text kept as fallback)
  const n = (
    id: string,
    userId: string,
    kind: NonNullable<FleetData['notifications'][number]['kind']>,
    titleKey: string,
    textKey: string,
    vars: Record<string, MsgVar>,
    at: string,
    read: boolean,
    bookingId?: string
  ) => ({ id, userId, kind, titleKey, textKey, vars, title: translate('en', titleKey, vars), text: translate('en', textKey, vars), time: '', at, read, bookingId });
  const w = (b: Booking) => ({ win: { startDate: b.startDate, startTime: b.startTime, endDate: b.endDate, endTime: b.endTime } });
  const bk = (id: string) => bookings.find(b => b.id === id)!;

  const notifications: FleetData['notifications'] = [
    n('n1', 'u4', 'request', 'nt_request_title', 'nt_request_text', { name: 'Srey Neath', car: 'EV DongFeng Nano Box', win: w(bk('BK-0011')) }, `${today} 09:40`, false, 'BK-0011'),
    n('n2', 'u4', 'request', 'nt_request_title', 'nt_request_text', { name: 'Sokha Chan', car: 'Hyundai Santa Fe', win: w(bk('BK-0010')) }, `${today} 09:30`, false, 'BK-0010'),
    n('n3', 'u7', 'request', 'nt_admin_needed_title', 'nt_admin_needed_text', { name: 'Sophea Lim', car: 'EV-JAC' }, `${today} 10:05`, false, 'BK-0012'),
    n('n4', 'u1', 'approved', 'nt_approved_title', 'nt_approved_text_self', { id: 'BK-0006', car: 'Hyundai Santa Fe', by: 'Sophea Lim', driver: '' }, `${d(-1)} 15:30`, false, 'BK-0006'),
    n('n5', 'u1', 'rejected', 'nt_rejected_title', 'nt_rejected_text', { id: 'BK-0005', reason: 'Vehicle reserved for priority delivery' }, `${d(-3)} 11:00`, true, 'BK-0005'),
    n('n6', 'u5', 'assigned', 'nt_assigned_title', 'nt_assigned_text', { name: 'Piseth Roeun', dest: 'Chroy Changvar Depot', win: w(bk('BK-0007')) }, `${today} 08:45`, false, 'BK-0007'),
    n('n7', 'u6', 'assigned', 'nt_assigned_title', 'nt_assigned_text', { name: 'Piseth Roeun', dest: 'Kandal Industrial Zone', win: w(bk('BK-0009')) }, `${today} 08:10`, false, 'BK-0009'),
    n('n8', 'u7', 'maintenance', 'nt_maint_title', 'nt_maint_text', { car: 'Hyundai Santa Fe (PP-2AX 7664)', date: { day: d(1) } }, `${today} 07:00`, true),
  ];

  return { users, cars, drivers, bookings, notifications };
}
