import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { storage } from '@/lib/storage';
import { parseCommands, executeCommand, Command } from '@/lib/assistantCommands';
import { generateReply } from '@/lib/ai';
import { getAuditLog, clearAuditLog } from '@/lib/auditLog';

interface Message { role: 'user' | 'assistant' | 'system'; text: string; commands?: Command[] }

export default function Instrutor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [autoAccept, setAutoAccept] = useState(false);
  const [audit, setAudit] = useState<any[]>([]);

  useEffect(() => {
    // load persisted AI conversation history if available
    const persisted = storage.getAIConversations();
    if (persisted && persisted.length) {
      setMessages(persisted.map(m => ({ role: m.role, text: m.text })) as Message[]);
    } else {
      const welcome = { role: 'system', text: 'Instrutor pronto. Pode sugerir comandos estruturados entre parênteses ou JSON.' } as Message;
      setMessages([welcome]);
      try { storage.addAIMessage({ role: welcome.role, text: welcome.text }); } catch (e) { /* noop */ }
    }

    setAudit(getAuditLog().slice().reverse().slice(0, 50));
  }, []);

  const appendMessage = (m: Message) => {
    setMessages(prev => {
      const next = [...prev, m];
      try { storage.addAIMessage({ role: m.role, text: m.text }); } catch (e) { /* noop */ }
      return next;
    });
  };

  const sendUser = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', text: input };
    appendMessage(userMsg);
    setInput('');
    // In this implementation we do not call external AI — user will paste assistant reply or use quick simulate below.
  };

  const handleAssistantReply = async (text: string) => {
    const assistantMsg: Message = { role: 'assistant', text };
    appendMessage(assistantMsg);

    const cmds = parseCommands(text);
    if (!cmds.length) return;

    // show commands in message history
    appendMessage({ role: 'system', text: `Comandos detectados: ${JSON.stringify(cmds)}`, commands: cmds });

    for (const cmd of cmds) {
      if (autoAccept) {
        const res = await executeCommand(cmd);
        appendMessage({ role: 'system', text: `Executado: ${cmd.entity} ${cmd.action} -> ${res.message}` });
        setAudit(getAuditLog().slice().reverse().slice(0, 50));
      } else {
        appendMessage({ role: 'system', text: `Aguardando sua aprovação para: ${cmd.entity} ${cmd.action} ${JSON.stringify(cmd.params)}` });
      }
    }
  };

  const approveLastCommand = async (index: number) => {
    const msg = messages[index];
    if (!msg || !msg.commands || msg.commands.length === 0) return;
    for (const cmd of msg.commands) {
      const res = await executeCommand(cmd);
      appendMessage({ role: 'system', text: `Executado: ${cmd.entity} ${cmd.action} -> ${res.message}` });
      setAudit(getAuditLog().slice().reverse().slice(0, 50));
    }
  };

  const quickSimulate = () => {
    // small example assistant reply that creates a habit
    const reply = "(habito, criar, nome: \"Beber agua\", dias: [1,2,3,4,5])";
    handleAssistantReply(reply);
  };

  const generateFromModel = async () => {
    const prompt = input || 'Sugira comandos úteis para mim';
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: prompt }]);
    const text = await generateReply(prompt);
    await handleAssistantReply(text);
  };

  return (
    <Layout>
      <div className={'space-y-4'}>
        <div className={'flex items-center justify-between'}>
          <h1 className={'text-2xl font-bold'}>Instrutor (IA)</h1>
          <div className={'flex items-center space-x-2'}>
            <label className={'text-sm'}>Aceitar comandos automaticamente</label>
            <input type="checkbox" checked={autoAccept} onChange={e => setAutoAccept(e.target.checked)} />
          </div>
        </div>

        <div className={'grid grid-cols-1 md:grid-cols-3 gap-4'}>
          <div className={'md:col-span-2'}>
            <Card>
              <CardHeader>
                <CardTitle>Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={'space-y-3 max-h-[60vh] overflow-auto p-2 bg-surface rounded'}>
                  {messages.map((m, i) => (
                    <div key={i} className={m.role === 'user' ? 'text-right' : m.role === 'assistant' ? 'text-left' : 'text-center'}>
                      <div className={m.role === 'user' ? 'inline-block bg-primary/10 p-2 rounded' : m.role === 'assistant' ? 'inline-block bg-muted/10 p-2 rounded' : 'inline-block bg-yellow-50 p-2 rounded'}>
                        <div className={'text-sm'}>{m.text}</div>
                        {m.commands && (
                          <div className={'text-xs text-muted-foreground mt-1'}>
                            Comandos: {JSON.stringify(m.commands)}
                            <div>
                              <Button size={'sm'} onClick={() => approveLastCommand(i)}>Aprovar</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={'mt-3 flex space-x-2'}>
                  <Input value={input} onChange={e => setInput(e.target.value)} placeholder={'Pergunte ao instrutor...'} />
                  <Input value={input} onChange={e => setInput(e.target.value)} placeholder={'Pergunte ao instrutor...'} />
                  <Button onClick={sendUser}>Enviar</Button>
                  <Button variant={'outline'} onClick={() => handleAssistantReply(promptForDemo())}>Simular resposta</Button>
                  <Button variant={'outline'} onClick={generateFromModel}>Gerar pelo modelo</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Ferramentas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={'space-y-2'}>
                  <Button onClick={quickSimulate}>Simular criar hábito</Button>
                  <Button onClick={() => { setMessages([{ role: 'system', text: 'Conectado ao storage' }]); storage.setAIConversations([{ role: 'system', text: 'Conectado ao storage', createdAt: new Date().toISOString() }]); }}>Resetar chat</Button>
                  <div className={'text-sm text-muted-foreground mt-2'}>Você pode colar a resposta da IA aqui ou usar a simulação.</div>
                  <div className={'mt-3'}>
                    <div className={'flex items-center justify-between'}>
                      <div className={'text-sm font-semibold'}>Log de auditoria (últimos)</div>
                      <div>
                        <Button size={'sm'} variant={'outline'} onClick={() => { clearAuditLog(); setAudit([]); }}>Limpar</Button>
                      </div>
                    </div>
                    <div className={'max-h-48 overflow-auto mt-2 text-xs'}>
                      {audit.length === 0 && <div className={'text-muted-foreground'}>Sem entradas</div>}
                      {audit.map((a, i) => (
                        <div key={a.id || i} className={'p-1 border-b'}>
                          <div className={'text-xs text-muted-foreground'}>{new Date(a.timestamp).toLocaleString()}</div>
                          <div className={'truncate'}>{a.command?.entity} {a.command?.action} — {a.result?.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function promptForDemo() {
  return `O usuário quer otimizar hábitos. Sugestões (habito, criar, nome: "Meditar 10 min", dias: [1,2,3,4,5])`;
}
