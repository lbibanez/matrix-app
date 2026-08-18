import { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { TaskItem } from './TaskItem';
import { format, parseISO } from 'date-fns';

export function TaskList({ highlightTaskId }: { highlightTaskId?: string | null }) {
  const { tasks, completedTasks, grouped, loading } = useTasks();
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  if (loading || !grouped || !completedTasks) {
    return <div style={{ padding: 16, color: '#6B7280' }}>Loading tasks...</div>;
  }

  const sortedUpcomingDates = Object.keys(grouped.upcoming).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 5 }}>All work</div>
          <h1 style={{ fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.04em', margin: 0, fontWeight: 800 }}>Tasks</h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setTab('active')}
          style={{
            padding: '8px 16px',
            borderRadius: 99,
            fontSize: 13,
            background: tab === 'active' ? '#171717' : 'rgba(255,255,255,0.7)',
            color: tab === 'active' ? '#fff' : '#6B7280',
            fontWeight: tab === 'active' ? 600 : 500,
            transition: 'all 0.2s',
            border: tab === 'active' ? '1px solid #171717' : '1px solid rgba(23,23,23,0.1)',
            boxShadow: tab === 'active' ? '0 4px 12px rgba(23,23,23,.1)' : 'none'
          }}
        >
          Active ({tasks.length})
        </button>
        <button
          onClick={() => setTab('completed')}
          style={{
            padding: '8px 16px',
            borderRadius: 99,
            fontSize: 13,
            background: tab === 'completed' ? '#171717' : 'rgba(255,255,255,0.7)',
            color: tab === 'completed' ? '#fff' : '#6B7280',
            fontWeight: tab === 'completed' ? 600 : 500,
            transition: 'all 0.2s',
            border: tab === 'completed' ? '1px solid #171717' : '1px solid rgba(23,23,23,0.1)',
            boxShadow: tab === 'completed' ? '0 4px 12px rgba(23,23,23,.1)' : 'none'
          }}
        >
          Completed ({completedTasks.length})
        </button>
      </div>

      {tab === 'active' ? (
        tasks.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#6B7280' }}>
            <strong style={{ display: 'block', color: '#171717', fontSize: 15, marginBottom: 5 }}>No active tasks</strong>
            <span style={{ fontSize: 14 }}>You're all caught up.</span>
          </div>
        ) : (
          <>
            {grouped.overdue.length > 0 && (
              <section style={{ marginTop: 28 }}>
                <div style={{ fontSize: 14, fontWeight: 650, marginBottom: 9, color: '#A95757' }}>Overdue</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {grouped.overdue.map(task => <TaskItem key={task.id} task={task} isOverdue={true} isHighlighted={task.id === highlightTaskId} />)}
                </div>
              </section>
            )}

            {grouped.today.length > 0 && (
              <section style={{ marginTop: 28 }}>
                <div style={{ fontSize: 14, fontWeight: 650, marginBottom: 9, color: '#1F5A37' }}>Today</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {grouped.today.map(task => <TaskItem key={task.id} task={task} isHighlighted={task.id === highlightTaskId} />)}
                </div>
              </section>
            )}

            {grouped.tomorrow.length > 0 && (
              <section style={{ marginTop: 28 }}>
                <div style={{ fontSize: 14, fontWeight: 650, marginBottom: 9 }}>Tomorrow</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {grouped.tomorrow.map(task => <TaskItem key={task.id} task={task} isHighlighted={task.id === highlightTaskId} />)}
                </div>
              </section>
            )}

            {sortedUpcomingDates.map(dateStr => (
              <section key={dateStr} style={{ marginTop: 28 }}>
                <div style={{ fontSize: 14, fontWeight: 650, marginBottom: 9 }}>
                  {format(parseISO(dateStr), 'EEE, MMM d')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {grouped.upcoming[dateStr].map(task => <TaskItem key={task.id} task={task} isHighlighted={task.id === highlightTaskId} />)}
                </div>
              </section>
            ))}

            {grouped.noDate.length > 0 && (
              <section style={{ marginTop: 28 }}>
                <div style={{ fontSize: 14, fontWeight: 650, marginBottom: 9, color: '#9CA3AF' }}>No date</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {grouped.noDate.map(task => <TaskItem key={task.id} task={task} isHighlighted={task.id === highlightTaskId} />)}
                </div>
              </section>
            )}
          </>
        )
      ) : (
        completedTasks.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#6B7280' }}>
            <strong style={{ display: 'block', color: '#171717', fontSize: 15, marginBottom: 5 }}>No completed tasks</strong>
            <span style={{ fontSize: 14 }}>Complete some tasks to see them here.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {completedTasks.map(task => (
              <TaskItem key={task.id} task={task} isHighlighted={task.id === highlightTaskId} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
