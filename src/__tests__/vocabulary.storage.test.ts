import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '@/lib/storage';

describe('Vocabulary storage', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.importData('{}');
  });

  it('can add, update, delete and mark reviewed', () => {
    const w = storage.addVocabularyWord({ word: 'Teste', definition: 'Definição', exampleSentence: 'Exemplo', category: 'geral', difficulty: 'easy' });

    expect(storage.getVocabulary().length).toBe(1);

    const okUpdate = storage.updateVocabularyWord(w.id, { definition: 'Nova definição' });
    expect(okUpdate).toBe(true);
    const updated = storage.getVocabulary().find(x => x.id === w.id)!;
    expect(updated.definition).toBe('Nova definição');

    const okReview = storage.markVocabularyReviewed(w.id, true);
    expect(okReview).toBe(true);
    const afterReview = storage.getVocabulary().find(x => x.id === w.id)!;
    expect(afterReview.reviewCount).toBe(1);
    expect(afterReview.lastReviewed).toBeTruthy();
    expect(afterReview.nextReviewAt).toBeTruthy();
    expect(afterReview.intervalDays).toBeGreaterThanOrEqual(1);
    expect(new Date(afterReview.nextReviewAt!).getTime()).toBeGreaterThan(new Date(afterReview.lastReviewed + 'T00:00:00').getTime());

    const okDelete = storage.deleteVocabularyWord(w.id);
    expect(okDelete).toBe(true);
    expect(storage.getVocabulary().length).toBe(0);
  });
});