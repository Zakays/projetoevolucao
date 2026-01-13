import dotenv from 'dotenv';
// Load environment variables from .env.local when present (development convenience)
dotenv.config({ path: '.env.local' });

import express from 'express';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));
// Very small CORS handler (single-user app; adapt as needed)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const missing = [];
if (!SUPABASE_URL) missing.push('SUPABASE_URL');
if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
if (missing.length) {
  console.error('Missing required environment variable(s):', missing.join(', '));
  console.error('Ensure these are set (for development you can put them in `.env.local`).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// POST /api/save { key, value }
app.post('/api/save', async (req, res) => {
  try {
    const { key, value } = req.body || {};
    console.log('POST /api/save', { key, valueSummary: value ? (Array.isArray(value.habits) ? `habits:${value.habits.length}` : typeof value) : null });
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

    console.log('POST /api/save ok', { key });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Save error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// GET /api/load?key=...
app.get('/api/load', async (req, res) => {
  try {
    const key = String(req.query.key ?? '');
    console.log('GET /api/load', { key });
    if (!key) return res.status(400).json({ error: 'key is required' });

    const { data, error } = await supabase
      .from('user_data')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.error('Supabase select error:', error);
      return res.status(500).json({ error: 'db_error', details: error.message });
    }

    console.log('GET /api/load result', { key, found: !!data });
    return res.json({ value: data?.value ?? null });
  } catch (err) {
    console.error('Load error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Health endpoint for quick checks
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
