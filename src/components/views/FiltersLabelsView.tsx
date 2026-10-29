import React, { useState } from 'react';
import { Flag, Plus, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { TaskList } from '../task/TaskList';
import type { Priority } from '../../types';

export const FiltersLabelsView: React.FC = () => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#2563eb');
  const [isAddingLabel, setIsAddingLabel] = useState(false);

  const labels = useLiveQuery(() => db.labels.toArray()) || [];
  const allTasks = useLiveQuery(() => db.tasks.toArray()) || [];

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newLabelName.trim().toLowerCase().replace(/^@/, '');
    if (!clean) return;

    await db.labels.put({
      id: `lbl-${Date.now()}`,
      name: clean,
      color: newLabelColor,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    });
    setNewLabelName('');
    setIsAddingLabel(false);
  };

  const handleDeleteLabel = async (id: string) => {
    await db.labels.delete(id);
    if (selectedTag === id) setSelectedTag(null);
  };

  // Filter tasks based on selections
  let filteredTasks = allTasks.filter((t) => !t.isCompleted);
  if (selectedTag) {
    const lblObj = labels.find((l) => l.id === selectedTag);
    if (lblObj) {
      filteredTasks = filteredTasks.filter(
        (t) => t.labels && t.labels.includes(lblObj.name)
      );
    }
  }
  if (selectedPriority) {
    filteredTasks = filteredTasks.filter((t) => t.priority === selectedPriority);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="pb-4 mb-6 border-b border-[#282828]">
        <h1 className="text-xl font-bold text-white tracking-tight">Filters & Labels</h1>
        <p className="text-xs text-neutral-400 mt-0.5">Filter tasks across all projects</p>
      </div>

      {/* Priority Filters */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
          Priority Filters
        </h2>
        <div className="flex flex-wrap gap-2">
          {([1, 2, 3, 4] as Priority[]).map((p) => {
            const isSelected = selectedPriority === p;
            const labels = { 1: 'P1 (Urgent)', 2: 'P2 (High)', 3: 'P3 (Medium)', 4: 'P4 (Normal)' };
            const colors = {
              1: 'text-[#dc4c3e]',
              2: 'text-[#e58e26]',
              3: 'text-[#3867d6]',
              4: 'text-neutral-400',
            };

            return (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPriority(isSelected ? null : p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-[#333333] border-white text-white'
                    : 'border-[#333333] bg-[#222222] hover:bg-[#2b2b2b]'
                }`}
              >
                <Flag className={`w-3.5 h-3.5 ${colors[p]} fill-current`} />
                <span>{labels[p]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Labels / Tags Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Labels
          </h2>
          <button
            type="button"
            onClick={() => setIsAddingLabel(!isAddingLabel)}
            className="text-xs text-[#dc4c3e] hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>New label</span>
          </button>
        </div>

        {isAddingLabel && (
          <form onSubmit={handleAddLabel} className="p-3 bg-[#252525] rounded-lg mb-3 border border-[#383838] flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="Label name (e.g., 'errands')"
              className="bg-transparent text-xs text-white placeholder-neutral-500 outline-none flex-1"
            />
            <input
              type="color"
              value={newLabelColor}
              onChange={(e) => setNewLabelColor(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
            />
            <button
              type="submit"
              disabled={!newLabelName.trim()}
              className="px-2.5 py-1 bg-[#dc4c3e] text-white rounded text-xs font-medium disabled:opacity-50"
            >
              Save
            </button>
          </form>
        )}

        <div className="flex flex-wrap gap-2">
          {labels.map((lbl) => {
            const isSelected = selectedTag === lbl.id;
            return (
              <div
                key={lbl.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-[#333333] border-white text-white'
                    : 'border-[#333333] bg-[#222222] hover:bg-[#2b2b2b] text-neutral-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedTag(isSelected ? null : lbl.id)}
                  className="flex items-center gap-1.5"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lbl.color }} />
                  <span>@{lbl.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteLabel(lbl.id)}
                  className="text-neutral-500 hover:text-red-400 ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtered Results */}
      <div>
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
          Filtered Tasks ({filteredTasks.length})
        </h2>
        <TaskList
          tasks={filteredTasks}
          emptyTitle="No tasks matching criteria"
          emptySubtitle="Select a different label or priority filter above."
        />
      </div>
    </div>
  );
};
