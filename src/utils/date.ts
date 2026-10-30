export function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayString(): string {
  return formatDateToYYYYMMDD(new Date());
}

export function getTomorrowString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDateToYYYYMMDD(d);
}

export function getTodaySecondaryLabel(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'short' });
}

export function getTomorrowSecondaryLabel(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Calculates "Next week" (Upcoming Monday).
 * If today is Monday, schedules for next week's Monday (+7 days).
 * Example output: { dateStr: '2026-11-02', label: 'Mon 2 Nov' }
 */
export function getNextWeekDate(): { dateStr: string; label: string } {
  const d = new Date();
  const currentDay = d.getDay(); // 0 is Sunday, 1 is Monday
  // Days until next Monday:
  const daysUntilNextMonday = ((8 - currentDay) % 7) || 7;
  d.setDate(d.getDate() + daysUntilNextMonday);
  const dateStr = formatDateToYYYYMMDD(d);
  const label = `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
  return { dateStr, label };
}

/**
 * Calculates "Next weekend" (Upcoming or following Saturday).
 * If today is Friday, Saturday, or Sunday, jumps to Saturday of next week (+7 days after this weekend).
 * Example output: { dateStr: '2026-11-07', label: 'Sat 7 Nov' }
 */
export function getNextWeekendDate(): { dateStr: string; label: string } {
  const d = new Date();
  const currentDay = d.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  let daysToAdd = (6 - currentDay);
  if (currentDay === 5 || currentDay === 6 || currentDay === 0) {
    daysToAdd += 7;
  }
  d.setDate(d.getDate() + daysToAdd);
  const dateStr = formatDateToYYYYMMDD(d);
  const label = `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
  return { dateStr, label };
}

export function formatDueDate(dateStr?: string, timeStr?: string): { text: string; isOverdue: boolean; isToday: boolean; isTomorrow: boolean } {
  if (!dateStr) {
    return { text: '', isOverdue: false, isToday: false, isTomorrow: false };
  }

  const todayStr = getTodayString();
  const tomorrowStr = getTomorrowString();

  const isToday = dateStr === todayStr;
  const isTomorrow = dateStr === tomorrowStr;
  const isOverdue = dateStr < todayStr;

  let text = '';
  if (isToday) {
    text = 'Today';
  } else if (isTomorrow) {
    text = 'Tomorrow';
  } else {
    // Format e.g. "Oct 30" or "Nov 2, 2026"
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const currentYear = new Date().getFullYear();
    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });

    if (year === currentYear) {
      text = `${monthName} ${day}`;
    } else {
      text = `${monthName} ${day}, ${year}`;
    }
  }

  if (timeStr) {
    text += ` ${timeStr}`;
  }

  return { text, isOverdue, isToday, isTomorrow };
}

export function formatRecurrenceLabel(rule?: string): string {
  if (!rule) return '';
  switch (rule.toLowerCase()) {
    case 'daily':
      return 'Every day';
    case 'weekdays':
      return 'Every weekday (Mon-Fri)';
    case 'weekly':
      return 'Every week';
    case 'monthly':
      return 'Every month';
    case 'yearly':
      return 'Every year';
    default:
      return rule;
  }
}

/**
 * Natural language parser specifically for date input string (e.g. in "Type a date")
 */
export function parseDateInputText(query: string): { dueDate?: string; dueTime?: string; recurrenceRule?: string } | null {
  const text = query.trim().toLowerCase();
  if (!text) return null;

  let dueTime: string | undefined;
  let recurrenceRule: string | undefined;
  let cleaned = text;

  // Check for time: "at 4pm", "at 14:30", "4pm", "16:00"
  const timeMatch = cleaned.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) || cleaned.match(/\b(?:at\s+)(\d{1,2}):(\d{2})\b/i);
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3]?.toLowerCase();
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    dueTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    cleaned = cleaned.replace(timeMatch[0], '').trim();
  }

  // Check for recurrence: "every day", "daily", "every weekday", "every week", "every month", "every monday"
  if (/\b(?:every\s+day|daily)\b/i.test(cleaned)) {
    recurrenceRule = 'daily';
    cleaned = cleaned.replace(/\b(?:every\s+day|daily)\b/gi, '').trim();
  } else if (/\bevery\s+weekday\b/i.test(cleaned)) {
    recurrenceRule = 'weekdays';
    cleaned = cleaned.replace(/\bevery\s+weekday\b/gi, '').trim();
  } else if (/\b(?:every\s+week|weekly)\b/i.test(cleaned)) {
    recurrenceRule = 'weekly';
    cleaned = cleaned.replace(/\b(?:every\s+week|weekly)\b/gi, '').trim();
  } else if (/\b(?:every\s+month|monthly)\b/i.test(cleaned)) {
    recurrenceRule = 'monthly';
    cleaned = cleaned.replace(/\b(?:every\s+month|monthly)\b/gi, '').trim();
  } else if (/\b(?:every\s+year|yearly)\b/i.test(cleaned)) {
    recurrenceRule = 'yearly';
    cleaned = cleaned.replace(/\b(?:every\s+year|yearly)\b/gi, '').trim();
  }

  let dueDate: string | undefined;

  // "today", "tonight"
  if (/\b(today|tonight)\b/i.test(cleaned) || cleaned === '') {
    dueDate = getTodayString();
  }
  // "tomorrow", "tmrw"
  else if (/\b(tomorrow|tmrw)\b/i.test(cleaned)) {
    dueDate = getTomorrowString();
  }
  // "next week"
  else if (/\bnext\s+week\b/i.test(cleaned)) {
    dueDate = getNextWeekDate().dateStr;
  }
  // "next weekend"
  else if (/\bnext\s+weekend\b/i.test(cleaned)) {
    dueDate = getNextWeekendDate().dateStr;
  }
  // "in X days"
  else if (/^in\s+(\d+)\s+days?$/i.test(cleaned)) {
    const match = cleaned.match(/^in\s+(\d+)\s+days?$/i);
    if (match) {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(match[1], 10));
      dueDate = formatDateToYYYYMMDD(d);
    }
  }
  // Days of week: "monday", "mon", "tuesday", "tue", ...
  else {
    const daysMap: Record<string, number> = {
      sunday: 0, sun: 0,
      monday: 1, mon: 1,
      tuesday: 2, tue: 2, tues: 2,
      wednesday: 3, wed: 3,
      thursday: 4, thu: 4, thurs: 4,
      friday: 5, fri: 5,
      saturday: 6, sat: 6,
    };

    const nextDayMatch = cleaned.match(/^(?:next\s+)?(monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thurs|friday|fri|saturday|sat|sunday|sun)$/i);
    if (nextDayMatch) {
      const targetDay = daysMap[nextDayMatch[1].toLowerCase()];
      const d = new Date();
      const currentDay = d.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7;
      if (/^next\s+/i.test(cleaned) && diff < 7) {
        diff += 7;
      }
      d.setDate(d.getDate() + diff);
      dueDate = formatDateToYYYYMMDD(d);
    } else {
      // Try parsing standard date like "Nov 15", "15 Nov", "November 15, 2026", "2026-11-15"
      const currentYear = new Date().getFullYear();
      let attemptStr = cleaned;
      if (!/\d{4}/.test(attemptStr)) {
        attemptStr += ` ${currentYear}`;
      }
      const parsedTime = Date.parse(attemptStr);
      if (!isNaN(parsedTime)) {
        const d = new Date(parsedTime);
        dueDate = formatDateToYYYYMMDD(d);
      }
    }
  }

  // Strictly enforce: no past dates allowed
  const todayStr = getTodayString();
  if (dueDate && dueDate < todayStr) {
    dueDate = undefined;
  }

  if (!dueDate && !dueTime && !recurrenceRule) return null;
  return { dueDate, dueTime, recurrenceRule };
}

