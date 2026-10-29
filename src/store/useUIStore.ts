import { create } from 'zustand';
import type { ViewType } from '../types';

interface UIState {
  currentView: ViewType;
  selectedProjectId: string | null;
  isSidebarOpen: boolean;
  isQuickAddOpen: boolean;
  isBackupModalOpen: boolean;
  searchQuery: string;
  selectedTaskId: string | null;
  soundEnabled: boolean;
  
  // Actions
  setView: (view: ViewType, projectId?: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setQuickAddOpen: (open: boolean) => void;
  setBackupModalOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTaskId: (id: string | null) => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'inbox',
  selectedProjectId: null,
  isSidebarOpen: true,
  isQuickAddOpen: false,
  isBackupModalOpen: false,
  searchQuery: '',
  selectedTaskId: null,
  soundEnabled: true,

  setView: (view: ViewType, projectId: string | null = null) => {
    set({ currentView: view, selectedProjectId: projectId, selectedTaskId: null });
  },
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),
  setQuickAddOpen: (open: boolean) => set({ isQuickAddOpen: open }),
  setBackupModalOpen: (open: boolean) => set({ isBackupModalOpen: open }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedTaskId: (id: string | null) => set({ selectedTaskId: id }),
  setSoundEnabled: (enabled: boolean) => set({ soundEnabled: enabled }),
}));
