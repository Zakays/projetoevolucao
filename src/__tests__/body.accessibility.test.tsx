import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Body from '@/pages/Body';
import { storage } from '@/lib/storage';

describe('Body accessibility', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.importData('{}');
    vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
  });

  it('confirm delete button has accessible name', async () => {
    const user = userEvent.setup();

    const added = storage.addBodyMeasurement({
      date: '2026-01-02',
      weight: 70,
      measurements: { chest: 90 },
      selfAssessment: { energy: 6, confidence: 6, selfEsteem: 6 },
      notes: 'a11y-test',
    });

    render(<MemoryRouter><Body /></MemoryRouter>);

    // Trigger the delete flow for this specific measurement
    const deleteTrigger = screen.getByLabelText(new RegExp(added.id));
    await user.click(deleteTrigger);

    const dialog = await screen.findByRole('alertdialog');

    // The confirm action should have an accessible name that includes the measurement id
    const confirmButton = within(dialog).getByRole('button', { name: new RegExp(`Confirmar exclusao medicao ${added.id}`) });
    expect(confirmButton).toBeInTheDocument();
  });
});
