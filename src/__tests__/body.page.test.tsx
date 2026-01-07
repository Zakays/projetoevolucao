import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Body from '@/pages/Body';
import { storage } from '@/lib/storage';

describe('Body page (UI)', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.importData('{}');
    vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
  });

  it('shows empty state when no measurements exist', () => {
    render(<MemoryRouter><Body /></MemoryRouter>);
    expect(screen.getByText(/Nenhuma medicao registrada ainda/i)).toBeInTheDocument();
  });

  it('can create a measurement using the dialog', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Body /></MemoryRouter>);

    // Open dialog
    const newBtn = screen.getByRole('button', { name: /Nova Medicao/i });
    await user.click(newBtn);

    // Submit with defaults (date required will be prefilled)
    const submitBtn = screen.getByRole('button', { name: /Registrar Medicao/i });
    await user.click(submitBtn);

    // After submit, storage should contain one measurement
    const all = storage.getBodyMeasurements();
    expect(all.length).toBe(1);

    // And the UI should show the new measurement date
    // Expected formatted date: 02/01/2026 (pt-BR)
    expect(screen.getAllByText('02/01/2026').length).toBeGreaterThanOrEqual(1);
  });

  it('renders measurements coming from storage', () => {
    storage.addBodyMeasurement({
      date: '2026-01-02',
      weight: 72,
      measurements: { chest: 95, waist: 78, hips: 100 },
      selfAssessment: { energy: 7, confidence: 6, selfEsteem: 6 },
      notes: 'Feeling good'
    });

    render(<MemoryRouter><Body /></MemoryRouter>);

    // Verify date and a visible field
    expect(screen.getAllByText('02/01/2026').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Peso:/i)).toBeInTheDocument();
    // There are multiple elements showing the same weight (large and small), assert at least one
    expect(screen.getAllByText(/72 kg/).length).toBeGreaterThanOrEqual(1);
  });

  it('deletes a measurement after confirmation', async () => {
    const user = userEvent.setup();

    const added = storage.addBodyMeasurement({
      date: '2026-01-02',
      weight: 72,
      measurements: { chest: 95 },
      selfAssessment: { energy: 7, confidence: 6, selfEsteem: 6 },
      notes: `test-delete-${Date.now()}`,
    });

    render(<MemoryRouter><Body /></MemoryRouter>);

    // ensure it's rendered
    expect(screen.getAllByText('02/01/2026').length).toBeGreaterThanOrEqual(1);

    // ensure the measurement exists in storage
    const allBefore = storage.getBodyMeasurements();
    expect(allBefore.find(m => m.id === added.id)).toBeDefined();

    // ensure there's exactly one delete trigger for this id (deterministic by testid)
    const deleteTrigger = screen.getByTestId(`delete-button-${added.id}`);
    await user.click(deleteTrigger);

    // Confirm dialog confirm button is targeted by testid
    const dialog = await screen.findByRole('alertdialog');
    const confirmButton = within(dialog).getByTestId(`confirm-delete-${added.id}`);

    // spy on deleteBodyMeasurement to ensure it's invoked for correct id
    const spy = vi.spyOn(storage, 'deleteBodyMeasurement');

    await user.click(confirmButton);

    await waitFor(() => expect(spy).toHaveBeenCalledWith(added.id), { timeout: 2000 });
    await waitFor(() => expect(storage.getBodyMeasurements().find(m => m.id === added.id)).toBeUndefined(), { timeout: 2000 });

    spy.mockRestore();

    // The measurement's delete trigger should be gone (stable selector tied to id)
    await waitFor(() => expect(screen.queryByTestId(`delete-button-${added.id}`)).toBeNull(), { timeout: 2000 });
  });
});