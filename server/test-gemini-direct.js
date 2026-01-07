// Quick test script to call Google Generative API (REST) using key from server/.gemini_keys
// Usage: node server/test-gemini-direct.js "Your prompt here"

import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const prompt = process.argv.slice(2).join(' ') || 'Olá, tudo bem? Por favor, responda com uma frase curta e alegre.';
  const keysFile = path.join(process.cwd(), 'server', '.gemini_keys');
  let rawKey = null;
  try {
    const txt = await fs.readFile(keysFile, 'utf8');
    rawKey = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean)[0];
  } catch (e) {
    console.error('[test] could not read server/.gemini_keys:', e.message || e);
    process.exit(2);
  }

  if (!rawKey) {
    console.error('[test] no key found in server/.gemini_keys');
    process.exit(2);
  }

  const apiUrls = [
    process.env.AI_API_URL || process.env.VITE_GEMINI_API_URL || 'https://generative.googleapis.com/v1beta2/models/text-bison-001:generate',
    'https://generative.googleapis.com/v1beta2/models/gemini-1.5-mini:generate',
    'https://generative.googleapis.com/v1/models/gemini-1.5-mini:generate'
  ];

  // helper to post
  async function post(url, key, useQueryKey = false) {
    const payload = { prompt: { text: prompt } };
    const finalUrl = useQueryKey ? `${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(key)}` : url;
    const headers = useQueryKey ? { 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` };

    try {
      const res = await fetch(finalUrl, { method: 'POST', headers, body: JSON.stringify(payload) });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch (e) { json = null; }
      return { ok: res.ok, status: res.status, statusText: res.statusText, text, json };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }

  // Try endpoints sequentially; if 401/403, try query param fallback
  for (const url of apiUrls) {
    console.log(`[test] Trying ${url} with Bearer header...`);
    const r = await post(url, rawKey, false);
    if (r.error) {
      console.warn('[test] request error:', r.error);
      continue;
    }
    console.log('[test] status', r.status, r.statusText);
    if (r.ok) {
      console.log('[test] got success response');
      console.log('--- body ---');
      console.log(r.text);
      return;
    }
    // try query param if unauthorized or 401/403
    if ([401, 403].includes(r.status) || (r.text && /unauthori|invalid|auth/i.test(r.text))) {
      console.log('[test] Trying same endpoint with ?key= query param fallback...');
      const r2 = await post(url, rawKey, true);
      if (r2.ok) {
        console.log('[test] got success response with query key fallback');
        console.log('--- body ---');
        console.log(r2.text);
        return;
      }
      console.log('[test] fallback status', r2.status, r2.statusText);
      console.log(r2.text);
      continue;
    }

    // otherwise print body and continue
    console.log('[test] response body:');
    console.log(r.text);
  }

  console.error('[test] All attempts exhausted — no success');
  process.exit(1);
}

main().catch(e => { console.error('Unhandled', e); process.exit(3); });
