import { useState } from 'react';
import { useCalendarTasks } from '../hooks/useCalendarTasks';
import { TaskItem } from './TaskItem';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';

export function CalendarView({ selectedDate, setSelectedDate }: { selectedDate: Date, setSelectedDate: (d: Date) => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { selectedDateTasks, hasTask, loading } = useCalendarTasks(selectedDate);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const jumpToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const weekDayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 5 }}>Plan by date</div>
          <h1 style={{ fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.04em', margin: 0, fontWeight: 800 }}>Calendar</h1>
        </div>
        <button className="mx-icon-btn" onClick={jumpToToday} style={{ fontSize: 12, fontWeight: 650, width: 'auto', padding: '0 14px' }}>
          Today
        </button>
      </div>

      {/* Calendar Card */}
      <div style={{
        background: 'rgba(255,255,255,0.78)',
        border: '1px solid rgba(23,23,23,.055)',
        borderRadius: 22,
        padding: 18,
        boxShadow: '0 7px 24px rgba(23,23,23,.06)',
      }}>
        {/* Month header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 620, letterSpacing: '-0.015em' }}>
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <button className="mx-small-btn" onClick={handlePrevMonth}>‹</button>
            <button className="mx-small-btn" onClick={handleNextMonth}>›</button>
          </div>
        </div>

        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, textAlign: 'center' }}>
          {weekDayHeaders.map((d, i) => (
            <div key={i} style={{ fontSize: 10, color: '#9A9D9A', fontWeight: 650, paddingBottom: 4 }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
          {days.map((day, i) => {
            const isSel = selectedDate ? isSameDay(day, selectedDate) : false;
            const isCurMonth = isSameMonth(day, currentMonth);
            const isDayToday = isToday(day);
            const hasTaskOnDay = hasTask(day);

            let className = 'mx-day';
            if (!isCurMonth && !isSel) className += ' mx-day--muted';
            if (isDayToday && !isSel) className += ' mx-day--today';
            if (isSel) className += ' mx-day--selected';
            if (hasTaskOnDay) className += ' mx-day--has-task';

            return (
              <button key={i} className={className} onClick={() => setSelectedDate(day)}>
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Agenda */}
      <section style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <div style={{ fontSize: 19, fontWeight: 630, letterSpacing: '-0.02em' }}>
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>
            {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#6B7280' }}>
            <span style={{ fontSize: 14 }}>Loading tasks...</span>
          </div>
        ) : selectedDateTasks.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#6B7280' }}>
            <strong style={{ display: 'block', color: '#171717', fontSize: 15, marginBottom: 5 }}>No tasks here</strong>
            <span style={{ fontSize: 14 }}>You're all caught up.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedDateTasks.map(task => <TaskItem key={task.id} task={task} />)}
          </div>
        )}
      </section>
    </div>
  );
}
