import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sun,
  Armchair,
  CalendarDays,
  Clock,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Circle,
  X,
  Check,
  ArrowLeft,
} from 'lucide-react';
import {
  getTodayString,
  getTomorrowString,
  getTodaySecondaryLabel,
  getTomorrowSecondaryLabel,
  getNextWeekDate,
  getNextWeekendDate,
  formatDateToYYYYMMDD,
  parseDateInputText,
  formatRecurrenceLabel,
} from '../../utils/date';

interface DatePickerPopoverProps {
  selectedDate?: string; // YYYY-MM-DD
  selectedTime?: string; // HH:mm
  selectedRecurrence?: string;
  onSelectDate: (date: string | undefined) => void;
  onSelectTime: (time: string | undefined) => void;
  onSelectRecurrence: (rule: string | undefined) => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

type PickerView = 'calendar' | 'time' | 'repeat' | 'repeat-custom';

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  selectedDate,
  selectedTime,
  selectedRecurrence,
  onSelectDate,
  onSelectTime,
  onSelectRecurrence,
  onClose,
  anchorRef,
  className = '',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [currentView, setCurrentView] = useState<PickerView>('calendar');
  const [dateInputText, setDateInputText] = useState('');
  const [positionAbove, setPositionAbove] = useState(false);

  // User local date calculation
  const todayStr = getTodayString();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Active view month:
  // Reopening with a valid future date displays that date's month; otherwise defaults to current month
  const [viewYear, setViewYear] = useState<number>(() => {
    if (selectedDate && selectedDate >= todayStr) {
      const parts = selectedDate.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0])) return parts[0];
    }
    return currentYear;
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (selectedDate && selectedDate >= todayStr) {
      const parts = selectedDate.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[1])) return parts[1] - 1;
    }
    return currentMonth;
  });

  // Custom Time state
  const [customTime, setCustomTime] = useState(selectedTime || '09:00');

  // Custom Repeat state
  const [customInterval, setCustomInterval] = useState(1);
  const [customUnit, setCustomUnit] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [customDays, setCustomDays] = useState<number[]>([1]); // 0=Sun, 1=Mon...

  // Viewport adjustment
  useEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 440 && rect.top > 440) {
        setPositionAbove(true);
      } else {
        setPositionAbove(false);
      }
    }
    // Focus search input
    searchInputRef.current?.focus();
  }, [anchorRef]);

  // Always reset calendar scroll to top so today's month starts clearly from the beginning
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [viewYear, viewMonth]);

  // Handle click outside and Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        (!anchorRef?.current || !anchorRef.current.contains(e.target as Node))
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentView !== 'calendar') {
          setCurrentView('calendar');
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, currentView, anchorRef]);

  // Dynamic quick option dates
  const tomorrowStr = getTomorrowString();
  const nextWeek = getNextWeekDate();
  const nextWeekend = getNextWeekendDate();

  // Natural language date input submit - strictly prevents past dates
  const handleDateInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const parsed = parseDateInputText(dateInputText);
      if (parsed) {
        if (parsed.dueDate) {
          if (parsed.dueDate < todayStr) {
            // Strictly reject past date
            return;
          }
          onSelectDate(parsed.dueDate);
        }
        if (parsed.dueTime) onSelectTime(parsed.dueTime);
        if (parsed.recurrenceRule) onSelectRecurrence(parsed.recurrenceRule);
        onClose();
      }
    }
  };

  // Previous-month navigation must NOT allow navigating into months before the current month
  const isPrevMonthDisabled =
    viewYear < currentYear || (viewYear === currentYear && viewMonth <= currentMonth);

  const handlePrevMonth = () => {
    if (isPrevMonthDisabled) return;
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleJumpToToday = () => {
    setViewYear(currentYear);
    setViewMonth(currentMonth);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const handleSelectDay = (dateStr: string) => {
    // Strictly prevent selecting past dates
    if (dateStr < todayStr) return;
    onSelectDate(dateStr);
    onClose();
  };

  // Generate 24 future months starting from viewing month for smooth vertical scrolling
  const monthsToRender = useMemo(() => {
    const list: { year: number; month: number }[] = [];
    let y = viewYear;
    let m = viewMonth;
    for (let i = 0; i < 24; i++) {
      list.push({ year: y, month: m });
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
    return list;
  }, [viewYear, viewMonth]);

  // Render month day grid (Monday to Sunday)
  const renderMonthGrid = (year: number, month: number, isFirst: boolean) => {
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Monday is index 0: (day + 6) % 7
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    const monthName = firstDayOfMonth.toLocaleDateString('en-US', { month: 'short' });
    const fullYear = firstDayOfMonth.getFullYear();

    const days: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    return (
      <div key={`${year}-${month}`} className="mb-3">
        {/* Month sub-header for subsequent months in the scroll view */}
        {!isFirst && (
          <div className="text-[11px] font-semibold text-neutral-300 px-1 py-1 mt-2 border-t border-[#333333]/60">
            {monthName} {fullYear}
          </div>
        )}

        <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="w-8 h-7" />;
            }

            const dayDate = new Date(year, month, day);
            const dateStr = formatDateToYYYYMMDD(dayDate);
            const isToday = dateStr === todayStr;
            const isPast = dateStr < todayStr;
            const isSelected = dateStr === selectedDate;

            // Past dates must be muted, visually disabled, and non-clickable
            if (isPast) {
              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={true}
                  aria-disabled="true"
                  tabIndex={-1}
                  className="w-8 h-7 text-xs rounded-full flex items-center justify-center mx-auto text-neutral-600 opacity-25 cursor-not-allowed select-none pointer-events-none"
                  title="Past dates cannot be selected"
                >
                  {day}
                </button>
              );
            }

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleSelectDay(dateStr)}
                className={`w-8 h-7 text-xs rounded-full flex items-center justify-center transition-colors mx-auto cursor-pointer ${
                  isSelected
                    ? 'bg-[#dc4c3e] text-white font-semibold'
                    : isToday
                    ? 'text-[#dc4c3e] font-bold hover:bg-[#333333]'
                    : 'text-neutral-300 hover:bg-[#333333] hover:text-white'
                }`}
                title={dateStr}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={popoverRef}
      className={`absolute z-50 w-[270px] bg-[#222222] border border-[#383838] rounded-xl shadow-2xl text-neutral-200 select-none overflow-hidden animate-fade-in ${
        positionAbove ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
      } left-0 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Main Calendar View */}
      {currentView === 'calendar' && (
        <div className="flex flex-col">
          {/* A. Search / Type a date input */}
          <div className="p-2 border-b border-[#333333]">
            <input
              ref={searchInputRef}
              type="text"
              value={dateInputText}
              onChange={(e) => setDateInputText(e.target.value)}
              onKeyDown={handleDateInputKeyDown}
              placeholder="Type a date"
              className="w-full bg-[#1c1c1c] text-xs text-neutral-200 placeholder-neutral-500 rounded-md px-2.5 py-1.5 border border-[#333333] focus:border-neutral-400 outline-none transition-colors"
            />
          </div>

          {/* B. Quick Date Options */}
          <div className="p-1 space-y-0.5 border-b border-[#333333]">
            {/* Today */}
            <button
              type="button"
              onClick={() => handleSelectDay(todayStr)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#2e2e2e] text-xs text-neutral-200 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-[4px] border border-[#22c55e] text-[#22c55e] flex items-center justify-center text-[9px] font-bold leading-none">
                  {new Date().getDate()}
                </div>
                <span className="font-medium">Today</span>
              </div>
              <span className="text-[11px] text-neutral-400 group-hover:text-neutral-300">
                {getTodaySecondaryLabel()}
              </span>
            </button>

            {/* Tomorrow */}
            <button
              type="button"
              onClick={() => handleSelectDay(tomorrowStr)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#2e2e2e] text-xs text-neutral-200 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Sun className="w-4 h-4 text-[#eab308] stroke-[2.2]" />
                <span className="font-medium">Tomorrow</span>
              </div>
              <span className="text-[11px] text-neutral-400 group-hover:text-neutral-300">
                {getTomorrowSecondaryLabel()}
              </span>
            </button>

            {/* Next week */}
            <button
              type="button"
              onClick={() => handleSelectDay(nextWeek.dateStr)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#2e2e2e] text-xs text-neutral-200 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-[#a855f7] stroke-[2]" />
                <span className="font-medium">Next week</span>
              </div>
              <span className="text-[11px] text-neutral-400 group-hover:text-neutral-300">
                {nextWeek.label}
              </span>
            </button>

            {/* Next weekend */}
            <button
              type="button"
              onClick={() => handleSelectDay(nextWeekend.dateStr)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#2e2e2e] text-xs text-neutral-200 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Armchair className="w-4 h-4 text-[#3b82f6] stroke-[2]" />
                <span className="font-medium">Next weekend</span>
              </div>
              <span className="text-[11px] text-neutral-400 group-hover:text-neutral-300">
                {nextWeekend.label}
              </span>
            </button>
          </div>

          {/* C. Full Calendar Header & Grid */}
          <div className="p-2">
            {/* Header: Month Year + Navigation */}
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-xs font-semibold text-neutral-200">
                {new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={isPrevMonthDisabled}
                  onClick={handlePrevMonth}
                  className={`p-1 rounded transition-colors ${
                    isPrevMonthDisabled
                      ? 'text-neutral-600 opacity-25 cursor-not-allowed'
                      : 'text-neutral-400 hover:text-white hover:bg-[#333333]'
                  }`}
                  title={isPrevMonthDisabled ? 'Cannot navigate to past months' : 'Previous month'}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="p-1 rounded hover:bg-[#333333] text-neutral-400 hover:text-white transition-colors"
                  title="Go to Today"
                >
                  <Circle className="w-2.5 h-2.5 fill-current" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded hover:bg-[#333333] text-neutral-400 hover:text-white transition-colors"
                  title="Next month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Weekday Labels (Monday to Sunday) */}
            <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-neutral-500 py-1 border-b border-[#333333]/40 mb-1">
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
              <span>S</span>
            </div>

            {/* Vertically Scrollable Multiple Months */}
            <div
              ref={scrollContainerRef}
              onWheel={(e) => e.stopPropagation()}
              className="max-h-[200px] overflow-y-auto overscroll-contain pr-0.5 select-none"
              style={{ scrollbarWidth: 'thin' }}
            >
              {monthsToRender.map((m, idx) =>
                renderMonthGrid(m.year, m.month, idx === 0)
              )}
            </div>
          </div>

          {/* D & E. Time & Repeat Buttons */}
          <div className="p-1.5 border-t border-[#333333] space-y-1">
            {/* Time Trigger */}
            <div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-[#2e2e2e] text-xs font-medium text-neutral-300 transition-colors cursor-pointer group">
              <button
                type="button"
                onClick={() => setCurrentView('time')}
                className="flex items-center gap-2 flex-1 text-left"
              >
                <Clock className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-200" />
                <span>{selectedTime ? `Time: ${selectedTime}` : 'Time'}</span>
              </button>
              {selectedTime && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTime(undefined);
                  }}
                  className="p-0.5 text-neutral-500 hover:text-red-400 rounded"
                  title="Clear time"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Repeat Trigger */}
            <div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-[#2e2e2e] text-xs font-medium text-neutral-300 transition-colors cursor-pointer group">
              <button
                type="button"
                onClick={() => setCurrentView('repeat')}
                className="flex items-center gap-2 flex-1 text-left"
              >
                <Repeat className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-200" />
                <span className="truncate">
                  {selectedRecurrence
                    ? formatRecurrenceLabel(selectedRecurrence)
                    : 'Repeat'}
                </span>
              </button>
              {selectedRecurrence && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRecurrence(undefined);
                  }}
                  className="p-0.5 text-neutral-500 hover:text-red-400 rounded"
                  title="Clear repeat"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Clear Date Option (if date is set) */}
            {selectedDate && (
              <button
                type="button"
                onClick={() => {
                  onSelectDate(undefined);
                  onSelectTime(undefined);
                  onSelectRecurrence(undefined);
                  onClose();
                }}
                className="w-full text-center py-1 text-[11px] text-red-400 hover:bg-[#2e2e2e] rounded transition-colors"
              >
                Clear date
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Time Selection View */}
      {currentView === 'time' && (
        <div className="p-3">
          <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-[#333333]">
            <button
              type="button"
              onClick={() => setCurrentView('calendar')}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#333333]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-semibold">Select Time</span>
          </div>

          {/* Quick Time Presets */}
          <div className="space-y-1 mb-3">
            {[
              { label: 'Morning', time: '09:00' },
              { label: 'Afternoon', time: '13:00' },
              { label: 'Evening', time: '18:00' },
              { label: 'Night', time: '21:00' },
            ].map((p) => (
              <button
                key={p.time}
                type="button"
                onClick={() => {
                  onSelectTime(p.time);
                  setCurrentView('calendar');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  selectedTime === p.time
                    ? 'bg-[#333333] text-white font-medium'
                    : 'text-neutral-300 hover:bg-[#2e2e2e]'
                }`}
              >
                <span>{p.label}</span>
                <span className="text-[11px] text-neutral-400">{p.time}</span>
              </button>
            ))}
          </div>

          {/* Custom Time Input */}
          <div className="pt-2 border-t border-[#333333]">
            <label className="text-[10px] text-neutral-400 block mb-1">
              Custom Time:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="flex-1 bg-[#1c1c1c] text-xs text-neutral-200 border border-[#383838] rounded-md px-2 py-1 outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (customTime) {
                    onSelectTime(customTime);
                    setCurrentView('calendar');
                  }
                }}
                className="px-2.5 py-1 bg-[#dc4c3e] hover:bg-[#c53b27] text-white text-xs font-medium rounded-md transition-colors"
              >
                Set
              </button>
            </div>
          </div>

          {selectedTime && (
            <button
              type="button"
              onClick={() => {
                onSelectTime(undefined);
                setCurrentView('calendar');
              }}
              className="w-full text-center text-xs text-red-400 hover:bg-[#2e2e2e] py-1.5 rounded mt-3 transition-colors"
            >
              Clear time
            </button>
          )}
        </div>
      )}

      {/* 3. Repeat Scheduling View */}
      {currentView === 'repeat' && (
        <div className="p-3">
          <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-[#333333]">
            <button
              type="button"
              onClick={() => setCurrentView('calendar')}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#333333]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-semibold">Repeat Scheduling</span>
          </div>

          <div className="space-y-1">
            {[
              { rule: 'daily', label: 'Every day' },
              { rule: 'weekdays', label: 'Every weekday (Mon-Fri)' },
              { rule: 'weekly', label: 'Every week' },
              { rule: 'monthly', label: 'Every month' },
              { rule: 'yearly', label: 'Every year' },
            ].map((opt) => (
              <button
                key={opt.rule}
                type="button"
                onClick={() => {
                  onSelectRecurrence(opt.rule);
                  setCurrentView('calendar');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  selectedRecurrence === opt.rule
                    ? 'bg-[#333333] text-white font-medium'
                    : 'text-neutral-300 hover:bg-[#2e2e2e]'
                }`}
              >
                <span>{opt.label}</span>
                {selectedRecurrence === opt.rule && (
                  <Check className="w-3.5 h-3.5 text-[#dc4c3e]" />
                )}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentView('repeat-custom')}
              className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-neutral-300 hover:bg-[#2e2e2e] transition-colors"
            >
              Custom...
            </button>
          </div>

          {selectedRecurrence && (
            <div className="pt-2 mt-2 border-t border-[#333333]">
              <button
                type="button"
                onClick={() => {
                  onSelectRecurrence(undefined);
                  setCurrentView('calendar');
                }}
                className="w-full text-center text-xs text-red-400 hover:bg-[#2e2e2e] py-1.5 rounded transition-colors"
              >
                Clear repeat (Don't repeat)
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Custom Repeat View */}
      {currentView === 'repeat-custom' && (
        <div className="p-3">
          <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-[#333333]">
            <button
              type="button"
              onClick={() => setCurrentView('repeat')}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#333333]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-semibold">Custom Recurrence</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">
                Repeat every:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={customInterval}
                  onChange={(e) => setCustomInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 bg-[#1c1c1c] text-xs text-neutral-200 border border-[#383838] rounded-md px-2 py-1 outline-none text-center"
                />
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value as 'day' | 'week' | 'month' | 'year')}
                  className="flex-1 bg-[#1c1c1c] text-xs text-neutral-200 border border-[#383838] rounded-md px-2 py-1 outline-none"
                >
                  <option value="day">{customInterval === 1 ? 'day' : 'days'}</option>
                  <option value="week">{customInterval === 1 ? 'week' : 'weeks'}</option>
                  <option value="month">{customInterval === 1 ? 'month' : 'months'}</option>
                  <option value="year">{customInterval === 1 ? 'year' : 'years'}</option>
                </select>
              </div>
            </div>

            {/* Weekday selector when unit is 'week' */}
            {customUnit === 'week' && (
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">
                  On days:
                </label>
                <div className="flex justify-between gap-1">
                  {[
                    { label: 'M', day: 1 },
                    { label: 'T', day: 2 },
                    { label: 'W', day: 3 },
                    { label: 'T', day: 4 },
                    { label: 'F', day: 5 },
                    { label: 'S', day: 6 },
                    { label: 'S', day: 0 },
                  ].map((d) => {
                    const isSelected = customDays.includes(d.day);
                    return (
                      <button
                        key={d.day}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (customDays.length > 1) {
                              setCustomDays(customDays.filter((x) => x !== d.day));
                            }
                          } else {
                            setCustomDays([...customDays, d.day]);
                          }
                        }}
                        className={`w-7 h-7 text-[11px] font-semibold rounded-full flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#dc4c3e] text-white'
                            : 'bg-[#2a2a2a] text-neutral-400 hover:text-white'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const ruleText = `Every ${customInterval} ${customUnit}${customInterval > 1 ? 's' : ''}`;
                  onSelectRecurrence(ruleText);
                  setCurrentView('calendar');
                }}
                className="w-full py-1.5 bg-[#dc4c3e] hover:bg-[#c53b27] text-white text-xs font-medium rounded-md transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

