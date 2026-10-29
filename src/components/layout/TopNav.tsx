import React from 'react';
import { Menu, Plus, Search, X } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

interface TopNavProps {
  title: string;
}

export const TopNav: React.FC<TopNavProps> = ({ title }) => {
  const {
    toggleSidebar,
    searchQuery,
    setSearchQuery,
    setQuickAddOpen,
  } = useUIStore();

  return (
    <header className="h-12 border-b border-[#282828] bg-[#1e1e1e] flex items-center justify-between px-4 shrink-0 select-none">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-[#2b2b2b] transition-colors"
          title="Toggle sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold text-[#f2f2f2]">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 pointer-events-none" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks (/)..."
            className="w-48 sm:w-64 bg-[#282828] text-xs text-neutral-200 placeholder-neutral-500 rounded-md pl-8 pr-7 py-1 border border-[#383838] focus:border-neutral-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-neutral-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Quick Add */}
        <button
          type="button"
          onClick={() => setQuickAddOpen(true)}
          className="flex items-center gap-1.5 bg-[#dc4c3e] hover:bg-[#c53b27] text-white text-xs font-semibold px-2.5 py-1 rounded-md transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add task</span>
        </button>
      </div>
    </header>
  );
};
