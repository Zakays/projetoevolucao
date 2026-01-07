import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import MiniQuiz from '@/components/MiniQuiz';
import { storage } from '@/lib/storage';

describe('MiniQuiz', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.importData('{}');
  });

  it('starts, answers questions, shows score and persists result', () => {
    render(<MiniQuiz />);

    // set category/difficulty then start
    fireEvent.change(screen.getByLabelText(/Categoria do MiniQuiz/i), { target: { value: 'geografia' } });
    fireEvent.change(screen.getByLabelText(/Dificuldade do MiniQuiz/i), { target: { value: 'any' } });

    const start = screen.getByRole('button', { name: /Iniciar Mini-Quiz/i });
    fireEvent.click(start);

    // first question should be visible
    expect(screen.getByText(/Pergunta 1/)).toBeInTheDocument();

    // pick correct answer for q1 -> Brasília is option index 1
    const option1 = screen.getByRole('button', { name: /option-1/i });
    fireEvent.click(option1);

    // next
    const next = screen.getByRole('button', { name: /Próxima pergunta/i });
    fireEvent.click(next);

    // answer q2 incorrectly
    const opt0 = screen.getByRole('button', { name: /option-0/i });
    fireEvent.click(opt0);
    fireEvent.click(next);

    // answer q3 correctly
    const opt2 = screen.getByRole('button', { name: /option-2/i });
    fireEvent.click(opt2);
    fireEvent.click(next);

    // after finishing, score should be shown and persisted
    expect(screen.getByText(/Você concluiu!/i)).toBeInTheDocument();
    const results = storage.getQuizResults();
    expect(results.length).toBeGreaterThanOrEqual(1);
    const last = results[results.length - 1];
    expect(last.correctAnswers).toBeGreaterThanOrEqual(1);
    expect(last.category).toBe('geografia');

    // Reset should show the start button again
    const restart = screen.getByRole('button', { name: /Reiniciar Mini-Quiz/i });
    fireEvent.click(restart);

    expect(screen.getByRole('button', { name: /Iniciar Mini-Quiz/i })).toBeInTheDocument();
  });

  it('shows explanation when available', () => {
    const q = [{ id: 'x1', question: 'Q?', options: ['a','b'], answerIndex: 0, explanation: 'Because it is A' }];
    render(<MiniQuiz questions={q as any} maxQuestions={1} />);

    fireEvent.click(screen.getByRole('button', { name: /Iniciar Mini-Quiz/i }));
    fireEvent.click(screen.getByRole('button', { name: /option-0/i }));

    expect(screen.getByRole('note')).toHaveTextContent(/Because it is A/i);
  });
});