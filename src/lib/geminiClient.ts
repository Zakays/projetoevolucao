// Minimal client-only Gemini helper (for local/dev use only).
// WARNING: storing API keys in client bundles is dangerous and may expose your key publicly.
// Use this only for local testing. Do NOT commit your key.

type GeminiResponse = { response: string };

function parseGeminiResponse(json: any): string {
  // try common response shapes
  const candidates = json?.candidates ?? json?.outputs ?? json?.output ?? json?.choices ?? null;
  if (Array.isArray(candidates) && candidates.length) {
    const cand = candidates[0];
    // nested content array with text fields
    if (cand?.content) {
      if (Array.isArray(cand.content)) {
        return cand.content.map((c: any) => c?.text ?? '').join('');
      }
      return cand.content?.text ?? '';
    }
    if (cand?.text) return cand.text;
    if (typeof cand === 'string') return cand;
    if (cand?.outputText) return cand.outputText;
  }

  // fallback top-level fields
  if (typeof json?.text === 'string') return json.text;
  if (typeof json?.output === 'string') return json.output;

  try { return JSON.stringify(json); } catch { return String(json); }
}

export async function sendMessageDirectly(message: string, opts?: { key?: string; apiUrl?: string; allowProduction?: boolean }): Promise<GeminiResponse> {
  const key = opts?.key ?? (import.meta.env.VITE_GEMINI_API_KEY as string | undefined);
  if (!key) throw new Error('No API key provided. Pass a key or set VITE_GEMINI_API_KEY in .env.local (do not commit)');


  const apiUrl = opts?.apiUrl ?? (import.meta.env.VITE_GEMINI_API_URL as string | undefined) ?? 'https://generative.googleapis.com/v1beta2/models/text-bison-001:generate';

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: { text: message } }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '<non-json-body>');
    throw new Error(`Gemini request failed: ${res.status} ${res.statusText} - ${body}`);
  }

  const json = await res.json().catch(() => ({}));
  const text = parseGeminiResponse(json);
  return { response: text };
}
