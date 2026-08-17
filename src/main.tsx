import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider, useAuth } from './core/auth/AuthContext'
import { AppShell } from './AppShell'
import { TaskDetailProvider } from './modules/tasks/context/TaskDetailContext'
import './index.css'

import { AuthScreen } from './modules/auth/components/AuthScreen'

function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div style={{ padding: 20 }}>Loading...</div>
  }

  return user ? (
    <TaskDetailProvider>
      <AppShell />
    </TaskDetailProvider>
  ) : <AuthScreen />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
