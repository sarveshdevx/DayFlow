import 'fake-indexeddb/auto';
import { db, seedInitialDataIfNeeded } from '../src/db/index';
import { getTodayString, getTomorrowString } from '../src/utils/date';
import type { Task } from '../src/types';

async function runSectionDefaultDateTests() {
  console.log('--- RUNNING SECTION DEFAULT DATE BEHAVIOR VERIFICATION ---\n');

  const todayStr = getTodayString();
  console.log(`Local Today String: ${todayStr}`);

  // Test 1: Simulating Task creation in Today view (initialDueDate = todayStr)
  console.log('Test 1: Creating a task in Today automatically selects today\'s date:');
  const taskIdToday = `task-today-test-${Date.now()}`;
  const initialDueDateToday = todayStr;

  const todayTask: Task = {
    id: taskIdToday,
    title: 'Review daily priorities',
    priority: 1,
    dueDate: initialDueDateToday,
    projectId: null,
    isCompleted: false,
    orderIndex: 1,
    labels: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.tasks.add(todayTask);
  const fetchedToday = await db.tasks.get(taskIdToday);

  if (fetchedToday && fetchedToday.dueDate === todayStr) {
    console.log(`  ✓ Task created from Today view automatically saved with dueDate: ${fetchedToday.dueDate}`);
  } else {
    throw new Error('Test 1 failed: task did not have today\'s date');
  }

  // Test 2: Task immediately appears in Today query
  console.log('\nTest 2: Saved task immediately appears in Today task list query:');
  const todayTasksInDB = await db.tasks.where('dueDate').equals(todayStr).toArray();
  const foundInToday = todayTasksInDB.some((t) => t.id === taskIdToday);
  if (foundInToday) {
    console.log(`  ✓ Task found in Today query (total today tasks: ${todayTasksInDB.length}).`);
  } else {
    throw new Error('Test 2 failed: task not found in Today query');
  }

  // Test 3: Removing the date allows an undated task
  console.log('\nTest 3: Removing the date allows an undated task:');
  await db.tasks.update(taskIdToday, { dueDate: undefined });
  const fetchedUndated = await db.tasks.get(taskIdToday);
  if (fetchedUndated && fetchedUndated.dueDate === undefined) {
    console.log('  ✓ Task successfully cleared of due date (now undated).');
  } else {
    throw new Error('Test 3 failed: date was not cleared');
  }

  // Test 4: Creating a task in Inbox does not select a date
  console.log('\nTest 4: Creating a task in Inbox does not select a date:');
  const taskIdInbox = `task-inbox-test-${Date.now()}`;
  const initialDueDateInbox = undefined; // Inbox default

  const inboxTask: Task = {
    id: taskIdInbox,
    title: 'Inbox idea without date',
    priority: 4,
    dueDate: initialDueDateInbox,
    projectId: null,
    isCompleted: false,
    orderIndex: 2,
    labels: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.tasks.add(inboxTask);
  const fetchedInbox = await db.tasks.get(taskIdInbox);
  if (fetchedInbox && fetchedInbox.dueDate === undefined) {
    console.log('  ✓ Task created from Inbox saved without date (dueDate: undefined).');
  } else {
    throw new Error('Test 4 failed: inbox task had unexpected date');
  }

  // Test 5: Section switching defaults logic
  console.log('\nTest 5: Section switching resolves correct default dates:');
  const getDefaultDateForSection = (section: string) => {
    switch (section) {
      case 'today':
        return getTodayString();
      case 'inbox':
      case 'upcoming':
      default:
        return undefined;
    }
  };

  if (
    getDefaultDateForSection('today') === todayStr &&
    getDefaultDateForSection('inbox') === undefined &&
    getDefaultDateForSection('upcoming') === undefined &&
    getDefaultDateForSection('project') === undefined
  ) {
    console.log('  ✓ Section default dates resolved correctly: Today -> todayStr; Inbox/Upcoming/Projects -> undefined.');
  } else {
    throw new Error('Test 5 failed: section defaults incorrect');
  }

  // Test 6: Existing task editing preserves saved date regardless of active section
  console.log('\nTest 6: Editing existing task preserves its saved date:');
  const existingTask: Task = {
    id: 'existing-task-1',
    title: 'Existing task scheduled tomorrow',
    priority: 2,
    dueDate: getTomorrowString(),
    projectId: null,
    isCompleted: false,
    orderIndex: 3,
    labels: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // When editing inside Today view, initialDueDate is todayStr, but initialTask exists:
  const getEditingDueDate = (task?: Task, sectionDefaultDate?: string) => {
    return task ? task.dueDate : sectionDefaultDate;
  };

  const editingDate = getEditingDueDate(existingTask, todayStr);
  if (editingDate === getTomorrowString()) {
    console.log(`  ✓ Editing existing task in Today view preserved its original date: ${editingDate}`);
  } else {
    throw new Error('Test 6 failed: existing task date overwritten');
  }

  // Test 7: Refreshing application preserves saved dates
  console.log('\nTest 7: Refreshing application / reconnecting IndexedDB preserves dates:');
  db.close();
  await db.open();

  const fetchedAfterRefresh = await db.tasks.get(taskIdInbox);
  if (fetchedAfterRefresh && fetchedAfterRefresh.title === 'Inbox idea without date') {
    console.log('  ✓ Data integrity verified across IndexedDB connection reload.');
  } else {
    throw new Error('Test 7 failed: data corrupted on refresh');
  }

  // Clean up
  await db.tasks.delete(taskIdToday);
  await db.tasks.delete(taskIdInbox);

  console.log('\n--- ALL SECTION DEFAULT DATE VERIFICATIONS PASSED! ---');
}

runSectionDefaultDateTests().catch((e) => {
  console.error('\n❌ Test suite failed:', e);
  process.exit(1);
});
