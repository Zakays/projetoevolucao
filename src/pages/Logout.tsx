import React from 'react';

export default function Logout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 animate-spin">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.2" />
            <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">Saindo da conta...</h2>
        <p className="text-sm text-muted-foreground mt-2">Aguarde um momento enquanto encerra sua sessão.</p>
      </div>
    </div>
  );
}
