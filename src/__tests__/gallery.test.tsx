import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import Gallery from '@/components/Gallery';
import { storage } from '@/lib/storage';

// small helper to seed files
function seedFiles() {
  storage.data.records.uploadedFiles = [
    { id: 'a', originalName: 'a.jpg', type: 'image/jpeg', size: 1024, previewUrl: 'a', category: 'uploads', tags: [] },
    { id: 'b', originalName: 'b.jpg', type: 'image/jpeg', size: 2048, previewUrl: 'b', category: 'uploads', tags: [] },
  ] as any;
}

describe('Gallery selection and compare', () => {
  beforeEach(() => {
    localStorage.clear();
    seedFiles();
  });

  it('lets you select two images for comparison', async () => {
    const user = userEvent.setup();
    render(<Gallery />);

    // Use the "Comparar 2 primeiras" button which programmatically selects two images
    const compareBtn = screen.getByRole('button', { name: /Comparar 2 primeiras/i });
    await user.click(compareBtn);

    // dialog title should show 'Comparação'
    const dialogTitle = await screen.findByText(/Comparação/i);
    expect(dialogTitle).toBeInTheDocument();
  });

  it('lets you select two images via checkboxes and compare selected', async () => {
    const user = userEvent.setup();
    render(<Gallery />);

    // select images
    const selectA = await screen.findByTestId('gallery-select-a');
    const selectB = await screen.findByTestId('gallery-select-b');

    await user.click(selectA);
    await user.click(selectB);

    // click compare selected
    const compareSelected = screen.getByTestId('gallery-compare-selected');
    await user.click(compareSelected);

    const dialogTitle = await screen.findByText(/Comparação/i);
    expect(dialogTitle).toBeInTheDocument();
  });
});