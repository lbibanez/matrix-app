import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '../../../core/db/dexie';
import { isSameDay, startOfDay } from 'date-fns';
import { useMemo } from 'react';

export function useCalendarTasks(selectedDate: Date) {
  const tasks = useLiveQuery(
    () => db.tasks.filter(t => !t.deleted && t.status !== 'completed' && !!t.due_date).toArray(),
    []
  );

  const { selectedDateTasks, tasksByDateStr } = useMemo(() => {
    const map: Record<string, boolean> = {};
    const selectedTasks: Task[] = [];
    
    if (!tasks) return { selectedDateTasks: [], tasksByDateStr: map };
    
    tasks.forEach(task => {
      const taskDate = new Date(task.due_date!);
      const dateStr = startOfDay(taskDate).toISOString();
      map[dateStr] = true;
      
      if (isSameDay(taskDate, selectedDate)) {
        selectedTasks.push(task);
      }
    });

    // Sort selected tasks: All Day first, then by time
    selectedTasks.sort((a, b) => {
      if (a.all_day && !b.all_day) return -1;
      if (!a.all_day && b.all_day) return 1;
      return new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime();
    });

    return { selectedDateTasks: selectedTasks, tasksByDateStr: map };
  }, [tasks, selectedDate]);

  const hasTask = (date: Date) => {
    return !!tasksByDateStr[startOfDay(date).toISOString()];
  };

  return {
    selectedDateTasks,
    hasTask,
    loading: tasks === undefined
  };
}

