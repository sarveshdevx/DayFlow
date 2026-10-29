import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Flag, Hash, Tag, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { Priority, Task } from '../../types';
import { parseNaturalLanguageTaskInput } from '../../utils/nlp';
import { getTodayString, getTomorrowString } from '../../utils/date';

interface InlineTaskComposerProps {
  initialProjectId?: string | null;
  initialTask?: Task;
  onClose: () => void;
  onSuccess?: (task: Task) => void;
  className?: string;
}

export const InlineTaskComposer: React.FC<InlineTaskComposerProps> = ({
  initialProjectId = null,
  initialTask,
  onClose,
  onSuccess,
  className = '',
}) => {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [priority, setPriority] = useState<Priority>(initialTask?.priority || 4);
  const [dueDate, setDueDate] = useState<string | undefined>(initialTask?.dueDate);
  const [dueTime, setDueTime] = useState<string | undefined>(initialTask?.dueTime);
  const [projectId, setProjectId] = useState<string | null>(initialTask ? (initialTask.projectId ?? null) : initialProjectId);
  const [labels, setLabels] = useState<string[]>(initialTask?.labels || []);
  const [labelInput, setLabelInput] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const availableLabels = useLiveQuery(() => db.labels.toArray()) || [];

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  // Live NLP parsing as user types
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);

    // If typing without editing an existing task, let NLP detect attributes dynamically
    if (!initialTask && val.length > 2) {
      const parsed = parseNaturalLanguageTaskInput(val);
      if (parsed.priority && parsed.priority !== priority) {
        setPriority(parsed.priority);
      }
      if (parsed.dueDate && parsed.dueDate !== dueDate) {
        setDueDate(parsed.dueDate);
      }
      if (parsed.dueTime && parsed.dueTime !== dueTime) {
        setDueTime(parsed.dueTime);
      }
      if (parsed.labels.length > 0) {
        setLabels((prev) => Array.from(new Set([...prev, ...parsed.labels])));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const now = new Date().toISOString();

    // Clean title from NLP tags before storing
    const parsed = parseNaturalLanguageTaskInput(title);
    const finalTitle = parsed.cleanTitle || title.trim();

    if (initialTask) {
      // Update existing task
      const updated: Task = {
        ...initialTask,
        title: finalTitle,
        description: description.trim(),
        priority,
        dueDate,
        dueTime,
        projectId,
        labels,
        updatedAt: now,
      };
      await db.tasks.put(updated);
      onSuccess?.(updated);
      onClose();
    } else {
      // Create new task
      const count = await db.tasks.count();
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: finalTitle,
        description: description.trim(),
        priority,
        dueDate,
        dueTime,
        projectId,
        isCompleted: false,
        orderIndex: count,
        labels,
        createdAt: now,
        updatedAt: now,
      };
      await db.tasks.add(newTask);
      onSuccess?.(newTask);
      // Reset input for rapid sequential adding
      setTitle('');
      setDescription('');
      setPriority(4);
      setDueDate(undefined);
      setDueTime(undefined);
      setLabels([]);
      titleInputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey && (e.metaKey || e.ctrlKey || e.target === titleInputRef.current)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const addLabel = (name: string) => {
    const cleaned = name.trim().toLowerCase().replace(/^@/, '');
    if (cleaned && !labels.includes(cleaned)) {
      setLabels([...labels, cleaned]);
    }
    setLabelInput('');
  };

  const removeLabel = (name: string) => {
    setLabels(labels.filter((l) => l !== name));
  };

  const currentProject = projects.find((p) => p.id === projectId);

  return (
    <div
      className={`border border-[#383838] bg-[#242424] rounded-xl p-3 shadow-xl transition-all duration-150 ${className}`}
      onKeyDown={handleKeyDown}
    >
      <form onSubmit={handleSubmit}>
        {/* Title Input */}
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Task name (e.g., 'Draft proposal tomorrow at 3pm p1')"
          className="w-full bg-transparent text-[#f2f2f2] placeholder-neutral-500 font-medium text-[15px] outline-none mb-1.5"
        />

        {/* Description Input */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description or notes"
          rows={2}
          className="w-full bg-transparent text-neutral-300 placeholder-neutral-500 text-xs outline-none resize-none leading-relaxed mb-3"
        />

        {/* Selected Attribute Badges */}
        {(dueDate || priority !== 4 || labels.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            {dueDate && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-[#333333] text-neutral-200 px-2 py-0.5 rounded-md border border-[#444444]">
                <Calendar className="w-3 h-3 text-[#16a34a]" />
                {dueDate} {dueTime && `@ ${dueTime}`}
                <button
                  type="button"
                  onClick={() => {
                    setDueDate(undefined);
                    setDueTime(undefined);
                  }}
                  className="hover:text-red-400 ml-1"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {priority !== 4 && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-[#333333] px-2 py-0.5 rounded-md border border-[#444444]">
                <Flag
                  className={`w-3 h-3 fill-current ${
                    priority === 1 ? 'text-[#dc4c3e]' : priority === 2 ? 'text-[#e58e26]' : 'text-[#3867d6]'
                  }`}
                />
                <span className="text-neutral-200">P{priority}</span>
                <button type="button" onClick={() => setPriority(4)} className="hover:text-red-400 ml-1 text-neutral-400">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {labels.map((lbl) => (
              <span
                key={lbl}
                className="inline-flex items-center gap-1 text-[11px] bg-[#333333] text-neutral-300 px-2 py-0.5 rounded-md border border-[#444444]"
              >
                <Tag className="w-2.5 h-2.5 text-neutral-400" />
                {lbl}
                <button type="button" onClick={() => removeLabel(lbl)} className="hover:text-red-400 ml-0.5 text-neutral-400">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#333333]">
          {/* Quick attribute pickers */}
          <div className="flex items-center gap-1.5">
            {/* Due Date Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowDatePicker(!showDatePicker);
                  setShowPriorityPicker(false);
                  setShowProjectPicker(false);
                  setShowLabelPicker(false);
                }}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                  dueDate ? 'border-[#16a34a]/50 text-[#16a34a] bg-[#16a34a]/10' : 'border-[#404040] text-neutral-400 hover:text-neutral-200 hover:bg-[#303030]'
                }`}
                title="Set Due Date"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{dueDate ? dueDate : 'Due date'}</span>
              </button>

              {/* Date Picker Dropdown */}
              {showDatePicker && (
                <div className="absolute left-0 bottom-full mb-1 w-48 bg-[#2d2d2d] border border-[#404040] rounded-lg shadow-2xl p-1.5 z-50 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setDueDate(getTodayString());
                      setShowDatePicker(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[#383838] flex items-center justify-between text-neutral-200"
                  >
                    <span>Today</span>
                    <span className="text-[10px] text-neutral-500">Today</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDueDate(getTomorrowString());
                      setShowDatePicker(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[#383838] flex items-center justify-between text-neutral-200"
                  >
                    <span>Tomorrow</span>
                    <span className="text-[10px] text-neutral-500">Tmrw</span>
                  </button>
                  <div className="border-t border-[#3a3a3a] my-1" />
                  <div className="px-2 py-1">
                    <label className="text-[10px] text-neutral-400 block mb-1">Pick date:</label>
                    <input
                      type="date"
                      value={dueDate || ''}
                      onChange={(e) => {
                        setDueDate(e.target.value);
                        setShowDatePicker(false);
                      }}
                      className="w-full bg-[#1e1e1e] border border-[#444444] rounded px-1.5 py-1 text-neutral-200 text-xs outline-none"
                    />
                  </div>
                  {dueDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setDueDate(undefined);
                        setDueTime(undefined);
                        setShowDatePicker(false);
                      }}
                      className="w-full text-left px-2 py-1 text-red-400 hover:bg-[#383838] rounded text-[11px] mt-1"
                    >
                      Clear date
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Priority Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowPriorityPicker(!showPriorityPicker);
                  setShowDatePicker(false);
                  setShowProjectPicker(false);
                  setShowLabelPicker(false);
                }}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                  priority !== 4 ? 'border-[#dc4c3e]/50 text-[#dc4c3e] bg-[#dc4c3e]/10' : 'border-[#404040] text-neutral-400 hover:text-neutral-200 hover:bg-[#303030]'
                }`}
                title="Set Priority"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>P{priority}</span>
              </button>

              {/* Priority Dropdown */}
              {showPriorityPicker && (
                <div className="absolute left-0 bottom-full mb-1 w-36 bg-[#2d2d2d] border border-[#404040] rounded-lg shadow-2xl p-1 z-50 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPriority(1);
                      setShowPriorityPicker(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[#383838] flex items-center gap-2 text-[#dc4c3e]"
                  >
                    <Flag className="w-3.5 h-3.5 fill-current" />
                    <span>Priority 1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPriority(2);
                      setShowPriorityPicker(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[#383838] flex items-center gap-2 text-[#e58e26]"
                  >
                    <Flag className="w-3.5 h-3.5 fill-current" />
                    <span>Priority 2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPriority(3);
                      setShowPriorityPicker(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[#383838] flex items-center gap-2 text-[#3867d6]"
                  >
                    <Flag className="w-3.5 h-3.5 fill-current" />
                    <span>Priority 3</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPriority(4);
                      setShowPriorityPicker(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[#383838] flex items-center gap-2 text-neutral-400"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Priority 4</span>
                  </button>
                </div>
              )}
            </div>

            {/* Labels Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowLabelPicker(!showLabelPicker);
                  setShowDatePicker(false);
                  setShowPriorityPicker(false);
                  setShowProjectPicker(false);
                }}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                  labels.length > 0 ? 'border-[#3867d6]/50 text-[#3867d6] bg-[#3867d6]/10' : 'border-[#404040] text-neutral-400 hover:text-neutral-200 hover:bg-[#303030]'
                }`}
                title="Add Label"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{labels.length > 0 ? `${labels.length} tags` : 'Labels'}</span>
              </button>

              {/* Label Picker Dropdown */}
              {showLabelPicker && (
                <div className="absolute left-0 bottom-full mb-1 w-48 bg-[#2d2d2d] border border-[#404040] rounded-lg shadow-2xl p-2 z-50 text-xs">
                  <div className="flex items-center gap-1 mb-2">
                    <input
                      type="text"
                      value={labelInput}
                      onChange={(e) => setLabelInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLabel(labelInput);
                        }
                      }}
                      placeholder="Type & Enter"
                      className="w-full bg-[#1e1e1e] border border-[#444444] rounded px-2 py-1 text-neutral-200 text-xs outline-none"
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {availableLabels.map((lbl) => (
                      <button
                        key={lbl.id}
                        type="button"
                        onClick={() => addLabel(lbl.name)}
                        className="w-full text-left px-2 py-1 rounded hover:bg-[#383838] flex items-center gap-1.5 text-neutral-300"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lbl.color }} />
                        <span>@{lbl.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Project destination selector & Submit controls */}
          <div className="flex items-center gap-2">
            {/* Project Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProjectPicker(!showProjectPicker);
                  setShowDatePicker(false);
                  setShowPriorityPicker(false);
                  setShowLabelPicker(false);
                }}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 px-2 py-1 rounded hover:bg-[#303030] transition-colors"
              >
                <Hash className="w-3.5 h-3.5 text-neutral-500" />
                <span className="max-w-[100px] truncate">{currentProject ? currentProject.name : 'Inbox'}</span>
              </button>

              {showProjectPicker && (
                <div className="absolute right-0 bottom-full mb-1 w-44 bg-[#2d2d2d] border border-[#404040] rounded-lg shadow-2xl p-1 z-50 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setProjectId(null);
                      setShowProjectPicker(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 ${
                      projectId === null ? 'bg-[#383838] text-white' : 'text-neutral-300 hover:bg-[#383838]'
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Inbox</span>
                  </button>
                  <div className="border-t border-[#3a3a3a] my-1" />
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => {
                        setProjectId(proj.id);
                        setShowProjectPicker(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 ${
                        projectId === proj.id ? 'bg-[#383838] text-white' : 'text-neutral-300 hover:bg-[#383838]'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: proj.color }} />
                      <span className="truncate">{proj.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded-md font-medium text-neutral-400 hover:text-neutral-200 hover:bg-[#303030] transition-colors"
            >
              Cancel
            </button>

            {/* Add/Save Task Button */}
            <button
              type="submit"
              disabled={!title.trim()}
              className="text-xs px-3.5 py-1.5 rounded-md font-semibold bg-[#dc4c3e] hover:bg-[#c53b27] disabled:opacity-50 disabled:hover:bg-[#dc4c3e] text-white transition-colors cursor-pointer shadow-sm"
            >
              {initialTask ? 'Save' : 'Add task'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
