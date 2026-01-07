import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Habits from '@/pages/Habits';
import { storage } from '@/lib/storage';

vi.mock('@/lib/sound', () => ({
  playClick: vi.fn(),
  playSuccess: vi.fn(),
  playFail: vi.fn(),
}));

import { playClick, playSuccess } from '@/lib/sound';

describe('Habits sounds', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.importData('{}');
  });

  it('plays success sound when completing a habit', async () => {
    const user = userEvent.setup();
    // add a habit for today (use getWeekDay(formatDate(...)) to avoid timezone mismatch)
    const today = (new Date()).toISOString().split('T')[0];
    const weekDay = new Date(today + 'T00:00:00').getDay();
    storage.addHabit({ name: 'Test Habit', category: 'saude', time: '', daysOfWeek: [weekDay], isEssential: false, weight: 1, additionalInfo: '' });

    render(<MemoryRouter><Habits /></MemoryRouter>);

    // find the habit card
    // the page renders a single checkbox for today's habit
    const checkbox = await screen.findByRole('checkbox');
    await user.click(checkbox);

    expect(playClick).toHaveBeenCalled();
    expect(playSuccess).toHaveBeenCalled();
  });
});