export type Priority = 1 | 2 | 3 | 4;

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  recurrenceRule?: string; // e.g. 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly' | custom string
  projectId?: string | null; // null or undefined means Inbox
  sectionId?: string | null;
  parentId?: string | null; // For nested subtasks
  isCompleted: boolean;
  completedAt?: string | null;
  orderIndex: number;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isFavorite: boolean;
  isArchived: boolean;
  orderIndex: number;
  createdAt: string;
}

export interface Section {
  id: string;
  projectId: string;
  name: string;
  orderIndex: number;
  createdAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface UserPreferences {
  id: string;
  theme: 'dark' | 'light' | 'system';
  soundEnabled: boolean;
  sidebarCollapsed: boolean;
  density: 'compact' | 'comfortable';
}

export type ViewType = 'inbox' | 'today' | 'upcoming' | 'filters-labels' | 'productivity' | 'project';

