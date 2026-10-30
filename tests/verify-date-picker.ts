import 'fake-indexeddb/auto';
import { db, seedInitialDataIfNeeded } from '../src/db/index';
import {
  parseDateInputText,
  getNextWeekDate,
  getNextWeekendDate,
  getTodayString,
  getTomorrowString,
  formatRecurrenceLabel,
} from '../src/utils/date';
import type { Task } from '../src/types';

async function runDatePickerTests() {
  console.log('--- RUNNING DATE PICKER & RECURRENCE VERIFICATION ---\n');

  // 1. Test Quick Option date generators
  console.log('1. Testing Quick Option Date Generators:');
  const todayStr = getTodayString();
  const tomorrowStr = getTomorrowString();
  const nextWeek = getNextWeekDate();
  const nextWeekend = getNextWeekendDate();

  console.log(`  Today: ${todayStr}`);
  console.log(`  Tomorrow: ${tomorrowStr}`);
  console.log(`  Next week: ${nextWeek.dateStr} (${nextWeek.label})`);
  console.log(`  Next weekend: ${nextWeekend.dateStr} (${nextWeekend.label})`);

  if (!nextWeek.dateStr || !nextWeek.label.includes('Mon')) {
    throw new Error('Next week calculation failed - expected Monday');
  }
  if (!nextWeekend.dateStr || !nextWeekend.label.includes('Sat')) {
    throw new Error('Next weekend calculation failed - expected Saturday');
  }
  console.log('  ✓ Quick date generators verified.');

  // 2. Test Natural Language Date Parsing (Type a date)
  console.log('\n2. Testing "Type a date" Natural Language Input:');
  const testCases = [
    { input: 'today', expectedDate: todayStr },
    { input: 'tomorrow', expectedDate: tomorrowStr },
    { input: 'next week', expectedDate: nextWeek.dateStr },
    { input: 'next weekend', expectedDate: nextWeekend.dateStr },
    { input: 'November 15', expectedDate: '2026-11-15' },
    { input: 'daily at 4pm', expectedDate: todayStr, expectedTime: '16:00', expectedRule: 'daily' },
    { input: 'every weekday', expectedRule: 'weekdays' },
  ];

  for (const tc of testCases) {
    const res = parseDateInputText(tc.input);
    if (!res) throw new Error(`Failed to parse: ${tc.input}`);
    if (tc.expectedDate && res.dueDate !== tc.expectedDate) {
      throw new Error(`Date mismatch for "${tc.input}": expected ${tc.expectedDate}, got ${res.dueDate}`);
    }
    if (tc.expectedTime && res.dueTime !== tc.expectedTime) {
      throw new Error(`Time mismatch for "${tc.input}": expected ${tc.expectedTime}, got ${res.dueTime}`);
    }
    if (tc.expectedRule && res.recurrenceRule !== tc.expectedRule) {
      throw new Error(`Recurrence mismatch for "${tc.input}": expected ${tc.expectedRule}, got ${res.recurrenceRule}`);
    }
    console.log(`  ✓ Parsed "${tc.input}" -> ${JSON.stringify(res)}`);
  }

  // 3. Test Recurrence label formatting
  console.log('\n3. Testing Recurrence Label Formatting:');
  if (
    formatRecurrenceLabel('daily') === 'Every day' &&
    formatRecurrenceLabel('weekdays') === 'Every weekday (Mon-Fri)' &&
    formatRecurrenceLabel('weekly') === 'Every week'
  ) {
    console.log('  ✓ Recurrence label formatting verified.');
  } else {
    throw new Error('Recurrence label formatting failed');
  }

  // 4. Test Task persistence with Date, Time, and Recurrence in IndexedDB
  console.log('\n4. Testing IndexedDB Task Persistence with Date, Time, and Recurrence:');
  await seedInitialDataIfNeeded();

  const testTaskId = `task-rec-${Date.now()}`;
  const newTask: Task = {
    id: testTaskId,
    title: 'Weekly team sync',
    priority: 1,
    dueDate: '2026-11-02',
    dueTime: '10:00',
    recurrenceRule: 'weekly',
    isCompleted: false,
    orderIndex: 99,
    labels: ['work'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.tasks.add(newTask);
  const fetched = await db.tasks.get(testTaskId);

  if (
    fetched &&
    fetched.dueDate === '2026-11-02' &&
    fetched.dueTime === '10:00' &&
    fetched.recurrenceRule === 'weekly'
  ) {
    console.log('  ✓ Task with due date, time, and recurrence rule successfully saved and retrieved from IndexedDB.');
  } else {
    throw new Error('Task persistence verification failed in IndexedDB');
  }

  // Clean up
  await db.tasks.delete(testTaskId);
  console.log('  ✓ Cleaned up test task.');

  console.log('\n--- ALL DATE PICKER VERIFICATIONS PASSED! ---');
}

runDatePickerTests().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});

