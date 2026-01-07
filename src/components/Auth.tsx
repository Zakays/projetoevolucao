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
      {message && <p className="mt-3 text-sm">{message}</p>}
    </div>
  );
}
