import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '@/lib/storage';

describe('Flashcards SRS scheduling', () => {
  beforeEach(() => {
    // Reset localStorage and storage state via importData
    localStorage.clear();
    storage.importData('{}');
    vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
  });

  it('schedules easy result with increased interval and streak increment', () => {
    const card = storage.addFlashcard({ question: 'Q1', answer: 'A1', category: 'test', difficulty: 'medium' });
    // initial values
    expect(card.interval).toBe(1);
    expect(card.ease).toBe(2.5);

    const ok = storage.scheduleReviewResult(card.id, 'easy');
    expect(ok).toBe(true);

    const updated = storage.getFlashcards().find(f => f.id === card.id)!;
    expect(updated.interval).toBeGreaterThan(1);
    // easy multiplies by ease*2.5 => floor(1*2.5*2.5)=6
    expect(updated.interval).toBe(6);
    // streak should be 1
    expect(updated.streak).toBe(1);
    // nextReview is 2026-01-08 (2026-01-02 + 6 days)
    expect(updated.nextReview).toBe('2026-01-08');
  });

  it('schedules again result resetting streak and interval to 1', () => {
    const card = storage.addFlashcard({ question: 'Q2', answer: 'A2', category: 'test', difficulty: 'hard' });
    // simulate a good result first
    storage.scheduleReviewResult(card.id, 'good');
    const afterGood = storage.getFlashcards().find(f => f.id === card.id)!;
    expect(afterGood.streak).toBeGreaterThanOrEqual(1);

    // now again
    const ok = storage.scheduleReviewResult(card.id, 'again');
    expect(ok).toBe(true);

    const updated = storage.getFlashcards().find(f => f.id === card.id)!;
    expect(updated.interval).toBe(1);
    expect(updated.streak).toBe(0);
    // nextReview should be 2026-01-03 (today +1)
    expect(updated.nextReview).toBe('2026-01-03');
  });

  it('schedules hard result with slight interval and ease decrease', () => {
    const card = storage.addFlashcard({ question: 'Q3', answer: 'A3', category: 'test', difficulty: 'hard' });
    const prevEase = card.ease;

    const ok = storage.scheduleReviewResult(card.id, 'hard');
    expect(ok).toBe(true);

    const updated = storage.getFlashcards().find(f => f.id === card.id)!;
    expect(updated.ease).toBeLessThanOrEqual(prevEase);
    expect(updated.interval).toBeGreaterThanOrEqual(1);
  });
});
