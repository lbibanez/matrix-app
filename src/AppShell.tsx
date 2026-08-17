import { useState, useEffect } from 'react';
import { Calendar, CheckSquare, Settings, Sun, Plus } from 'lucide-react';
import { useAuth } from './core/auth/AuthContext';
import { syncEngine } from './core/sync/syncEngine';
import { TaskList } from './modules/tasks/components/TaskList';
import { TaskCreateSheet } from './modules/tasks/components/TaskCreateSheet';
import { TodayView } from './modules/tasks/components/TodayView';
import { CalendarView } from './modules/tasks/components/CalendarView';
import { SettingsView } from './modules/tasks/components/SettingsView';

type Tab = 'today' | 'calendar' | 'tasks' | 'settings';

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [toast, setToast] = useState<string | null>(null);
  const { user } = useAuth();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    if (user) {
      // Sync on startup and listen for changes
      syncEngine.sync(user.id).catch(console.error);
      const unsubscribe = syncEngine.startRealtimeListener(user.id);
      return () => unsubscribe();
    }
  }, [user]);

  const renderContent = () => {
    switch (activeTab) {
      case 'today': return <TodayView />;
      case 'calendar': return <CalendarView selectedDate={calendarDate} setSelectedDate={setCalendarDate} />;
      case 'tasks': return <TaskList />;
      case 'settings': return <SettingsView />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', background: '#F8F8F5', overflow: 'hidden', position: 'relative' }}>

      {/* ── Desktop Sidebar ── */}
      <aside className="mx-sidebar" style={{ display: 'none' }} id="desktop-sidebar">
        <div style={{ fontWeight: 750, fontSize: 20, letterSpacing: '-0.03em', padding: '0 10px 30px', color: '#171717' }}>
          Matrix
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <button className={`mx-side-btn${activeTab === 'today' ? ' mx-side-btn--active' : ''}`} onClick={() => setActiveTab('today')}>
            <Sun size={17} /> <span>Today</span>
          </button>
          <button className={`mx-side-btn${activeTab === 'calendar' ? ' mx-side-btn--active' : ''}`} onClick={() => setActiveTab('calendar')}>
            <Calendar size={17} /> <span>Calendar</span>
          </button>
          <button className="mx-side-create" onClick={() => setIsCreateOpen(true)}>
            <Plus size={17} strokeWidth={2.5} /> New Task
          </button>
          <button className={`mx-side-btn${activeTab === 'tasks' ? ' mx-side-btn--active' : ''}`} onClick={() => setActiveTab('tasks')}>
            <CheckSquare size={17} /> <span>Tasks</span>
          </button>
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <button className={`mx-side-btn${activeTab === 'settings' ? ' mx-side-btn--active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={17} /> <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="no-scrollbar" style={{ flex: 1, height: '100%', overflowY: 'auto', scrollBehavior: 'smooth' }}>
        <div style={{ padding: '28px 22px 112px', maxWidth: 680, margin: '0 auto' }}>
          {renderContent()}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="mx-bottom-nav">
        <button className={`mx-nav-btn${activeTab === 'today' ? ' mx-nav-btn--active' : ''}`} onClick={() => setActiveTab('today')}>
          <Sun size={24} />
        </button>
        <button className={`mx-nav-btn${activeTab === 'calendar' ? ' mx-nav-btn--active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <Calendar size={24} />
        </button>
        <button className="mx-fab" onClick={() => setIsCreateOpen(true)} aria-label="Create task">
          <Plus size={24} strokeWidth={2.5} />
        </button>
        <button className={`mx-nav-btn${activeTab === 'tasks' ? ' mx-nav-btn--active' : ''}`} onClick={() => setActiveTab('tasks')}>
          <CheckSquare size={24} />
        </button>
        <button className={`mx-nav-btn${activeTab === 'settings' ? ' mx-nav-btn--active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={24} />
        </button>
      </nav>

      {/* ── Create Sheet ── */}
      <TaskCreateSheet 
        isOpen={isCreateOpen} 
        onClose={(saved) => { setIsCreateOpen(false); if (saved) showToast('Task added ✓'); }} 
        defaultDate={activeTab === 'today' ? new Date() : (activeTab === 'calendar' ? calendarDate : undefined)}
      />

      {/* ── Toast ── */}
      <div className={`mx-toast${toast ? ' mx-toast--show' : ''}`}>{toast}</div>
    </div>
  );
}
