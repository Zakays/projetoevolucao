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

      // If running as a mobile app (Capacitor), adjust polling and lifecycle hooks
      try {
        // dynamic import so bundlers don't require Capacitor in web builds
        const cap = await import('@capacitor/app');
        const capApp = (cap as any).App;
        if (capApp && typeof capApp.addListener === 'function') {
          // set a reasonable mobile poll (10s default or override with VITE_MOBILE_POLL_MS)
          const mobilePoll = Number(import.meta.env.VITE_MOBILE_POLL_MS || 10000);
          try { storage.setPollIntervalMs(mobilePoll); } catch (e) {}
          try { storage.startPolling(); } catch (e) {}

          capApp.addListener('appStateChange', (state: any) => {
            try {
              if (state && state.isActive) {
                try { storage.startPolling(); } catch (e) {}
                try { storage.forceSyncNow().catch(() => {}); } catch (e) {}
              } else {
                try { storage.stopPolling(); } catch (e) {}
              }
            } catch (e) { /* noop */ }
          });
        }
      } catch (e) { /* noop - Capacitor not present */ }
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
