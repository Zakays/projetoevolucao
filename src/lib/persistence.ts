// Lightweight persistence layer that stores data in Supabase via the server API
// Provides fallback to localStorage when offline or when the backend fails.

const LOCAL_PREFIX = 'glowup_';

// Determine API base URL. When running from a file:// origin (Capacitor/web assets),
// use the deployed site origin so fetch('/api/...') will resolve correctly.
const API_BASE = (() => {
  try {
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      return 'https://projetoevolucao.vercel.app';
    }
  } catch (e) {}
  return import.meta.env.VITE_API_BASE ?? '';
})();

function apiUrl(path: string) {
  if (!API_BASE) return path;
  return API_BASE.replace(/\/$/, '') + path;
}

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

  // Fallback to local cache
  try {
    const raw = localStorage.getItem(LOCAL_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.value ?? null;
  } catch (err) {
    return null;
  }
}

// Optional utility — try to synchronize local cache to remote when back online
export async function syncLocalToRemote(key: string): Promise<boolean> {
  try {
    const raw = localStorage.getItem(LOCAL_PREFIX + key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.value === undefined) return false;
    return await saveData(key, parsed.value);
  } catch (err) {
    return false;
  }
}
