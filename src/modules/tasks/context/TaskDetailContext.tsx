import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { TaskDetailSheet } from '../components/TaskDetailSheet';
import { TaskCreateSheet } from '../components/TaskCreateSheet';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../core/db/dexie';

interface TaskDetailContextType {
  openTask: (taskId: string) => void;
  closeTask: () => void;
  editTask: (taskId: string) => void;
}

const TaskDetailContext = createContext<TaskDetailContextType | undefined>(undefined);

export function TaskDetailProvider({ children }: { children: ReactNode }) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);

  const taskToEdit = useLiveQuery(
    async () => (editTaskId ? await db.tasks.get(editTaskId) : undefined),
    [editTaskId]
  );

  const openTask = useCallback((taskId: string) => setSelectedTaskId(taskId), []);
  const closeTask = useCallback(() => setSelectedTaskId(null), []);
  const editTask = useCallback((taskId: string) => setEditTaskId(taskId), []);

  return (
    <TaskDetailContext.Provider value={{ openTask, closeTask, editTask }}>
      {children}
      <TaskDetailSheet taskId={selectedTaskId} onClose={closeTask} onEdit={() => { if (selectedTaskId) editTask(selectedTaskId); }} />
      <TaskCreateSheet isOpen={!!editTaskId} editTask={taskToEdit} onClose={() => setEditTaskId(null)} />
    </TaskDetailContext.Provider>
  );
}

export function useTaskDetail() {
  const context = useContext(TaskDetailContext);
  if (context === undefined) {
    throw new Error('useTaskDetail must be used within a TaskDetailProvider');
  }
  return context;
}
