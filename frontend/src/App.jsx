import React, { useEffect } from 'react';
import AppRouter from './router/AppRouter';
import { Toaster } from './components/ui/toaster';
import { useUIStore } from './store/uiStore';
import { useAuthStore } from './store/authStore';
import LoadingSpinner from './components/common/LoadingSpinner';

import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  const { initDarkMode } = useUIStore();
  const { isLoading } = useAuthStore();

  useEffect(() => {
    initDarkMode();
  }, [initDarkMode]);

  return (
    <ErrorBoundary>
      <AppRouter />
      <Toaster />

      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in duration-300">
            <LoadingSpinner size="lg" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
              Authenticating...
            </p>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}
