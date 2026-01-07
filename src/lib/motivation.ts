export function composeMotivationPrompt(convo: { role: string; text: string }[], tone: string, length: string) {
  const last = (convo || []).slice(-20).map(m => `${m.role}: ${m.text}`).join('\n');
  const lengthGuidance = length === 'short' ? 'máx 80 caracteres' : length === 'medium' ? 'máx 140 caracteres' : 'máx 240 caracteres';
  const prompt = `Com base no histórico de conversas abaixo, escreva UMA única frase motivacional ${tone} ${length} (${lengthGuidance}), personalizada para o usuário e adequada para inspirar ação hoje. Responda apenas com a frase, sem explicações.\n\nHistórico:\n${last}`;
  return prompt;
}

export function sanitizeMotivation(raw: string | null, maxChars = 200) {
  if (!raw) return '';
  let reply = String(raw);
  // take first non-empty line
  reply = reply.split('\n').map(s => s.trim()).find(s => s.length > 0) || reply;
  // strip surrounding quotes
  reply = reply.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  if (reply.length > maxChars) reply = reply.slice(0, maxChars - 3) + '...';
  return reply;
}