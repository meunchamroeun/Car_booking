import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FleetData } from '@/types';

/**
 * Shared demo data in Supabase: one row (`fleet_state.id = 'main'`) holding the whole FleetData,
 * so every device sees the same bookings. Realtime pushes changes to the other open apps.
 * Without the env vars the app keeps working on localStorage only.
 */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const ROW = 'main';

let client: SupabaseClient | null = null;
function db() {
  if (!URL || !KEY) return null;
  return (client ??= createClient(URL, KEY, { auth: { persistSession: false } }));
}

export const cloudEnabled = () => !!URL && !!KEY;

const valid = (d: unknown): d is FleetData => !!d && typeof d === 'object' && 'cars' in d && 'bookings' in d && 'users' in d;

/** The shared data, or null when there is none yet (or Supabase is off / unreachable). */
export async function loadCloud(): Promise<FleetData | null> {
  const c = db();
  if (!c) return null;
  const { data, error } = await c.from('fleet_state').select('data').eq('id', ROW).maybeSingle();
  if (error) throw error;
  return valid(data?.data) ? data.data : null;
}

export async function saveCloud(next: FleetData) {
  const c = db();
  if (!c) return;
  const { error } = await c.from('fleet_state').upsert({ id: ROW, data: next, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/** Calls `onChange` whenever another device saves. Returns an unsubscribe function. */
export function subscribeCloud(onChange: (next: FleetData) => void) {
  const c = db();
  if (!c) return () => {};
  const channel = c
    .channel('fleet_state_main')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_state', filter: `id=eq.${ROW}` }, payload => {
      const next = (payload.new as { data?: unknown })?.data;
      if (valid(next)) onChange(next);
    })
    .subscribe();
  return () => {
    c.removeChannel(channel);
  };
}
