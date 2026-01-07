import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storage } from '@/lib/storage';

describe('Midnight reset / daily stats', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.importData('{}');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('records yesterday stats into monthly chart after midnight reset', () => {
    // Simulate being on Jan 1, 2026
    const jan1 = new Date('2026-01-01T12:00:00Z');
    vi.setSystemTime(jan1);

    const weekday = jan1.getDay();
    const habit = storage.addHabit({
      name: 'Daily walk',
      daysOfWeek: [weekday],
      weight: 5,
    });

    // Complete habit on Jan 1
    const ok = storage.completeHabit(habit.id, 'completed');
    expect(ok).toBe(true);

    // Streak should be 1 for that habit
    const h = storage.getHabits().find(x => x.id === habit.id);
    expect(h?.streak).toBe(1);

    // Advance to Jan 2, 2026 and trigger midnight reset
    const jan2 = new Date('2026-01-02T00:05:00Z');
    vi.setSystemTime(jan2);

    // Call the private reset method directly for testing
    (storage as any).performMidnightReset();

    const stats = storage.getDailyStats('2026-01-01');
    expect(stats).not.toBeNull();
    expect(stats?.totalHabits).toBe(1);
    expect(stats?.completedHabits).toBe(1);
    expect(stats?.earnedPoints).toBe(5);
    expect(stats?.percentage).toBe(100);

    const chart = storage.getMonthlyChart('2026-01');
    expect(chart).not.toBeNull();
    expect(chart?.dailyStats.find(s => s.date === '2026-01-01')).toBeDefined();
  });
});