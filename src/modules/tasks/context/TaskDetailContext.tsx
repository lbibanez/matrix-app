import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { TaskDetailSheet } from '../components/TaskDetailSheet';

interface TaskDetailContextType {
  openTask: (taskId: string) => void;
  closeTask: () => void;
}

const TaskDetailContext = createContext<TaskDetailContextType | undefined>(undefined);

export function TaskDetailProvider({ children }: { children: ReactNode }) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const openTask = useCallback((taskId: string) => setSelectedTaskId(taskId), []);
  const closeTask = useCallback(() => setSelectedTaskId(null), []);

  return (
    <TaskDetailContext.Provider value={{ openTask, closeTask }}>
      {children}
      <TaskDetailSheet taskId={selectedTaskId} onClose={closeTask} />
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
