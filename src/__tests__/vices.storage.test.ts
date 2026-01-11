import { describe, beforeEach, test, expect } from 'vitest';
import { storage, LocalStorageManager, formatDate } from '@/lib/storage';

describe('Vices storage', () => {
  beforeEach(() => {
    LocalStorageManager.getInstance().resetForTests();
  });

  test('can add a vice and retrieve it', () => {
    const v = storage.addVice({ name: 'Smoking', note: 'Stop it' });
    const all = storage.getVices();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe('Smoking');
  });

  test('toggle days and compute streak', () => {
    const v = storage.addVice({ name: 'Sweets' });
    // mark today clean
    const today = formatDate(new Date());
    storage.toggleViceDay(v.id, 'clean', today);
    expect(storage.getViceStreak(v.id)).toBe(1);

    // mark yesterday clean
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yesterday = formatDate(y);
    storage.toggleViceDay(v.id, 'clean', yesterday);
    expect(storage.getViceStreak(v.id)).toBe(2);

    // mark two days ago relapse -> breaks streak back to 0
    const d2 = new Date(); d2.setDate(d2.getDate() - 2);
    const d2s = formatDate(d2);
    storage.toggleViceDay(v.id, 'relapse', d2s);
    expect(storage.getViceStreak(v.id)).toBe(0);

    // remove relapse day and set two days ago clean -> streak should be 3
    storage.toggleViceDay(v.id, 'relapse', d2s); // toggles off
    storage.toggleViceDay(v.id, 'clean', d2s);
    expect(storage.getViceStreak(v.id)).toBe(3);
  });
});