import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, beforeEach, expect } from 'vitest';
import { storage } from '@/lib/storage';
import { Navigation } from '@/components/Navigation';

describe('Navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.importData('{}');
  });

  it('shows due vocabulary count when there are due items', () => {
    storage.addVocabularyWord({ word: 'Casa', definition: 'Home', exampleSentence: 'Minha casa', category: 'geral', difficulty: 'easy' });
    render(<MemoryRouter><Navigation /></MemoryRouter>);

    expect(screen.getByText(/Vocabulário/)).toBeInTheDocument();
    // Due count should be visible as a destructive Badge with number 1
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});