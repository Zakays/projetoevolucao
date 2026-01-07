# Como Pré-visualizar o Site

## ✅ Pré-requisitos
- Node.js instalado (versão 16+ recomendada)
- npm ou pnpm (o projeto suporta ambos)

## 🚀 Métodos de Pré-visualização

### 1. **Servidor de Desenvolvimento (Recomendado)**
```bash
npm run dev
```
- **URL**: http://localhost:8080
- **Recursos**: Hot reload automático, erros em tempo real
- **Comando já executado**: ✅ Servidor rodando perfeitamente

### 2. **Preview da Build de Produção**
```bash
# Primeiro faça o build
npm run build

# Depois visualize
npm run preview
```
- **URL**: http://localhost:4173 (porta padrão do Vite)
- **Recursos**: Visualização exata do que será publicado

### 3. **Preview com Source Maps (para debugging)**
```bash
npm run preview:dev
```

## 📊 Status Atual do Projeto

### ✅ **SERVIDOR ATIVO**
- **URL**: http://localhost:8080
- **Status**: ✅ Funcionando perfeitamente
- **Framework**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS

### 🎯 **Funcionalidades do Projeto**
O projeto é um **Organizador Pessoal (Glow Up)** com:
- **Dashboard** com tracking de hábitos diários
- **Categorias**: Saúde, Treino, Estudo, Estética, Disciplina
- **Sistema de pontos** e streaks
- **Páginas**: Hábitos, Treino, Corpo, Diário, Metas, Estatísticas, Estudo, Registros, Configurações
- **Persistência local** dos dados

### 🔧 **Comandos Disponíveis**
```bash
# Desenvolvimento
npm run dev          # Servidor com hot reload
npm run lint         # Verificar qualidade do código

# Build
npm run build        # Build de produção
npm run build:dev    # Build de desenvolvimento com source maps
npm run build:map    # Build com source maps

# Preview
npm run preview      # Preview da build de produção
npm run preview:dev  # Preview da build de desenvolvimento
```

## 🌐 **Como Acessar**
1. Abra seu navegador
2. Acesse: **http://localhost:8080**
3. O site estará rodando com todas as funcionalidades

## 📱 **Compatibilidade**
- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (responsive design)
- ✅ Modo escuro/claro automático

## 🛠️ **Para Desenvolvimento**
- **Hot reload**: Mudanças no código refletem instantaneamente
- **Console de erros**: Erros aparecem no terminal e no navegador
- **TypeScript**: Verificação de tipos em tempo real

---

**Status**: ✅ **PRÉ-VISUALIZAÇÃO DISPONÍVEL E FUNCIONANDO**

O servidor está ativo e o projeto pode ser visualizado em http://localhost:8080