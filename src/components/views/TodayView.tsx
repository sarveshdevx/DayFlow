import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { TaskList } from '../task/TaskList';
import { getTodayString } from '../../utils/date';
import { useUIStore } from '../../store/useUIStore';

export const TodayView: React.FC = () => {
  const { searchQuery } = useUIStore();
  const todayStr = getTodayString();
  const allTasks = useLiveQuery(() => db.tasks.toArray()) || [];

  let todayTasks = allTasks.filter((t) => t.dueDate === todayStr && !t.isCompleted);
  let overdueTasks = allTasks.filter((t) => t.dueDate && t.dueDate < todayStr && !t.isCompleted);

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    todayTasks = todayTasks.filter((t) => t.title.toLowerCase().includes(q));
    overdueTasks = overdueTasks.filter((t) => t.title.toLowerCase().includes(q));
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="pb-4 mb-4 border-b border-[#282828]">
        <h1 className="text-xl font-bold text-white tracking-tight">Today</h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* Overdue Section */}
      {overdueTasks.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-red-900/40">
            <span className="text-xs font-semibold text-[#dc4c3e] uppercase tracking-wider">Overdue</span>
            <span className="text-[11px] text-neutral-500 font-normal">({overdueTasks.length})</span>
          </div>
          <TaskList tasks={overdueTasks} emptyTitle="" emptySubtitle="" />
        </div>
      )}

      {/* Today Section */}
      <div>
        <TaskList
          tasks={todayTasks}
          defaultDueDate={todayStr}
          emptyTitle="Nothing scheduled for today"
          emptySubtitle="Take a break or schedule upcoming tasks."
        />
      </div>
    </div>
  );
};

