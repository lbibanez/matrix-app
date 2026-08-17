import Dexie, { type Table } from 'dexie';

export type SyncStatus = 'synced' | 'created' | 'updated' | 'deleted';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval?: number;
  unit?: 'days' | 'weeks' | 'months' | 'years';
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  subtasks: Subtask[];
  status: 'pending' | 'in_progress' | 'completed';
  due_date?: string | null;
  start_date?: string | null;
  all_day: boolean;
  recurrence_rule?: RecurrenceRule | null;
  deleted: boolean;
  created_at: string;
  updated_at: string;
  _syncStatus: SyncStatus;
}

export class MatrixDatabase extends Dexie {
  tasks!: Table<Task, string>;

  constructor() {
    super('MatrixDB');
    
    // Version 1 of the database schema
    this.version(1).stores({
      tasks: 'id, user_id, status, due_date, deleted, _syncStatus'
    });

    // Version 2: Added description, subtasks, all_day, recurrence_rule
    // We don't need to add them to the stores index string unless we query BY them.
    this.version(2).stores({
      tasks: 'id, user_id, status, due_date, deleted, _syncStatus'
    });
  }
}

export const db = new MatrixDatabase();
