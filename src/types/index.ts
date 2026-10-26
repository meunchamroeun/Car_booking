export type UserRole = 'Employee' | 'Approver' | 'Driver' | 'Admin';

export type CarType = 'Sedan' | 'SUV' | 'Van' | 'Pickup';

export type CarStatus = 'Active' | 'Maintenance';

export type BookingStatus = 'Pending' | 'Approved' | 'Completed' | 'Rejected' | 'Cancelled';

export type DriverTaskStatus = 'Assigned' | 'In Progress' | 'Completed';

export interface MaintenanceInfo {
  mode: 'manual' | 'scheduled';
  reason: string;
  estimatedDate?: string | null;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  setAt?: string;
  setBy?: string;
  setByRole?: string;
}

export interface User {
  id: string;
  name: string;
  nameKm?: string;
  email: string;
  dept: string;
  role: UserRole;
  phone: string;
  initials: string;
  avatarUrl?: string;
  driverId?: string | null;
}

export interface Driver {
  id: string;
  name: string;
  nameKm?: string;
  phone: string;
  status: 'Active' | 'OffDuty';
  avatarUrl?: string;
  licenseNo?: string;
}

export interface Car {
  id: string;
  name: string;
  nameKm?: string;
  plate: string;
  type: CarType;
  seats: number;
  status: CarStatus;
  color?: string;
  fuel?: 'Petrol' | 'Diesel' | 'Hybrid' | 'EV';
  odometer?: number;
  /** Vehicle photo. Backend: store the company's own photo URL here. */
  imageUrl?: string;
  /** Attribution for third-party (e.g. Creative Commons) photos. */
  imageCredit?: string;
  maintenance?: MaintenanceInfo | null;
}

export interface Booking {
  id: string;
  carId: string;
  requesterId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  originalEndTime?: string;
  actualEndTime?: string;
  returnedEarly?: boolean;
  purpose: string;
  needDriver: boolean;
  driverId: string | null;
  destination: string;
  passengers: number;
  status: BookingStatus;
  taskStatus?: DriverTaskStatus | null;
  approverId: string | null;
  decisionAt: string | null;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  rejectReason?: string;
  cancelReason?: string;
  endOdometer?: string;
  completionNotes?: string;
  /** Closed by the end-time job rather than by a person. */
  autoCompleted?: boolean;
}

/**
 * A value inside a translated message. Plain text/numbers are inserted as-is;
 * `win` (a booking window) and `day` (a date) are formatted in the reader's language.
 */
export type MsgVar =
  | string
  | number
  | { win: { startDate: string; startTime: string; endDate?: string; endTime: string } }
  | { day: string };

/** Translatable message: a key in i18n.ts plus its values. */
export interface Msg {
  key: string;
  vars?: Record<string, MsgVar>;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  text: string;
  /** Translation keys; when present they win over the English `title` / `text`. */
  titleKey?: string;
  textKey?: string;
  vars?: Record<string, MsgVar>;
  /** Display fallback, e.g. "Today 09:40". Prefer `at`. */
  time: string;
  /** When it happened, "YYYY-MM-DD HH:MM". */
  at?: string;
  read: boolean;
  bookingId?: string;
  kind?: 'request' | 'approved' | 'rejected' | 'assigned' | 'completed' | 'cancelled' | 'maintenance' | 'info';
}

export interface FleetData {
  users: User[];
  cars: Car[];
  drivers: Driver[];
  bookings: Booking[];
  notifications: NotificationItem[];
}

export type Language = 'en' | 'kh';
export type ThemeMode = 'light' | 'dark';
export type ViewMode = 'cards' | 'timeline';
export type AppTab = 'home' | 'vehicles' | 'trips' | 'history' | 'tasks' | 'approvals' | 'fleet' | 'profile';

/** Fleet-today numbers that open a detail list. */
export type KpiKind = 'available' | 'in_use' | 'today' | 'service';

export type SheetState =
  | { type: 'book'; carId?: string; date?: string; start?: string; end?: string; /** Edit this booking instead of making a new one */ editId?: string }
  | { type: 'booking'; id: string }
  | { type: 'review'; id: string; mode?: 'approve' | 'reject' }
  | { type: 'return'; id: string; mode: 'early' | 'complete' }
  | { type: 'maintenance'; carId: string; mode?: 'manual' | 'scheduled' }
  | { type: 'notifications' }
  | { type: 'kpi'; kind: KpiKind }
  | null;
