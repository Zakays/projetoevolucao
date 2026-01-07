import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { storage } from './lib/storage'

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

createRoot(document.getElementById("root")!).render(<App />);
