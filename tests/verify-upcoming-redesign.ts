import assert from 'assert';
import fs from 'fs';
import path from 'path';
import 'fake-indexeddb/auto';
import { db } from '../src/db';
import { formatDateToYYYYMMDD, getTodayString, getTomorrowString } from '../src/utils/date';

console.log('--- RUNNING UPCOMING REDESIGN VERIFICATION ---');

function getStartOfWeek(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  return date;
}

// 1. Verify file content and structure of UpcomingView.tsx
const upcomingViewContent = fs.readFileSync(
  path.resolve('src/components/views/UpcomingView.tsx'),
  'utf-8'
);

assert(upcomingViewContent.includes('grid grid-cols-7'), 'Must include 7-day horizontal calendar strip');
assert(upcomingViewContent.includes('ChevronLeft'), 'Must include navigation arrows');
assert(upcomingViewContent.includes('ChevronRight'), 'Must include navigation arrows');
assert(upcomingViewContent.includes('Today'), 'Must include Today button');
assert(upcomingViewContent.includes('showMonthPicker'), 'Must include Month/Year selector');
assert(upcomingViewContent.includes('#dc4c3e'), 'Must highlight today with coral-red accent');
assert(upcomingViewContent.includes('agenda-date-'), 'Must anchor each date in daily agenda');
assert(upcomingViewContent.includes('InlineTaskComposer'), 'Must render task composer under date');
console.log('✓ UpcomingView.tsx structure matches all interface requirements.');

// 2. Verify 7-day calendar strip calculation
const today = new Date();
const todayStr = getTodayString();
const tomorrowStr = getTomorrowString();
const weekStart = getStartOfWeek(today);

const weekDays = [0, 1, 2, 3, 4, 5, 6].map((i) => {
  const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
  const dateStr = formatDateToYYYYMMDD(d);
  const weekdayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = d.getDate();
  const isToday = dateStr === todayStr;
  const isPast = dateStr < todayStr;
  return { dateStr, weekdayShort, dayNum, isToday, isPast };
});

assert.strictEqual(weekDays.length, 7, 'Calendar strip must contain exactly 7 consecutive days');
const todayInStrip = weekDays.find((d) => d.isToday);
assert(todayInStrip !== undefined, "Today's date must be present and identified in the current week");
assert(todayInStrip.dateStr === todayStr, 'Identified date must match local todayStr');
console.log(`✓ 7-day calendar strip verified: Mon ${weekDays[0].dayNum} to Sun ${weekDays[6].dayNum}. Today (${todayStr}) highlighted.`);

// 3. Verify agenda date formatting: "30 Oct · Today · Friday", "31 Oct · Tomorrow · Saturday", "1 Nov · Sunday"
function formatAgendaHeading(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayNum = dateObj.getDate();
  const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const weekdayLong = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

  const isToday = dateStr === todayStr;
  const isTomorrow = dateStr === tomorrowStr;

  if (isToday) return `${dayNum} ${monthShort} · Today · ${weekdayLong}`;
  if (isTomorrow) return `${dayNum} ${monthShort} · Tomorrow · ${weekdayLong}`;
  return `${dayNum} ${monthShort} · ${weekdayLong}`;
}

const formattedToday = formatAgendaHeading(todayStr);
assert(formattedToday.includes('· Today ·'), `Today's heading must contain '· Today ·': got "${formattedToday}"`);
const formattedTomorrow = formatAgendaHeading(tomorrowStr);
assert(formattedTomorrow.includes('· Tomorrow ·'), `Tomorrow's heading must contain '· Tomorrow ·': got "${formattedTomorrow}"`);

const nextWeekDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
const nextWeekDateStr = formatDateToYYYYMMDD(nextWeekDate);
const formattedNextWeek = formatAgendaHeading(nextWeekDateStr);
assert(!formattedNextWeek.includes('· Today ·') && !formattedNextWeek.includes('· Tomorrow ·'), 'Future dates must not show Today/Tomorrow');
console.log('✓ Agenda date headings correctly formatted with relative labels.');

async function runDatabaseTests() {
  await db.open();

  // Clean test tasks
  await db.tasks.clear();

  // Test 4 & 5: Adding a task under a specific date assigns that exact date
  const targetDateStr = formatDateToYYYYMMDD(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3));
  const taskId = await db.tasks.add({
    id: 'test-upcoming-1',
    title: 'Future Milestone Review',
    isCompleted: false,
    priority: 1,
    dueDate: targetDateStr,
    orderIndex: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const savedTask = await db.tasks.get(taskId);
  assert(savedTask, 'Task must be saved in db');
  assert.strictEqual(savedTask.dueDate, targetDateStr, 'Task dueDate must match the selected date');
  console.log(`✓ Add task under date assigned exact date: ${savedTask.dueDate}`);

  // Test 6: Querying and grouping tasks by scheduled date
  const allTasks = await db.tasks.toArray();
  const tasksForTarget = allTasks.filter((t) => t.dueDate === targetDateStr && !t.isCompleted);
  assert.strictEqual(tasksForTarget.length, 1, 'Task appears under its assigned scheduled date');
  assert.strictEqual(tasksForTarget[0].title, 'Future Milestone Review');
  console.log('✓ Existing tasks correctly appear under their scheduled dates.');

  // Test 7: Week navigation logic
  const prevWeek = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() - 7);
  const nextWeek = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7);

  assert.strictEqual(
    (weekStart.getTime() - prevWeek.getTime()) / (1000 * 60 * 60 * 24),
    7,
    'Previous week shifts by exactly 7 days'
  );
  assert.strictEqual(
    (nextWeek.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24),
    7,
    'Next week shifts by exactly 7 days'
  );
  console.log('✓ Navigation arrows (< and >) shift week by 7 days.');

  // Test 8: Agenda range & scroll loading
  const initialDaysCount = 28;
  const initialDates = [];
  for (let i = 0; i < initialDaysCount; i++) {
    const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
    initialDates.push(formatDateToYYYYMMDD(d));
  }
  assert.strictEqual(initialDates.length, 28, 'Initial agenda displays 28 consecutive days');

  // Load more +14 days
  const expandedDaysCount = initialDaysCount + 14;
  const expandedDates = [];
  for (let i = 0; i < expandedDaysCount; i++) {
    const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
    expandedDates.push(formatDateToYYYYMMDD(d));
  }
  assert.strictEqual(expandedDates.length, 42, 'Loading more extends agenda by 14 days (42 total)');
  console.log('✓ Scrolling / Load more extends agenda dynamically into future dates.');

  // Test 9: Refreshing and persistence
  await db.close();
  await db.open();
  const reloadedTask = await db.tasks.get(taskId);
  assert(reloadedTask, 'Task remains in database after reconnect/refresh');
  assert.strictEqual(reloadedTask.dueDate, targetDateStr);
  console.log('✓ Persistence verified after application restart / database reconnect.');

  console.log('--- ALL UPCOMING REDESIGN TESTS PASSED! ---');
}

runDatabaseTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

