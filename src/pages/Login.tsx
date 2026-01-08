import React from 'react';
import { signInWithGoogle } from '@/lib/auth';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="w-full max-w-md bg-white shadow rounded p-8">
        <h2 className="text-2xl font-semibold mb-4">Entrar</h2>
        <p className="text-sm text-muted-foreground mb-6">Entrar com sua conta Google para sincronizar seus dados.</p>
        <button
          onClick={() => signInWithGoogle()}
          className="w-full py-3 rounded bg-white border flex items-center justify-center space-x-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.04 1.53 7.43 2.79l5.46-5.46C34.55 3.3 29.66 1.5 24 1.5 14.88 1.5 6.98 6.96 3.7 14.38l6.37 4.95C12.77 13.33 17.9 9.5 24 9.5z"/>
            <path fill="#34A853" d="M46.5 24c0-1.63-.15-2.85-.48-4.1H24v8.02h12.91c-.56 3.02-2.3 5.28-4.9 6.9l7.56 5.86C43.6 36.05 46.5 30.66 46.5 24z"/>
            <path fill="#4A90E2" d="M10.07 28.33A14.99 14.99 0 0 1 9 24c0-1.33.22-2.61.61-3.8L3.24 15.25C1.22 18.9.5 21.94.5 24c0 2.06.72 5.1 2.74 8.75l6.83-4.42z"/>
            <path fill="#FBBC05" d="M24 46.5c6.66 0 11.55-2 15.2-5.43l-7.56-5.86c-2.58 1.9-5.8 3.12-9.64 3.12-6.1 0-11.23-3.83-13.93-9.53l-6.37 4.95C6.98 41.04 14.88 46.5 24 46.5z"/>
          </svg>
          <span>Entrar com Google</span>
        </button>
      </div>
    </div>
  );
}
