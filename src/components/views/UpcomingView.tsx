import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Eye, EyeOff } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { Task } from '../../types';
import { TaskItem } from '../task/TaskItem';
import { InlineTaskComposer } from '../task/InlineTaskComposer';
import { formatDateToYYYYMMDD, getTodayString, getTomorrowString } from '../../utils/date';
import { useUIStore } from '../../store/useUIStore';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Returns the Monday of the week containing the given date in local time.
 */
function getStartOfWeek(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  return date;
}

export const UpcomingView: React.FC = () => {
  const { searchQuery } = useUIStore();
  const todayStr = getTodayString();
  const tomorrowStr = getTomorrowString();

  // Current viewed week start (Monday)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getStartOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(() => currentWeekStart.getFullYear());
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [visibleDaysCount, setVisibleDaysCount] = useState<number>(28);
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  const monthPickerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Sync picker year when week start changes
  useEffect(() => {
    setPickerYear(currentWeekStart.getFullYear());
  }, [currentWeekStart]);

  // Close month picker on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setShowMonthPicker(false);
      }
    };
    if (showMonthPicker) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showMonthPicker]);

  // Infinite scroll: auto-load more days when scrolling near the bottom
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleDaysCount((prev) => prev + 14);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [visibleDaysCount]);

  // Query all tasks from Dexie IndexedDB
  const allTasks = useLiveQuery(() => db.tasks.toArray()) || [];

  // Group tasks by dueDate
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of allTasks) {
      if (!t.dueDate) continue;
      if (!showCompleted && t.isCompleted) continue;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesLabel = t.labels?.some((l) => l.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesLabel) continue;
      }

      if (!map[t.dueDate]) {
        map[t.dueDate] = [];
      }
      map[t.dueDate].push(t);
    }

    // Sort tasks in each date by priority, then orderIndex
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.priority - b.priority || a.orderIndex - b.orderIndex);
    }

    return map;
  }, [allTasks, searchQuery, showCompleted]);

  // Navigation handlers
  const handlePrevWeek = () => {
    const newStart = new Date(
      currentWeekStart.getFullYear(),
      currentWeekStart.getMonth(),
      currentWeekStart.getDate() - 7
    );
    setCurrentWeekStart(newStart);
    setSelectedDate(formatDateToYYYYMMDD(newStart));
  };

  const handleNextWeek = () => {
    const newStart = new Date(
      currentWeekStart.getFullYear(),
      currentWeekStart.getMonth(),
      currentWeekStart.getDate() + 7
    );
    setCurrentWeekStart(newStart);
    setSelectedDate(formatDateToYYYYMMDD(newStart));
  };

  const handleGoToToday = () => {
    const today = new Date();
    const start = getStartOfWeek(today);
    setCurrentWeekStart(start);
    setSelectedDate(todayStr);

    setTimeout(() => {
      const el = document.getElementById(`agenda-date-${todayStr}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const el = document.getElementById(`agenda-date-${dateStr}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Generate 7 consecutive days for the horizontal calendar strip
  const weekDays = useMemo(() => {
    return [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const d = new Date(
        currentWeekStart.getFullYear(),
        currentWeekStart.getMonth(),
        currentWeekStart.getDate() + i
      );
      const dateStr = formatDateToYYYYMMDD(d);
      const weekdayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      const isSelected = dateStr === selectedDate;
      const hasTasks = Boolean(tasksByDate[dateStr]?.length);

      return {
        date: d,
        dateStr,
        weekdayShort,
        dayNum,
        isToday,
        isPast,
        isSelected,
        hasTasks,
      };
    });
  }, [currentWeekStart, selectedDate, todayStr, tasksByDate]);

  // Month and Year label for the header
  const headerMonthYear = useMemo(() => {
    // Show month and year of the currently viewed week
    const displayDate = currentWeekStart;
    return displayDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [currentWeekStart]);

  // Generate dates for the vertical agenda
  const agendaDates = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(
      currentWeekStart.getFullYear(),
      currentWeekStart.getMonth(),
      currentWeekStart.getDate()
    );
    for (let i = 0; i < visibleDaysCount; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      dates.push(formatDateToYYYYMMDD(d));
    }
    return dates;
  }, [currentWeekStart, visibleDaysCount]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#282828] flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white tracking-tight">Upcoming</h1>

          {/* Month / Year Selector */}
          <div className="relative" ref={monthPickerRef}>
            <button
              type="button"
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white px-2.5 py-1 rounded-md bg-[#252525] hover:bg-[#2e2e2e] border border-[#383838] transition-colors cursor-pointer"
              title="Select month and year"
            >
              <span>{headerMonthYear}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {/* Calendar Month Selector Popover */}
            {showMonthPicker && (
              <div className="absolute left-0 top-full mt-1.5 w-60 bg-[#252525] border border-[#3a3a3a] rounded-xl shadow-2xl p-3 z-40 text-xs">
                {/* Year Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#383838]">
                  <span className="text-xs font-bold text-white">{pickerYear}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPickerYear((y) => y - 1)}
                      className="p-1 hover:bg-[#333333] rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      title="Previous year"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerYear((y) => y + 1)}
                      className="p-1 hover:bg-[#333333] rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      title="Next year"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Months Grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTH_NAMES.map((name, idx) => {
                    const isCurrent =
                      currentWeekStart.getFullYear() === pickerYear &&
                      currentWeekStart.getMonth() === idx;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          const newDate = new Date(pickerYear, idx, 1);
                          setCurrentWeekStart(getStartOfWeek(newDate));
                          setSelectedDate(formatDateToYYYYMMDD(newDate));
                          setShowMonthPicker(false);
                        }}
                        className={`py-1.5 px-2 text-xs rounded text-center transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-[#dc4c3e] text-white font-semibold'
                            : 'text-neutral-300 hover:bg-[#333333] hover:text-white'
                        }`}
                      >
                        {name.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>

                {/* Jump to Today Button */}
                <div className="mt-2 pt-2 border-t border-[#383838]">
                  <button
                    type="button"
                    onClick={() => {
                      handleGoToToday();
                      setShowMonthPicker(false);
                    }}
                    className="w-full text-center py-1 text-xs text-[#dc4c3e] hover:bg-[#333333] rounded transition-colors font-semibold cursor-pointer"
                  >
                    Jump to Today
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation & Controls on Right */}
        <div className="flex items-center gap-2">
          {/* Toggle Completed */}
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
              showCompleted
                ? 'bg-[#2f2f2f] text-neutral-200 border-[#444444]'
                : 'text-neutral-400 border-transparent hover:bg-[#282828] hover:text-neutral-200'
            }`}
            title="Toggle completed tasks"
          >
            {showCompleted ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Completed</span>
          </button>

          {/* Previous / Today / Next Navigation Controls */}
          <div className="flex items-center bg-[#242424] p-0.5 rounded-lg border border-[#333333]">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1 hover:bg-[#303030] text-neutral-400 hover:text-white rounded-md transition-colors cursor-pointer"
              title="Previous week"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleGoToToday}
              className="px-2.5 py-0.5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-[#303030] rounded-md transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1 hover:bg-[#303030] text-neutral-400 hover:text-white rounded-md transition-colors cursor-pointer"
              title="Next week"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Horizontal Weekly Calendar Strip */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-8 bg-[#202020] p-1.5 sm:p-2 rounded-xl border border-[#2b2b2b] select-none">
        {weekDays.map((day) => {
          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => handleSelectDate(day.dateStr)}
              className={`group flex flex-col items-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
                day.isSelected
                  ? day.isToday
                    ? 'bg-[#dc4c3e] text-white shadow-md'
                    : 'bg-[#303030] text-white ring-1 ring-neutral-500 shadow-sm'
                  : 'hover:bg-[#282828] text-neutral-300'
              } ${day.isPast && !day.isSelected ? 'opacity-40 hover:opacity-80' : 'opacity-100'}`}
            >
              {/* Weekday abbreviation */}
              <span
                className={`text-[11px] font-medium tracking-wide uppercase mb-1 ${
                  day.isSelected
                    ? day.isToday
                      ? 'text-white'
                      : 'text-neutral-200'
                    : day.isToday
                    ? 'text-[#dc4c3e] font-semibold'
                    : 'text-neutral-400'
                }`}
              >
                {day.weekdayShort}
              </span>

              {/* Date Number */}
              <span
                className={`text-sm sm:text-base font-bold flex items-center justify-center w-7 h-7 rounded-full ${
                  day.isSelected
                    ? day.isToday
                      ? 'text-white'
                      : 'text-white'
                    : day.isToday
                    ? 'text-[#dc4c3e] font-extrabold ring-1 ring-[#dc4c3e]/40'
                    : 'text-neutral-200 group-hover:text-white'
                }`}
              >
                {day.dayNum}
              </span>

              {/* Task indicator dot */}
              {day.hasTasks && (
                <span
                  className={`w-1 h-1 rounded-full mt-1 ${
                    day.isSelected ? 'bg-white' : 'bg-neutral-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Vertical Daily Agenda */}
      <div className="space-y-6">
        {agendaDates.map((dateStr) => {
          const [y, m, d] = dateStr.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          const dayNum = dateObj.getDate();
          const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
          const weekdayLong = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

          const isToday = dateStr === todayStr;
          const isTomorrow = dateStr === tomorrowStr;
          const dayTasks = tasksByDate[dateStr] || [];

          return (
            <div
              key={dateStr}
              id={`agenda-date-${dateStr}`}
              className="scroll-mt-6 pb-2"
            >
              {/* Daily Section Heading: e.g. "30 Oct · Today · Friday" */}
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5 flex-wrap">
                  <span>
                    {dayNum} {monthShort}
                  </span>
                  <span className="text-neutral-500 font-normal">·</span>
                  {isToday && (
                    <>
                      <span className="text-[#dc4c3e] font-semibold">Today</span>
                      <span className="text-neutral-500 font-normal">·</span>
                    </>
                  )}
                  {isTomorrow && (
                    <>
                      <span className="text-amber-500 font-semibold">Tomorrow</span>
                      <span className="text-neutral-500 font-normal">·</span>
                    </>
                  )}
                  <span className="text-neutral-400 font-normal">{weekdayLong}</span>
                </h3>

                {dayTasks.length > 0 && (
                  <span className="text-[11px] text-neutral-500">
                    {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                )}
              </div>

              {/* Subtle Horizontal Divider */}
              <div className="border-b border-[#282828] mt-2 mb-2" />

              {/* Scheduled Tasks for this Date */}
              {dayTasks.length > 0 && (
                <div className="divide-y divide-[#282828]/50 mb-1">
                  {dayTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              )}

              {/* "+ Add task" Action or Inline Composer */}
              {addingDate === dateStr ? (
                <div className="pt-1 pb-2">
                  <InlineTaskComposer
                    initialDueDate={dateStr}
                    onClose={() => setAddingDate(null)}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingDate(dateStr)}
                  className="group flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-400 hover:text-[#dc4c3e] transition-colors rounded-md cursor-pointer mt-0.5"
                >
                  <span className="flex items-center justify-center w-4 h-4 rounded-full text-[#dc4c3e] group-hover:bg-[#dc4c3e] group-hover:text-white transition-colors">
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span className="group-hover:text-[#dc4c3e] font-normal">Add task</span>
                </button>
              )}
            </div>
          );
        })}

        {/* Load More Trigger Sentinel */}
        <div ref={loadMoreRef} className="pt-4 pb-8 text-center">
          <button
            type="button"
            onClick={() => setVisibleDaysCount((prev) => prev + 14)}
            className="text-xs text-neutral-400 hover:text-neutral-200 px-4 py-2 rounded-md hover:bg-[#282828] border border-[#333333] transition-colors cursor-pointer"
          >
            Load more dates
          </button>
        </div>
      </div>
    </div>
  );
};
