import { storage } from './storage';
import { pushAudit } from './auditLog';

export type CommandAction = 'create' | 'criar' | 'delete' | 'remover' | 'update' | 'atualizar' | 'complete' | 'concluir' | 'summarize' | 'resumir';

export interface Command {
  entity: string; // e.g., 'habito', 'journal', 'financial'
  action: CommandAction;
  params: Record<string, any>;
}

// Try to parse commands from assistant text. Support JSON blocks or simple parenthesis tuples.
export function parseCommands(text: string): Command[] {
  const cmds: Command[] = [];

  // 1) Try to find JSON arrays/objects inside the message
  const jsonMatch = text.match(/```\s*json\s*([\s\S]*?)```/i) || text.match(/({[\s\S]*})/m) || text.match(/(\[[\s\S]*\])/m);
  if (jsonMatch) {
    const candidate = jsonMatch[1] || jsonMatch[0];
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) {
        parsed.forEach(p => {
          if (p.entity && p.action) cmds.push({ entity: String(p.entity).toLowerCase(), action: p.action as CommandAction, params: p.params || {} });
        });
      } else if (parsed && typeof parsed === 'object') {
        if (parsed.entity && parsed.action) cmds.push({ entity: String(parsed.entity).toLowerCase(), action: parsed.action as CommandAction, params: parsed.params || {} });
      }
      if (cmds.length) return cmds;
    } catch (e) {
      // fallthrough
    }
  }

  // 2) Parenthesis style: (habito, criar, nome: Dormir cedo, dias: [1,2,3])
  const parenRegex = /\(([^)]+)\)/g;
  let m;
  while ((m = parenRegex.exec(text)) !== null) {
    const inside = m[1];
    const parts = inside.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const entity = parts[0].toLowerCase();
      const action = parts[1].toLowerCase() as CommandAction;
      const params: Record<string, any> = {};
      for (let i = 2; i < parts.length; i++) {
        const kv = parts[i].split(':');
        if (kv.length >= 2) {
          const key = kv[0].trim();
          const val = kv.slice(1).join(':').trim();
          // try JSON parse value
          try { params[key] = JSON.parse(val); } catch (e) { params[key] = val; }
        }
      }
      cmds.push({ entity, action, params });
    }
  }

  // 3) Line-based instructions: each line like "habito:create name=... days=1,2"
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    // skip lines that look like parenthesis tuples (they are parsed above)
    if (line.startsWith('(')) continue;
    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      const entity = parts[0].toLowerCase();
      const action = parts[1].toLowerCase() as CommandAction;
      const params: Record<string, any> = {};
      for (let i = 2; i < parts.length; i++) {
        const [k, v] = parts[i].split('=');
        if (k && v !== undefined) {
          try { params[k] = JSON.parse(v); } catch (e) { params[k] = v; }
        }
      }
      cmds.push({ entity, action, params });
    }
  }

  // Deduplicate commands to avoid duplicates from overlapping regex matches
  const unique: Command[] = [];
  const seen = new Set<string>();
  for (const c of cmds) {
    try {
      const key = JSON.stringify([c.entity, c.action, c.params || {}]);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    } catch (e) {
      unique.push(c);
    }
  }

  return unique;
}


export async function executeCommand(cmd: Command): Promise<{ ok: boolean; message?: string; result?: any }> {
  const e = cmd.entity;
  const a = cmd.action;
  const p = cmd.params || {};

  let res: { ok: boolean; message?: string; result?: any } = { ok: false, message: 'Comando não reconhecido' };

  try {
    if ((e === 'habito' || e === 'habit') && (a === 'create' || a === 'criar')) {
      const name = p.nome || p.name || 'Novo hábito';
      const days = p.dias || p.days || [];
      const weight = p.peso || p.weight || 1;
      const category = p.categoria || p.category || 'disciplina';
      const habit = storage.addHabit({ name, daysOfWeek: days, weight, category, time: '', isEssential: false, additionalInfo: '' } as any);
      res = { ok: true, message: 'Hábito criado', result: habit };
    } else if ((e === 'habito' || e === 'habit') && (a === 'delete' || a === 'remover')) {
      const id = p.id || p.ID || p.name;
      if (!id) res = { ok: false, message: 'ID do hábito não fornecido' };
      else {
        const ok = storage.deleteHabit(id);
        res = { ok, message: ok ? 'Hábito removido' : 'Hábito não encontrado' };
      }
    } else if ((String(e) === 'habito' || String(e) === 'habit') && (String(a) === 'complete' || String(a) === 'concluir')) {
      // support completing a habit for today with optional status and justification
      const id = p.id || p.ID || p.habitId || p.habit;
      if (!id) {
        res = { ok: false, message: 'ID do hábito não fornecido' };
      } else {
        const rawStatus = (p.status || p.estado || 'completed');
        const s = String(rawStatus).toLowerCase();
        let mappedStatus: any = 'completed';
        if (s.includes('just')) mappedStatus = 'justified';
        else if (s.includes('not') || s.includes('nao') || s.includes('não') || s.includes('not_completed') || s.includes('nao_concluido')) mappedStatus = 'not_completed';
        else mappedStatus = 'completed';
        const justification = p.justification || p.justificacao || p.justify || p.justificativa || undefined;
        const ok = storage.completeHabit(id, mappedStatus, justification);
        res = { ok, message: ok ? `Hábito marcado como ${mappedStatus}` : 'Hábito não encontrado' };
      }
    } else if ((e === 'journal' || e === 'diario' || e === 'entrada') && (a === 'create' || a === 'criar')) {
      const title = p.titulo || p.title || '';
      const content = p.texto || p.content || p.body || '';
      const mood = p.mood || p.humor || null;
      const entry = storage.addJournalEntry({ title, content, mood } as any);
      res = { ok: true, message: 'Entrada de diário criada', result: entry };
    } else if ((e === 'journal' || e === 'diario') && (a === 'delete' || a === 'remover')) {
      const id = p.id;
      if (!id) res = { ok: false, message: 'ID da entrada não fornecido' };
      else {
        const ok = storage.deleteJournalEntry(id);
        res = { ok, message: ok ? 'Entrada removida' : 'Entrada não encontrada' };
      }
    } else if ((e === 'journal' || e === 'diario' || e === 'entrada') && (a === 'summarize' || a === 'resumir')) {
      // Summarize journal entries for a given period (default: last 7 days)
      const period = (p.period || p.periodo || 'semana').toString().toLowerCase();
      const all = storage.getJournalEntries() || [];
      const now = new Date();
      const fromDate = new Date(now);
      if (period === 'semana' || period === '7' || period === '7dias' || period === '7_days') {
        fromDate.setDate(now.getDate() - 6); // include today and previous 6 days
      } else if (period === 'mes' || period === '30' || period === '30dias' || period === '30_days') {
        fromDate.setDate(now.getDate() - 29);
      } else if (/^\d+$/.test(period)) {
        // numeric days
        const days = parseInt(period, 10) || 7;
        fromDate.setDate(now.getDate() - (days - 1));
      } else {
        // default to 7 days
        fromDate.setDate(now.getDate() - 6);
      }

      const fromStr = fromDate.toISOString().split('T')[0];
      const toStr = now.toISOString().split('T')[0];

      const entries = all.filter((e: any) => e.date >= fromStr && e.date <= toStr);

      const count = entries.length;
      const avgMood = count > 0 ? Math.round((entries.reduce((s: number, x: any) => s + (Number(x.mood) || 0), 0) / count) * 10) / 10 : null;

      const positives = entries.map((x: any) => x.whatWentWell || '').filter(Boolean).slice(0, 5);
      const negatives = entries.map((x: any) => x.whatToImprove || '').filter(Boolean).slice(0, 5);

      let summary = `Resumo (${fromStr} → ${toStr}): ${count} entrada(s)`;
      if (avgMood !== null) summary += `, humor médio ${avgMood}/10.`;
      if (positives.length) summary += ` Pontos positivos: ${positives.join(' | ')}.`;
      if (negatives.length) summary += ` Pontos a melhorar: ${negatives.join(' | ')}.`;

      res = { ok: true, message: 'Resumo gerado', result: { count, avgMood, positives, negatives, summary, entries } };
    } else if ((e === 'finance' || e === 'financial' || e === 'financas') && (a === 'create' || a === 'criar')) {
      const amount = Number(p.amount || p.valor || 0);
      const type = p.type || p.tipo || 'expense';
      const category = p.category || p.categoria || '';
      const date = p.date || p.data || new Date().toISOString().split('T')[0];
      const note = p.note || p.nota || '';
      const entry = storage.addFinancialEntry({ amount, type, category, date, note } as any);
      res = { ok: true, message: 'Lançamento financeiro criado', result: entry };
    } else if ((e === 'finance' || e === 'financas') && (a === 'delete' || a === 'remover')) {
      const id = p.id;
      if (!id) res = { ok: false, message: 'ID do lançamento não fornecido' };
      else {
        const ok = storage.deleteFinancialEntry(id);
        res = { ok, message: ok ? 'Lançamento removido' : 'Não encontrado' };
      }
    } else if ((e === 'curso' || e === 'course') && (a === 'create' || a === 'criar')) {
      const title = p.titulo || p.title || 'Novo curso';
      const course = storage.addCourse({ title } as any);
      res = { ok: true, message: 'Curso criado', result: course };
    } else if ((e === 'curso' || e === 'course') && (a === 'delete' || a === 'remover')) {
      const id = p.id;
      if (!id) res = { ok: false, message: 'ID do curso não fornecido' };
      else {
        const ok = storage.deleteCourse(id);
        res = { ok, message: ok ? 'Curso removido' : 'Não encontrado' };
      }
    } else if ((e === 'quiz' || e === 'pergunta' || e === 'question') && (a === 'create' || a === 'criar')) {
      const question = p.question || p.pergunta || p.text || '';
      const choices = p.choices || p.opcoes || p.options || [];
      const answer = p.answer || p.resposta || p.correct || '';
      const category = p.category || p.categoria || 'general';
      try {
        const q = storage.addQuizQuestion({ question, choices, answer, category } as any);
        res = { ok: true, message: 'Pergunta criada', result: q };
      } catch (err: any) {
        res = { ok: false, message: String(err?.message || err) };
      }
    } else if ((e === 'quiz' || e === 'pergunta' || e === 'question') && (a === 'delete' || a === 'remover')) {
      const id = p.id;
      if (!id) res = { ok: false, message: 'ID da pergunta não fornecido' };
      else {
        const ok = storage.deleteQuizQuestion(id);
        res = { ok, message: ok ? 'Pergunta removida' : 'Pergunta não encontrada' };
      }
    } else {
      res = { ok: false, message: `Comando não reconhecido: ${cmd.entity} ${cmd.action}` };
    }
  } catch (err: any) {
    res = { ok: false, message: String(err?.message || err) };
  }

  try {
    pushAudit({ command: cmd, result: res });
  } catch (e) {
    // noop
  }

  return res;
}
