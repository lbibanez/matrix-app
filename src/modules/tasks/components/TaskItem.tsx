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
  const isCompleted = task.status === 'completed';

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isToggling) return;
    try {
      setIsToggling(true);
      if (isCompleted) {
        await taskService.updateTask(task.id, { status: 'pending' });
      } else {
        await taskService.completeTask(task.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsToggling(false);
    }
  };

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const formattedTime = (task.due_date && !task.all_day) ? format(new Date(task.due_date), 'h:mm a') : null;

  return (
    <div
      onClick={() => openTask(task.id)}
      className={`mx-task${isCompleted ? ' is-done' : ''}`}
    >
      <button
        onClick={handleToggle}
        disabled={isToggling}
        className={`mx-check${isCompleted ? ' mx-check--done' : isOverdue ? ' mx-check--overdue' : ''}`}
        aria-label={isCompleted ? 'Mark incomplete' : 'Complete task'}
        style={{ opacity: isToggling ? 0.5 : 1 }}
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
