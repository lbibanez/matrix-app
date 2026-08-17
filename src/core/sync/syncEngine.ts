import { db } from '../db/dexie';
import { supabase } from '../lib/supabase';
import type { Task } from '../db/dexie';

const getSyncKey = (userId: string) => `matrix_last_sync_${userId}`;

export const syncEngine = {
  getLastSyncTimestamp(userId: string): string {
    return localStorage.getItem(getSyncKey(userId)) || '1970-01-01T00:00:00.000Z';
  },

  setLastSyncTimestamp(userId: string, timestamp: string) {
    localStorage.setItem(getSyncKey(userId), timestamp);
  },

  async push() {
    // 1. Fetch all local records that need syncing
    const pendingSyncs = await db.tasks.where('_syncStatus').notEqual('synced').toArray();
    if (pendingSyncs.length === 0) return;

    console.log(`[SyncEngine] Pushing ${pendingSyncs.length} changes to Supabase`);

    // Prepare payload (exclude local-only _syncStatus)
    const payload = pendingSyncs.map(task => {
      const { _syncStatus, ...rest } = task;
      return rest;
    });

    // 2. Upsert to Supabase
    const { error } = await supabase.from('tasks').upsert(payload, { onConflict: 'id' });
    
    if (error) {
      console.error('[SyncEngine] Push failed:', error);
      throw new Error(`Supabase Push Failed: ${error.message}`);
    }

    // 3. Update local sync status to 'synced'
    await db.transaction('rw', db.tasks, async () => {
      for (const task of pendingSyncs) {
        if (task._syncStatus === 'deleted') {
          // It's synced as deleted to the server, so we can now safely hard delete locally
          await db.tasks.delete(task.id);
        } else {
          await db.tasks.update(task.id, { _syncStatus: 'synced' });
        }
      }
    });
    
    console.log('[SyncEngine] Push complete');
  },

  async pull(userId: string) {
    const lastSync = this.getLastSyncTimestamp(userId);
    console.log(`[SyncEngine] Pulling changes since ${lastSync}`);

    // Fetch changes from server where server's updated_at > last sync
    const { data: serverTasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', lastSync)
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('[SyncEngine] Pull failed:', error);
      throw new Error(`Supabase Pull Failed: ${error.message}`);
    }

    if (!serverTasks || serverTasks.length === 0) {
      console.log('[SyncEngine] No new changes from server');
      return;
    }

    console.log(`[SyncEngine] Pulled ${serverTasks.length} remote changes`);

    let maxTimestamp = lastSync;

    // Apply changes locally using Last-Write-Wins based on server timestamp
    await db.transaction('rw', db.tasks, async () => {
      for (const remote of serverTasks) {
        const remoteTask = remote as Omit<Task, '_syncStatus'>;
        const localTask = await db.tasks.get(remoteTask.id);

        // Keep track of the highest updated_at received
        if (remoteTask.updated_at > maxTimestamp) {
          maxTimestamp = remoteTask.updated_at;
        }

        if (remoteTask.deleted) {
          await db.tasks.delete(remoteTask.id);
        } else {
          if (!localTask) {
            // New record
            await db.tasks.add({ ...remoteTask, _syncStatus: 'synced' });
          } else {
            // Conflict resolution: only overwrite if local state is synced or older
            if (localTask._syncStatus === 'synced') {
              await db.tasks.put({ ...remoteTask, _syncStatus: 'synced' });
            } else {
              console.log(`[SyncEngine] Conflict on task ${remoteTask.id}, local wins for next push`);
            }
          }
        }
      }
    });

    this.setLastSyncTimestamp(userId, maxTimestamp);
    console.log('[SyncEngine] Pull complete');
  },

  async sync(userId: string) {
    console.log('[SyncEngine] Starting full sync cycle');
    // Always push local changes first before pulling to resolve conflicts properly
    await this.push();
    await this.pull(userId);
    console.log('[SyncEngine] Sync cycle complete');
  },

  startRealtimeListener(userId: string) {
    console.log('[SyncEngine] Starting Realtime listener');
    const channel = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('[SyncEngine] Received Realtime payload:', payload);
          // When a remote change happens, trigger a pull
          this.pull(userId).catch(console.error);
        }
      )
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }
};
