import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function initSupabase(url: string, anonKey: string) {
  if (!url || !anonKey) return null;
  if (!_supabase) {
    _supabase = createClient(url, anonKey, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 5 } },
    });
  }
  return _supabase;
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) throw new Error('Supabase not initialized. Call initSupabase first.');
  return _supabase;
}
 
