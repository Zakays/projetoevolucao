import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { storage } from './lib/storage'
import { initSupabase, getSupabase } from './lib/supabase';

// Aplicar tema na inicialização
const applyInitialTheme = () => {
  const settings = storage.getSettings();
  const root = document.documentElement;
  
  if (settings.theme === 'dark') {
    root.classList.add('dark');
  } else if (settings.theme === 'light') {
    root.classList.remove('dark');
  } else {
    // System theme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

applyInitialTheme();

// Inicializar Supabase com variáveis de ambiente
try {
  initSupabase(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string
  );

  // Listen auth state changes to sync data
  const supabase = getSupabase();
  let currentUserId: string | null = null;
  // expose supabase client for debugging in console
  try { (window as any).__supabase = supabase; } catch (e) { /* noop */ }
  try { console.log('DEBUG: VITE_SUPABASE_URL=', import.meta.env.VITE_SUPABASE_URL); } catch (e) { /* noop */ }
  (async () => {
    try {
      const s = await supabase.auth.getSession();
      console.log('DEBUG: supabase.auth.getSession() ->', s);
    } catch (e) {
      console.warn('DEBUG: getSession() error', e);
    }
    try {
      const keys = Object.keys(localStorage).filter(k => /supabase|sb-|supabase.auth/i.test(k));
      console.log('DEBUG: supabase-related localStorage keys', keys);
      if (keys.length) {
        try { console.log('DEBUG: token parse:', JSON.parse(localStorage.getItem(keys[0]) || 'null')); } catch (e) { console.warn('DEBUG: token parse error', e); }
      }
    } catch (e) { /* noop */ }
  })();
  // Restore existing session (if any) so user stays logged after reload
  try {
    supabase.auth.getSession().then(async (res) => {
      const session = res?.data?.session;
      const user = session?.user;
      if (user && user.id) {
        currentUserId = user.id;
        try {
          await storage.restoreFromSupabase(user.id);
          console.log('Restored data for', user.id);
        } catch (e) {
          console.warn('Failed to restore on startup', e);
        }
      } else {
        // no session: try to recover using stored token object (refresh_token)
        try {
          const key = Object.keys(localStorage).find(k => /supabase|sb-|supabase.auth/i.test(k));
          if (key) {
            const raw = localStorage.getItem(key);
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                const refresh = parsed?.refresh_token || parsed?.currentSession?.refresh_token || parsed?.refreshToken;
                if (refresh) {
                  console.log('Attempting to restore session from stored refresh_token...');
                  try {
                    const setRes = await supabase.auth.setSession({ refresh_token: refresh });
                    console.log('setSession result', setRes);
                    const restoredUser = setRes?.data?.session?.user;
                    if (restoredUser && restoredUser.id) {
                      currentUserId = restoredUser.id;
                      try { await storage.restoreFromSupabase(restoredUser.id); } catch (e) { console.warn('restore after setSession failed', e); }
                    }
                  } catch (e) {
                    console.warn('setSession failed', e);
                  }
                }
              } catch (e) { /* parse error */ }
            }
          }
        } catch (e) { /* noop */ }
      }
    }).catch(err => console.warn('getSession error', err));

    supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session && session.user) {
          const userId = session.user.id;
          if (userId) {
            currentUserId = userId;
            await storage.restoreFromSupabase(userId);
            console.log('Restored data for', userId);
          }
        } else {
          // Signed out: backup current data
          if (currentUserId) {
            await storage.backupToSupabase(currentUserId);
            console.log('Backed up data for', currentUserId);
            currentUserId = null;
          }
        }
      } catch (err) {
        console.error('Auth sync error', err);
      }
    });
  } catch (e) {
    console.warn('Auth listener setup failed', e);
  }
} catch (e) {
  console.warn('Supabase not initialized (missing env vars?)', e);
}

createRoot(document.getElementById("root")!).render(<App />);
