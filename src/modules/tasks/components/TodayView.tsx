import { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { TaskItem } from './TaskItem';
import { format } from 'date-fns';
import { Check } from 'lucide-react';

export function TodayView() {
  const { grouped, loading } = useTasks();
  const [showCompleted, setShowCompleted] = useState(false);

  if (loading || !grouped) {
    return <div style={{ padding: 16, color: '#6B7280' }}>Loading...</div>;
  }

  const { overdue, today, completedToday } = grouped;
  const allDayTasks = today.filter(t => t.all_day);
  const scheduledTasks = today.filter(t => !t.all_day).sort((a, b) => {
    if (!a.due_date || !b.due_date) return 0;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const hasTasks = overdue.length > 0 || today.length > 0;
  const activeCount = overdue.length + today.length;

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 5 }}>
            {format(new Date(), 'EEEE, MMMM d')}
          </div>
          <h1 style={{ fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.04em', margin: 0, fontWeight: 800 }}>
            Today
          </h1>
          <div style={{ fontSize: 14, color: '#6B7280', marginTop: 7 }}>
            {activeCount} {activeCount === 1 ? 'task' : 'tasks'} scheduled
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!hasTasks && (
        <div style={{ padding: '48px 20px', textAlign: 'center', color: '#6B7280' }}>
          <div style={{ width: 46, height: 46, borderRadius: 16, background: '#EEF5F0', color: '#1F5A37', display: 'grid', placeItems: 'center', margin: '0 auto 15px' }}>
            <Check size={22} strokeWidth={3} />
          </div>
          <strong style={{ display: 'block', color: '#171717', fontSize: 15, marginBottom: 5 }}>No tasks here</strong>
          <span style={{ fontSize: 14 }}>You're all caught up.</span>
        </div>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
            <div className="mx-section-title" style={{ color: '#A95757' }}>Overdue</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {overdue.map(task => <TaskItem key={task.id} task={task} isOverdue={true} />)}
          </div>
        </section>
      )}

      {/* All Day */}
      {allDayTasks.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
            <div className="mx-section-title">All day</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allDayTasks.map(task => <TaskItem key={task.id} task={task} />)}
          </div>
        </section>
      )}

      {/* Scheduled */}
      {scheduledTasks.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
            <div className="mx-section-title">Scheduled</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scheduledTasks.map(task => <TaskItem key={task.id} task={task} />)}
          </div>
        </section>
      )}

      {/* Completed */}
      {completedToday.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
            <div className="mx-section-title">Completed</div>
          </div>
          <button className="mx-completed-summary" onClick={() => setShowCompleted(!showCompleted)}>
            <span className="mx-mini-check">
              <Check size={12} strokeWidth={3} />
            </span>
            {completedToday.length} completed today
          </button>
          {showCompleted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {completedToday.map(task => <TaskItem key={task.id} task={task} />)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
