// Lightweight persistence layer that stores data in Supabase via the server API
// Provides fallback to localStorage when offline or when the backend fails.

const LOCAL_PREFIX = 'glowup_';

export async function saveData(key: string, value: any): Promise<boolean> {
  const body = { key, value };
  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      try { localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify({ value, updated_at: Date.now() })); } catch {}
      return true;
    }
  } catch (err) {
    // network error — fall through to local save
  }

  // Fallback: save locally
  try {
    localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify({ value, updated_at: Date.now() }));
    return false;
  } catch (err) {
    console.error('saveData: failed to persist locally', err);
    return false;
  }
}

export async function loadData(key: string): Promise<any> {
  // Try remote first
  try {
    const url = '/api/load?key=' + encodeURIComponent(key);
    const res = await fetch(url, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.value !== undefined && data.value !== null) {
        // update local cache
        try { localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify({ value: data.value, updated_at: Date.now() })); } catch {}
        return data.value;
      }
    }
  } catch (err) {
    // network error
  }

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
