import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSupabase } from '@/lib/supabase';

export default function AuthGate({ children }: { children: any }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [errored, setErrored] = useState<string | null>(null);
  const location = useLocation();

  // small helper to add timeout to promises
  const withTimeout = async <T,>(p: Promise<T>, ms = 5000): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timeout')), ms);
      p.then((v) => {
        clearTimeout(t);
        resolve(v);
      }).catch((e) => {
        clearTimeout(t);
        reject(e);
      });
    });
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = getSupabase();
        // prefer getSession which is more explicit about persisted sessions
        const res = await withTimeout(supabase.auth.getSession(), 5000);
        const session = res?.data?.session;
        const user = session?.user;
        if (mounted) setAuthed(!!user);
        // if no session, but localStorage contains supabase auth keys, surface a helpful error
        if (mounted && !user) {
          try {
            const hasStored = Object.keys(localStorage).some(k => /supabase|sb-|supabase.auth/i.test(k));
            if (hasStored) {
              setErrored('Sessão encontrada no armazenamento local, mas não pôde ser restaurada automaticamente.');
            }
          } catch (e) {
            // noop
          }
        }
      } catch (e: any) {
        if (mounted) {
          setAuthed(false);
          setErrored(e?.message === 'timeout' ? 'Tempo esgotado ao verificar sessão' : (e?.message || String(e)));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Allow public access to /login and /logout
  if (location.pathname === '/login' || location.pathname === '/instrutor' || location.pathname === '/logout') return children;

  // While checking auth show a visible loader (prevents blank/black screen)
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.2" />
            <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
            </path>
          </svg>
          <div style={{ fontSize: 16 }}>Carregando sua sessão...</div>
        </div>
      </div>
    );
  }

  if (!authed) return <Navigate to="/login" replace />;

  // If there was an error retrieving auth, show a minimal error overlay instead of blank
  if (errored) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111827' }}>
        <div style={{ color: 'white', padding: 20, borderRadius: 8, maxWidth: 640 }}>
          <h3 style={{ marginBottom: 8 }}>Erro ao restaurar sessão</h3>
          <p style={{ marginBottom: 12, opacity: 0.9 }}>{errored}</p>
          <div>
            <a href="#/login" style={{ color: '#60a5fa' }}>Ir para tela de login</a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
