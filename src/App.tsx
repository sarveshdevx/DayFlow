import React, { useEffect, useState } from 'react';
import { seedInitialDataIfNeeded } from './db';
import { AppLayout } from './components/layout/AppLayout';

export const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await seedInitialDataIfNeeded();
      } catch (err) {
        console.error('Failed to initialize database:', err);
      } finally {
        setIsReady(true);
      }
    }
    init();
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[#1e1e1e] text-neutral-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#dc4c3e] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium tracking-wide">Initializing TaskFlow...</p>
        </div>
      </div>
    );
  }

  return <AppLayout />;
};

export default App;

