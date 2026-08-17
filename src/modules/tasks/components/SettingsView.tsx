import { useState } from 'react';
import { useAuth } from '../../../core/auth/AuthContext';
import { authService } from '../../../core/auth/authService';
import { syncEngine } from '../../../core/sync/syncEngine';
import { taskService } from '../services/taskService';
import { ChevronRight, LogOut, RefreshCw, CheckCircle, Info, Lock } from 'lucide-react';

export function SettingsView() {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSignOut = async () => {
    if (confirm('Sign out? This will clear local data.')) {
      try {
        await authService.signOut();
      } catch (err: any) {
        alert(`Sign out failed: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const handleForceSync = async () => {
    if (!user) return;
    try {
      setIsSyncing(true);
      await syncEngine.sync(user.id);
      alert('Sync complete!');
    } catch (err: any) {
      alert(`Sync failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCompleted = async () => {
    if (confirm('Are you sure you want to permanently delete all completed tasks?')) {
      try {
        await taskService.clearCompletedTasks();
        alert('Completed tasks cleared.');
      } catch (err: any) {
        alert(`Clear failed: ${err.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 5 }}>Matrix</div>
          <h1 style={{ fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.035em', margin: 0, fontWeight: 650 }}>Settings</h1>
        </div>
      </div>

      {/* Profile Card */}
      <div style={{
        background: '#fff',
        border: '1px solid rgba(23,23,23,.055)',
        borderRadius: 20,
        padding: 15,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 7px 24px rgba(23,23,23,.06)',
        marginBottom: 28,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 15,
          background: '#1F5A37', color: '#fff',
          display: 'grid', placeItems: 'center',
          fontWeight: 650, fontSize: 18,
        }}>
          {user?.email?.charAt(0).toUpperCase() || 'M'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 620, fontSize: 14 }}>Matrix User</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{user?.email || 'Local-first workspace'}</div>
        </div>
        <ChevronRight size={18} style={{ color: '#A0A5A1' }} />
      </div>

      {/* Data & Sync */}
      <div style={{ marginTop: 23 }}>
        <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 650, margin: '0 4px 8px' }}>Data &amp; Sync</div>
        <div className="mx-settings-card">
          <button className="mx-setting-row" onClick={handleForceSync} disabled={isSyncing}>
            <span className="mx-setting-icon"><RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /></span>
            <span style={{ flex: 1, fontSize: 14 }}>{isSyncing ? 'Syncing...' : 'Sync now'}</span>
            <span style={{ fontSize: 12, color: '#1F5A37' }}>{isSyncing ? 'In progress' : 'Up to date'}</span>
          </button>
          <button className="mx-setting-row" onClick={handleClearCompleted}>
            <span className="mx-setting-icon"><CheckCircle size={16} /></span>
            <span style={{ flex: 1, fontSize: 14 }}>Clear completed tasks</span>
            <ChevronRight size={16} style={{ color: '#A0A5A1' }} />
          </button>
          <button className="mx-setting-row" onClick={handleSignOut} style={{ borderBottom: 0 }}>
            <span className="mx-setting-icon" style={{ background: '#F8EEEE', color: '#A95757' }}><LogOut size={16} /></span>
            <span style={{ flex: 1, fontSize: 14, color: '#A95757' }}>Sign out</span>
          </button>
        </div>
      </div>

      {/* About */}
      <div style={{ marginTop: 23 }}>
        <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 650, margin: '0 4px 8px' }}>About</div>
        <div className="mx-settings-card">
          <button className="mx-setting-row">
            <span className="mx-setting-icon"><Info size={16} /></span>
            <span style={{ flex: 1, fontSize: 14 }}>About Matrix</span>
            <ChevronRight size={16} style={{ color: '#A0A5A1' }} />
          </button>
          <button className="mx-setting-row" style={{ borderBottom: 0 }}>
            <span className="mx-setting-icon"><Lock size={16} /></span>
            <span style={{ flex: 1, fontSize: 14 }}>Privacy</span>
            <ChevronRight size={16} style={{ color: '#A0A5A1' }} />
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', color: '#A0A4A1', fontSize: 11, marginTop: 28 }}>
        Matrix · Module 1
      </div>
    </div>
  );
}
