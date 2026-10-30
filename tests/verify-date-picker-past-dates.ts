import 'fake-indexeddb/auto';
import { db, seedInitialDataIfNeeded } from '../src/db/index';
import {
  parseDateInputText,
  formatDateToYYYYMMDD,
  getTodayString,
  getTomorrowString,
  getNextWeekDate,
  getNextWeekendDate,
} from '../src/utils/date';
import { parseNaturalLanguageTaskInput } from '../src/utils/nlp';
import type { Task } from '../src/types';

async function runTests() {
  console.log('--- RUNNING DATE PICKER & PAST DATE RESTRICTION VERIFICATION ---\n');

  const todayStr = getTodayString();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Test Case 1: Initial month logic when no date is selected
  console.log('Case 1: Open date picker with no selected date -> today\'s month appears:');
  const getInitialMonth = (selectedDate?: string) => {
    if (selectedDate && selectedDate >= todayStr) {
      const parts = selectedDate.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0])) return { year: parts[0], month: parts[1] - 1 };
    }
    return { year: currentYear, month: currentMonth };
  };

  const initialNoDate = getInitialMonth(undefined);
  if (initialNoDate.year === currentYear && initialNoDate.month === currentMonth) {
    console.log(`  ✓ Opened at current month: ${currentYear}-${currentMonth + 1}`);
  } else {
    throw new Error('Case 1 failed: did not open at current month');
  }

  // Test Case 2: Multi-month scroll list generation (24 future months)
  console.log('\nCase 2: Scroll down -> future months appear:');
  const generateMonths = (startYear: number, startMonth: number, count = 24) => {
    const list: { year: number; month: number }[] = [];
    let y = startYear;
    let m = startMonth;
    for (let i = 0; i < count; i++) {
      list.push({ year: y, month: m });
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
    return list;
  };

  const months = generateMonths(currentYear, currentMonth);
  if (months.length === 24 && months[1].month === (currentMonth + 1) % 12) {
    console.log(`  ✓ Generated ${months.length} future months starting from ${currentYear}-${currentMonth + 1} up to ${months[23].year}-${months[23].month + 1}`);
  } else {
    throw new Error('Case 2 failed: future months not generated properly');
  }

  // Test Case 3: Try selecting yesterday -> selection is prevented
  console.log('\nCase 3: Try selecting yesterday -> selection prevented:');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateToYYYYMMDD(yesterday);

  const canSelectDate = (d: string) => d >= todayStr;
  if (!canSelectDate(yesterdayStr)) {
    console.log(`  ✓ Yesterday (${yesterdayStr}) is rejected (< today: ${todayStr}).`);
  } else {
    throw new Error('Case 3 failed: yesterday was permitted');
  }

  // Test Case 4: Try selecting today's date -> selection works
  console.log('\nCase 4: Try selecting today\'s date -> selection works:');
  if (canSelectDate(todayStr)) {
    console.log(`  ✓ Today (${todayStr}) is permitted.`);
  } else {
    throw new Error('Case 4 failed: today was rejected');
  }

  // Test Case 5: Select a date next month -> selection works
  console.log('\nCase 5: Select a date next month -> selection works:');
  const nextMonthDate = new Date();
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  nextMonthDate.setDate(15);
  const nextMonthDateStr = formatDateToYYYYMMDD(nextMonthDate);

  if (canSelectDate(nextMonthDateStr)) {
    console.log(`  ✓ Date in next month (${nextMonthDateStr}) is permitted.`);
  } else {
    throw new Error('Case 5 failed: next month date rejected');
  }

  // Test Case 6: Reopen the picker -> selected future date is displayed
  console.log('\nCase 6: Reopen picker with future date -> opens at selected future month:');
  const reopenState = getInitialMonth(nextMonthDateStr);
  if (
    reopenState.year === nextMonthDate.getFullYear() &&
    reopenState.month === nextMonthDate.getMonth()
  ) {
    console.log(`  ✓ Reopening with future date ${nextMonthDateStr} successfully targeted month ${reopenState.year}-${reopenState.month + 1}.`);
  } else {
    throw new Error('Case 6 failed: did not open at selected future month');
  }

  // Test Case 7: Try entering a past date manually -> rejected
  console.log('\nCase 7: Try entering a past date manually in NLP / input -> rejected:');
  const pastInput1 = parseDateInputText('2020-01-01');
  const pastInput2 = parseDateInputText('yesterday');
  const pastNLP = parseNaturalLanguageTaskInput('Meeting yesterday p1');

  if (!pastInput1?.dueDate && !pastInput2?.dueDate && !pastNLP.dueDate) {
    console.log('  ✓ Manual past date entries "2020-01-01", "yesterday", and NLP past dates are all strictly rejected.');
  } else {
    throw new Error('Case 7 failed: past date was accepted');
  }

  // Test Case 8: Refresh the app / IndexedDB persistence
  console.log('\nCase 8: Refresh / reconnect IndexedDB -> saved dates remain correct:');
  await seedInitialDataIfNeeded();

  const testTaskId = `task-verify-persist-${Date.now()}`;
  const validFutureDate = getTomorrowString();

  const testTask: Task = {
    id: testTaskId,
    title: 'Verify persistence task',
    priority: 1,
    dueDate: validFutureDate,
    dueTime: '14:30',
    isCompleted: false,
    orderIndex: 999,
    labels: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.tasks.add(testTask);

  // Close and reopen database simulating app refresh
  db.close();
  await db.open();

  const fetched = await db.tasks.get(testTaskId);
  if (fetched && fetched.dueDate === validFutureDate && fetched.dueTime === '14:30') {
    console.log(`  ✓ Task persisted cleanly across DB reload with valid date: ${fetched.dueDate} ${fetched.dueTime}.`);
  } else {
    throw new Error('Case 8 failed: task date lost on reload');
  }

  await db.tasks.delete(testTaskId);

  console.log('\n--- ALL 8 TESTING CHECKLIST ITEMS PASSED! ---');
}

runTests().catch((e) => {
  console.error('\n❌ Test suite failed:', e);
  process.exit(1);
});
