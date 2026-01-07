# Glow Up Organizer — Documentação Detalhada

> Este arquivo é um resumo persistente das instruções, decisões e tarefas que foram discutidas e implementadas no repositório. Criei este documento para preservar o histórico das instruções caso o histórico do chat seja perdido.

---

## 📌 O que é este projeto
Um organizador pessoal (Glow Up) para acompanhar hábitos, treinos, estudos, diário, metas, estatísticas e registros. É uma SPA feita com React + TypeScript + Vite, usando TailwindCSS e componentes shadcn/ui. Os dados do usuário são persistidos localmente (LocalStorage).

Tecnologias principais:
- React, TypeScript, Vite
- TailwindCSS, shadcn/ui
- Vitest + Testing Library para testes
- Web Audio API para efeitos sonoros (feature adicionada)

---

## 🗂️ Como rodar (local)
- Instalar dependências: `npm install`
- Rodar dev server: `npm run dev` (URL padrão: `http://localhost:8080`)
- Rodar testes: `npm test` ou `npx vitest --run`
- Build: `npm run build` / `npm run preview`

---

## ✅ Alterações e funcionalidades implementadas (resumo)
- Implantações **já concluídas**:
  - SRS básico para Vocabulário (agendamento simples, `nextReviewAt`, `intervalDays`, métodos de storage e UI) ✅
  - Página `Vocabulary` (UI, marcação de revisão com limite por dia planejado, badge na navegação indicando pendências) ✅
  - Animações globais e polimento visual (progress grow, shimmer, animações de botão e card) ✅
  - Sistema de sons interativos (`src/lib/sound.ts`) e integração com Hábitos, Vocabulário e Flashcards ✅
  - Testes de unidade/componente para: SRS, vocabulário, sons (habits/vocabulary), quiz stats e outros testes de page-level ✅
  - Workflow de CI ajustado para mitigar OOM (`NODE_OPTIONS=--max_old_space_size=4096`) ✅

- Mudanças recentes (adicionadas):
  - `src/lib/storage.ts`: métodos de SRS, `getDueVocabulary`, etc.
  - `src/pages/Vocabulary.tsx`, `src/components/Navigation.tsx` — UI e contador de pendentes
  - `src/components/ui/progress.tsx`, `tailwind.config.ts`, `src/index.css` — animações/estilos
  - `src/lib/sound.ts` — utilitário de áudio
  - Testes: `src/__tests__/*` adicionados/atualizados para cobrir novas features

---

## 🧭 Instruções/pendências que você solicitou (copiado e resumido)
Aqui estão as solicitações de melhoria que você pediu e o status atual (para evitar perda de contexto):

1. **Treino**
   - Requisito: Ao mostrar cada exercício, exibir o número total de repetições realizadas (soma de todas as séries), ex.: `Abdômen (15)`.
   - Status: Pendente (planejado). Só alterar a exibição (não alterar persistência de dados).

2. **Estudos**
   - Requisito: Corrigir fundo branco em selects (dificuldade e filtros); ativar os dados do painel (`Tempo Hoje`, `Flashcards para revisar hoje`, `Sequência`, `Nível`) com dados reais; implementar grupos/assuntos para flashcards.
   - Status: Pendente (planejado).

3. **Vocabulário**
   - Requisito: Adicionar resumo/contadores no topo da página e garantir que cada palavra só possa ser marcada como revisada 1 vez por dia.
   - Status: Parcialmente implementado (SRS + contagem), reforçar limite 1x/dia.

4. **Diário**
   - Requisito: Quando criar a reflexão do dia, o indicador "Reflexão Hoje" deve atualizar imediatamente (hoje permanece pendente). 
   - Status: Pendente (corrigir refresh de estado após criação).

5. **Metas**
   - Requisito: Ao marcar objetivo como concluído, atualizar status/dados imediatamente (hoje só atualiza após reload).
   - Status: Pendente.

6. **Quiz**
   - Requisitos:
     - Corrigir fundo branco em selects / checkboxes
     - Corrigir mapeamento índice → resposta (quando escolho índice 3, a opção 3 deve ser a correta)
     - Finalizar quiz automaticamente quando todas as perguntas respondidas
     - Embaralhar perguntas e opções aleatoriamente ao iniciar o quiz
   - Status: Pendente.

7. **Registros/Galeria**
   - Requisitos: Ao enviar foto, atualizar contagem; preview de imagens funcionando; implementar funcionalidade de comparar imagens, filtrar e organizar (conforme instruções da página Records).
   - Status: Pendente.

8. **Notificações**
   - Problema: Notificações duplicadas (canto inferior direito e superior direito). 
   - Requisito: Investigar causa e evitar duplicação de mensagens.
   - Status: Pendente.

9. **Estilo global e selects**
   - Requisito: Padronizar fundo de selects e caixas (remover fundos brancos indesejados). Aplicar correção globalmente.
   - Status: Pendente.

10. **Testes e QA**
   - Requisito: Adicionar/ajustar testes unitários e de UI para todas as correções.
   - Status: Em planejamento / será executado junto com as correções.

---

## 🛠️ Arquivos e caminhos úteis (para edição rápida)
- Storage & dados: `src/lib/storage.ts`
- Vocabulário: `src/pages/Vocabulary.tsx`
- Flashcards: `src/components/FlashcardSystem.tsx`
- Treino: `src/pages/Training.tsx`
- Habits (referência de implementação sólida): `src/pages/Habits.tsx`
- Galeria/Registros: `src/components/Gallery.tsx` e `src/components/BeforeAfterSlider.tsx`
- Animações/estilos: `src/index.css`, `tailwind.config.ts`, `src/components/ui/*`
- Sons: `src/lib/sound.ts`
- Testes: `src/__tests__/*`
- CI: `.github/workflows/ci.yml`

---

## 📋 Como vamos proceder (recomendação)
1. Implementar correções por página, uma a uma, começando por Treino (você confirmou prioridade). Cada mudança terá testes e PRs pequenos. 
2. Fazer revisão visual local (dev server) e ajustes de design. 
3. Abrir PR e rodar CI para validar suíte completa. 
4. Corrigir eventuais problemas indicados pelo CI e merge.

---

## 📝 Nota final
Se desejar, posso abrir um PR com as mudanças já feitas (SRS, animações, sons, testes) e seguir com o plano de prioridades. Também posso começar imediatamente pela correção da página "Treino" (mostrar total de repetições por exercício) e ir avançando seguindo o plano.

Se quiser que eu adicione alguma instrução extra neste README (ex.: normas de commit, convenções de teste, checklist de revisão visual), diga o que incluir e eu atualizo o arquivo.

---

*Arquivo gerado em 2026-01-02 por GitHub Copilot.*
