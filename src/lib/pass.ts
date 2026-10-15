import { Booking, Car, User } from '@/types';
import { DateUtil } from '@/lib/date-utils';

/**
 * Vehicle pass carried inside the QR code as a link: <app>/?pass=<token>.
 * The token holds the booking details, so any phone can scan and check it without the app's data.
 *
 * Demo only: the token is not signed. In production the QR should hold just the booking id
 * (or a signed token) and the check page should ask the backend whether the pass is valid.
 */
export interface PassData {
  id: string;
  car: string;
  plate: string;
  name: string;
  dept: string;
  sd: string; // start date
  st: string; // start time
  ed: string; // end date
  et: string; // end time
  drv?: string; // driver name
}

// UTF-8 safe base64url (names may be in Khmer)
const toBase64Url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const fromBase64Url = (s: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));

export function passToken(b: Booking, car: Car, requester: User | undefined, driverName?: string): string {
  const data: PassData = {
    id: b.id,
    car: car.name,
    plate: car.plate,
    name: requester?.name ?? '',
    dept: requester?.dept ?? '',
    sd: b.startDate,
    st: b.startTime,
    ed: b.endDate || b.startDate,
    et: b.endTime,
    ...(driverName ? { drv: driverName } : {}),
  };
  return toBase64Url(JSON.stringify(data));
}

export function passUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://car-booking-demo-app.vercel.app';
  return `${origin}/?pass=${token}`;
}

export function readPass(token: string): PassData | null {
  try {
    const d = JSON.parse(fromBase64Url(token)) as PassData;
    return d && d.id && d.sd && d.st && d.et ? d : null;
  } catch {
    return null;
  }
}

/** Valid from 30 minutes before the start until the end. */
export function passStatus(p: PassData, now = DateUtil.nowStamp()): 'valid' | 'early' | 'expired' {
  const [d, t] = [p.sd, p.st];
  const [y, m, day] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  const open = new Date(y, m - 1, day, h, mi - 30);
  const openStamp = `${DateUtil.toDateStr(open)} ${DateUtil.pad(open.getHours())}:${DateUtil.pad(open.getMinutes())}`;
  if (now < openStamp) return 'early';
  if (now >= DateUtil.stamp(p.ed, p.et)) return 'expired';
  return 'valid';
}
