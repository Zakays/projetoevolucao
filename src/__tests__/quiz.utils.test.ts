import { describe, it, expect } from 'vitest';
import { chooseNextQuestionIndex } from '@/lib/quizUtils';

const makeQ = (id: string, difficulty: 'easy'|'medium'|'hard') => ({ id, question: id, options: ['a','b','c'], correctAnswer: 0, category: 'test', difficulty, tags: [] });

describe('chooseNextQuestionIndex', () => {
  it('prefers harder or same difficulty when correct', () => {
    const qs = [makeQ('q1','easy'), makeQ('q2','medium'), makeQ('q3','hard')];
    const idx = chooseNextQuestionIndex(qs, 0, true);
    // from easy and correct, should pick medium (index 1)
    expect(idx).toBe(1);
  });

  it('prefers easier difficulty when incorrect', () => {
    const qs = [makeQ('q1','hard'), makeQ('q2','medium'), makeQ('q3','easy')];
    const idx = chooseNextQuestionIndex(qs, 0, false);
    // from hard and wrong, should pick medium or easy; expect medium (index 1)
    expect(idx).toBe(1);
  });

  it('falls back to next sequential when no difficulty candidates', () => {
    const qs = [makeQ('q1','medium'), makeQ('q2','medium')];
    const idx = chooseNextQuestionIndex(qs, 0, true);
    expect(idx).toBe(1);
  });
});