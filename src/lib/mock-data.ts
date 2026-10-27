import { FleetData, Booking, MsgVar } from '@/types';
import { translate } from '@/lib/i18n';
import { DateUtil } from '@/lib/date-utils';

/**
 * Seed data for the demo. Shapes match the API contract in docs/API.md,
 * so the backend can return exactly this JSON from its endpoints.
 *
 * Bookings, people and approvers come from the approved history of the
 * EPower Resource Booking bot (BKG-2026-000094 … 000152, 8–28 Oct 2026).
 * Cars and drivers are the real fleet. Emails, phones and most departments
 * are not in the bot, so they are left blank or taken from the name tag.
 */
export function getDefaultMockData(): FleetData {
  // From the bot: requesters, plus the two approvers (ប៊ុនណារ័ត្ន ឈុំ approves most → Fleet admin)
  const person = (id: string, name: string, dept: string, role: FleetData['users'][number]['role'], initials: string) => ({ id, name, email: '', dept, role, phone: '', initials });
  const users: FleetData['users'] = [
    person('u1', 'Rotanak Vichea', 'EAM', 'Employee', 'RV'),
    person('a1', 'ប៊ុនណារ័ត្ន ឈុំ', 'E-Power', 'Admin', 'ប'),
    person('a2', 'មុន្នី អ៊ឹង', 'E-Power', 'Approver', 'ម'),
    person('u2', 'Houng Hoeun', 'E-Power', 'Employee', 'HH'),
    person('u3', 'houth.sotheavisal', 'E-Power', 'Employee', 'HS'),
    person('u4', 'គន្ធា ជា', 'E-Power', 'Employee', 'គ'),
    person('u7', 'ចាន់តារា សូនី', 'E-Power', 'Employee', 'ច'),
    person('u9', 'orong.svay', 'OONE', 'Employee', 'OS'),
    person('u10', 'Kunwath Pha', 'E-Power', 'Employee', 'KP'),
    person('u11', 'kakada Diep', 'E-Power', 'Employee', 'KD'),
    person('u12', 'Hel Pech', 'E-Power', 'Employee', 'HP'),
    person('u13', 'Channy Tun', 'E-Power', 'Employee', 'CT'),
    person('u14', 'sokkeo.men', 'UnifyCharge', 'Employee', 'SM'),
    person('u15', 'Keo Kannika', 'E-Power', 'Employee', 'KK'),
    person('u16', 'នុញ្ញា ណារ', 'E-Power', 'Employee', 'ន'),
    person('u17', 'So Thi', 'E-Power', 'Employee', 'ST'),
    person('u18', 'Chankea Som', 'E-Power', 'Employee', 'CS'),
    person('u19', 'chakriya.sun', 'eMax', 'Employee', 'CS'),
    person('u20', 'សុជាតិ ប៊ុន', 'E-Power', 'Employee', 'ស'),
    person('u21', 'sereyvath.ke', 'E-Water', 'Employee', 'SK'),
    person('u22', 'Thoeun Bolin', 'E-Power', 'Employee', 'TB'),
    // Company drivers (they also book cars themselves, e.g. to pick up guests)
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

  /**
   * One approved booking from the bot:
   * [ref no., car, requester, start date, start, end, days, purpose, approved by, approved on, driver?, passengers]
   * Requested ~30 min before the approval; same-day approvals are early morning so they come before the start.
   */
  type Row = [number, string, string, string, string, string, number, string, string, string, string | null, number];
  const row = ([no, carId, requesterId, start, startTime, endTime, days, purpose, approverId, approvedOn, driverId, passengers]: Row): Booking => {
    const startDate = `2026-${start}`;
    const decisionDate = `2026-${approvedOn}`;
    const sameDay = decisionDate === startDate;
    return {
      id: `BKG-2026-${String(no).padStart(6, '0')}`,
      carId,
      requesterId,
      startDate,
      endDate: DateUtil.addDays(startDate, days - 1),
      startTime,
      endTime,
      originalEndTime: endTime,
      purpose,
      destination: '',
      passengers,
      needDriver: !!driverId,
      driverId,
      status: 'Approved',
      taskStatus: driverId ? 'Assigned' : null,
      approverId,
      createdAt: `${decisionDate} ${sameDay ? '07:00' : '08:30'}`,
      decisionAt: `${decisionDate} ${sameDay ? '07:30' : '09:00'}`,
    };
  };

  // Newest first, as in the bot. BKG-2026-000147 (driver Somnang Chun for the same trip) is merged into 000146.
  const rows: Row[] = [
    [152, 'c2', 'u1', '10-28', '08:00', '11:00', 1, 'Meeting at eMoney office', 'a1', '10-27', null, 1],
    [151, 'c3', 'u2', '10-27', '08:00', '17:30', 1, 'Join Event CWA', 'a1', '10-26', null, 1],
    [148, 'c1', 'u3', '10-26', '14:30', '17:30', 1, 'បងជួយជូនទៅ ABA SEN SOK, FTB SEN SOK និង ACL SEN SOK។ អរគុណបង', 'a1', '10-26', null, 1],
    [146, 'c2', 'a2', '10-26', '09:00', '13:30', 1, 'EDC ផ្សារតូច', 'a1', '10-26', 'd1', 1],
    [145, 'c3', 'u2', '10-26', '08:00', '17:30', 1, 'Go to CWA event', 'a1', '10-25', null, 1],
    [144, 'c4', 'u4', '10-26', '08:00', '19:30', 2, 'ទៅតាំងពិពណ៌នៅសុខា ចំនួន២ថ្ងៃ', 'a1', '10-25', null, 1],
    [143, 'c2', 'u7', '10-27', '12:00', '18:00', 1, 'Meeting at PPWSA', 'a1', '10-25', null, 1],
    [141, 'c2', 'u8', '10-25', '16:00', '21:00', 1, 'ទៅទទួលភ្ញៀវនៅព្រលាន', 'a1', '10-23', null, 1],
    [140, 'c5', 'u9', '10-23', '09:45', '12:30', 1, 'Video shooting', 'a1', '10-23', null, 1],
    [139, 'c2', 'u10', '10-23', '10:30', '18:00', 1, 'ទៅចូលរួមសិក្ខាសាលា. Destination: Phnom Penh', 'a1', '10-23', null, 2],
    [138, 'c4', 'u11', '10-23', '08:30', '12:00', 1, 'EDC អូរបែកក្អម និង EDC វត្តភ្នំ, Phillip, FTB, MME, សាលាក្រុង', 'a1', '10-22', null, 1],
    [137, 'c1', 'u7', '10-23', '08:00', '19:00', 1, 'Meeting at MME', 'a2', '10-22', null, 1],
    [136, 'c4', 'u12', '10-22', '14:00', '17:00', 1, 'ទៅចតរីវេ Bill24 នៅ Fae Salon (នៅក្រាំងធ្នង)', 'a1', '10-22', null, 2],
    [135, 'c4', 'u13', '10-22', '09:15', '12:00', 1, 'FTB Sensok, Canadia, AC and ABA', 'a1', '10-22', null, 1],
    [133, 'c2', 'u5', '10-22', '08:00', '10:30', 1, 'ទៅយកភ្ញៀវនៅសណ្ឋាគារមក E-Power', 'a1', '10-22', null, 1],
    [132, 'c1', 'u7', '10-22', '08:00', '13:00', 1, 'Meeting at EDC', 'a1', '10-21', null, 1],
    [131, 'c2', 'u5', '10-21', '16:00', '21:00', 1, 'ទៅទទួលភ្ញៀវនៅព្រលាន', 'a1', '10-21', null, 1],
    [130, 'c3', 'u2', '10-23', '08:00', '17:30', 3, 'Site Visit 278L', 'a1', '10-21', null, 1],
    [129, 'c5', 'u14', '10-26', '08:00', '15:00', 1, 'Training UnifyCharge and CSMS System with EDC', 'a1', '10-21', null, 1],
    [127, 'c4', 'u15', '10-21', '09:15', '12:00', 1, 'ABA, AC, Canadia bank, EDC វត្តភ្នំ, EDC អូរបែកក្អម, MME, ក្រសួងសេដ្ឋកិច្ច, TRC and Sacombank HQ', 'a1', '10-21', null, 1],
    [126, 'c4', 'u14', '10-21', '14:00', '17:00', 1, 'ទៅភ្ជាប់ទូសាកអោយភ្ញៀវរបស់ E-Power នៅ IU', 'a1', '10-20', null, 1],
    [123, 'c4', 'u16', '10-20', '14:30', '16:30', 1, 'B ko', 'a1', '10-20', null, 1],
    [121, 'c2', 'u17', '10-20', '09:00', '12:00', 1, 'EDC ក្រាំងធ្នង', 'a1', '10-20', null, 1],
    [120, 'c3', 'a2', '10-20', '08:00', '19:45', 3, 'ទៅខេត្តព្រះវិហារ', 'a2', '10-19', null, 1],
    [119, 'c2', 'u18', '10-19', '15:45', '18:00', 1, 'Meet customer. Destination: 1987 Cafe, near Aeon 2', 'a2', '10-19', null, 1],
    [118, 'c4', 'u4', '10-19', '14:30', '16:45', 1, 'ទៅយកសែកនៅ BVC និងចូល ABA', 'a1', '10-19', null, 1],
    [117, 'c5', 'u14', '10-19', '13:00', '17:00', 1, 'Meeting with CPO', 'a1', '10-19', null, 1],
    [116, 'c3', 'a2', '10-19', '09:00', '18:00', 1, 'យកភ្ញៀវ', 'a2', '10-19', null, 1],
    [115, 'c2', 'u1', '10-19', '13:00', '15:30', 1, 'Meeting with Forte', 'a1', '10-19', null, 1],
    [114, 'c5', 'a1', '10-16', '14:30', '16:15', 1, 'ABA FTB bank', 'a1', '10-16', null, 1],
    [113, 'c1', 'u7', '10-19', '12:30', '19:00', 1, 'Meeting at EDC and MME', 'a2', '10-16', null, 1],
    [112, 'c4', 'u15', '10-16', '14:15', '17:45', 1, 'ពន្ធដារសែនសុខ, ABA & FTB Sensok, សាលាក្រុងភ្នំពេញ, EDC, PPWSA និងធនាគារ Canadia', 'a2', '10-16', null, 3],
    [111, 'c2', 'a1', '10-16', '14:00', '17:30', 1, 'Sale ដានី ទៅជួបភ្ញៀវ', 'a1', '10-16', null, 1],
    [110, 'c5', 'u14', '10-19', '08:00', '13:00', 1, 'Event MOU with Farizon and UnifyCharge', 'a1', '10-16', null, 5],
    [109, 'c4', 'u14', '10-19', '08:00', '13:00', 1, 'Event MOU with Farizon team (UnifyCharge)', 'a1', '10-16', null, 5],
    [108, 'c2', 'u19', '10-16', '10:15', '12:00', 1, 'សុំទៅអគ្គជ្រោយចង្វារ', 'a1', '10-16', null, 1],
    [106, 'c5', 'a2', '10-16', '08:00', '12:30', 1, 'ទៅយកភ្ញៀវនៅព្រលានយន្តហោះ', 'a1', '10-15', null, 1],
    [105, 'c2', 'u7', '10-14', '08:45', '09:15', 1, 'Go to MME. Destination: MME HQ', 'a2', '10-13', null, 1],
    [104, 'c4', 'u20', '10-13', '13:30', '14:30', 1, 'Destination: TRC', 'a2', '10-13', null, 1],
    [103, 'c2', 'u7', '10-13', '12:30', '18:00', 1, 'Go to meeting at MME. Destination: MME HQ', 'a1', '10-13', null, 1],
    [102, 'c1', 'u10', '10-13', '11:30', '14:30', 1, 'Meet guest', 'a2', '10-13', null, 1],
    [101, 'c4', 'u3', '10-13', '14:30', '17:30', 1, 'ABA Sen Sok & Head office, FTB Sen Sok & Baktouk, EDC, Kasikorn Bank និងពន្ធដារសែនសុខ', 'a2', '10-13', null, 1],
    [100, 'c5', 'u14', '10-14', '08:00', '12:00', 1, 'Meeting with EAC', 'a1', '10-13', null, 1],
    [99, 'c3', 'u21', '10-13', '08:00', '17:30', 4, 'Site Visit GS70 / GS8 and GS79', 'a1', '10-12', null, 1],
    [98, 'c4', 'u11', '10-09', '09:00', '11:30', 1, 'EDC អូរបែកក្អម', 'a1', '10-09', null, 1],
    [97, 'c1', 'u7', '10-09', '08:00', '13:00', 1, 'Meeting at MME. Destination: MME HQ', 'a1', '10-08', null, 1],
    [96, 'c4', 'u22', '10-08', '14:30', '17:30', 1, 'សូមទៅធនាគារនៅអ៊ីអន ២', 'a1', '10-08', null, 1],
    [95, 'c2', 'u1', '10-08', '09:30', '14:00', 1, 'To install devices with Dev at customer side', 'a1', '10-08', null, 1],
    [94, 'c4', 'u15', '10-08', '09:15', '12:15', 1, 'ពន្ធដារសែនសុខ, សាលាខណ្ឌ, ABA Sensok, AC Aeon and FTB Sensok', 'a1', '10-08', null, 1],
  ];
  // Bookings already past their end time are marked Completed when the app loads (same as the backend job)
  const bookings: Booking[] = rows.map(row);

  // Notifications: the latest approvals, as the bot sends them
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
  const carName = (id: string) => cars.find(c => c.id === id)!.name;
  const userName = (id: string) => users.find(u => u.id === id)!.name;
  const notifications: FleetData['notifications'] = bookings.slice(0, 8).map((b, i) =>
    n(`n${i + 1}`, b.requesterId, 'approved', 'nt_approved_title', b.driverId ? 'nt_approved_text_driver' : 'nt_approved_text_self', { id: b.id, car: carName(b.carId), by: userName(b.approverId!), driver: b.driverId ? drivers.find(d => d.id === b.driverId)!.name : '' }, b.decisionAt!, i > 2, b.id)
  );
  // Somnang Chun was assigned to drive BKG-2026-000146
  const b146 = bookings.find(b => b.id === 'BKG-2026-000146')!;
  notifications.push(
    n('n9', 'u5', 'assigned', 'nt_assigned_title', 'nt_assigned_text', { name: userName(b146.requesterId), dest: '—', win: { win: { startDate: b146.startDate, startTime: b146.startTime, endDate: b146.endDate, endTime: b146.endTime } } }, b146.decisionAt!, true, b146.id)
  );

  return { users, cars, drivers, bookings, notifications };
}
