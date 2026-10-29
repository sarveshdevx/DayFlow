import type { Priority } from '../types';
import { getTodayString, getTomorrowString } from './date';

export interface ParsedTaskInput {
  cleanTitle: string;
  priority?: Priority;
  dueDate?: string;
  dueTime?: string;
  labels: string[];
}

export function parseNaturalLanguageTaskInput(input: string): ParsedTaskInput {
  let title = input.trim();
  let priority: Priority | undefined;
  let dueDate: string | undefined;
  let dueTime: string | undefined;
  const labels: string[] = [];

  // 1. Parse priority: p1, p2, p3, p4
  const priorityMatch = title.match(/\b(p[1-4]|!p[1-4])\b/i);
  if (priorityMatch) {
    const pNum = parseInt(priorityMatch[1].replace('!', '').substring(1), 10) as Priority;
    if (pNum >= 1 && pNum <= 4) {
      priority = pNum;
      title = title.replace(priorityMatch[0], '').trim();
    }
  }

  // 2. Parse labels: @urgent, @work, etc.
  const labelMatches = title.match(/@([a-zA-Z0-9_-]+)/g);
  if (labelMatches) {
    for (const match of labelMatches) {
      const labelName = match.substring(1).toLowerCase();
      if (!labels.includes(labelName)) {
        labels.push(labelName);
      }
      title = title.replace(match, '').trim();
    }
  }

  // 3. Parse specific time: e.g. "at 4pm", "at 16:00", "at 9:30am"
  const timeMatch = title.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;

    dueTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    title = title.replace(timeMatch[0], '').trim();
  }

  // 4. Parse relative dates
  const lowerTitle = title.toLowerCase();

  if (/\b(today|tonight)\b/i.test(lowerTitle)) {
    dueDate = getTodayString();
    title = title.replace(/\b(today|tonight)\b/gi, '').trim();
  } else if (/\b(tomorrow|tmrw)\b/i.test(lowerTitle)) {
    dueDate = getTomorrowString();
    title = title.replace(/\b(tomorrow|tmrw)\b/gi, '').trim();
  } else {
    // "in X days"
    const inDaysMatch = title.match(/\bin\s+(\d+)\s+days?\b/i);
    if (inDaysMatch) {
      const daysToAdd = parseInt(inDaysMatch[1], 10);
      const d = new Date();
      d.setDate(d.getDate() + daysToAdd);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dueDate = `${y}-${m}-${day}`;
      title = title.replace(inDaysMatch[0], '').trim();
    }
  }

  // Clean any leftover double spaces
  title = title.replace(/\s+/g, ' ').trim();

  return {
    cleanTitle: title,
    priority,
    dueDate,
    dueTime,
    labels,
  };
}
