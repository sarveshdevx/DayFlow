import React, { useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { InlineTaskComposer } from './InlineTaskComposer';

export const QuickAddModal: React.FC = () => {
  const { isQuickAddOpen, setQuickAddOpen, selectedProjectId } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global 'Q' shortcut when not typing in an input/textarea
      if (
        (e.key === 'q' || e.key === 'Q') &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        e.preventDefault();
        setQuickAddOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setQuickAddOpen]);

  if (!isQuickAddOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl">
        <InlineTaskComposer
          initialProjectId={selectedProjectId}
          onClose={() => setQuickAddOpen(false)}
          className="bg-[#242424] border-[#444444] shadow-2xl"
        />
      </div>
    </div>
  );
};

