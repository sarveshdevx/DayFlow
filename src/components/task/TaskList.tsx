import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Task } from '../../types';
import { TaskItem } from './TaskItem';
import { InlineTaskComposer } from './InlineTaskComposer';

interface TaskListProps {
  tasks: Task[];
  projectId?: string | null;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  projectId = null,
  emptyTitle = 'All clear for now',
  emptySubtitle = 'Tap the button below or press Q to add a task.',
}) => {
  const [isAddingTask, setIsAddingTask] = useState(false);

  return (
    <div className="space-y-1">
      {/* Task list items */}
      {tasks.length > 0 ? (
        <div className="divide-y divide-[#282828]/50">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-neutral-400">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#262626] mb-3 text-neutral-500">
            ✓
          </div>
          <p className="text-sm font-medium text-neutral-300">{emptyTitle}</p>
          <p className="text-xs text-neutral-500 mt-1">{emptySubtitle}</p>
        </div>
      )}

      {/* Add Task Trigger or Inline Composer */}
      {isAddingTask ? (
        <div className="pt-2">
          <InlineTaskComposer
            initialProjectId={projectId}
            onClose={() => setIsAddingTask(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAddingTask(true)}
          className="group flex items-center gap-2.5 py-2 px-3 text-sm text-neutral-400 hover:text-[#dc4c3e] transition-colors duration-150 w-full rounded-lg cursor-pointer mt-2"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full text-[#dc4c3e] group-hover:bg-[#dc4c3e] group-hover:text-white transition-colors duration-150">
            <Plus className="w-4 h-4" />
          </span>
          <span className="font-normal text-xs text-neutral-400 group-hover:text-[#dc4c3e]">Add task</span>
        </button>
      )}
    </div>
  );
};

