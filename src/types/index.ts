export type UserRole = 'Employee' | 'Approver' | 'Driver' | 'Admin';

export type CarType = 'Sedan' | 'SUV' | 'Van' | 'Pickup';

export type CarStatus = 'Active' | 'Maintenance';

export type BookingStatus = 'Pending' | 'Approved' | 'Completed' | 'Rejected' | 'Cancelled';

export type DriverTaskStatus = 'Assigned' | 'In Progress' | 'Completed';

export interface MaintenanceInfo {
  mode: 'manual' | 'scheduled';
  reason: string;
  estimatedDate?: string | null;
  workshop?: string;
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
  email: string;
  dept: string;
  role: UserRole;
  phone: string;
  initials: string;
  driverId?: string | null;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: 'Active' | 'OffDuty';
  licenseNo?: string;
}

export interface Car {
  id: string;
  name: string;
  plate: string;
  type: CarType;
  seats: number;
  status: CarStatus;
  color?: string;
  fuel?: 'Petrol' | 'Diesel' | 'Hybrid' | 'EV';
  odometer?: number;
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
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  text: string;
  time: string;
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
export type AppTab = 'home' | 'vehicles' | 'trips' | 'tasks' | 'approvals' | 'fleet' | 'profile';

export type SheetState =
  | { type: 'book'; carId?: string; date?: string; start?: string; end?: string }
  | { type: 'booking'; id: string }
  | { type: 'review'; id: string }
  | { type: 'return'; id: string; mode: 'early' | 'complete' }
  | { type: 'maintenance'; carId: string; mode?: 'manual' | 'scheduled' }
  | { type: 'notifications' }
  | null;
