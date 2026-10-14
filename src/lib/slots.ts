/** Company booking slots — the only times staff can book. Change times here only. */
export const BOOKING_SLOTS = {
  morning: { start: '08:00', end: '12:00' },
  afternoon: { start: '13:00', end: '17:30' },
  full_day: { start: '08:00', end: '17:30' },
} as const;

export type SlotKey = keyof typeof BOOKING_SLOTS;
export const SLOT_ORDER: SlotKey[] = ['morning', 'afternoon', 'full_day'];
