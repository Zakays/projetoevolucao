import { describe, it, expect, beforeEach } from 'vitest';
import { parseCommands, executeCommand } from '@/lib/assistantCommands';
import { storage } from '@/lib/storage';

describe('assistantCommands.parseCommands', () => {
  it('parses JSON blocks', () => {
    const text = '```json\n{"entity":"habito","action":"create","params":{"name":"X","days":[1,2]}}\n```';
    const cmds = parseCommands(text);
    expect(cmds.length).toBe(1);
    expect(cmds[0].entity).toBe('habito');
    expect(cmds[0].action).toBe('create');
  });

  it('parses parenthesis tuples', () => {
    const text = '(habito, criar, nome: "Beber agua", dias: [1,2,3])';
    const cmds = parseCommands(text);
    expect(cmds.length).toBe(1);
    expect(cmds[0].entity).toBe('habito');
    expect(cmds[0].action).toBe('criar');
    expect(cmds[0].params.nome).toContain('Beber');
  });

  it('parses line based commands', () => {
    const text = 'habito create name=Teste days=[1,2]';
    const cmds = parseCommands(text);
    expect(cmds.length).toBe(1);
    expect(cmds[0].entity).toBe('habito');
  });
});

describe('assistantCommands.executeCommand (integration smoke)', () => {
  beforeEach(() => {
    // ensure clean state for storage
    try { localStorage.clear(); } catch (e) { /* noop */ }
  });

  it('can create and delete a habit', async () => {
    const cmd = { entity: 'habito', action: 'create', params: { nome: 'Teste Habit', dias: [1] } } as any;
    const res = await executeCommand(cmd);
    expect(res.ok).toBe(true);
    expect(res.result).toBeDefined();
    const id = res.result?.id;
    expect(id).toBeTruthy();

    const del = await executeCommand({ entity: 'habito', action: 'delete', params: { id } } as any);
    expect(del.ok).toBe(true);
  });

  it('can complete a habit', async () => {
    const cmd = { entity: 'habito', action: 'create', params: { nome: 'Completar Habit', dias: [1] } } as any;
    const res = await executeCommand(cmd);
    expect(res.ok).toBe(true);
    const id = res.result?.id;
    expect(id).toBeTruthy();

    const comp = await executeCommand({ entity: 'habito', action: 'complete', params: { id, status: 'completed' } } as any);
    expect(comp.ok).toBe(true);

    const completions = storage.getHabitCompletions();
    const found = completions.find(c => c.habitId === id && c.status === 'completed');
    expect(found).toBeTruthy();
  });

  it('can summarize journal entries', async () => {
    const today = new Date();
    const d1 = new Date(today);
    d1.setDate(today.getDate() - 1);
    const d2 = new Date(today);
    d2.setDate(today.getDate() - 3);
    const date1 = d1.toISOString().split('T')[0];
    const date2 = d2.toISOString().split('T')[0];

    storage.addJournalEntry({ date: date1, whatWentWell: 'Treinei bem', whatToImprove: 'Dormir mais', howIFelt: 'Energia alta', mood: 8 } as any);
    storage.addJournalEntry({ date: date2, whatWentWell: 'Comi saudável', whatToImprove: 'Planejar refeições', howIFelt: 'Bem', mood: 7 } as any);

    const res = await executeCommand({ entity: 'journal', action: 'summarize', params: { period: '7' } } as any);
    expect(res.ok).toBe(true);
    expect(res.result).toBeDefined();
    expect(res.result.count).toBeGreaterThanOrEqual(2);
    expect(typeof res.result.summary).toBe('string');
    expect(res.result.summary).toContain('Resumo');
  });

  it('can create and delete a quiz question', async () => {
    const cmd = { entity: 'quiz', action: 'create', params: { question: 'O que é SRS?', choices: ['A','B'], answer: 'A' } } as any;
    const res = await executeCommand(cmd);
    expect(res.ok).toBe(true);
    const id = res.result?.id;
    expect(id).toBeTruthy();

    const del = await executeCommand({ entity: 'quiz', action: 'delete', params: { id } } as any);
    expect(del.ok).toBe(true);
  });
});
