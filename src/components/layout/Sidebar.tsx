import React, { useState } from 'react';
import {
  Inbox,
  Calendar,
  CalendarDays,
  Tag,
  Plus,
  ChevronDown,
  ChevronRight,
  Database,
  Volume2,
  VolumeX,
  Search,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useUIStore } from '../../store/useUIStore';
import { getTodayString } from '../../utils/date';

export const Sidebar: React.FC = () => {
  const {
    currentView,
    selectedProjectId,
    setView,
    isSidebarOpen,
    setQuickAddOpen,
    setBackupModalOpen,
    soundEnabled,
    setSoundEnabled,
  } = useUIStore();

  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectColor, setNewProjectColor] = useState('#ea580c');

  // Live queries from Dexie IndexedDB
  const inboxCount = useLiveQuery(async () => {
    return await db.tasks.filter((t) => !t.projectId && !t.isCompleted).count();
  }) || 0;

  const todayStr = getTodayString();
  const todayCount = useLiveQuery(async () => {
    return await db.tasks.filter((t) => t.dueDate === todayStr && !t.isCompleted).count();
  }) || 0;

  const projects = useLiveQuery(async () => {
    const list = await db.projects.toArray();
    return list.filter((p) => !p.isArchived).sort((a, b) => a.orderIndex - b.orderIndex);
  }) || [];

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const count = await db.projects.count();
    const newProj = {
      id: `proj-${Date.now()}`,
      name: newProjectName.trim(),
      color: newProjectColor,
      isFavorite: false,
      isArchived: false,
      orderIndex: count,
      createdAt: new Date().toISOString(),
    };
    await db.projects.add(newProj);
    setNewProjectName('');
    setIsAddingProject(false);
    setView('project', newProj.id);
  };

  const projectColorPalette = [
    '#ea580c', '#dc4c3e', '#e58e26', '#16a34a', '#2563eb', '#9333ea', '#64748b'
  ];

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-64 bg-[#191919] border-r border-[#2d2d2d] flex flex-col h-screen shrink-0 text-neutral-300 select-none">
      {/* Workspace / Brand Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-[#262626]">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="TaskFlow" className="w-6 h-6 rounded-md shadow-sm" />
          <div>
            <h1 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>TaskFlow</span>
              <span className="text-[10px] font-normal px-1 py-0.2 bg-[#333333] text-neutral-300 rounded">Local</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Global Add Task Action */}
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => setQuickAddOpen(true)}
          className="w-full flex items-center gap-2 py-1.5 px-2.5 text-xs font-semibold text-[#dc4c3e] hover:bg-[#282828] rounded-md transition-colors duration-150 cursor-pointer"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#dc4c3e] text-white">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </span>
          <span>Add task</span>
          <span className="ml-auto text-[10px] text-neutral-500 font-mono">Q</span>
        </button>
      </div>

      {/* Primary Navigation Views */}
      <nav className="px-2 pt-3 space-y-0.5 text-[13px]">
        {/* Search */}
        <button
          type="button"
          onClick={() => {
            // Focus global search
            const searchInput = document.getElementById('global-search-input');
            searchInput?.focus();
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-neutral-300 hover:bg-[#262626] hover:text-white transition-colors"
        >
          <Search className="w-4 h-4 text-neutral-400" />
          <span>Search</span>
          <span className="ml-auto text-[10px] text-neutral-500 font-mono">/</span>
        </button>

        {/* Inbox */}
        <button
          type="button"
          onClick={() => setView('inbox')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
            currentView === 'inbox'
              ? 'bg-[#2a2a2a] text-white font-medium'
              : 'text-neutral-300 hover:bg-[#262626] hover:text-white'
          }`}
        >
          <Inbox className="w-4 h-4 text-[#2563eb]" />
          <span>Inbox</span>
          {inboxCount > 0 && (
            <span className="ml-auto text-xs text-neutral-400 font-normal">
              {inboxCount}
            </span>
          )}
        </button>

        {/* Today */}
        <button
          type="button"
          onClick={() => setView('today')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
            currentView === 'today'
              ? 'bg-[#2a2a2a] text-white font-medium'
              : 'text-neutral-300 hover:bg-[#262626] hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 text-[#16a34a]" />
          <span>Today</span>
          {todayCount > 0 && (
            <span className="ml-auto text-xs text-neutral-400 font-normal">
              {todayCount}
            </span>
          )}
        </button>

        {/* Upcoming */}
        <button
          type="button"
          onClick={() => setView('upcoming')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
            currentView === 'upcoming'
              ? 'bg-[#2a2a2a] text-white font-medium'
              : 'text-neutral-300 hover:bg-[#262626] hover:text-white'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-[#9333ea]" />
          <span>Upcoming</span>
        </button>

        {/* Filters & Labels */}
        <button
          type="button"
          onClick={() => setView('filters-labels')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
            currentView === 'filters-labels'
              ? 'bg-[#2a2a2a] text-white font-medium'
              : 'text-neutral-300 hover:bg-[#262626] hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4 text-[#e58e26]" />
          <span>Filters & Labels</span>
        </button>
      </nav>

      {/* Projects Section */}
      <div className="mt-4 px-2 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2.5 py-1 text-xs font-semibold text-neutral-400 group">
          <button
            type="button"
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="flex items-center gap-1 hover:text-white"
          >
            {projectsExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <span>My Projects</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddingProject(true)}
            className="opacity-0 group-hover:opacity-100 hover:text-white p-0.5 rounded hover:bg-[#333333] transition-opacity"
            title="Add Project"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* New Project Input */}
        {isAddingProject && (
          <form onSubmit={handleAddProject} className="p-2 bg-[#252525] rounded-lg mt-1 border border-[#383838]">
            <input
              type="text"
              autoFocus
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full bg-transparent text-xs text-white placeholder-neutral-500 outline-none mb-2"
            />
            <div className="flex items-center gap-1 mb-2">
              {projectColorPalette.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewProjectColor(color)}
                  className={`w-3.5 h-3.5 rounded-full ${newProjectColor === color ? 'ring-2 ring-white ring-offset-1 ring-offset-[#252525]' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center justify-end gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setIsAddingProject(false)}
                className="px-2 py-0.5 text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newProjectName.trim()}
                className="px-2.5 py-0.5 bg-[#dc4c3e] text-white rounded font-medium disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </form>
        )}

        {/* Projects List */}
        {projectsExpanded && (
          <div className="space-y-0.5 mt-1 text-[13px]">
            {projects.map((proj) => (
              <button
                key={proj.id}
                type="button"
                onClick={() => setView('project', proj.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                  currentView === 'project' && selectedProjectId === proj.id
                    ? 'bg-[#2a2a2a] text-white font-medium'
                    : 'text-neutral-300 hover:bg-[#262626] hover:text-white'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: proj.color }}
                />
                <span className="truncate">{proj.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-2 border-t border-[#262626] flex items-center justify-between text-xs text-neutral-400">
        <button
          type="button"
          onClick={() => setBackupModalOpen(true)}
          className="flex items-center gap-1.5 py-1 px-2 rounded hover:bg-[#262626] hover:text-neutral-200 transition-colors"
          title="Backup and Restore IndexedDB Data"
        >
          <Database className="w-3.5 h-3.5 text-[#dc4c3e]" />
          <span>Backup</span>
        </button>

        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1 rounded hover:bg-[#262626] hover:text-neutral-200 transition-colors"
          title={soundEnabled ? 'Chime sound is active' : 'Sound muted'}
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-neutral-300" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
          )}
        </button>
      </div>
    </aside>
  );
};
