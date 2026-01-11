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

async function bootstrap() {
  // Auth removed: persistence without login will be implemented later.
  root.render(<App />)

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
