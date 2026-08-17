import { useState } from 'react';
import { type Task } from '../../../core/db/dexie';
import { taskService } from '../services/taskService';
import { Clock, Repeat, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useTaskDetail } from '../context/TaskDetailContext';

interface TaskItemProps {
  task: Task;
  isOverdue?: boolean;
}

export function TaskItem({ task, isOverdue = false }: TaskItemProps) {
  const { openTask } = useTaskDetail();
  const [isToggling, setIsToggling] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const isCompleted = task.status === 'completed';

  // When completing (not un-completing), play exit animation before DB write finalises
  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isToggling) return;
    setIsToggling(true);
    try {
      if (isCompleted) {
        // Un-complete — no animation needed, just restore
        await taskService.updateTask(task.id, { status: 'pending' });
      } else {
        // Show check burst first, then slide out
        setJustCompleted(true);
        await taskService.completeTask(task.id);
        // Wait for check animation, then exit
        setTimeout(() => setExiting(true), 380);
      }
    } catch (err) {
      console.error(err);
      setJustCompleted(false);
      setExiting(false);
    } finally {
      setIsToggling(false);
    }
  };

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const formattedTime = (task.due_date && !task.all_day) ? format(new Date(task.due_date), 'h:mm a') : null;

  return (
    <div
      onClick={() => !justCompleted && openTask(task.id)}
      className={`mx-task${isCompleted ? ' is-done' : ''}`}
      style={{
        // Slide-up + fade exit
        transition: exiting
          ? 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.4s ease 0.1s, margin 0.4s ease 0.1s, padding 0.4s ease 0.1s'
          : undefined,
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'scale(0.95) translateY(-6px)' : undefined,
        maxHeight: exiting ? 0 : 200,
        overflow: exiting ? 'hidden' : undefined,
        marginBottom: exiting ? 0 : undefined,
        padding: exiting ? '0 14px' : undefined,
        pointerEvents: exiting ? 'none' : undefined,
      }}
    >
      <button
        onClick={handleToggle}
        disabled={isToggling}
        className={`mx-check${(isCompleted || justCompleted) ? ' mx-check--done' : isOverdue ? ' mx-check--overdue' : ''}`}
        aria-label={isCompleted ? 'Mark incomplete' : 'Complete task'}
        style={{
          transform: justCompleted ? 'scale(1.25)' : 'scale(1)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.25s, border-color 0.25s',
        }}
      >
        <Check className="mx-check-icon" strokeWidth={3} />
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15,
          fontWeight: 520,
          lineHeight: 1.35,
          textDecoration: isCompleted ? 'line-through' : 'none',
          color: isCompleted ? '#8A8E91' : '#171717',
          transition: 'color 0.3s, text-decoration 0.3s',
        }}>
          {task.title}
        </div>

        {(formattedTime || totalSubtasks > 0 || task.recurrence_rule || task.all_day) && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 7,
            marginTop: 5,
            fontSize: 12,
            color: (isOverdue && !isCompleted) ? '#A95757' : '#6B7280',
          }}>
            {task.all_day && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>All day</span>
            )}
            {formattedTime && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Clock style={{ width: 13, height: 13 }} /> {formattedTime}
              </span>
            )}
            {totalSubtasks > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {completedSubtasks}/{totalSubtasks} subtasks
              </span>
            )}
            {task.recurrence_rule && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#1F5A37' }}>
                <Repeat style={{ width: 13, height: 13 }} /> Repeats
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
