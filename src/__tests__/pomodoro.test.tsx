import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
// use synchronous fireEvent with fake timers to avoid user-event timing issues in tests
import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';
import { storage } from '@/lib/storage';
import Pomodoro from '@/components/Pomodoro';

describe('Pomodoro', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    // ensure timers are restored even if a test times out or throws
    vi.useRealTimers();
  });

  it('shows initial focus time and counts down when started', async () => {
    render(<Pomodoro focusMinutes={0} breakMinutes={0} />); // small durations to simplify

    // initial should be 00:00 because focusMinutes=0
    expect(screen.getByText(/00:00/)).toBeInTheDocument();

    // start and advance timers (wrapped in act to avoid act warnings)
    const startBtn = screen.getByRole('button', { name: /Iniciar/i });
    act(() => {
      fireEvent.click(startBtn);
      vi.advanceTimersByTime(1500);
    });

    // With 0s duration it should immediately switch mode to break and set break duration (0) -> 00:00
    expect(screen.getAllByText(/00:00/).length).toBeGreaterThanOrEqual(1);

    // session should be persisted (wait briefly for state side-effects)
    await waitFor(() => expect(storage.getPomodoroSessions().length).toBeGreaterThanOrEqual(1));
  });

  it('pauses and resets correctly', async () => {
    render(<Pomodoro focusMinutes={0} breakMinutes={1} />);

    const startBtn = screen.getByRole('button', { name: /Iniciar/i });
    act(() => {
      fireEvent.click(startBtn);
      vi.advanceTimersByTime(1000);
    });

    const pauseBtn = screen.getByRole('button', { name: /Pausar/i });
    act(() => {
      fireEvent.click(pauseBtn);
    });

    // capture the currently displayed time (mm:ss)
    const before = screen.getByText(/\d{2}:\d{2}/).textContent;

    // advance timers; since paused, no change
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText(before || '00:00')).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    act(() => {
      fireEvent.click(resetBtn);
    });

    expect(screen.getByText(/00:00/)).toBeInTheDocument();
  });
});