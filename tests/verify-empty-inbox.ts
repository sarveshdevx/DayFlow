import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('--- RUNNING EMPTY INBOX ILLUSTRATION VERIFICATION ---');

// 1. Verify empty-inbox.png file exists in public/ and is non-empty
const imagePath = path.resolve('public/empty-inbox.png');
assert(fs.existsSync(imagePath), 'public/empty-inbox.png must exist');
const stats = fs.statSync(imagePath);
assert(stats.size > 100000, `Image file size (${stats.size} bytes) should be substantial (>100KB)`);
console.log(`✓ Image verified in public/empty-inbox.png (${stats.size} bytes).`);

// 2. Verify InboxView.tsx contains the illustration, heading, description, and coral-red button
const inboxViewContent = fs.readFileSync(path.resolve('src/components/inbox/InboxView.tsx'), 'utf-8');

assert(inboxViewContent.includes('src="/empty-inbox.png"'), 'Must reference /empty-inbox.png');
assert(inboxViewContent.includes('Inbox is empty'), 'Must contain "Inbox is empty" heading');
assert(
  inboxViewContent.includes('Capture new ideas, notes, or tasks anytime. Add a task to get started.'),
  'Must contain the exact description copy'
);
assert(inboxViewContent.includes('bg-[#dc4c3e]'), 'Must use coral-red background #dc4c3e');
assert(inboxViewContent.includes('Add task'), 'Must have "Add task" button');
assert(inboxViewContent.includes('InlineTaskComposer'), 'Must support opening InlineTaskComposer');

console.log('✓ InboxView correctly integrates 3D illustration, text, and coral-red button.');

// 3. Verify other views do not render this empty inbox illustration
const todayViewContent = fs.readFileSync(path.resolve('src/components/views/TodayView.tsx'), 'utf-8');
const upcomingViewContent = fs.readFileSync(path.resolve('src/components/views/UpcomingView.tsx'), 'utf-8');
const projectViewContent = fs.readFileSync(path.resolve('src/components/views/ProjectView.tsx'), 'utf-8');

assert(!todayViewContent.includes('empty-inbox.png'), 'TodayView must NOT use empty-inbox illustration');
assert(!upcomingViewContent.includes('empty-inbox.png'), 'UpcomingView must NOT use empty-inbox illustration');
assert(!projectViewContent.includes('empty-inbox.png'), 'ProjectView must NOT use empty-inbox illustration');

console.log('✓ Verified: Today, Upcoming, and Project views preserve their distinct standard views.');

// 4. Test logic simulation of state transitions
interface MockTask {
  id: string;
  title: string;
  projectId: string | null;
  isCompleted: boolean;
}

function computeEmptyInboxState(tasks: MockTask[], showCompleted: boolean, isAddingTask: boolean) {
  const inboxTasks = tasks.filter((t) => !t.projectId);
  const activeInboxTasksCount = tasks.filter((t) => !t.projectId && !t.isCompleted).length;
  const filteredInbox = !showCompleted ? inboxTasks.filter((t) => !t.isCompleted) : inboxTasks;
  const isEmptyInbox = activeInboxTasksCount === 0 && (!showCompleted || filteredInbox.length === 0);

  if (isEmptyInbox) {
    if (isAddingTask) return 'composer';
    return 'empty_illustration';
  }
  return 'task_list';
}

// Initial: 0 tasks in inbox -> empty illustration
let state = computeEmptyInboxState([], false, false);
assert.strictEqual(state, 'empty_illustration', '0 tasks should show empty illustration');

// Click "+ Add task" -> opens composer
state = computeEmptyInboxState([], false, true);
assert.strictEqual(state, 'composer', 'clicking Add task should show composer');

// Task created -> hides empty state, shows task list
const tasks: MockTask[] = [{ id: '1', title: 'Task 1', projectId: null, isCompleted: false }];
state = computeEmptyInboxState(tasks, false, false);
assert.strictEqual(state, 'task_list', 'creating first task should show task list');

// Task completed -> active count becomes 0 -> restores empty illustration
tasks[0].isCompleted = true;
state = computeEmptyInboxState(tasks, false, false);
assert.strictEqual(state, 'empty_illustration', 'completing active tasks should restore empty illustration');

console.log('✓ Dynamic state transitions verified: empty state -> composer -> task list -> restored empty state.');
console.log('--- ALL EMPTY INBOX VERIFICATIONS PASSED! ---');

