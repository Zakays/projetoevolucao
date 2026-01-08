import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getSession, signOut, onAuthStateChange } from '@/lib/auth';

export default function Account() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    getSession().then(async (r: any) => {
      console.debug('Account: getSession ->', r);
      if (!mounted) return;
      const session = r?.data?.session ?? null;
      if (session?.user) {
        setUser(session.user);
        return;
      }
      // fallback: try getUser()
      try {
        const user = await (await import('@/lib/auth')).getUser();
        console.debug('Account: getUser fallback ->', user);
        if (!mounted) return;
        setUser(user ?? null);
      } catch (e) {
        console.warn('Account getUser fallback error', e);
      }
    }).catch((e) => { console.warn('Account getSession error', e); });

    const resp: any = onAuthStateChange((event, session) => {
      console.debug('Account: onAuthStateChange', event, session);
      if (!mounted) return;
      setUser(session?.user ?? null);
    });

    // supabase returns { data: { subscription } }
    const subscription = resp?.data?.subscription ?? resp?.data ?? resp;

    return () => {
      mounted = false;
      try { subscription?.unsubscribe?.(); } catch (e) { /* noop */ }
    };
  }, []);

  return (
    <div className={'text-center'}>
      {user ? (
        <div className={'space-y-2'}>
          <div className={'flex items-center gap-2 justify-center'}>
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt={'avatar'} className={'w-8 h-8 rounded-full'} />
            ) : null}
            <div className={'text-sm'}>{user.email || user?.user_metadata?.full_name || user?.id}</div>
          </div>
          <div>
            <button onClick={async () => { await signOut(); setUser(null); navigate('/login'); }} className={'text-sm text-muted-foreground underline'}>Sair</button>
          </div>
        </div>
      ) : (
        <div>
          <button onClick={() => navigate('/login')} className={'text-sm underline'}>Entrar</button>
        </div>
      )}
      <div className={'mt-2'}>
        <Link to={'/settings'} className={'text-sm text-muted-foreground underline'}>Configurações</Link>
      </div>
    </div>
  );
}
