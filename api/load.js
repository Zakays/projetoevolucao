import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

    const key = String(req.query?.key || '');
    if (!key) return res.status(400).json({ error: 'key is required' });

    const { data, error } = await supabase
      .from('user_data')
      .select('value, updated_at')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.error('Supabase select error:', error);
      return res.status(500).json({ error: 'db_error', details: error.message });
    }

    return res.json({ value: data?.value ?? null, updated_at: data?.updated_at ?? null });
  } catch (err) {
    console.error('Load error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}
