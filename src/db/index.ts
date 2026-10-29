import Dexie, { type Table } from 'dexie';
import type { Task, Project, Section, Label, UserPreferences } from '../types';

export class TaskFlowDatabase extends Dexie {
  tasks!: Table<Task, string>;
  projects!: Table<Project, string>;
  sections!: Table<Section, string>;
  labels!: Table<Label, string>;
  preferences!: Table<UserPreferences, string>;

  constructor() {
    super('TaskFlowDB');
    this.version(1).stores({
      tasks: 'id, projectId, sectionId, parentId, dueDate, priority, isCompleted, orderIndex, createdAt',
      projects: 'id, name, isFavorite, isArchived, orderIndex, createdAt',
      sections: 'id, projectId, orderIndex, createdAt',
      labels: 'id, name, isFavorite, createdAt',
      preferences: 'id',
    });
  }
}

export const db = new TaskFlowDatabase();

// Seed initial data if the database is brand new
export async function seedInitialDataIfNeeded() {
  const taskCount = await db.tasks.count();
  if (taskCount > 0) return;

  const now = new Date().toISOString();
  const todayStr = now.split('T')[0];

  // Seed default preferences
  await db.preferences.put({
    id: 'default',
    theme: 'dark',
    soundEnabled: true,
    sidebarCollapsed: false,
    density: 'compact',
  });

  // Seed starter projects
  const starterProjects: Project[] = [
    {
      id: 'proj-work',
      name: 'Work & Projects',
      color: '#ea580c',
      isFavorite: true,
      isArchived: false,
      orderIndex: 0,
      createdAt: now,
    },
    {
      id: 'proj-personal',
      name: 'Personal Life',
      color: '#16a34a',
      isFavorite: false,
      isArchived: false,
      orderIndex: 1,
      createdAt: now,
    },
  ];
  await db.projects.bulkAdd(starterProjects);

  // Seed starter labels
  const starterLabels: Label[] = [
    { id: 'lbl-urgent', name: 'urgent', color: '#dc4c3e', isFavorite: true, createdAt: now },
    { id: 'lbl-reading', name: 'reading', color: '#2563eb', isFavorite: false, createdAt: now },
    { id: 'lbl-errands', name: 'errands', color: '#16a34a', isFavorite: false, createdAt: now },
  ];
  await db.labels.bulkAdd(starterLabels);

  // Seed helpful starter tasks into Inbox
  const starterTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Welcome to TaskFlow! 👋 Click the circle to complete me',
      description: 'Your data is saved directly in IndexedDB on your Mac with zero server latency.',
      priority: 1,
      dueDate: todayStr,
      projectId: null, // Inbox
      isCompleted: false,
      orderIndex: 0,
      labels: ['urgent'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-2',
      title: 'Press "Q" anywhere to open the Quick Add composer',
      description: 'You can type natural language dates like "tomorrow at 4pm" or priority "p1".',
      priority: 2,
      dueDate: todayStr,
      projectId: null,
      isCompleted: false,
      orderIndex: 1,
      labels: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-3',
      title: 'Explore sidebar navigation & create custom projects',
      description: 'Organize tasks into projects, sections, and color-coded tags.',
      priority: 3,
      projectId: null,
      isCompleted: false,
      orderIndex: 2,
      labels: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-4',
      title: 'Export JSON backups from the Settings or Backup menu',
      description: 'Your tasks stay safe and can be restored or exported at any time.',
      priority: 4,
      projectId: null,
      isCompleted: false,
      orderIndex: 3,
      labels: [],
      createdAt: now,
      updatedAt: now,
    },
  ];
  await db.tasks.bulkAdd(starterTasks);
}
