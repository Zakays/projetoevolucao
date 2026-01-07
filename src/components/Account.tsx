import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { storage } from '@/lib/storage';
import { Link, useNavigate } from 'react-router-dom';

// Helper to add a timeout to a promise
const withTimeout = <T,>(p: Promise<T>, ms = 5000): Promise<T> => {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(r => { clearTimeout(t); resolve(r); }).catch(err => { clearTimeout(t); reject(err); });
  });
};

export default function Account() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const supabase = getSupabase();
      supabase.auth.getUser().then(res => setUser(res.data.user || null));
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });
      return () => { sub.subscription.unsubscribe(); };
    } catch (e) {
      // supabase not initialized
    }
  }, []);

  const signOut = async () => {
    if (!user) return;
    // immediate feedback: show loading and navigate to /logout right away
    setLoading(true);
    try {
      try { localStorage.setItem('glowup:loggingOut', '1'); } catch (e) { /* noop */ }
      try { window.location.hash = '#/logout'; } catch (e) { /* noop */ }

      // perform logout tasks in background; don't block UI
      (async () => {
        try {
          try { await withTimeout(storage.backupToSupabase(user.id), 5000); } catch (e) { console.warn('backup timed out or failed', e); }
          const supabase = getSupabase();
          try { await withTimeout(supabase.auth.signOut(), 4000); } catch (e) { console.warn('supabase.signOut timed out or failed', e); }
          try { storage.clearAllLocalData(); } catch (e) { /* noop */ }
        } catch (err) {
          console.error('Background sign out error', err);
        } finally {
          try { localStorage.removeItem('glowup:loggingOut'); } catch (e) { /* noop */ }
          try { window.location.hash = '#/login'; } catch (e) { /* noop */ }
        }
      })();
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={'text-center'}>
        <Link to={'/login'} className={'text-sm text-muted-foreground underline'}>Entrar</Link>
      </div>
    );
  }

  return (
    <div className={'text-center'}>
      <div className={'text-xs text-muted-foreground mb-1'}>{user.email}</div>
      <button onClick={signOut} disabled={loading} className={'text-sm text-red-500'}>
        {loading ? 'Saindo...' : 'Sair'}
      </button>
    </div>
  );
}
