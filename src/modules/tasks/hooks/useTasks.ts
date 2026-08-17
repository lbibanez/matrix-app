import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '../../../core/db/dexie';
import { isBefore, isToday, isTomorrow, startOfDay } from 'date-fns';

interface GroupedTasks {
  overdue: Task[];
  today: Task[];
  tomorrow: Task[];
  upcoming: Record<string, Task[]>;
  noDate: Task[];
  completedToday: Task[];
}

export function useTasks() {
  const tasks = useLiveQuery(
    () => db.tasks.filter(t => !t.deleted).toArray(),
    []
  );

  const safeTasks = tasks || [];

  const now = new Date();
  const todayStart = startOfDay(now);

  const grouped: GroupedTasks = {
    overdue: [],
    today: [],
    tomorrow: [],
    upcoming: {},
    noDate: [],
    completedToday: [],
  };

  const activeTasks = safeTasks.filter(t => t.status !== 'completed');
  const completedTasks = safeTasks.filter(t => t.status === 'completed');

  // Group active tasks
  activeTasks.forEach((task) => {
    if (!task.due_date) {
      grouped.noDate.push(task);
      return;
    }
    const dueDate = new Date(task.due_date);
    if (isBefore(dueDate, todayStart)) {
      grouped.overdue.push(task);
    } else if (isToday(dueDate)) {
      grouped.today.push(task);
    } else if (isTomorrow(dueDate)) {
      grouped.tomorrow.push(task);
    } else {
      const dateStr = startOfDay(dueDate).toISOString();
      if (!grouped.upcoming[dateStr]) grouped.upcoming[dateStr] = [];
      grouped.upcoming[dateStr].push(task);
    }
  });

  // Find tasks completed today
  completedTasks.forEach(task => {
    if (isToday(new Date(task.updated_at))) {
      grouped.completedToday.push(task);
    }
  });

  completedTasks.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return { loading: tasks === undefined, tasks: activeTasks, completedTasks, grouped };
}
