import React, { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { generateReply } from '@/lib/ai';
import { toast } from 'sonner';
import { AIMessage } from '@/types';

export default function AIChat({ maxMessages = 50 }: { maxMessages?: number }) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [proxyHealthy, setProxyHealthy] = useState<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const convo = storage.getAIConversations() || [];
    setMessages(convo.slice(-maxMessages));
  }, [maxMessages]);

  useEffect(() => {
    // auto-scroll to bottom
    try {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    } catch (e) { /* noop */ }
  }, [messages]);

  const append = (m: AIMessage) => {
    const next = [...messages, m].slice(-maxMessages);
    setMessages(next);
    try { storage.addAIMessage(m); } catch (e) { /* noop */ }
  };

  const clearChat = () => {
    setMessages([]);
    try { storage.setAIConversations([]); toast.success('Histórico limpo'); } catch (e) { /* noop */ }
  };

  const settings = storage.getSettings();
  const hasKey = Boolean((settings.aiApiKeys && settings.aiApiKeys.length) || (import.meta as any).env.VITE_GEMINI_API_KEY);
  const aiEnabled = settings.aiChatEnabled ?? false;

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: AIMessage = { role: 'user', text: input, createdAt: new Date().toISOString() };
    append(userMsg);
    setInput('');

    setLoading(true);
    try {
      const raw = await generateReply(input);
      const assistantText = String(raw || '');
      // If the model returned an error string, surface it clearly in the UI
      if (assistantText.startsWith('Erro')) {
        setApiError(assistantText);
        toast.error(assistantText);
        const assistantMsg: AIMessage = { role: 'assistant', text: assistantText, createdAt: new Date().toISOString() };
        append(assistantMsg);
        return;
      }
      const assistantMsg: AIMessage = { role: 'assistant', text: assistantText, createdAt: new Date().toISOString() };
      append(assistantMsg);
    } catch (e) {
      toast.error('Erro ao contatar o modelo');
      append({ role: 'assistant', text: 'Erro ao contatar o modelo', createdAt: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && hasKey) send();
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Chat com a IA</CardTitle>
        <div className="space-x-2">
          <Button size="sm" variant="ghost" onClick={clearChat}>Limpar</Button>
        </div>
      </CardHeader>
      {apiError && (
        <div className="p-3 mb-3 rounded bg-red-50 text-sm text-red-800 border border-red-200 flex items-center justify-between">
          <div className="mr-4">{apiError}</div>
          <div className="flex items-center space-x-2">
            <button
              className="text-sm underline"
              onClick={() => {
                navigator.clipboard?.writeText('Abra Configurações → AI Keys e adicione sua Gemini API key (não comite).');
                toast.success('Instruções copiadas para a área de transferência');
              }}
            >
              Copiar instruções de configuração
            </button>
          </div>
        </div>
      )}
      <CardContent className="flex flex-col h-full">
        {!aiEnabled && (
          <div className="p-3 mb-3 rounded bg-yellow-50 text-sm text-yellow-800 border border-yellow-200 flex items-center justify-between">
            <div>⚠️ Chat com IA desabilitado nas configurações.</div>
            <div>
              <button
                className="text-sm underline"
                onClick={() => { window.location.hash = '#/settings'; }}
              >
                Abrir Configurações
              </button>
            </div>
          </div>
        )}
        {!aiEnabled && hasKey && (
          <div className="p-2 mb-3 text-sm text-muted-foreground">Observação: chaves estão configuradas, mas o chat está desativado nas configurações.</div>
        )}
        {!(!aiEnabled) && !hasKey && (
          <div className="p-3 mb-3 rounded bg-yellow-50 text-sm text-yellow-800 border border-yellow-200">
            ⚠️ Sem chave de API configurada — configure em Configurações para ter respostas personalizadas.
          </div>
        )}
        <div ref={containerRef} className="flex-1 overflow-y-auto space-y-3 p-3 bg-muted/20 rounded mb-3">
          {messages.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">Nenhuma conversa ainda. Comece a digitar!</div>}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-lg ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <div className='text-sm break-words'>{m.text}</div>
                <div className={`text-xs mt-1 ${m.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {new Date(m.createdAt || '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted px-4 py-2 rounded-lg">
                <div className='text-sm text-muted-foreground'>Digitando...</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto flex gap-2">
          <Input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={onKeyDown} 
            placeholder={!aiEnabled ? 'Chat desabilitado em Configurações' : (hasKey ? 'Pergunte algo à IA...' : 'Configure uma chave para usar o chat')}
            disabled={!hasKey || !aiEnabled}
            autoFocus 
          />
          <Button onClick={send} disabled={loading || !hasKey || !input.trim() || !aiEnabled}>
            {loading ? '...' : 'Enviar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}