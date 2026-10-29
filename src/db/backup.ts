import { db } from './index';
import type { Task, Project, Section, Label, UserPreferences } from '../types';

export interface TaskFlowBackupData {
  version: number;
  appName: string;
  exportedAt: string;
  tasks: Task[];
  projects: Project[];
  sections: Section[];
  labels: Label[];
  preferences: UserPreferences[];
}

export async function exportTaskFlowData(): Promise<void> {
  const [tasks, projects, sections, labels, preferences] = await Promise.all([
    db.tasks.toArray(),
    db.projects.toArray(),
    db.sections.toArray(),
    db.labels.toArray(),
    db.preferences.toArray(),
  ]);

  const backupData: TaskFlowBackupData = {
    version: 1,
    appName: 'TaskFlow',
    exportedAt: new Date().toISOString(),
    tasks,
    projects,
    sections,
    labels,
    preferences,
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const dateStr = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `taskflow-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importTaskFlowData(jsonFile: File, mode: 'replace' | 'merge' = 'replace'): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const text = await jsonFile.text();
    const data: TaskFlowBackupData = JSON.parse(text);

    if (!data || !Array.isArray(data.tasks)) {
      throw new Error('Invalid backup file format: tasks array missing');
    }

    await db.transaction('rw', [db.tasks, db.projects, db.sections, db.labels, db.preferences], async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.tasks.clear(),
          db.projects.clear(),
          db.sections.clear(),
          db.labels.clear(),
          db.preferences.clear(),
        ]);
      }

      if (data.projects && data.projects.length > 0) {
        await db.projects.bulkPut(data.projects);
      }
      if (data.sections && data.sections.length > 0) {
        await db.sections.bulkPut(data.sections);
      }
      if (data.labels && data.labels.length > 0) {
        await db.labels.bulkPut(data.labels);
      }
      if (data.preferences && data.preferences.length > 0) {
        await db.preferences.bulkPut(data.preferences);
      }
      if (data.tasks && data.tasks.length > 0) {
        await db.tasks.bulkPut(data.tasks);
      }
    });

    return {
      success: true,
      message: `Successfully imported ${data.tasks.length} tasks and ${data.projects?.length || 0} projects.`,
      count: data.tasks.length,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during import',
    };
  }
}
