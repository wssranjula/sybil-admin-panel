'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from './Navigation';
import { ProtectedRoute } from './ProtectedRoute';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't show navigation on the login page
  const isLoginPage = pathname === '/';

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Protect all other pages
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Navigation />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}

