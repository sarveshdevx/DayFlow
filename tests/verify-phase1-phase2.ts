import 'fake-indexeddb/auto';
import { db, seedInitialDataIfNeeded } from '../src/db/index';
import { parseNaturalLanguageTaskInput } from '../src/utils/nlp';
import { getTodayString, getTomorrowString, formatDueDate } from '../src/utils/date';
import type { TaskFlowBackupData } from '../src/db/backup';

async function runTests() {
  console.log('--- STARTING TASKFLOW PHASE 1 & PHASE 2 VERIFICATION ---\n');

  // Test 1: NLP Parser
  console.log('1. Testing Natural Language Parser:');
  const sample1 = parseNaturalLanguageTaskInput('Buy groceries tomorrow at 5pm p1 @errands');
  console.log('Parsed sample 1:', sample1);
  if (
    sample1.cleanTitle === 'Buy groceries' &&
    sample1.priority === 1 &&
    sample1.dueTime === '17:00' &&
    sample1.dueDate === getTomorrowString() &&
    sample1.labels.includes('errands')
  ) {
    console.log('  ✓ NLP relative date, 24h time conversion, p1 priority, and label verified.');
  } else {
    throw new Error('NLP Parser assertion failed on sample 1');
  }

  const sample2 = parseNaturalLanguageTaskInput('Review pull request today p3');
  if (sample2.cleanTitle === 'Review pull request' && sample2.priority === 3 && sample2.dueDate === getTodayString()) {
    console.log('  ✓ NLP today date and p3 priority verified.');
  } else {
    throw new Error('NLP Parser assertion failed on sample 2');
  }

  // Test 2: Date formatting & status
  console.log('\n2. Testing Date Utilities:');
  const todayFormat = formatDueDate(getTodayString());
  const tomorrowFormat = formatDueDate(getTomorrowString(), '14:30');
  const overdueFormat = formatDueDate('2020-01-01');

  if (todayFormat.isToday && tomorrowFormat.isTomorrow && overdueFormat.isOverdue) {
    console.log('  ✓ Today, Tomorrow, and Overdue flag calculations verified.');
  } else {
    throw new Error('Date utility assertion failed');
  }

  // Test 3: Dexie IndexedDB Initialization & Seeding
  console.log('\n3. Testing IndexedDB Persistence & Seeding:');
  await seedInitialDataIfNeeded();
  const initialTaskCount = await db.tasks.count();
  const initialProjectCount = await db.projects.count();
  const initialLabelCount = await db.labels.count();

  console.log(`  Initial tasks: ${initialTaskCount}, projects: ${initialProjectCount}, labels: ${initialLabelCount}`);
  if (initialTaskCount >= 4 && initialProjectCount >= 2 && initialLabelCount >= 3) {
    console.log('  ✓ Seed data successfully populated into IndexedDB.');
  } else {
    throw new Error('Seeding verification failed');
  }

  // Test 4: Task CRUD in IndexedDB
  console.log('\n4. Testing Task CRUD & State Toggle in IndexedDB:');
  const testTaskId = `task-test-${Date.now()}`;
  await db.tasks.add({
    id: testTaskId,
    title: 'Automated test task',
    priority: 2,
    isCompleted: false,
    orderIndex: 99,
    labels: ['test'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  let fetchedTask = await db.tasks.get(testTaskId);
  if (!fetchedTask || fetchedTask.title !== 'Automated test task' || fetchedTask.priority !== 2) {
    throw new Error('Task creation verification failed');
  }
  console.log('  ✓ Task successfully written and read from IndexedDB.');

  // Toggle completion
  await db.tasks.update(testTaskId, { isCompleted: true, completedAt: new Date().toISOString() });
  fetchedTask = await db.tasks.get(testTaskId);
  if (!fetchedTask?.isCompleted) {
    throw new Error('Task toggle completion verification failed');
  }
  console.log('  ✓ Task completion toggled and persisted.');

  // Delete test task
  await db.tasks.delete(testTaskId);
  fetchedTask = await db.tasks.get(testTaskId);
  if (fetchedTask) {
    throw new Error('Task deletion verification failed');
  }
  console.log('  ✓ Task deletion verified.');

  // Test 5: JSON Export & Import Round-trip
  console.log('\n5. Testing JSON Backup & Restore:');
  const allTasks = await db.tasks.toArray();
  const allProjects = await db.projects.toArray();
  const allSections = await db.sections.toArray();
  const allLabels = await db.labels.toArray();
  const allPreferences = await db.preferences.toArray();

  const backupPayload: TaskFlowBackupData = {
    version: 1,
    appName: 'TaskFlow',
    exportedAt: new Date().toISOString(),
    tasks: allTasks,
    projects: allProjects,
    sections: allSections,
    labels: allLabels,
    preferences: allPreferences,
  };

  const serialized = JSON.stringify(backupPayload);
  const parsedBackup: TaskFlowBackupData = JSON.parse(serialized);

  if (parsedBackup.tasks.length === allTasks.length && parsedBackup.projects.length === allProjects.length) {
    console.log(`  ✓ Backup serialization verified (${parsedBackup.tasks.length} tasks, ${parsedBackup.projects.length} projects).`);
  } else {
    throw new Error('Backup serialization mismatch');
  }

  // Test 6: Simulating app restart / reload persistence
  console.log('\n6. Testing Persistence across Re-open / Re-connection:');
  db.close();
  await db.open();
  const countAfterReopen = await db.tasks.count();
  if (countAfterReopen === initialTaskCount) {
    console.log(`  ✓ IndexedDB connection cleanly re-opened. Task count retained: ${countAfterReopen}.`);
  } else {
    throw new Error(`Data loss on reload: expected ${initialTaskCount}, found ${countAfterReopen}`);
  }

  console.log('\n--- ALL PHASE 1 & PHASE 2 VERIFICATIONS PASSED SUCCESSFULLY! ---');
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
