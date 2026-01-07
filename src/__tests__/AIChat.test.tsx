import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AIChat from '@/components/AIChat';
import { storage } from '@/lib/storage';

vi.mock('@/lib/ai', () => ({
  generateReply: vi.fn(),
}));

import { generateReply } from '@/lib/ai';

describe('AIChat', () => {
  let getAIConversationsSpy: any;
  let getSettingsSpy: any;
  let addAIMessageSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    getAIConversationsSpy = vi.spyOn(storage, 'getAIConversations');
    getSettingsSpy = vi.spyOn(storage, 'getSettings');
    addAIMessageSpy = vi.spyOn(storage, 'addAIMessage');
  });

  afterEach(() => {
    getAIConversationsSpy.mockRestore();
    getSettingsSpy.mockRestore();
    addAIMessageSpy.mockRestore();
  });

  it('renders persisted messages from storage', () => {
    getAIConversationsSpy.mockReturnValue([
      { role: 'user', text: 'Oi', createdAt: new Date().toISOString() },
      { role: 'assistant', text: 'Olá', createdAt: new Date().toISOString() }
    ]);
    getSettingsSpy.mockReturnValue({ aiApiKeys: ['test-key'] } as any);

    render(<AIChat />);

    expect(screen.getByText('Oi')).toBeInTheDocument();
    expect(screen.getByText('Olá')).toBeInTheDocument();
  });

  it('sends a message and appends assistant reply', async () => {
    getAIConversationsSpy.mockReturnValue([]);
    getSettingsSpy.mockReturnValue({ aiApiKeys: ['test-key'] } as any);
    addAIMessageSpy.mockImplementation(() => {});

    const mockedGenerate = vi.mocked(generateReply);
    mockedGenerate.mockResolvedValue('Resposta do assistant');

    render(<AIChat />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Teste' } });

    const sendButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(vi.mocked(generateReply)).toHaveBeenCalledWith('Teste');
    });

    await waitFor(() => {
      expect(screen.getByText('Resposta do assistant')).toBeInTheDocument();
    });

    expect(addAIMessageSpy).toHaveBeenCalled();
  });

  it('shows warning when no key configured and disables send', () => {
    getAIConversationsSpy.mockReturnValue([]);
    getSettingsSpy.mockReturnValue({} as any);

    render(<AIChat />);

    expect(screen.getByText(/sem chave de api/i)).toBeInTheDocument();
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    expect(sendButton).toBeDisabled();
  });
});