import React, { useState } from 'react';
import { Eye, EyeOff, SlidersHorizontal, Plus } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { TaskList } from '../task/TaskList';
import { InlineTaskComposer } from '../task/InlineTaskComposer';
import { useUIStore } from '../../store/useUIStore';

export const InboxView: React.FC = () => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'priority' | 'date'>('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const { searchQuery } = useUIStore();

  // Query Inbox tasks (where projectId is null)
  const rawTasks = useLiveQuery(() => db.tasks.toArray()) || [];

  let inboxTasks = rawTasks.filter((t) => !t.projectId);

  // Active inbox tasks count (regardless of search or showCompleted)
  const activeInboxTasksCount = rawTasks.filter((t) => !t.projectId && !t.isCompleted).length;

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

  // Check if inbox has zero active tasks (or no tasks match and active count is 0)
  const isEmptyInbox = activeInboxTasksCount === 0 && (!showCompleted || inboxTasks.length === 0);

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

      {/* Task List or Custom Empty State */}
      {isEmptyInbox ? (
        isAddingTask ? (
          <div className="pt-2">
            <InlineTaskComposer
              initialProjectId={null}
              onClose={() => setIsAddingTask(false)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
            <img
              src="/empty-inbox.png"
              alt="Inbox is empty"
              className="w-64 sm:w-72 max-w-[280px] sm:max-w-[300px] h-auto mx-auto mb-6 object-contain pointer-events-none drop-shadow-md"
            />
            <h2 className="text-lg font-bold text-white mb-2">Inbox is empty</h2>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto mb-6 leading-relaxed">
              Capture new ideas, notes, or tasks anytime. Add a task to get started.
            </p>
            <button
              type="button"
              onClick={() => setIsAddingTask(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#dc4c3e] hover:bg-[#c53b27] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-md transition-all duration-150 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add task</span>
            </button>
          </div>
        )
      ) : inboxTasks.length === 0 && searchQuery.trim() ? (
        <div className="py-12 text-center text-neutral-400">
          <p className="text-sm font-medium text-neutral-300">No tasks found</p>
          <p className="text-xs text-neutral-500 mt-1">
            No tasks in Inbox match &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : (
        <TaskList
          tasks={inboxTasks}
          projectId={null}
        />
      )}
    </div>
  );
};

