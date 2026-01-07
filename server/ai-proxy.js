import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import fsSync from 'fs';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(bodyParser.json());

// Basic request logging to help debug connectivity issues
app.use((req, res, next) => {
  console.log(`[proxy] ${new Date().toISOString()} ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Add permissive CORS headers so browser clients can call the proxy from different origins
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Log Authorization header for debugging client-sent keys
app.use((req, res, next) => {
  try { console.log('[proxy] Authorization header:', req.headers['authorization']); } catch (e) { /* noop */ }
  next();
});

// Root route for basic connectivity checks
app.get('/', (_req, res) => {
  res.status(200).send('AI proxy alive');
});

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('[proxy] Uncaught exception', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[proxy] Unhandled rejection', reason);
});
process.on('exit', (code) => {
  console.log('[proxy] process.exit called with code', code);
});

const CommandSchema = z.object({
  entity: z.string(),
  action: z.string(),
  params: z.record(z.any()).optional(),
});
const CommandsSchema = z.array(CommandSchema);

const AI_API_URL = process.env.AI_API_URL || process.env.VITE_GEMINI_API_URL;
let AI_API_KEY = process.env.AI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

// Load multiple keys from server/.gemini_keys (one per line) for rotation.
// Also support a single-key file at server/.gemini_key for convenience.
function loadKeyList() {
  try {
    if (fsSync.existsSync('server/.gemini_keys')) {
      const txt = fsSync.readFileSync('server/.gemini_keys', 'utf8');
      return txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    }
    // fallback to singular file for older workflows
    if (fsSync.existsSync('server/.gemini_key')) {
      const txt = fsSync.readFileSync('server/.gemini_key', 'utf8');
      const k = String(txt || '').trim();
      if (k) return [k];
    }
  } catch (e) { /* ignore */ }
  if (AI_API_KEY) return [AI_API_KEY];
  return [];
}

function persistKeyList(keys) {
  try {
    fsSync.writeFileSync('server/.gemini_keys', keys.join('\n'));
  } catch (e) { /* ignore */ }
}

let keyList = loadKeyList();

function removeKeyFromList(badKey) {
  keyList = keyList.filter(k => k !== badKey);
  persistKeyList(keyList);
}

function currentKey() {
  return keyList && keyList.length ? keyList[0] : null;
}

function shiftToNextKey() {
  if (keyList.length > 0) {
    keyList.shift();
    persistKeyList(keyList);
  }
}

async function tryExtractCommandsFromData(data) {
  // If data.commands exists and is an array, validate
  if (data && Array.isArray(data.commands)) {
    const parsed = data.commands;
    const ok = CommandsSchema.safeParse(parsed);
    if (ok.success) return ok.data;
  }

  // If data is a string, try to parse JSON from it
  if (typeof data === 'string') {
    // try to find JSON block inside ```json ... ```
    const jsonBlock = data.match(/```\s*json\s*([\s\S]*?)```/i);
    const candidate = jsonBlock ? jsonBlock[1] : data;
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) {
        const ok = CommandsSchema.safeParse(parsed);
        if (ok.success) return ok.data;
      }
      if (parsed && Array.isArray(parsed.commands)) {
        const ok = CommandsSchema.safeParse(parsed.commands);
        if (ok.success) return ok.data;
      }
    } catch (e) {
      // ignore
    }
  }

  // If data.choices[0].text exists, try parse JSON there
  if (data && data.choices && Array.isArray(data.choices) && data.choices[0]) {
    const txt = data.choices[0].text || data.choices[0].message || '';
    if (typeof txt === 'string') {
      try {
        const parsed = JSON.parse(txt);
        if (parsed && Array.isArray(parsed.commands)) {
          const ok = CommandsSchema.safeParse(parsed.commands);
          if (ok.success) return ok.data;
        }
      } catch (e) { /* noop */ }
    }
  }

  // Google-style candidates
  if (data && data.candidates && Array.isArray(data.candidates) && data.candidates[0]) {
    const cand = data.candidates[0];
    if (cand.content && Array.isArray(cand.content)) {
      const out = cand.content.filter(c => c.type === 'output_text').map(c => c.text).join('\n');
      try {
        const parsed = JSON.parse(out);
        if (parsed && Array.isArray(parsed.commands)) {
          const ok = CommandsSchema.safeParse(parsed.commands);
          if (ok.success) return ok.data;
        }
      } catch (e) { /* noop */ }
    }
  }

  return null;
}

async function processPrompt(prompt) {
  try {
    const systemWrapper = `You are the GlowUp assistant. When possible, return ONLY valid JSON matching: {"commands":[{entity,action,params},...]}. Do not include any extra text.`;
    const wrappedPrompt = `${systemWrapper}\nUser: ${prompt}`;

    // helper to run an async operation with timeout
    const withTimeout = (p, ms = 15000) => {
      return Promise.race([
        p,
        new Promise((_, rej) => setTimeout(() => rej(new Error('upstream timeout')), ms)),
      ]);
    };

    let data = null;
  // Use server-side key rotation: try keys until one works
  if (keyList && keyList.length) {
    // First, try a simple conversational probe for a natural reply (prefer this over strict JSON commands)
    for (let probeIdx = 0; probeIdx < 1; probeIdx++) {
      const usedKey = keyList[probeIdx];
      try {
        console.log('[proxy] conversational probe using key', usedKey ? usedKey.slice(0,6) + '...' : 'none');
        const genai = new GoogleGenerativeAI(usedKey);
        const modelName = process.env.GEMINI_MODEL || process.env.MODEL_NAME || 'gemini-2.5-flash';
        const model = genai.getGenerativeModel({ model: modelName });
        const probeResult = await withTimeout(model.generateContent({
          contents: [{ type: 'text', text: prompt }],
          generationConfig: { maxOutputTokens: 300 }
        }), 8000);
        if (probeResult) {
          try {
            // extract human text if present
            if (probeResult.candidates && Array.isArray(probeResult.candidates) && probeResult.candidates[0]) {
              const cand = probeResult.candidates[0];
              let txt = '';
              if (cand.content && Array.isArray(cand.content)) txt = cand.content.filter(c => c.type === 'output_text').map(c => c.text || '').join('\n');
              else if (cand.output_text) txt = cand.output_text;
              else if (typeof cand === 'string') txt = cand;
              if (txt && txt.trim()) { data = { message: txt, raw: probeResult }; break; }
            } else if (typeof probeResult === 'string' && probeResult.trim()) {
              data = { message: probeResult, raw: probeResult }; break;
            }
          } catch (e) { /* ignore probe extraction errors */ }
        }
      } catch (probeErr) {
        console.warn('[proxy] conversational probe failed', String(probeErr && probeErr.message));
      }
    }

    // Desired JSON schema for structured commands
    const responseJsonSchema = {
      type: 'object',
      properties: {
        commands: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              entity: { type: 'string' },
              action: { type: 'string' },
              params: { type: 'object' }
            },
            required: ['entity','action']
          }
        }
      },
      required: ['commands']
    };

    // Attempt each key in the list
    for (let i = 0; i < keyList.length; i++) {
      const usedKey = keyList[i];
      console.log('[proxy] trying key', usedKey ? usedKey.slice(0,6) + '...' : 'none');
      try {
        // Prefer SDK if available; fallback to REST shape only if AI_API_URL is configured
        let result = null;
        try {
          const genai = new GoogleGenerativeAI(usedKey);
          const modelName = process.env.GEMINI_MODEL || process.env.MODEL_NAME || 'gemini-2.5-flash';
          const model = genai.getGenerativeModel({ model: modelName });
          result = await withTimeout(model.generateContent({
            contents: [{ type: 'text', text: wrappedPrompt }],
            generationConfig: {
              responseMimeType: 'application/json',
              responseJsonSchema,
              maxOutputTokens: 800,
            }
          }), 15000);
        } catch (sdkErr) {
          console.warn('[proxy] SDK attempt failed or timed out', String(sdkErr && sdkErr.message));

          // Only try REST fallback if an API URL is configured
          if (AI_API_URL) {
            // REST fallback: use Google Generative Language REST shape
            // Use `prompt.text` shape which the API expects, avoid `contents[{type,text}]` which caused errors
            const body = {
              prompt: { text: wrappedPrompt },
              // include generation hints where supported
              responseJsonSchema,
              maxOutputTokens: 800,
            };
            let upstream = null;
            try {
              upstream = await withTimeout(fetch(AI_API_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${usedKey}`,
                },
                body: JSON.stringify(body),
              }), 15000);
            } catch (fetchErr) {
              console.warn('[proxy] REST fetch failed or timed out', String(fetchErr && fetchErr.message));
            }

            if (upstream) {
              const contentType = upstream.headers.get('content-type') || '';
              const upstreamText = contentType.includes('application/json') ? JSON.stringify(await upstream.clone().json()) : await upstream.clone().text();
              console.log('[proxy] upstream response status', upstream.status, 'content-type', contentType, 'body-snippet', upstreamText.slice(0, 500));
              if (contentType.includes('application/json')) result = await upstream.json();
              else result = await upstream.text();

              // If auth failed, some Gemini setups accept ?key=API_KEY query param — try that as a fallback
              if ((upstream.status === 401 || upstream.status === 403) && AI_API_URL.includes('generativelanguage.googleapis.com')) {
                try {
                  const urlWithKey = AI_API_URL.includes('?') ? `${AI_API_URL}&key=${usedKey}` : `${AI_API_URL}?key=${usedKey}`;
                  const upstream2 = await withTimeout(fetch(urlWithKey, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                  }), 15000);
                  const ct2 = upstream2.headers.get('content-type') || '';
                  const upstream2Text = ct2.includes('application/json') ? JSON.stringify(await upstream2.clone().json()) : await upstream2.clone().text();
                  console.log('[proxy] upstream-with-key response', upstream2.status, 'body-snippet', upstream2Text.slice(0, 500));
                  if (ct2.includes('application/json')) result = await upstream2.json();
                  else result = await upstream2.text();
                } catch (e) { console.warn('[proxy] fallback-with-key attempt failed', String(e?.message || e)); }
              }
            }
          }
        }


        // Normalize SDK/REST response to extract commands
        let extracted = null;
        if (result) {
          // SDK may return object with .response or .candidates
          if (result.commands && Array.isArray(result.commands)) extracted = result.commands;
          else if (result.candidates && Array.isArray(result.candidates) && result.candidates[0] && result.candidates[0].content) {
            // content might be array of parts
            const cand = result.candidates[0];
            if (cand.content && Array.isArray(cand.content)) {
              const out = cand.content.map(c => c.text || c).join('\n');
              try { const parsed = JSON.parse(out); if (Array.isArray(parsed.commands)) extracted = parsed.commands; } catch (e) { }
            }
          } else if (typeof result === 'string') {
            try { const parsed = JSON.parse(result); if (Array.isArray(parsed.commands)) extracted = parsed.commands; } catch (e) { }
          } else if (result.response && typeof result.response.text === 'function') {
            try { const txt = result.response.text(); const parsed = JSON.parse(txt); if (Array.isArray(parsed.commands)) extracted = parsed.commands; } catch (e) { }
          }
        }

        if (extracted) {
          data = { commands: extracted, message: 'ok' };
          break;
        }

        // If we reached here and result indicates quota/exhaustion, remove key and continue
        const asText = JSON.stringify(result || '');
        if (/quota|exceed|exceeded|limit|insufficient/i.test(asText)) {
          removeKeyFromList(usedKey);
          continue;
        }

        // No commands extracted — set raw for fallback parsing
        data = result;
        break;
      } catch (errInner) {
        // remove problematic key and try next
        removeKeyFromList(usedKey);
        continue;
      }
    }
  } else {
    // No server-side keys available — do NOT return canned replies.
    // Return an explicit error so the frontend can surface the auth/setup issue.
    data = { error: 'no_server_key', message: 'No server-side Gemini API key configured', raw: null };
  }

  // Ensure we have a safe object to read from (prevent crash when upstream returns null)
  data = data || {};
  const extracted = await tryExtractCommandsFromData(data);

  const auditEntry = { timestamp: new Date().toISOString(), prompt, extracted: extracted ? extracted : null, fallback: !!data.fallback };
  try { await fs.appendFile('server/ai-audit.log', JSON.stringify(auditEntry) + '\n'); } catch (e) { console.warn('failed writing audit', e); }

  if (extracted) return { commands: extracted, message: 'ok', raw: data };

  // If data has a simple message field (fallback conversational reply), return it
  if (typeof data.message === 'string' && data.message.trim()) {
    return { message: data.message, raw: data };
  }

  // If we didn't extract commands and have no message, attempt a simple conversational fallback
  if (!extracted) {
    try {
      const firstKey = (keyList && keyList[0]) || AI_API_KEY || null;
      if (firstKey) {
        try {
          const genai = new GoogleGenerativeAI(firstKey);
          const modelName = process.env.GEMINI_MODEL || process.env.MODEL_NAME || 'gemini-1.5-flash';
          const model = genai.getGenerativeModel({ model: modelName });
          const conv = await model.generateContent({ contents: [{ type: 'text', text: prompt }], generationConfig: { maxOutputTokens: 300 } });
          let convText = '';
          if (conv && conv.candidates && Array.isArray(conv.candidates) && conv.candidates[0]) {
            const cand = conv.candidates[0];
            if (cand.content && Array.isArray(cand.content)) convText = cand.content.filter(c => c.type === 'output_text').map(c => c.text || '').join('\n');
            else if (cand.output_text) convText = cand.output_text;
            else if (typeof cand === 'string') convText = cand;
          } else if (typeof conv === 'string') convText = conv;
          if (convText && convText.trim()) return { message: convText, raw: conv };
        } catch (e) { console.warn('[proxy] conversational fallback SDK failed', String(e && e.message)); }
      }

      // REST conversational fallback
      if (AI_API_URL && (keyList && keyList[0])) {
        try {
          const body = { prompt: { text: prompt } };
          const upstream = await fetch(AI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${keyList[0]}` }, body: JSON.stringify(body) });
          const t = await upstream.text();
          try { const parsed = JSON.parse(t); if (parsed && (parsed.response || parsed.message)) return { message: parsed.response || parsed.message, raw: parsed }; } catch { return { message: t, raw: t }; }
        } catch (e) { console.warn('[proxy] conversational fallback REST failed', String(e && e.message)); }
      }
    } catch (e) { /* swallow fallback errors */ }
  }

  // fallback: return raw data for client-side parsing
  return { commands: null, raw: data, message: 'no-commands-extracted' };
}

app.post('/api/ai', async (req, res) => {
  // New simple, secure entrypoint that calls Gemini using server-side API key.
  const { message } = req.body || {};
  console.log('[proxy] /api/ai called with message length', (message && message.length) || 0);
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'message is required' });

  // Use explicit GEMINI_API_KEY from env for production-like flow.
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || null;
  const modelName = process.env.GEMINI_MODEL || process.env.MODEL_NAME || 'gemini-1.5-flash';

  if (!GEMINI_KEY) {
    // Fall back to the older processPrompt behavior only if there's no explicit server key
    try {
      const reply = await processPrompt(message);
      return res.json(reply);
    } catch (err) {
      console.error('ai-proxy error (no GEMINI_KEY fallback)', err);
      return res.status(500).json({ error: 'No GEMINI_API_KEY configured and fallback failed' });
    }
  }

  try {
    // Prefer SDK call when available to avoid crafting REST shapes incorrectly
    const genai = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genai.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents: [{ type: 'text', text: message }],
      generationConfig: { maxOutputTokens: 512 }
    });

    // Extract human-readable text from SDK response
    let text = '';
    try {
      if (result && result.candidates && Array.isArray(result.candidates) && result.candidates[0]) {
        const cand = result.candidates[0];
        if (cand.content && Array.isArray(cand.content)) {
          text = cand.content.filter(c => c.type === 'output_text').map(c => c.text || '').join('\n');
        } else if (cand.output_text) {
          text = cand.output_text;
        } else if (typeof cand === 'string') {
          text = cand;
        }
      } else if (typeof result === 'string') {
        text = result;
      }
    } catch (ex) {
      console.warn('[proxy] failed to extract text from SDK response', ex && ex.message);
    }

    // Return normalized JSON to the frontend
    return res.json({ response: text || JSON.stringify(result) });
  } catch (e) {
    console.error('[proxy] Gemini SDK call failed', e && (e.stack || e.message || e));
    // If SDK fails, try a REST fallback if AI_API_URL is configured
    if (AI_API_URL) {
      try {
        const body = { prompt: message };
        const upstream = await fetch(AI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GEMINI_KEY}` }, body: JSON.stringify(body) });
        const text = await upstream.text();
        try { const data = JSON.parse(text); return res.json({ response: data.response || data.message || text }); } catch { return res.json({ response: text }); }
      } catch (restErr) {
        console.error('[proxy] REST fallback failed', restErr && restErr.message);
      }
    }

    return res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
});

// Support GET /api/ai?prompt=... for quick browser testing and tooling
app.get('/api/ai', async (req, res) => {
  const prompt = String(req.query.prompt || req.query.message || '').trim();
  if (!prompt) return res.json({ ok: true, usage: 'GET /api/ai?prompt=your+text OR POST {"message":"..."}', example: '/api/ai?prompt=ping' });
  try {
    // If there's no explicit server GEMINI key, reuse processPrompt (key-rotating flow)
    const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || null;
    if (!GEMINI_KEY) {
      const reply = await processPrompt(prompt);
      return res.json(reply);
    }

    // Prefer SDK when server key is present for a natural conversational reply
    try {
      const genai = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genai.getGenerativeModel({ model: process.env.GEMINI_MODEL || process.env.MODEL_NAME || 'gemini-1.5-flash' });
      const result = await model.generateContent({
        contents: [{ type: 'text', text: prompt }],
        generationConfig: { maxOutputTokens: 512 }
      });

      let text = '';
      if (result && result.candidates && Array.isArray(result.candidates) && result.candidates[0]) {
        const cand = result.candidates[0];
        if (cand.content && Array.isArray(cand.content)) {
          text = cand.content.filter(c => c.type === 'output_text').map(c => c.text || '').join('\n');
        } else if (cand.output_text) {
          text = cand.output_text;
        } else if (typeof cand === 'string') {
          text = cand;
        }
      } else if (typeof result === 'string') {
        text = result;
      }
      return res.json({ response: text || JSON.stringify(result) });
    } catch (sdkErr) {
      console.warn('[proxy] SDK call failed (GET), falling back to REST', String(sdkErr && sdkErr.message));
    }

    // REST fallback: use AI_API_URL if configured
    const AI_API_URL = process.env.AI_API_URL || process.env.VITE_GEMINI_API_URL;
    if (AI_API_URL) {
      try {
        const body = { prompt: { text: prompt } };
        const upstream = await fetch(AI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GEMINI_KEY}` }, body: JSON.stringify(body) });
        const text = await upstream.text();
        try { const data = JSON.parse(text); return res.json({ response: data.response || data.message || text }); } catch { return res.json({ response: text }); }
      } catch (restErr) {
        console.error('[proxy] GET /api/ai REST fallback failed', restErr && restErr.message);
      }
    }

    return res.status(500).json({ error: 'AI request failed' });
  } catch (err) {
    console.error('ai-proxy error (GET)', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});
app.get('/healthz', (_req, res) => {
  const keyCount = (keyList && keyList.length) || 0;
  const keyPreview = keyList && keyList.length ? ('****' + String(keyList[0]).slice(-4)) : null;
  res.status(200).json({ status: 'ok', keyCount, keyPreview });
});

// Debug endpoint: test each loaded key against the upstream endpoint and return status
app.get('/debug/keys', (_req, res) => {
  console.log('[debug/keys] Returning loaded keys without testing.');
  const keyPreviews = keyList.map(k => '****' + String(k).slice(-4));
  res.json({ keys: keyPreviews, count: keyPreviews.length });
});

const port = process.env.PORT || 3001;
const host = '0.0.0.0';
console.log(`[proxy] starting - keys loaded: ${keyList && keyList.length ? keyList.length : 0}, first key preview: ${keyList && keyList[0] ? '****' + String(keyList[0]).slice(-4) : 'none'}`);
app.listen(port, host, () => console.log(`AI proxy running at http://localhost:${port}/api/ai`));
