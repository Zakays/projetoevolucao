import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '@/lib/storage';

describe('Quiz stats (storage)', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.importData('{}');
  });

  it('aggregates stats correctly', () => {
    storage.addQuizResult({ score: 8, totalQuestions: 10, correctAnswers: 8, timeSpent: 30, category: 'math', difficulty: 'easy', questions: [], userAnswers: [] });
    storage.addQuizResult({ score: 6, totalQuestions: 10, correctAnswers: 6, timeSpent: 40, category: 'math', difficulty: 'medium', questions: [], userAnswers: [] });
    storage.addQuizResult({ score: 9, totalQuestions: 10, correctAnswers: 9, timeSpent: 25, category: 'geografia', difficulty: 'easy', questions: [], userAnswers: [] });

    const stats = storage.getQuizStats();

    expect(stats.totalAttempts).toBe(3);
    // averageScore: (8 + 6 + 9) / 3 = 7.666... -> rounded to 1 decimal 7.7
    expect(stats.averageScore).toBeCloseTo(7.7, 1);
    expect(stats.bestScore).toBe(9);
    expect(stats.byCategory.math.attempts).toBe(2);
    expect(stats.byCategory.math.averageScore).toBeCloseTo((8 + 6) / 2, 1);
    expect(stats.byCategory.geografia.attempts).toBe(1);
  });
});