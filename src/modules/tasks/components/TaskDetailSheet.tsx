import { Check, Pencil } from 'lucide-react';
import { taskService } from '../services/taskService';
import { db } from '../../../core/db/dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

interface TaskDetailSheetProps {
  taskId: string | null;
  onClose: () => void;
  onEdit?: () => void;
}

export function TaskDetailSheet({ taskId, onClose, onEdit }: TaskDetailSheetProps) {
  const liveTask = useLiveQuery(
    async () => (taskId ? await db.tasks.get(taskId) : null),
    [taskId]
  );

  const [cachedTask, setCachedTask] = useState<any>(null);

  useEffect(() => {
    if (liveTask) {
      setCachedTask(liveTask);
    }
  }, [liveTask]);

  const task = liveTask || cachedTask;

  const [completing, setCompleting] = useState(false);
  const [poppingSubtask, setPoppingSubtask] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset confirm state when sheet closes
  useEffect(() => {
    if (!taskId) setShowDeleteConfirm(false);
  }, [taskId]);

  const handleDelete = async () => {
    if (!task) return;
    try {
      await taskService.deleteTask(task.id);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteToggle = async () => {
    if (!task) return;
    try {
      if (task.status === 'completed') {
        await taskService.updateTask(task.id, { status: 'pending' });
        onClose();
      } else {
        setCompleting(true);
        // Play green wash for 400ms, then update DB and close
        setTimeout(async () => {
          try {
            await taskService.completeTask(task.id);
            onClose();
            setCompleting(false);
          } catch (e) {
            console.error(e);
            setCompleting(false);
          }
        }, 400);
      }
    } catch (err) {
      console.error(err);
      setCompleting(false);
    }
  };

  const toggleSubtask = async (subtaskId: string, currentCompleted: boolean) => {
    if (!task?.subtasks) return;
    try {
      setPoppingSubtask(subtaskId);
      const newSt = task.subtasks.map((st: any) =>
        st.id === subtaskId ? { ...st, completed: !currentCompleted } : st
      );
      await taskService.updateTask(task.id, { subtasks: newSt });
      setTimeout(() => setPoppingSubtask(null), 400);
    } catch (err) {
      console.error(err);
      setPoppingSubtask(null);
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
      <div
        className={`mx-sheet${isOpen ? ' mx-sheet--open' : ''}`}
        style={{
          background: completing ? '#EEF5F0' : undefined,
          transition: 'background 0.4s ease, transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
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
                        flexShrink: 0,
                        transform: poppingSubtask === st.id ? 'scale(1.3)' : 'scale(1)',
                        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, border-color 0.2s',
                      }}
                    >
                      {st.completed && <Check size={11} strokeWidth={3} />}
                    </button>
                    <span style={{ textDecoration: st.completed ? 'line-through' : 'none', opacity: st.completed ? 0.5 : 1, transition: 'opacity 0.3s, text-decoration 0.3s' }}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {!showDeleteConfirm ? (
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                {/* Edit button */}
                {onEdit && (
                  <button
                    onClick={onEdit}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '12px 16px', borderRadius: 13, fontSize: 13, fontWeight: 600,
                      background: '#F3F4F6', color: '#374151',
                      transition: 'transform 0.15s',
                    }}
                  >
                    <Pencil size={14} strokeWidth={2.5} /> Edit
                  </button>
                )}
                <button className="mx-danger-btn" onClick={() => setShowDeleteConfirm(true)}>Delete</button>
                <button
                  className="mx-complete-btn"
                  onClick={handleCompleteToggle}
                  style={{
                    background: completing ? '#16462B' : undefined,
                    transform: completing ? 'scale(0.97)' : undefined,
                    transition: 'background 0.3s, transform 0.3s',
                  }}
                >
                  {completing ? '✓ Done!' : isCompleted ? 'Mark active' : 'Complete task'}
                </button>
              </div>
            ) : (
              /* Inline delete confirmation — no window.confirm() */
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 10, textAlign: 'center' }}>
                  Delete "{task.title}"?
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      flex: 1, borderRadius: 13, padding: 12, fontSize: 13, fontWeight: 600,
                      background: '#F3F4F6', color: '#374151', transition: 'opacity 0.15s',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      flex: 1, borderRadius: 13, padding: 12, fontSize: 13, fontWeight: 600,
                      background: '#C0392B', color: '#fff', transition: 'opacity 0.15s',
                    }}
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
