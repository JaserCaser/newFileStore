import { AuthProvider } from './features/auth/AuthProvider'
import { useAuth } from './features/auth/useAuth'
import { LoginPage } from './features/auth/LoginPage'
import { FileManagerPage } from './features/file-manager/FileManagerPage'

function AppContent() {
  const { isAuthenticated, logout } = useAuth()

  if (isAuthenticated) {
    return <FileManagerPage onLogout={logout} />
  }

  return <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
