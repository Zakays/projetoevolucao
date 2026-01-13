import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { storage } from './lib/storage'
import { applyTheme } from './lib/theme';

// Aplicar tema na inicialização (mantém comportamento visual)
const applyInitialTheme = () => {
  try {
    const settings = storage.getSettings();
    applyTheme(settings.theme);
  } catch (e) {
    // fallback: do nothing
  }
};

applyInitialTheme();

const container = document.getElementById('root')
const root = createRoot(container!)

import { initSupabase } from './lib/supabase';

async function bootstrap() {
  // Auth removed: persistence without login will be implemented later.
  root.render(<App />)

  // Initialize Supabase realtime and persistence if env vars are present
  try {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      initSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);
      // attempt an initial restore (non-blocking)
      try { await storage.restoreFromSupabase(); } catch (e) { /* noop */ }
      // subscribe to realtime updates
      try { (storage as any).subscribeToRealtime(); } catch (e) { /* noop */ }
    }
  } catch (e) {
    // ignore failures during init
  }

  if (import.meta.env.PROD) {
    try {
      const { registerSW } = await import('virtual:pwa-register');
      registerSW({ immediate: true });
    } catch (e) {
      // PWA registration is optional in dev / when plugin is not installed
    }
  }
}

bootstrap();
