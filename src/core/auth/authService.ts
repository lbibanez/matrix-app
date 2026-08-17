import { supabase } from '../lib/supabase';
import { db } from '../db/dexie';
import type { Session, Subscription } from '@supabase/supabase-js';

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Security: Wipe local data so another user on this device cannot see it
    await db.tasks.clear();
    localStorage.removeItem('matrix_last_sync_timestamp');
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback: (session: Session | null) => void): { subscription: Subscription } {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return { subscription: data.subscription };
  }
};
