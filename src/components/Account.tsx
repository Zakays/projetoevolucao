import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { storage } from '@/lib/storage';
import { Link } from 'react-router-dom';

export default function Account() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      // backup before sign out
      await storage.backupToSupabase(user.id);
      const supabase = getSupabase();
      await supabase.auth.signOut();
      setUser(null);
      // clear local user-specific data to avoid leaking between accounts
      try { storage.clearLocalUserData(); } catch (e) { /* noop */ }
    } catch (err) {
      console.error('Sign out failed', err);
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
