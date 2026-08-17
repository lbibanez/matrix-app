import { Check } from 'lucide-react';
import { taskService } from '../services/taskService';
import { db } from '../../../core/db/dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';

interface TaskDetailSheetProps {
  taskId: string | null;
  onClose: () => void;
}

export function TaskDetailSheet({ taskId, onClose }: TaskDetailSheetProps) {
  const task = useLiveQuery(
    async () => (taskId ? await db.tasks.get(taskId) : null),
    [taskId]
  );

  const handleDelete = async () => {
    if (task && confirm('Delete this task?')) {
      try {
        await taskService.deleteTask(task.id);
        onClose();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCompleteToggle = async () => {
    if (!task) return;
    try {
      if (task.status === 'completed') {
        await taskService.updateTask(task.id, { status: 'pending' });
      } else {
        await taskService.completeTask(task.id);
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSubtask = async (subtaskId: string, currentCompleted: boolean) => {
    if (!task?.subtasks) return;
    try {
      const newSt = task.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !currentCompleted } : st
      );
      await taskService.updateTask(task.id, { subtasks: newSt });
    } catch (err) {
      console.error(err);
    }
  };

  const isOpen = !!taskId;
  const isCompleted = task?.status === 'completed';
  const formattedTime = (task?.due_date && !task?.all_day)
    ? format(new Date(task.due_date), 'h:mm a')
    : null;

  let repeatLabel = null;
  if (task?.recurrence_rule) {
    if (task.recurrence_rule.type === 'custom') {
      repeatLabel = `Every ${task.recurrence_rule.interval} ${task.recurrence_rule.unit}`;
    } else {
      repeatLabel = task.recurrence_rule.type.charAt(0).toUpperCase() + task.recurrence_rule.type.slice(1);
    }
  }

  return (
    <>
      <div
        className={`mx-overlay${isOpen ? ' mx-overlay--open' : ''}`}
        onClick={onClose}
      />
      <div className={`mx-sheet${isOpen ? ' mx-sheet--open' : ''}`}>
        <div className="mx-sheet-handle" />
        {task && (
          <div style={{ padding: '14px 22px 32px' }}>
            <div style={{ fontSize: 20, fontWeight: 650, letterSpacing: '-0.02em', marginBottom: 18 }}>
              {task.title}
            </div>

            {/* Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '10px 0 20px' }}>
              {task.all_day && task.due_date && <span className="mx-detail-pill">All day</span>}
              {formattedTime && <span className="mx-detail-pill">{formattedTime}</span>}
              {task.recurrence_rule && repeatLabel && <span className="mx-detail-pill">↻ {repeatLabel}</span>}
            </div>

            {/* Description */}
            <div style={{ paddingTop: 16, borderTop: '1px solid #EFF1EE' }}>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 650, marginBottom: 9 }}>Description</div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>
                {task.description || 'No description added.'}
              </div>
            </div>

            {/* Checklist */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div style={{ paddingTop: 16, borderTop: '1px solid #EFF1EE', marginTop: 8 }}>
                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 650, marginBottom: 9 }}>Checklist</div>
                {task.subtasks.map((st: any) => (
                  <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', fontSize: 14 }}>
                    <button
                      onClick={() => toggleSubtask(st.id, st.completed)}
                      style={{
                        width: 18, height: 18, borderRadius: '50%',
                        border: `1.5px solid ${st.completed ? '#1F5A37' : '#A4AAA5'}`,
                        background: st.completed ? '#1F5A37' : 'transparent',
                        color: '#fff', display: 'grid', placeItems: 'center',
                        flexShrink: 0, transition: 'all 0.2s',
                      }}
                    >
                      {st.completed && <Check size={11} strokeWidth={3} />}
                    </button>
                    <span style={{ textDecoration: st.completed ? 'line-through' : 'none', opacity: st.completed ? 0.5 : 1 }}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="mx-danger-btn" onClick={handleDelete}>Delete</button>
              <button className="mx-complete-btn" onClick={handleCompleteToggle}>
                {isCompleted ? 'Mark active' : 'Complete task'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
