# GlowUp Organizer — Seu Assistente Pessoal com IA

[![CI](https://github.com/cleudospaeilandirenesoares-cell/Site-Evolucao/actions/workflows/ci.yml/badge.svg)](https://github.com/cleudospaeilandirenesoares-cell/Site-Evolucao/actions/workflows/ci.yml)  

> Repositório: `cleudospaeilandirenesoares-cell/Site-Evolucao`

**GlowUp** é um organizador pessoal completo que integra Inteligência Artificial para automatizar hábitos, estudos, treinos, finanças e muito mais. Com suporte a chat interativo e geração automática de frases motivacionais personalizadas, você tem um assistente poderoso ao seu alcance.

---

## 🚀 Destaques

- **Chat com IA** — converse com a IA diretamente no Dashboard; histórico persiste.
- **Frases Motivacionais Personalizadas** — geradas automaticamente a cada dia com base no seu histórico de conversa.
- **Proxy Gemini (opcional)** — pode ser usado para tratar chaves no servidor, mas o projeto também suporta chamadas diretas do cliente para desenvolvimento.
- **Conversão de Comandos** — a IA sugere ações em JSON ou tuplas; o app as executa com aprovação do usuário.
- **Dashboard Dinâmico** — visualize hábitos, pontos, sequências, progresso e muito mais em tempo real.
- **Armazenamento Local** — tudo é salvo em localStorage e IndexedDB; funciona offline.
- **Vitest & Testes** — cobertura completa com testes unitários e de integração.

---

## 📋 Tech Stack

- **Frontend:** Vite + React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn-ui
- **Backend (opcional):** Node.js + Express (proxy Gemini — opcional). O projeto já suporta chamadas diretas do cliente para desenvolvimento.
- **Storage:** localStorage + IndexedDB (blobs/imagens)
- **IA:** Google Gemini API (ou qualquer LLM com API REST)
- **Testing:** Vitest + @testing-library/react

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ (recomenda-se usar [nvm](https://github.com/nvm-sh/nvm))
- npm 11+

### Passos

1. **Clone ou extraia o projeto:**
   ```bash
   cd organizador_glow_up_expansao2
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente** (opcional, para IA):
   Crie um arquivo `.env` ou `.env.local` na raiz do projeto:
   ```
   VITE_GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
   VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE
   ```

---

## 🛠️ Desenvolvimento

### Iniciar servidor dev (com hot reload):
```bash
npm run dev
```
Acesse [http://localhost:5173](http://localhost:5173)

### Proxy Gemini (opcional)
```bash
node server/ai-proxy.js
```
O proxy ouve em `http://localhost:3001/api/ai` por padrão.

### Rodar testes:
```bash
npm test
```

### Build para produção:
```bash
npm run build
npm run preview  # preview local
```

**PWA (opcional):**
- Para habilitar o PWA instalável, instale o plugin: `npm install vite-plugin-pwa --save-dev`.
- Eu adicionei a configuração do plugin no `vite.config.ts` (registro automático de SW - `autoUpdate`). Para testes locais, rode `npm run build` e `npm run preview`, abra no Chrome (desktop ou mobile) e verifique a opção "Install" ou "Add to Home screen".
- Substitua os ícones em `public/` por PNGs 192x192 e 512x512 para melhor compatibilidade em Android/Play Store.


---

## 📂 Estrutura do Projeto

```
src/
├── components/
│   ├── AIChat.tsx                    # Chat com IA (novo)
│   ├── Layout.tsx
│   ├── Navigation.tsx
│   ├── Pomodoro.tsx
│   ├── QuizSystem.tsx
│   ├── Gallery.tsx
│   └── ui/                           # shadcn-ui components
├── pages/
│   ├── Index.tsx                     # Dashboard (com chat + frases)
│   ├── Body.tsx
│   ├── Finance.tsx
│   ├── Habits.tsx
│   ├── Journal.tsx
│   ├── Instrutor.tsx                 # Interface IA avançada
│   ├── Quiz.tsx
│   ├── Settings.tsx                  # Configurações (tom/comprimento de frase)
│   └── ...
├── lib/
│   ├── ai.ts                         # Integração com modelo IA (rotação de chaves)
│   ├── motivation.ts                 # Helpers para gerar frases (novo)
│   ├── assistantCommands.ts          # Parser & executor de comandos IA
│   ├── storage.ts                    # Gerenciador de dados local
│   ├── idb.ts                        # IndexedDB para blobs
│   ├── sound.ts
│   └── ...
├── types/
│   └── index.ts                      # Tipos TypeScript (inclui AIMessage)
├── __tests__/
│   ├── AIChat.test.tsx               # Testes do chat (novo)
│   ├── motivation.test.ts            # Testes de helpers (novo)
│   ├── ai.test.ts
│   ├── assistantCommands.test.ts
│   └── ...
└── main.tsx

server/
├── ai-proxy.js                       # Express proxy para Gemini
├── test-request.js                   # Script teste simples
├── .gemini_key                       # Arquivo com chave API (local, não commitar)
├── ai-audit.log                      # Log de requisições ao proxy
└── README.md                         # Instruções do proxy
```

---

## 🤖 Integração com IA

### 1. Chat com IA no Dashboard

O componente `AIChat` permite conversar com a IA diretamente na página inicial:

- **Localização:** Dashboard (coluna direita, abaixo da frase motivacional).
- **Arquivo:** `src/components/AIChat.tsx`
- **Funcionalidades:**
  - Auto-scroll ao adicionar mensagens.
  - Tecla Enter para enviar (Shift+Enter para quebra).
  - Botão "Limpar" para resetar histórico.
  - Aviso se nenhuma chave API estiver configurada.
  - Histórico persistido em `storage.aiConversations`.

**Como usar:**
1. Configure a chave API em Configurações ou via `VITE_GEMINI_API_KEY`.
2. Digite uma pergunta e pressione Enter ou clique "Enviar".
3. A resposta aparecerá abaixo.
4. Histórico é automaticamente salvo.

### 2. Geração Automática de Frases Motivacionais

Ao abrir o Dashboard, o app **automaticamente**:
- Verifica se já gerou uma frase hoje.
- Se não, coleta os últimos 20 mensagens do chat com a IA.
- Envia um prompt personalizado para o modelo gerando uma frase adequada.
- Respeita as preferências: **tom** (Encorajador/Calmo/Direto/Personal) e **comprimento** (Curta/Média/Longa).
- Salva a frase em `settings.dailyMotivation` e marca a data em `settings.lastMotivationGeneratedAt`.
- **Botão Sparkles** ao lado da frase permite regenerar manualmente.

**Customização em Configurações:**
- Acesse `src/pages/Settings.tsx` → seção "Motivação".
- Escolha tom e comprimento desejados.
- Botão "Restaurar padrão" reseta para Encorajador/Curta.

**Helpers implementados** (`src/lib/motivation.ts`):
```typescript
composeMotivationPrompt(convo, tone, length)  // constrói prompt
sanitizeMotivation(raw, maxChars)              // limpa resposta
```

### 3. Conversão de Comandos (Instrutor)

A página **Instrutor** (`src/pages/Instrutor.tsx`) funciona como um chat avançado com suporte a comandos:

- **Entrada:** User digita pergunta ou cola resposta IA.
- **Processamento:** `assistantCommands.parseCommands()` detecta JSON ou tuplas.
- **Execução:** `assistantCommands.executeCommand()` aplica as ações (criar hábito, journal, quiz, etc).
- **Auditoria:** Todas as ações são registradas em `auditLog.ts`.

**Formatos de comando suportados:**

**Tupla entre parênteses:**
```
(habito, criar, nome: "Meditar 10 min", dias: [1,2,3,4,5])
(journal, resumir)
(finance, create, type: income, amount: 100, category: "salary")
```

**JSON:**
```json
{
  "commands": [
    { "entity": "habito", "action": "criar", "params": { "nome": "Beber água", "dias": [1,2,3,4,5] } },
    { "entity": "journal", "action": "resumir" }
  ]
}
```

**Linha simples:**
```
habito create name="Treinar" weight=2 essential=true
```

**Entidades e ações implementadas:**

| Entidade | Ações |
|----------|-------|
| `habito` / `habit` | `create`/`criar`, `delete`/`remover`, `complete`/`concluir` |
| `journal` / `diario` | `create`/`criar`, `delete`/`remover`, `summarize`/`resumir` |
| `finance` / `financas` | `create`/`criar`, `delete`/`remover` |
| `course` / `curso` | `create`/`criar`, `delete`/`remover` |
| `quiz` / `pergunta` | `create`/`criar`, `delete`/`remover` |

### 4. Rotação de Chaves de API (Client-side)

Arquivo: `src/lib/ai.ts`

Se configurar múltiplas chaves em Configurações (`settings.aiApiKeys`), o app:
- Tenta cada chave na ordem.
- Detecta exaustão (códigos 401/402/403/429 ou texto contendo "quota", "exceeded").
- Remove chaves exauridas automaticamente.
- Continua com a próxima chave.

**Configuração:**
1. Acesse Configurações → Chaves de API.
2. Digite múltiplas chaves (uma por linha, se suportado).
3. O app as gerencia automaticamente.

---

## 🖥️ Proxy Gemini (Backend Opcional)

> Nota: O proxy é **opcional**. O projeto suporta chamadas diretas do cliente (dev-only) e também um backend Node/Express para quem prefere manter chaves no servidor.

### Propósito

O proxy (`server/ai-proxy.js`) é um servidor Express que:
- Centraliza requisições ao Gemini.
- Rotaciona múltiplas chaves de API.
- Remove chaves exauridas.
- Valida e extrai `commands` das respostas.
- Registra todas as requisições em log.

### Instalação & Uso

1. **Instale dependências do servidor:**
   ```bash
   npm install express body-parser zod @google/generative-ai
   ```

2. **Configure chaves em `server/.gemini_keys`** (um por linha):
   ```
   sk-key1...
   sk-key2...
   sk-key3...
   ```
   Ou use uma chave única em `server/.gemini_key`:
   ```
   sk-your-key...
   ```

3. **Inicie o proxy:**
   ```bash
   node server/ai-proxy.js
   ```
   Saída esperada:
   ```
   [proxy] starting - keys loaded: 1, first key preview: ****abcd
   AI proxy running at http://localhost:3001/api/ai
   ```

4. **Endpoints:**

   **POST /api/ai** (principal)
   ```bash
   curl -X POST http://localhost:3001/api/ai \
     -H "Content-Type: application/json" \
     -d '{"prompt":"Crie um hábito para beber água"}'
   ```
   Resposta:
   ```json
   {
     "commands": [
       { "entity": "habito", "action": "create", "params": {...} }
     ],
     "message": "ok"
   }
   ```

   **GET /api/ai?prompt=...** (conveniência para browser)
   ```
   http://localhost:3001/api/ai?prompt=ping
   ```

   **GET /healthz** (verificação de saúde)
   ```bash
   curl http://localhost:3001/healthz
   # {"status":"ok","keyCount":1,"keyPreview":"****abcd"}
   ```

   **GET /** (raiz)
   ```
   http://localhost:3001/
   # retorna "AI proxy alive"
   ```

### Features do Proxy

- **SDK Gemini:** Tenta usar `@google/generative-ai` se disponível.
- **Fallback REST:** Se SDK falhar, faz POST REST direto para `generateContent`.
- **Fallback ?key=...:** Se autenticação falha, tenta com query string `?key=API_KEY`.
- **JSON-mode:** Configura `responseMimeType: 'application/json'` + schema para estruturar respostas.
- **Timeouts:** Limite de 15s por requisição.
- **Rotação de chaves:** Remove chaves com quota/erro permanente.
- **Logging:** Registra todas as requisições e erros em `server/ai-audit.log`.

### Exemplo Completo

**Terminal 1 — Inicia o proxy:**
```bash
node server/ai-proxy.js
```

**Terminal 2 — Envia requisição:**
```bash
curl -X POST http://localhost:3001/api/ai \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Escreva uma frase motivacional curta e encorajadora em português"
  }'
```

**Resposta:**
```json
{
  "commands": [...],
  "message": "ok",
  "raw": { /* resposta bruta do Gemini */ }
}
```

---

## ⚙️ Configurações (Settings)

**Acesse via navegação → Configurações**

### Geral
- **Tema:** Light / Dark / System
- **Sons:** Ativar/desativar feedback sonoro
- **Animações:** Ativar/desativar transições suaves

### Motivação (NOVO)
- **Frase Motivacional Diária:** Edite manualmente ou gere automaticamente.
- **Tom da Frase:** Encorajador (padrão), Calmo, Direto, Personal.
- **Comprimento:** Curta (padrão), Média, Longa.
- **Botão Regenerar:** Força geração nova.
- **Restaurar padrão:** Reseta tom/comprimento.

### Chaves de API (NOVO)
- **Lista de API Keys:** Adicione uma chave por linha na caixa de configurações. Exemplo:
  ```
  sk-...
  sk-...
  ```
- As chaves são salvas localmente no navegador. Quando uma chave atingir o limite/quota ela será removida automaticamente da lista.
- Se preferir usar apenas uma chave, adicione uma única linha com essa chave.

### Notificações
- Lembretes de hábitos, treinos, journal.

### Testes (dev)
- Ativar botões de simulação (para testar sem modelo real).

---

## 📊 Funcionalidades Principais

### Dashboard
- **Frase Motivacional:** Exibida em destaque; regenerável via botão.
- **Chat com IA:** Panel interativo com histórico persistido.
- **Estatísticas:** Hábitos concluídos hoje, pontos, sequência, desempenho %.
- **Barra de Progresso:** Visual do progresso diário.
- **Lista de Hábitos:** Checkboxes, duração, categoria, peso em pontos.

### Hábitos
- Criar, editar, deletar hábitos.
- Categorias: Saúde, Treino, Estudo, Estética, Disciplina.
- Rastrear sequências (streaks).
- Marcar conclusão com nota.

### Finanças
- Registrar receitas e despesas.
- Filtrar por categoria.
- Gráfico mensal.

### Estudos
- Flashcards com SRS (Spaced Repetition).
- Quiz com estatísticas.
- Vocabulário com revisão programada.
- Livros (status leitura).
- Cursos (progresso).

### Treino
- Registrar exercícios e séries/reps.
- Histórico de workouts.

### Corpo
- Registrar peso, medidas, selfies.
- Comparação antes/depois.
- Auto-avaliação (energia, confiança, autoestima).

### Journal / Diário
- Anotar o que correu bem, melhorias, humor (1-10).
- Buscar por entrada.

### Instrutor (IA Avançada)
- Chat com suporte a comandos.
- Auto-execução ou aprovação prévia.
- Auditoria de ações.

---

## 🧪 Testes

### Rodar todos os testes:
```bash
npm test
```

### Rodar testes de um arquivo:
```bash
npm test -- -t "AIChat"
npm test -- -t "motivation"
```

### Testes incluídos:

| Arquivo | Casos |
|---------|-------|
| `AIChat.test.tsx` | Renderiza histórico, envia mensagem, aviso sem chave |
| `motivation.test.ts` | Compõe prompt, sanitiza resposta |
| `ai.test.ts` | Fallback simulado |
| `assistantCommands.test.ts` | Parser e executor de comandos |
| `streaks.test.ts` | Lógica de sequências |
| E muito mais... | ~66 testes passando ✓ |

### Coverage:
Rode `npm test` para ver cobertura atualizada.

---

## 🔐 Segurança

- **Chaves de API:** Armazenadas em localStorage ou arquivo local (`server/.gemini_key`).
  - **Não commitar** `server/.gemini_key` ou `.env` com chaves reais.
  - Use um `.gitignore` apropriado.
- **Armazenamento Local:** Dados persisem no navegador; nenhum servidor externo (exceto IA).
- **Execução de Comandos:** Requer aprovação prévia por padrão (toggleável).
- **Auditoria:** Todas as ações IA são registradas em `auditLog.ts`.

---

## 📝 Exemplos de Uso

### Scenario 1: Gerar Frase Motivacional Personalizada

1. Abra o Dashboard.
2. Vá ao **Chat com a IA** e converse (ex: "Preciso me dedicar mais aos estudos").
3. Feche e reabra o Dashboard (ou aguarde o reload automático).
4. A frase será gerada automaticamente com base na sua conversa.
5. Customize o **ton** e **comprimento** em Configurações.

### Scenario 2: Criar Hábito via IA

1. Acesse **Instrutor (IA)**.
2. Digite: "Crie um hábito chamado 'Meditar' para segunda, quarta e sexta, peso 3, essencial".
3. O sistema detecta o comando e mostra a ação.
4. Clique "Aprovar" ou ative "Aceitar automaticamente".
5. Hábito criado!

### Scenario 3: Usar Proxy Standalone

```bash
# Terminal 1: Inicia proxy
node server/ai-proxy.js

# Terminal 2: Envia prompt
curl -X POST http://localhost:3001/api/ai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Sugira 3 hábitos saudáveis"}'
```

---

## 🐛 Troubleshooting

### Chat retorna erro "Sem chave de API"
- Adicione chaves em Configurações → "Lista de API Keys" (uma por linha).
- Ou defina a variável de ambiente `VITE_GEMINI_API_KEY` em `.env.local`.

### Erro 404: endpoint não encontrado
- Se você iniciou o proxy com `node server/ai-proxy.js`, verifique se ele está rodando na porta padrão 3001.
- Para iniciar o proxy (na raiz do projeto):
```bash
node server/ai-proxy.js
```
- Confirme se a resposta de saúde está OK:
```bash
curl http://localhost:3001/healthz
# {"status":"ok","keyCount":1,"keyPreview":"****abcd"}
```
- Se o proxy estiver ativo, a aplicação em desenvolvimento usará `http://localhost:3001/api/ai` por padrão. Se preferir outro endpoint, defina `VITE_GEMINI_API_URL`.

### Proxy retorna `Cannot GET /api/ai`
- Certifique-se de que está usando POST ou GET com `?prompt=...`.
- Verifique se chaves estão em `server/.gemini_keys` ou `server/.gemini_key`.
- Rode com: `node server/ai-proxy.js`

### Testes falham com timeout
- Alguns testes de integração são longos (~20s).
- Rode: `npm test -- -t "seu-teste" --testTimeout=30000`

### Chaves exauridas não removem automaticamente
- Verifique se o status HTTP/texto contém "quota", "exceeded", "limit".
- Cheque os logs em `server/ai-audit.log` ou console.

---

## 📚 Documentação Adicional

- **[README_DETAILED.md](./README_DETAILED.md)** — Instruções e decisões técnicas.
- **[INSTRUCOES_PREVIEW.md](./INSTRUCOES_PREVIEW.md)** — Guia de preview.
- **[server/README.md](./server/README.md)** — Instruções do proxy.
- **[AGENTS.md](./AGENTS.md)** — Notas sobre agentes & expansão.

---

## 🎯 Próximos Passos

- [ ] Integração com Supabase para sincronização online.
- [ ] App mobile (React Native).
- [ ] Modo offline melhorado.
- [ ] Dashboard customizável (widgets).
- [ ] Integração com mais modelos (OpenAI, Claude, Llama).
- [ ] Compartilhamento social de conquistas.

---

## 📄 Licença

Proprietary — Todos os direitos reservados.

---

## 👤 Contribuidores

Desenvolvido com ❤️ por Maria e assistentes IA.

---

**Última atualização:** 5 de janeiro de 2026

