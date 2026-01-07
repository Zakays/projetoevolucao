import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '@/lib/storage';

describe('Quiz storage APIs', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.importData('{}');
    vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
  });

  it('adds and retrieves questions', () => {
    const q = storage.addQuizQuestion({ question: '1+1?', options: ['1','2'], correctAnswer: 1, category: 'math', difficulty: 'easy', tags: [] });
    const all = storage.getQuizQuestions();
    expect(all.find(x => x.id === q.id)).toBeTruthy();
  });

  it('updates and deletes questions', () => {
    const q = storage.addQuizQuestion({ question: 'Capita?', options: ['A','B'], correctAnswer: 0, category: 'geo', difficulty: 'easy', tags: [] });
    const ok = storage.updateQuizQuestion(q.id, { question: 'Capitais?' });
    expect(ok).toBe(true);
    const updated = storage.getQuizQuestions().find(x => x.id === q.id)!;
    expect(updated.question).toBe('Capitais?');

    const del = storage.deleteQuizQuestion(q.id);
    expect(del).toBe(true);
    expect(storage.getQuizQuestions().find(x => x.id === q.id)).toBeUndefined();
  });

  it('records quiz results', () => {
    storage.addQuizResult({ score: 2, totalQuestions: 3, correctAnswers: 2, timeSpent: 30, category: 'test', difficulty: 'easy', questions: [], userAnswers: [] });
    const results = storage.getQuizResults();
    expect(results.length).toBe(1);
    expect(results[0].score).toBe(2);
  });
});