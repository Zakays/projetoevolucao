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
  console.warn('Supabase not initialized (missing env vars?)', e);
}

createRoot(document.getElementById("root")!).render(<App />);
