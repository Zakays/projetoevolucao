import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Vocabulary from '@/pages/Vocabulary';
import { storage } from '@/lib/storage';

describe('Vocabulary page (UI)', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.importData('{}');
  });

  it('shows added words and allows marking review', async () => {
    const user = userEvent.setup();
    // add a word via storage
    const w = storage.addVocabularyWord({ word: 'Casa', definition: 'Home', exampleSentence: 'Minha casa', category: 'geral', difficulty: 'easy' });

    render(<MemoryRouter><Vocabulary /></MemoryRouter>);

    expect(screen.getByText(/Casa/)).toBeInTheDocument();

    const reviewBtn = screen.getByTestId(`review-success-${w.id}`);
    await user.click(reviewBtn);

    // after clicking, storage should reflect updated reviewCount
    const updated = storage.getVocabulary().find(x => x.id === w.id)!;
    expect(updated.reviewCount).toBe(1);
    expect(screen.getByText(/Próxima revisão:/i)).toBeInTheDocument();

    // clicking again same day should not increment
    await user.click(reviewBtn);
    const afterSecondClick = storage.getVocabulary().find(x => x.id === w.id)!;
    expect(afterSecondClick.reviewCount).toBe(1); // unchanged
  });
});