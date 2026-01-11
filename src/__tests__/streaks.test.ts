import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storage } from '@/lib/storage';

describe('Habit streak edge-cases', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.importData('{}');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('increments streak across consecutive days', () => {
    // Jan 1 completed
    const jan1 = new Date('2026-01-01T12:00:00Z');
    vi.setSystemTime(jan1);

    const weekday = jan1.getDay();
    const habit = storage.addHabit({ name: 'Daily test', daysOfWeek: [weekday], weight: 1, category: 'saude', isEssential: false });

    storage.completeHabit(habit.id, 'completed');
    let h = storage.getHabits().find(hb => hb.id === habit.id);
    expect(h?.streak).toBe(1);

    // Jan 2 completed
    const jan2 = new Date('2026-01-02T12:00:00Z');
    vi.setSystemTime(jan2);

    storage.completeHabit(habit.id, 'completed');

    h = storage.getHabits().find(hb => hb.id === habit.id);
    expect(h?.streak).toBe(2);
  });

  it('missed day resets streak', () => {
    // Jan 1 completed
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    const weekday = new Date('2026-01-01T12:00:00Z').getDay();
    const habit = storage.addHabit({ name: 'Miss test', daysOfWeek: [weekday], weight: 1, category: 'saude', isEssential: false });

    storage.completeHabit(habit.id, 'completed');
    let h = storage.getHabits().find(hb => hb.id === habit.id);
    expect(h?.streak).toBe(1);

    // Skip Jan 2 (no completion)
    // Move to Jan 3 and complete
    vi.setSystemTime(new Date('2026-01-03T12:00:00Z'));
    storage.completeHabit(habit.id, 'completed');

    h = storage.getHabits().find(hb => hb.id === habit.id);
    expect(h?.streak).toBe(1); // streak reset because Jan 2 was missed
  });

  it('justified day counts as completed for streak', () => {
    // Jan 1 completed
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    const weekday = new Date('2026-01-01T12:00:00Z').getDay();
    const habit = storage.addHabit({ name: 'Justify test', daysOfWeek: [weekday], weight: 1, category: 'saude', isEssential: false });

    storage.completeHabit(habit.id, 'completed');

    // Jan 2 justified
    vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
    storage.completeHabit(habit.id, 'justified', 'Was traveling');

    // Jan 3 completed
    vi.setSystemTime(new Date('2026-01-03T12:00:00Z'));
    storage.completeHabit(habit.id, 'completed');

    const h = storage.getHabits().find(hb => hb.id === habit.id);
    expect(h?.streak).toBe(3);
  });

  it('lastCompleted updates only for actual completed days', () => {
    // Jan 1 completed
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    const weekday = new Date('2026-01-01T12:00:00Z').getDay();
    const habit = storage.addHabit({ name: 'LastCompleted test', daysOfWeek: [weekday], weight: 1, category: 'saude', isEssential: false });

    storage.completeHabit(habit.id, 'completed');
    // Jan 2 justified
    vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
    storage.completeHabit(habit.id, 'justified');

    let h = storage.getHabits().find(hb => hb.id === habit.id);
    // Since latest status is 'justified', lastCompleted should still be Jan 1
    expect(h?.lastCompleted).toBe('2026-01-01');

    // Jan 3 completed
    vi.setSystemTime(new Date('2026-01-03T12:00:00Z'));
    storage.completeHabit(habit.id, 'completed');

    h = storage.getHabits().find(hb => hb.id === habit.id);
    expect(h?.lastCompleted).toBe('2026-01-03');
  });
});