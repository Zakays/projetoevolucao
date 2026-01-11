Arquivo arquivado: Configuração Supabase + Google OAuth (removida)

Este documento foi arquivado porque a autenticação via Supabase/Google foi removida do fluxo principal. A persistência sem login será implementada em breve.

(Arquivo mantido apenas para histórico.)

URLs de desenvolvimento (use estas para teste local)
- Dev (Vite): http://localhost:5173/
- Redirect típico (HashRouter): http://localhost:5173/#/

1) Console Supabase
- No painel do seu projeto Supabase → Auth → Providers:
  - Habilite o provedor "Google".
  - Cole o Client ID e Client Secret obtidos no Google Cloud (próximo passo).
- Em Authentication → Settings → Redirect URLs adicione:
  - http://localhost:5173/
  - http://localhost:5173/#/
  - (adicione também sua URL de produção, ex: https://app.seudominio.com/)

2) Google Cloud (OAuth 2.0)
- Console Google Cloud → APIs & Services → Credentials → Create Credentials → OAuth client ID (Web application).
  - Authorized JavaScript origins: http://localhost:5173, http://localhost:8080
  - Authorized redirect URIs: http://localhost:5173/, http://localhost:8080/, http://localhost:8080/#/

  Note: the project sometimes runs on port 8080 (Vite default here). Make sure the above redirect URIs include your dev origin (e.g., `http://localhost:8080/#/`) so OAuth redirects back correctly.
  - Copie o Client ID e Client Secret para o Supabase (passo 1).

3) Variáveis de ambiente
- Crie/atualize `.env.local` na raiz do projeto com:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_XXXX
```

Obs: `VITE_` prefix torna as variáveis disponíveis ao client; o anon key é segura para uso em cliente. Nunca exponha a `SERVICE_ROLE` em frontend.

4) Dependências
- Verifique que `@supabase/supabase-js` esteja instalada (já consta no `package.json`). Se não estiver:

```bash
pnpm add @supabase/supabase-js
```

5) Estrutura de código sugerida (arquivos e snippets)
- `src/lib/supabase.ts` — inicializa o cliente Supabase (já existe no projeto, exemplo abaixo):

```ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, storage: typeof window !== 'undefined' ? window.localStorage : undefined }
});

export function getSupabase() { return supabase; }
```

- `src/lib/auth-new.ts` — novo módulo de autenticação (exemplo mínimo):

```ts
import { getSupabase } from './supabase';

export async function signInWithGoogle() {
  const supabase = getSupabase();
  const redirectTo = window.location.origin + '/#/';
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  if (error) throw error;
}

export async function signOut() {
  const supabase = getSupabase();
  await supabase.auth.signOut();
}

export function onAuthStateChange(cb: (event: string, session: any) => void) {
  const supabase = getSupabase();
  return supabase.auth.onAuthStateChange(cb);
}

export async function getSession() {
  const supabase = getSupabase();
  const r = await supabase.auth.getSession();
  return (r as any)?.data?.session ?? null;
}
```

- Nota sobre redirect: em alguns fluxos SPA você pode precisar processar tokens no hash da URL e chamar `supabase.auth.setSession(...)`. Teste primeiro sem isso; na maioria dos casos `supabase-js` atual gerencia sessão automaticamente.

6) Frontend — página de login e integração
- Criar `src/pages/Login.tsx` com um botão que chama `signInWithGoogle()` e exibe instruções. Exemplo simples:

```tsx
import React from 'react';
import { signInWithGoogle } from '@/lib/auth-new';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>
        <h1>Entrar</h1>
        <button onClick={() => signInWithGoogle()}>Entrar com Google</button>
      </div>
    </div>
  );
}
```

- Adicione rota em `src/App.tsx`:
  - `<Route path="/login" element={<Login />} />`

- Atualize `src/components/Account.tsx` para mostrar botão `Sair` que chama `signOut()` e redireciona para `/login`:

```tsx
import { signOut } from '@/lib/auth-new';
import { useNavigate } from 'react-router-dom';

// ao clicar:
await signOut();
navigate('/login');
```

7) Sincronização com `app_data` (RLS)
- Já existe código no `src/lib/storage.ts` com `backupToSupabase(userId)` e `restoreFromSupabase(userId)`.
- No `onAuthStateChange` faça:
  - Se `session.user` presente: `await storage.restoreFromSupabase(session.user.id)` — carrega dados do usuário.
  - Se sessão removida: `storage.clearLocalUserData()`.

8) Testes e execução
- Rodar:

```bash
pnpm dev
```

- Fluxo de teste:
  1. Abra http://localhost:5173/
  2. Vá para `/login` e clique em "Entrar com Google" — complete o fluxo no Google.
  3. Ao retornar, confirme que a aplicação mostra o usuário logado (e.g., email na `Account`), e que `storage.restoreFromSupabase(userId)` funcionou.
  4. Teste `Sair` — deve chamar `signOut()` e redirecionar para `/login`.
  5. Verifique no Supabase → Authentication → Users se o usuário foi criado.

9) Erros comuns e depuração
- Redirect URI mismatch: verifique URIs exatas em Google Cloud e Supabase.
- Sessão não persistida: verifique `localStorage` e a chave `sb-<project>-auth-token` (se estiver usando persistência manual).
- CORS / origens: adicione `http://localhost:5173` em origens no Google Cloud.

10) Segurança e produção
- Nunca usar `SERVICE_ROLE` no frontend.
- Em produção, atualize as Redirect URLs no Supabase e no Google Cloud para o domínio final.
- Considere forçar HTTPS e revisar RLS para garantir apenas o `auth.uid()` pode acessar `app_data`.

11) Próximos passos (o que posso implementar para você)
- Implementar `src/lib/auth-new.ts` e `src/pages/Login.tsx` automaticamente.
- Ligar `onAuthStateChange` ao `storage.restoreFromSupabase` no `main.tsx`.
- Testar o fluxo localmente (rodar `pnpm dev`) e corrigir problemas de redirect/tempo de sessão.

Se quiser que eu implemente os arquivos de código agora, confirme e eu crio `src/lib/auth-new.ts`, `src/pages/Login.tsx` e atualizo as rotas/`Account` para ligar tudo automaticamente.