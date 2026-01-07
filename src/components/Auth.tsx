import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMagicLink = async () => {
    setLoading(true);
    setMessage('');
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin }
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
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
    <div className="p-4 max-w-sm mx-auto">
      <h2 className="text-lg font-semibold mb-2">Entrar</h2>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@exemplo.com"
        className="w-full p-2 border rounded mb-2"
      />
      <div className="flex items-center space-x-2">
        <button onClick={sendMagicLink} disabled={loading} className="btn">
          {loading ? 'Enviando...' : 'Enviar link'}
        </button>
        <button onClick={() => { setEmail(''); setMessage(''); }} className="btn-ghost">
          Limpar
        </button>
      </div>
      <div className="my-3">
        <button onClick={signInWithGoogle} className="w-full py-2 rounded bg-white text-gray-800 border flex items-center justify-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.04 1.53 7.43 2.79l5.46-5.46C34.55 3.3 29.66 1.5 24 1.5 14.88 1.5 6.98 6.96 3.7 14.38l6.37 4.95C12.77 13.33 17.9 9.5 24 9.5z"/>
            <path fill="#34A853" d="M46.5 24c0-1.63-.15-2.85-.48-4.1H24v8.02h12.91c-.56 3.02-2.3 5.28-4.9 6.9l7.56 5.86C43.6 36.05 46.5 30.66 46.5 24z"/>
            <path fill="#4A90E2" d="M10.07 28.33A14.99 14.99 0 0 1 9 24c0-1.33.22-2.61.61-3.8L3.24 15.25C1.22 18.9.5 21.94.5 24c0 2.06.72 5.1 2.74 8.75l6.83-4.42z"/>
            <path fill="#FBBC05" d="M24 46.5c6.66 0 11.55-2 15.2-5.43l-7.56-5.86c-2.58 1.9-5.8 3.12-9.64 3.12-6.1 0-11.23-3.83-13.93-9.53l-6.37 4.95C6.98 41.04 14.88 46.5 24 46.5z"/>
          </svg>
          <span>Entrar com Google</span>
        </button>
      </div>
      {message && <p className="mt-3 text-sm">{message}</p>}
    </div>
  );
}
