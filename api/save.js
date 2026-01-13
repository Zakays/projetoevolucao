import { createClient } from '@supabase/supabase-js';

let supabase = null;
function getSupabase() {
  if (supabase) return supabase;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment');
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return supabase;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    const { key, value } = req.body || {};
    if (!key) return res.status(400).json({ error: 'key is required' });

    let client;
    try {
      client = getSupabase();
    } catch (err) {
      console.error('Supabase init error:', err.message);
      return res.status(500).json({ error: 'internal_error', details: err.message });
    }

    const payload = {
      key: String(key),
      value: value ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('user_data').upsert(payload, { onConflict: 'key' });
    if (error) {
      console.error('Supabase upsert error:', error);
      return res.status(500).json({ error: 'db_error', details: error.message });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('Save error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}
