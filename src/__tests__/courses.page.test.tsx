import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, beforeEach, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Courses from '@/pages/Courses';
import { storage } from '@/lib/storage';

describe('Courses page', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.resetForTests();
    storage.importData('{}');
  });

  it('allows adding, editing and deleting a course', async () => {
    const user = userEvent.setup();

    render(<MemoryRouter><Courses /></MemoryRouter>);

    // Open new course dialog
    const newButton = screen.getByRole('button', { name: /Novo Curso/i });
    await user.click(newButton);

    // Verify dialog description exists (accessibility)
    expect(screen.getByText(/Use este formulário para adicionar ou editar informações do curso/i)).toBeInTheDocument();

    // Fill form
    const titleInput = screen.getByLabelText(/Titulo/i);
    await user.type(titleInput, 'Test Course');

    const providerInput = screen.getByLabelText(/Fornecedor/i);
    await user.type(providerInput, 'Test Provider');

    const progressInput = screen.getByLabelText(/Progresso \(%\)/i);
    await user.clear(progressInput);
    await user.type(progressInput, '50');

    const addButton = screen.getByRole('button', { name: /Adicionar/i });
    await user.click(addButton);

    // Expect course to appear
    const courseTitle = await screen.findByText('Test Course');
    expect(courseTitle).toBeInTheDocument();

    // Edit course
    const editBtn = screen.getByLabelText(/Editar curso/i);
    await user.click(editBtn);

    // Change progress
    const progressAfter = screen.getByLabelText(/Progresso \(%\)/i);
    await user.clear(progressAfter);
    await user.type(progressAfter, '80');

    const saveButton = screen.getByRole('button', { name: /Salvar|Adicionar/i });
    await user.click(saveButton);

    // Check updated progress text
    const progressText = await screen.findByText(/Progresso: 80%/i);
    expect(progressText).toBeInTheDocument();

    // Delete course
    const trashBtn = screen.getByLabelText(/Remover curso/i);
    await user.click(trashBtn);
    // Confirm delete
    const confirmBtn = await screen.findByRole('button', { name: /Remover/i });
    await user.click(confirmBtn);

    // Expect course to be removed
    expect(screen.queryByText('Test Course')).not.toBeInTheDocument();
  }, 20000);
});
