export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
