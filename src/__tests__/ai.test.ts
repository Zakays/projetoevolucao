import { describe, it, expect } from 'vitest';
import { generateReply } from '@/lib/ai';

describe('ai.generateReply', () => {
  it('returns a fallback simulated reply when no env configured', async () => {
    const res = await generateReply('teste');
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
    // fallback returns a tuple example
    expect(res.includes('habito') || res.includes('{')).toBeTruthy();
  });
});
