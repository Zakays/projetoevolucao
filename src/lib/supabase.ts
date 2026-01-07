import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export function initSupabase(url: string, anonKey: string) {
  if (!supabase) {
    const storageOption = typeof window !== 'undefined' ? window.localStorage : undefined;
    supabase = createClient(url, anonKey, { auth: { persistSession: true, storage: storageOption, detectSessionInUrl: true } });
  }
  return supabase;
}

export function getSupabase() {
  if (!supabase) throw new Error('Supabase client not initialized. Call initSupabase first.');
  return supabase;
}
