import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { storage } from './lib/storage'
import { initAuthFlow, onAuthStateChange } from '@/lib/auth';

// Aplicar tema na inicialização (mantém comportamento visual)
const applyInitialTheme = () => {
  try {
    const settings = storage.getSettings();
    const root = document.documentElement;
    if (settings.theme === 'dark') root.classList.add('dark');
    else if (settings.theme === 'light') root.classList.remove('dark');
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  } catch (e) {
    // fallback: do nothing
  }
};

applyInitialTheme();

const container = document.getElementById('root')
const root = createRoot(container!)

async function bootstrap() {
  try {
    await initAuthFlow();

    onAuthStateChange(async (_event, session) => {
      try {
        const user = session?.user;
        if (user && user.id) {
          await storage.restoreFromSupabase(user.id);
        } else {
          storage.clearLocalUserData();
        }
      } catch (e) {
        console.warn('Auth state change handling failed', e);
      }
    });
  } catch (e) {
    console.warn('initAuthFlow error', e);
  }

  root.render(<App />)
}

bootstrap();
