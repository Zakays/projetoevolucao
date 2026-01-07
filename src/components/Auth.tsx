import { useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

const QUOTES = [
  'Todo grande progresso começa com a decisão de tentar.',
  'Pequenos hábitos acumulados geram grande transformação.',
  'Consistência vence velocidade — faça um dia de cada vez.',
  'Você está mais perto do que pensa. Continue.',
  'Progresso é melhor que perfeição. Comece agora.'
];

export default function Auth() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const quote = useMemo(() => {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }, []);

  useEffect(() => {
    // clear message when email changes
    setMessage('');
  }, [email]);

  const sendMagicLink = async () => {
    setLoading(true);
    setMessage('');
    try {
      const supabase = getSupabase();
      const redirectTo = window.location.origin + '/#/login';
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo }
      });
      if (error) {
        setMessage('Erro: ' + error.message);
      } else {
        setMessage('Link enviado — verifique seu email.');
      }
    } catch (err: any) {
      setMessage('Erro inesperado: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setMessage('');
    try {
      const supabase = getSupabase();
      const redirectTo = window.location.origin + '/#/';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      });
      if (error) {
        setMessage('Erro ao iniciar Google: ' + error.message);
      } else {
        setMessage('Redirecionando para Google...');
      }
    } catch (err: any) {
      setMessage('Erro inesperado: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 shadow-lg rounded-lg overflow-hidden bg-white">
        <aside className="hidden md:flex flex-col justify-center p-8 bg-gradient-to-b from-indigo-600 to-violet-600 text-white">
          <div>
            <h1 className="text-3xl font-extrabold mb-2">Glow UP 2025</h1>
            <p className="text-sm opacity-90 mb-6">Organize seus hábitos, treinos e estudos. Progrida um dia de cada vez.</p>
            <blockquote className="text-lg italic font-medium">“{quote}”</blockquote>
          </div>
          <div className="mt-8 text-xs opacity-80">
            <p>Desenvolva disciplina com pequenas vitórias — celebre cada dia.</p>
            <p className="mt-3">Use este espaço para registrar, revisar e crescer.</p>
          </div>
        </aside>

        <main className="p-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-2">Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground mb-6">Faça login para acessar seu progresso salvo e sincronizado.</p>

            <label className="block mb-2 text-xs font-medium">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@exemplo.com"
              className="w-full p-3 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />

            <div className="flex items-center space-x-2 mb-4">
              <button onClick={sendMagicLink} disabled={loading} className="flex-1 py-3 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60">
                {loading ? 'Enviando...' : 'Enviar link mágico'}
              </button>
              <button onClick={() => { setEmail(''); setMessage(''); }} className="py-3 px-3 rounded border text-sm text-muted-foreground">Limpar</button>
            </div>

            <div className="my-3">
              <button onClick={signInWithGoogle} className="w-full py-3 rounded border bg-white text-gray-800 flex items-center justify-center space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.04 1.53 7.43 2.79l5.46-5.46C34.55 3.3 29.66 1.5 24 1.5 14.88 1.5 6.98 6.96 3.7 14.38l6.37 4.95C12.77 13.33 17.9 9.5 24 9.5z"/>
                  <path fill="#34A853" d="M46.5 24c0-1.63-.15-2.85-.48-4.1H24v8.02h12.91c-.56 3.02-2.3 5.28-4.9 6.9l7.56 5.86C43.6 36.05 46.5 30.66 46.5 24z"/>
                  <path fill="#4A90E2" d="M10.07 28.33A14.99 14.99 0 0 1 9 24c0-1.33.22-2.61.61-3.8L3.24 15.25C1.22 18.9.5 21.94.5 24c0 2.06.72 5.1 2.74 8.75l6.83-4.42z"/>
                  <path fill="#FBBC05" d="M24 46.5c6.66 0 11.55-2 15.2-5.43l-7.56-5.86c-2.58 1.9-5.8 3.12-9.64 3.12-6.1 0-11.23-3.83-13.93-9.53l-6.37 4.95C6.98 41.04 14.88 46.5 24 46.5z"/>
                </svg>
                <span>Entrar com Google</span>
              </button>
            </div>

            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}

            <div className="mt-6 text-xs text-muted-foreground">
              <p>Ao entrar, seus dados serão sincronizados com sua conta.</p>
              <p className="mt-2">Novo por aqui? Crie uma conta usando seu email — é rápido e seguro.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
