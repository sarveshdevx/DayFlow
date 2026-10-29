import React, { useState } from 'react';
import { Eye, EyeOff, SlidersHorizontal } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { TaskList } from '../task/TaskList';
import { useUIStore } from '../../store/useUIStore';

export const InboxView: React.FC = () => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'priority' | 'date'>('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const { searchQuery } = useUIStore();

  // Query Inbox tasks (where projectId is null)
  const rawTasks = useLiveQuery(() => db.tasks.toArray()) || [];

  let inboxTasks = rawTasks.filter((t) => !t.projectId);

  // Search filtering
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    inboxTasks = inboxTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.labels && t.labels.some((l) => l.toLowerCase().includes(q)))
    );
  }

  // Filter completed state
  if (!showCompleted) {
    inboxTasks = inboxTasks.filter((t) => !t.isCompleted);
  }

  // Sorting
  if (sortBy === 'priority') {
    inboxTasks.sort((a, b) => a.priority - b.priority);
  } else if (sortBy === 'date') {
    inboxTasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  } else {
    inboxTasks.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* View Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#282828]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Inbox</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {inboxTasks.length} {inboxTasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>

        {/* Display Controls */}
        <div className="flex items-center gap-2">
          {/* Toggle Completed */}
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors ${
              showCompleted
                ? 'bg-[#2f2f2f] text-neutral-200 border-[#444444]'
                : 'text-neutral-400 border-transparent hover:bg-[#282828] hover:text-neutral-200'
            }`}
            title="Toggle completed tasks"
          >
            {showCompleted ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Completed</span>
          </button>

          {/* Sort Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 px-2.5 py-1 rounded-md hover:bg-[#282828] transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sort</span>
            </button>

            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-[#2d2d2d] border border-[#404040] rounded-lg shadow-xl p-1 z-30 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('default');
                    setShowSortMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded ${
                    sortBy === 'default' ? 'bg-[#383838] text-white' : 'text-neutral-300 hover:bg-[#383838]'
                  }`}
                >
                  Default Order
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('priority');
                    setShowSortMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded ${
                    sortBy === 'priority' ? 'bg-[#383838] text-white' : 'text-neutral-300 hover:bg-[#383838]'
                  }`}
                >
                  By Priority
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('date');
                    setShowSortMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded ${
                    sortBy === 'date' ? 'bg-[#383838] text-white' : 'text-neutral-300 hover:bg-[#383838]'
                  }`}
                >
                  By Due Date
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task List */}
      <TaskList
        tasks={inboxTasks}
        projectId={null}
        emptyTitle="Inbox Zero achieved! 🎉"
        emptySubtitle="Capture new ideas, notes, or tasks anytime by pressing Q."
      />
    </div>
  );
};
