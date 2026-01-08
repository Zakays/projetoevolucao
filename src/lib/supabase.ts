import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function initSupabase(url: string, anonKey: string) {
  if (!supabaseClient) {
    supabaseClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  }
  return supabaseClient;
}

export function getSupabase() {
  if (!supabaseClient) throw new Error('Supabase client not initialized. Call initSupabase first.');
  return supabaseClient;
}

// Backwards-compatible export: default-ready client when env vars are present
try {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    initSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  // noop in non-browser or build-time contexts
}
