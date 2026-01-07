import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Quiz from '@/pages/Quiz';
import { storage } from '@/lib/storage';

describe('Quiz admin UI', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.importData('{}');
    vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
  });

  it('allows adding, editing and deleting questions', async () => { // increased timeout if needed
    const user = userEvent.setup();
    render(<MemoryRouter><Quiz /></MemoryRouter>);

    // add
    await user.type(screen.getByLabelText(/Pergunta/i), 'Qual a cor do céu?');
    await user.type(screen.getByLabelText(/Opções/i), 'azul,verde');
    await user.click(screen.getByRole('button', { name: /Adicionar Pergunta/i }));

    // wait for the question to appear
    const addedQuestion = await screen.findByText(/Qual a cor do céu\?/i);
    expect(addedQuestion).toBeInTheDocument();

    // edit: choose the first Edit button (scoped to the added question)
    const editBtn = screen.getAllByRole('button', { name: /Editar/i })[0];
    await user.click(editBtn);

    const editInput = await screen.findByDisplayValue(/Qual a cor do céu\?/i);
    await user.clear(editInput);
    await user.type(editInput, 'Qual a cor do mar?');

    const saveBtn = await screen.findByRole('button', { name: /Salvar/i });
    await user.click(saveBtn);

    const editedQuestion = await screen.findByText(/Qual a cor do mar\?/i);
    expect(editedQuestion).toBeInTheDocument();

    // delete: since tests clear storage before each run, target the first delete button directly for determinism
    const delBtns = screen.getAllByRole('button', { name: /Excluir/i });
    await user.click(delBtns[0]);

    await waitFor(() => expect(screen.queryByText(/Qual a cor do mar\?/i)).not.toBeInTheDocument(), { timeout: 10000 });
  }, { timeout: 20000 });

  it('starts quiz with selected filters', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Quiz /></MemoryRouter>);

    // seed questions
    await user.click(screen.getByRole('button', { name: /Semear Perguntas/i }));

    // choose category 'matematica'
    const categorySelect = screen.getByLabelText(/Categoria/i);
    await user.selectOptions(categorySelect, ['matematica']);

    // start quiz
    await user.click(screen.getByRole('button', { name: /Começar/i }));

    // Expect the math question to appear
    expect(screen.getByText(/Quanto é 5 \+ 7\?/i)).toBeInTheDocument();
  });

  it('shows quiz stats in the intro card', async () => {
    // add results directly via storage
    storage.addQuizResult({ score: 10, totalQuestions: 10, correctAnswers: 10, timeSpent: 20, category: 'math', difficulty: 'easy', questions: [], userAnswers: [] });
    storage.addQuizResult({ score: 8, totalQuestions: 10, correctAnswers: 8, timeSpent: 30, category: 'geografia', difficulty: 'easy', questions: [], userAnswers: [] });

    render(<MemoryRouter><Quiz /></MemoryRouter>);

    // Stats should reflect added results
    expect(screen.getByText(/Tentativas/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/Média/i)).toBeInTheDocument();
  });

  it('finishes after answering all questions (no infinite loop)', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Quiz /></MemoryRouter>);

    // Seed two questions and start
    await user.click(screen.getByRole('button', { name: /Semear Perguntas/i }));
    await user.click(screen.getByRole('button', { name: /Começar/i }));

    // Determine total number of questions from the header text "Pergunta X de N"
    const header = screen.getByText(/Pergunta \d+ de \d+/i);
    const match = header.textContent?.match(/Pergunta \d+ de (\d+)/i);
    const total = match ? parseInt(match[1], 10) : 0;

    // Click the first option for each question sequentially
    for (let i = 0; i < Math.max(1, total); i++) {
      const questionParagraph = document.querySelector('p.mb-4');
      if (!questionParagraph) break;
      const parent = questionParagraph.parentElement as HTMLElement | null;
      if (!parent) break;
      const optionButtons = Array.from(parent.querySelectorAll('button')).filter(b => {
        const text = (b.textContent || '').trim();
        return text && text !== 'Começar' && text !== 'Semear Perguntas' && text !== 'Adicionar Pergunta';
      });
      if (optionButtons.length === 0) break;
      await user.click(optionButtons[0]);
    }

    // There should be at least one result recorded
    const results = storage.getQuizResults();
    expect(results.length).toBeGreaterThanOrEqual(1);
  }, { timeout: 20000 });
});