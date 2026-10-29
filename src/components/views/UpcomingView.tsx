import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { TaskList } from '../task/TaskList';
import { getTodayString } from '../../utils/date';
import { useUIStore } from '../../store/useUIStore';

export const UpcomingView: React.FC = () => {
  const { searchQuery } = useUIStore();
  const todayStr = getTodayString();
  const allTasks = useLiveQuery(() => db.tasks.toArray()) || [];

  let upcomingTasks = allTasks.filter((t) => t.dueDate && t.dueDate > todayStr && !t.isCompleted);

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    upcomingTasks = upcomingTasks.filter((t) => t.title.toLowerCase().includes(q));
  }

  // Group by due date
  const groupedTasks: Record<string, typeof upcomingTasks> = {};
  for (const t of upcomingTasks) {
    if (!t.dueDate) continue;
    if (!groupedTasks[t.dueDate]) groupedTasks[t.dueDate] = [];
    groupedTasks[t.dueDate].push(t);
  }

  const sortedDates = Object.keys(groupedTasks).sort();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="pb-4 mb-4 border-b border-[#282828]">
        <h1 className="text-xl font-bold text-white tracking-tight">Upcoming</h1>
        <p className="text-xs text-neutral-400 mt-0.5">Scheduled future commitments</p>
      </div>

      {sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            const formatted = dateObj.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={dateStr} className="border-b border-[#282828] pb-4">
                <h3 className="text-xs font-semibold text-neutral-300 mb-2">{formatted}</h3>
                <TaskList tasks={groupedTasks[dateStr]} />
              </div>
            );
          })}
        </div>
      ) : (
        <TaskList
          tasks={[]}
          emptyTitle="No upcoming tasks scheduled"
          emptySubtitle="Plan ahead by scheduling tasks with future dates."
        />
      )}
    </div>
  );
};
