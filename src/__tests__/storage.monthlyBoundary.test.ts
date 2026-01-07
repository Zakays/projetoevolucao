import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storage } from '@/lib/storage';

describe('Monthly archiving at month boundary', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.importData('{}');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('places yesterday stats into the correct month chart (previous month) when crossing month boundary', () => {
    // Simulate Dec 31, 2025 (midday)
    const dec31 = new Date('2025-12-31T12:00:00Z');
    vi.setSystemTime(dec31);

    const weekday = dec31.getDay();
    const habit = storage.addHabit({
      name: 'End of month habit',
      daysOfWeek: [weekday],
      weight: 3,
    });

    // Complete habit on Dec 31
    storage.completeHabit(habit.id, 'completed');

    // Advance to Jan 1, 2026 and trigger midnight reset
    const jan1 = new Date('2026-01-01T00:05:00Z');
    vi.setSystemTime(jan1);

    // Call the private reset method directly for testing
    (storage as any).performMidnightReset();

    // Stats for 2025-12-31 should be present in December chart
    const decChart = storage.getMonthlyChart('2025-12');
    expect(decChart).not.toBeNull();
    expect(decChart?.dailyStats.find(s => s.date === '2025-12-31')).toBeDefined();

    // If a January chart exists, it should not contain the Dec 31 stat (but chart creation may vary by timezone)
    const janChart = storage.getMonthlyChart('2026-01');
    if (janChart) {
      expect(janChart.dailyStats.find(s => s.date === '2025-12-31')).toBeUndefined();
    }

    // And getDailyStats should return the correct stats for 2025-12-31
    const stats = storage.getDailyStats('2025-12-31');
    expect(stats).not.toBeNull();
    expect(stats?.completedHabits).toBe(1);
  });
});