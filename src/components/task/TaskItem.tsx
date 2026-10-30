import React, { useState } from 'react';
import { Calendar, MoreHorizontal, Pencil, Trash2, Tag, Repeat } from 'lucide-react';
import { db } from '../../db';
import type { Task } from '../../types';
import { CustomCheckbox } from '../common/CustomCheckbox';
import { PriorityBadge } from '../common/PriorityBadge';
import { formatDueDate, formatRecurrenceLabel } from '../../utils/date';
import { playTaskCompleteSound } from '../../utils/sound';
import { useUIStore } from '../../store/useUIStore';
import { InlineTaskComposer } from './InlineTaskComposer';

interface TaskItemProps {
  task: Task;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { soundEnabled } = useUIStore();

  const handleToggleComplete = async () => {
    const isNowCompleted = !task.isCompleted;
    if (isNowCompleted && soundEnabled) {
      playTaskCompleteSound();
    }
    await db.tasks.update(task.id, {
      isCompleted: isNowCompleted,
      completedAt: isNowCompleted ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDelete = async () => {
    await db.tasks.delete(task.id);
  };

  if (isEditing) {
    return (
      <div className="py-1">
        <InlineTaskComposer
          initialTask={task}
          onClose={() => setIsEditing(false)}
        />
      </div>
    );
  }

  const { text: dueDateText, isOverdue, isToday } = formatDueDate(task.dueDate, task.dueTime);

  return (
    <div className="group relative flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-[#252525] border-b border-[#2a2a2a] transition-colors duration-150">
      {/* Checkbox */}
      <div className="pt-0.5">
        <CustomCheckbox
          completed={task.isCompleted}
          priority={task.priority}
          onToggle={handleToggleComplete}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-16" onClick={() => setIsEditing(true)}>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[14px] leading-snug cursor-pointer font-normal break-words ${
              task.isCompleted
                ? 'line-through text-neutral-500'
                : 'text-[#e5e5e5] group-hover:text-white'
            }`}
          >
            {task.title}
          </span>
          <PriorityBadge priority={task.priority} />
        </div>

        {task.description && (
          <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Metadata row: Due date & Labels */}
        {(dueDateText || (task.labels && task.labels.length > 0)) && (
          <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs">
            {dueDateText && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                  isOverdue
                    ? 'text-[#dc4c3e]'
                    : isToday
                    ? 'text-[#16a34a]'
                    : 'text-neutral-400'
                }`}
                title={task.recurrenceRule ? formatRecurrenceLabel(task.recurrenceRule) : undefined}
              >
                <Calendar className="w-3 h-3" />
                <span>{dueDateText}</span>
                {task.recurrenceRule && (
                  <span className="inline-flex items-center gap-0.5 ml-0.5 opacity-80" title={formatRecurrenceLabel(task.recurrenceRule)}>
                    <Repeat className="w-2.5 h-2.5" />
                  </span>
                )}
              </span>
            )}

            {task.labels &&
              task.labels.map((lbl) => (
                <span
                  key={lbl}
                  className="inline-flex items-center gap-0.5 text-[11px] text-neutral-400 bg-[#2d2d2d] px-1.5 py-0.5 rounded border border-[#383838]"
                >
                  <Tag className="w-2.5 h-2.5 text-neutral-500" />
                  {lbl}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Hover Action Buttons */}
      <div className="absolute right-2 top-2.5 hidden group-hover:flex items-center gap-1 bg-[#252525] pl-2 rounded-md">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-[#333333] rounded transition-colors"
          title="Edit task"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="p-1 text-neutral-400 hover:text-red-400 hover:bg-[#333333] rounded transition-colors"
          title="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-[#333333] rounded transition-colors"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-[#2d2d2d] border border-[#404040] rounded shadow-xl py-1 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setIsEditing(true);
                }}
                className="w-full text-left px-3 py-1.5 text-neutral-300 hover:bg-[#383838]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  handleDelete();
                }}
                className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-[#383838]"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

