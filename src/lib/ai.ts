import { storage } from '@/lib/storage';

function isExhaustionStatus(status: number, bodyText: string | null) {
  if ([401, 402, 403, 429].includes(status)) return true;
  if (!bodyText) return false;
  const lower = bodyText.toLowerCase();
  if (lower.includes('quota') || lower.includes('insufficient') || lower.includes('exceeded') || lower.includes('limit')) return true;
  return false;
}

async function removeKeyFromSettings(badKey: string) {
  try {
    const s = storage.getSettings();
    const keys = (s.aiApiKeys || []).filter(k => k !== badKey);
    const newSettings: any = { aiApiKeys: keys };

    storage.updateSettings(newSettings);
  } catch (e) {
    // noop
  }
}

import { sendMessageDirectly } from '@/lib/geminiClient';

export async function generateReply(prompt: string): Promise<string> {
  try {
    const settings = typeof storage !== 'undefined' ? storage.getSettings() : null;

    // If user has per-user keys in settings, attempt client-side direct calls first
    const settingsKeys: string[] = (settings && Array.isArray(settings.aiApiKeys)) ? [...settings.aiApiKeys] : [];
    for (const k of settingsKeys) {
      try {
        const r = await sendMessageDirectly(prompt, { key: k, allowProduction: true });
        if (r && typeof r.response === 'string') return r.response;
      } catch (err: any) {
        console.warn('sendMessageDirectly with user key failed, will try next key', String(err?.message || err));
        // If the key is exhausted/unauthorized, remove it from settings
        if (/401|401|403|quota|insufficient|exceeded/i.test(String(err?.message || ''))) {
          await removeKeyFromSettings(k);
        }
        continue;
      }
    }

    // If an env key is set, try client-side direct call (developer choice: direct client calls are prioritized)
    const envKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (envKey) {
      try {
        const r = await sendMessageDirectly(prompt, { key: envKey, allowProduction: true });
        if (r && typeof r.response === 'string') return r.response;
      } catch (err: any) {
        console.warn('sendMessageDirectly with env key failed, falling back to server proxy logic', String(err?.message || err));
      }
    }

    // Prefer explicit env var for server URL; otherwise use local proxy endpoint
    // In dev, Vite will proxy /api/ai to http://localhost:3001/api/ai automatically
    // In prod, use env var or /api/ai (external endpoint)
    const url = (import.meta as any).env.VITE_GEMINI_API_URL || '/api/ai';

    const envServerKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

    const keys: string[] = [];
    if (settings && Array.isArray(settings.aiApiKeys) && settings.aiApiKeys.length) keys.push(...settings.aiApiKeys);

    if (envServerKey) keys.push(envServerKey);

    if (url && keys.length > 0) {
      // New server endpoint expects { message: string }
      const body = { message: prompt };
      for (const k of keys.slice()) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${k}`,
            },
            body: JSON.stringify(body),
          });

          const text = await res.text();
          let data: any = null;
          try { data = JSON.parse(text); } catch (e) { data = null; }

          if (res.ok) {
            if (data) {
              // Prefer the normalized { response: string } from the backend
              if (typeof data.response === 'string' && data.response.trim()) return data.response;
              if (data.commands && Array.isArray(data.commands)) {
                // Convert structured commands to a friendly message
                const commandSummary = data.commands
                  .map((cmd: any) => {
                    const entity = cmd.entity || 'item';
                    const action = cmd.action || 'action';
                    const params = cmd.params ? ` (${Object.entries(cmd.params).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ')})` : '';
                    return `• ${action} ${entity}${params}`;
                  })
                  .join('\n');
                return `Ações sugeridas:\n${commandSummary}`;
              }
              if (typeof data.message === 'string' && data.message.trim()) return data.message;
              if (typeof data.text === 'string' && data.text.trim()) return data.text;
              if (data.choices && Array.isArray(data.choices) && data.choices[0]) {
                const first = data.choices[0];
                if (typeof first.text === 'string' && first.text.trim()) return first.text;
                if (first.message && (first.message.content || first.message)) {
                  if (typeof first.message === 'string') return first.message;
                  if (first.message.content && typeof first.message.content === 'string') return first.message.content;
                  if (Array.isArray(first.message.content)) return first.message.content.map((c: any) => (c.text || c)).join('\n');
                }
              }
              if (data.candidates && Array.isArray(data.candidates) && data.candidates[0]) {
                const cand = data.candidates[0];
                if (cand.content && Array.isArray(cand.content)) {
                  const out = cand.content.filter((c: any) => c.type === 'output_text').map((c: any) => c.text).join('\n');
                  if (out) return out;
                }
                if (typeof cand.content === 'string') return cand.content;
              }
            }

            if (text && text.trim()) return text;
            return 'Resposta vazia do modelo';
          }

          const bodyText = (text && text.trim()) ? text.trim() : null;
          if (res.status === 404) {
            return 'Erro 404: endpoint não encontrado. Verifique se o proxy (/api/ai) está ativo ou configure VITE_GEMINI_API_URL.';
          }
          if (isExhaustionStatus(res.status, bodyText)) {
            await removeKeyFromSettings(k);
            continue;
          }

          return `Erro: resposta do modelo ${res.status} - ${bodyText ?? 'sem corpo'}`;
        } catch (err: any) {
          // Network or transient error when using this key; do not immediately remove it
          console.warn('ai.generateReply: network/error using key, will retry next key', String(err?.message || err));
          continue;
        }
      }

      return 'Nenhuma API key disponível ou todas as chaves excederam a quota.';
    }

    // fallback: sem URL ou keys configuradas
    return 'Erro: Configure uma chave de API em Configurações para usar o chat.';
  } catch (err: any) {
    return `Erro interno ao gerar resposta: ${String(err?.message || err)}`;
  }
}
