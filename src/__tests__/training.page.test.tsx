import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Training from '@/pages/Training';
import { storage } from '@/lib/storage';

describe('Training page', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.importData('{}');
  });

  it('shows total repetitions per exercise in history', () => {
    const workout = {
      id: 'w-test-1',
      date: '2025-12-31',
      type: 'treino',
      exercises: [
        { id: 'e1', name: 'Abdômen', sets: [{ reps: 5 }, { reps: 10 }] }
      ],
    } as any;

    storage.importData(JSON.stringify({ workouts: [workout] }));

    render(<MemoryRouter><Training /></MemoryRouter>);

    const badge = screen.getByTestId(`exercise-badge-${workout.id}-0`);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Abdômen (15)');
  });

  it('shows total repetitions per exercise in today workout section', () => {
    const today = new Date().toISOString().split('T')[0];
    const workout = {
      id: 'w-today-1',
      date: today,
      type: 'treino',
      exercises: [
        { id: 'e1', name: 'Flexao', sets: [{ reps: 8 }, { reps: 7 }] }
      ],
    } as any;

    storage.importData(JSON.stringify({ workouts: [workout] }));

    render(<MemoryRouter><Training /></MemoryRouter>);

    const badge = screen.getByTestId('exercise-badge-today-0');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Flexao (15)');
  });
});