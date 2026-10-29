import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { TaskList } from '../task/TaskList';
import { useUIStore } from '../../store/useUIStore';

interface ProjectViewProps {
  projectId: string;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ projectId }) => {
  const { searchQuery, setView } = useUIStore();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const project = useLiveQuery(() => db.projects.get(projectId), [projectId]);
  const tasks = useLiveQuery(
    () => db.tasks.where('projectId').equals(projectId).toArray(),
    [projectId]
  ) || [];

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-neutral-400">
        <p>Project not found.</p>
      </div>
    );
  }

  let activeTasks = tasks.filter((t) => !t.isCompleted);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    activeTasks = activeTasks.filter((t) => t.title.toLowerCase().includes(q));
  }

  const handleDeleteProject = async () => {
    // Delete project and reassign or delete tasks
    await db.transaction('rw', [db.projects, db.tasks], async () => {
      await db.projects.delete(projectId);
      await db.tasks.where('projectId').equals(projectId).delete();
    });
    setView('inbox');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Project Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#282828]">
        <div className="flex items-center gap-3">
          <span
            className="w-3.5 h-3.5 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{project.name}</h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              {activeTasks.length} {activeTasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>
        </div>

        {/* Delete Project action */}
        <div>
          {showConfirmDelete ? (
            <div className="flex items-center gap-2 bg-[#2d2d2d] px-2.5 py-1 rounded-md border border-red-800 text-xs">
              <span className="text-red-400">Delete project & tasks?</span>
              <button
                type="button"
                onClick={handleDeleteProject}
                className="text-white bg-red-600 hover:bg-red-700 px-2 py-0.5 rounded font-medium"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="text-neutral-300 hover:text-white px-1"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="text-neutral-500 hover:text-red-400 p-1.5 rounded hover:bg-[#282828] transition-colors"
              title="Delete project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      <TaskList
        tasks={activeTasks}
        projectId={projectId}
        emptyTitle={`No active tasks in ${project.name}`}
        emptySubtitle="Add the first task to get this project rolling."
      />
    </div>
  );
};
