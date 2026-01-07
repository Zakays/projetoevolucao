import { composeMotivationPrompt, sanitizeMotivation } from '@/lib/motivation';

describe('motivation helpers', () => {
  it('compose includes tone and length guidance and history', () => {
    const convo = [
      { role: 'user', text: 'Preciso de motivação' },
      { role: 'assistant', text: 'Você consegue!' }
    ];
    const prompt = composeMotivationPrompt(convo as any, 'encorajador', 'short');
    expect(prompt).toContain('encorajador');
    expect(prompt).toContain('máx 80 caracteres');
    expect(prompt).toContain('user: Preciso de motivação');
    expect(prompt).toContain('assistant: Você consegue!');
  });

  it('sanitize picks first non-empty line and strips quotes and truncates', () => {
    const raw = `\n\n"Essa é a frase do dia"\nMais texto`;
    const s = sanitizeMotivation(raw, 10);
    expect(s.length).toBeLessThanOrEqual(10);
    expect(s).toContain('...');
    const raw2 = `\n\nFrase limpa`;
    expect(sanitizeMotivation(raw2)).toBe('Frase limpa');
  });
});