import { db, type Task, type Subtask, type RecurrenceRule } from '../../../core/db/dexie';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

export const taskService = {
  async createTask(
    userId: string, 
    title: string, 
    options?: {
      description?: string;
      dueDate?: string;
      allDay?: boolean;
      recurrenceRule?: RecurrenceRule;
    }
  ) {
    const now = new Date().toISOString();
    const task: Task = {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      description: options?.description || '',
      subtasks: [],
      status: 'pending',
      due_date: options?.dueDate || null,
      all_day: options?.allDay !== undefined ? options.allDay : true,
      recurrence_rule: options?.recurrenceRule || null,
      deleted: false,
      created_at: now,
      updated_at: now,
      _syncStatus: 'created'
    };
    
    await db.tasks.add(task);
    return task;
  },

  async updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'user_id' | '_syncStatus' | 'created_at'>>) {
    const now = new Date().toISOString();
    
    await db.transaction('rw', db.tasks, async () => {
      const existing = await db.tasks.get(id);
      if (!existing) throw new Error('Task not found');
      
      const newSyncStatus = existing._syncStatus === 'created' ? 'created' : 'updated';
      
      await db.tasks.update(id, {
        ...updates,
        updated_at: now,
        _syncStatus: newSyncStatus
      });
    });
  },

  async completeTask(id: string) {
    const now = new Date().toISOString();
    
    await db.transaction('rw', db.tasks, async () => {
      const existing = await db.tasks.get(id);
      if (!existing) throw new Error('Task not found');
      
      // Handle Recurrence Generation
      if (existing.recurrence_rule && existing.due_date) {
        const nextDueDate = this.calculateNextOccurrence(existing.due_date, existing.recurrence_rule);
        
        // Spawn the next instance
        const nextTask: Task = {
          ...existing,
          id: crypto.randomUUID(),
          due_date: nextDueDate,
          subtasks: existing.subtasks.map(st => ({ ...st, completed: false })), // Uncheck subtasks
          status: 'pending',
          created_at: now,
          updated_at: now,
          _syncStatus: 'created'
        };
        await db.tasks.add(nextTask);
      }

      // Mark current task as completed
      const newSyncStatus = existing._syncStatus === 'created' ? 'created' : 'updated';
      await db.tasks.update(id, {
        status: 'completed',
        updated_at: now,
        _syncStatus: newSyncStatus
      });
    });
  },

  async deleteTask(id: string) {
    const now = new Date().toISOString();
    
    await db.transaction('rw', db.tasks, async () => {
      const existing = await db.tasks.get(id);
      if (!existing) return;

      if (existing._syncStatus === 'created') {
        await db.tasks.delete(id);
      } else {
        await db.tasks.update(id, {
          deleted: true,
          updated_at: now,
          _syncStatus: 'deleted'
        });
      }
    });
  },

  async clearCompletedTasks() {
    const now = new Date().toISOString();
    await db.transaction('rw', db.tasks, async () => {
      const completedTasks = await db.tasks.filter(t => t.status === 'completed' && !t.deleted).toArray();
      for (const task of completedTasks) {
        if (task._syncStatus === 'created') {
          await db.tasks.delete(task.id);
        } else {
          await db.tasks.update(task.id, {
            deleted: true,
            updated_at: now,
            _syncStatus: 'deleted'
          });
        }
      }
    });
  },

  // --- Subtask Helpers --- //

  async addSubtask(taskId: string, title: string) {
    await db.transaction('rw', db.tasks, async () => {
      const task = await db.tasks.get(taskId);
      if (!task) return;
      const newSubtask: Subtask = { id: crypto.randomUUID(), title, completed: false };
      await this.updateTask(taskId, { subtasks: [...task.subtasks, newSubtask] });
    });
  },

  async toggleSubtask(taskId: string, subtaskId: string) {
    await db.transaction('rw', db.tasks, async () => {
      const task = await db.tasks.get(taskId);
      if (!task) return;
      const subtasks = task.subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );
      await this.updateTask(taskId, { subtasks });
    });
  },

  async removeSubtask(taskId: string, subtaskId: string) {
    await db.transaction('rw', db.tasks, async () => {
      const task = await db.tasks.get(taskId);
      if (!task) return;
      const subtasks = task.subtasks.filter(st => st.id !== subtaskId);
      await this.updateTask(taskId, { subtasks });
    });
  },

  // --- Internal Helpers --- //

  calculateNextOccurrence(currentDateStr: string, rule: RecurrenceRule): string {
    const date = new Date(currentDateStr);
    let nextDate = date;

    const interval = rule.interval || 1;

    if (rule.type === 'daily') {
      nextDate = addDays(date, interval);
    } else if (rule.type === 'weekly') {
      nextDate = addWeeks(date, interval);
    } else if (rule.type === 'monthly') {
      nextDate = addMonths(date, interval);
    } else if (rule.type === 'yearly') {
      nextDate = addYears(date, interval);
    } else if (rule.type === 'custom' && rule.unit) {
      if (rule.unit === 'days') nextDate = addDays(date, interval);
      if (rule.unit === 'weeks') nextDate = addWeeks(date, interval);
      if (rule.unit === 'months') nextDate = addMonths(date, interval);
      if (rule.unit === 'years') nextDate = addYears(date, interval);
    }
    
    return nextDate.toISOString();
  }
};
