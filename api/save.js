import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    const { key, value } = req.body || {};
    if (!key) return res.status(400).json({ error: 'key is required' });

    const payload = {
      key: String(key),
      value: value ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('user_data').upsert(payload, { onConflict: 'key' });
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
