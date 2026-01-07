import { ReactNode } from 'react';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Main content */}
      <div className="md:ml-64">
        <main className="min-h-screen p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}