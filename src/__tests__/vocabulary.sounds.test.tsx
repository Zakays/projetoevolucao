import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Vocabulary from '@/pages/Vocabulary';
import { storage } from '@/lib/storage';

vi.mock('@/lib/sound', () => ({
  playClick: vi.fn(),
  playSuccess: vi.fn(),
  playFail: vi.fn(),
}));

import { playClick, playSuccess } from '@/lib/sound';

describe('Vocabulary sounds', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.importData('{}');
  });

  it('plays sound on successful review', async () => {
    const user = userEvent.setup();
    const w = storage.addVocabularyWord({ word: 'Casa', definition: 'Home', exampleSentence: 'Minha casa', category: 'geral', difficulty: 'easy' });

    render(<MemoryRouter><Vocabulary /></MemoryRouter>);

    const btn = await screen.findByTestId(`review-success-${w.id}`);
    await user.click(btn);

    expect(playClick).toHaveBeenCalled();
    expect(playSuccess).toHaveBeenCalled();
  });
});