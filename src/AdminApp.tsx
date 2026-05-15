import { useCallback, useEffect, useState } from 'react'
import { AuthProvider } from './features/auth/AuthProvider'
import { LoginPage } from './features/auth/LoginPage'
import { useAuth } from './features/auth/useAuth'
import { OperationsAdminPage } from './features/operations/OperationsAdminPage'

const ADMIN_ROUTE_HASH = '#/admin'

function getRouteHash(): string {
  return window.location.hash
}

function enterAdminHistoryEntry(): void {
  const nextUrl = `${window.location.pathname}${window.location.search}${ADMIN_ROUTE_HASH}`

  if (getRouteHash() === ADMIN_ROUTE_HASH) {
    window.history.replaceState({ filestoreRoute: 'admin' }, '', nextUrl)
    return
  }

  window.history.pushState({ filestoreRoute: 'admin' }, '', nextUrl)
}

function leaveAdminHistoryEntry(): void {
  if (getRouteHash() !== ADMIN_ROUTE_HASH) return

  const loginUrl = `${window.location.pathname}${window.location.search}`
  window.history.replaceState(null, '', loginUrl)
}

function AdminAppContent() {
  const { isAuthenticated, logout, user } = useAuth()
  const [, setRouteHash] = useState(() => getRouteHash())

  const handleLogout = useCallback(() => {
    leaveAdminHistoryEntry()
    setRouteHash(getRouteHash())
    logout()
  }, [logout])

  const handleAuthenticatedRouteLeave = useCallback(() => {
    const nextHash = getRouteHash()
    setRouteHash(nextHash)
    if (!isAuthenticated || nextHash === ADMIN_ROUTE_HASH) return

    logout()
  }, [isAuthenticated, logout])

  useEffect(() => {
    window.addEventListener('popstate', handleAuthenticatedRouteLeave)
    window.addEventListener('hashchange', handleAuthenticatedRouteLeave)

    return () => {
      window.removeEventListener('popstate', handleAuthenticatedRouteLeave)
      window.removeEventListener('hashchange', handleAuthenticatedRouteLeave)
    }
  }, [handleAuthenticatedRouteLeave])

  useEffect(() => {
    if (isAuthenticated && !user?.canAccessAdmin) {
      window.setTimeout(handleLogout, 0)
    }
  }, [handleLogout, isAuthenticated, user?.canAccessAdmin])

  if (isAuthenticated) {
    if (user?.canAccessAdmin) {
      return <OperationsAdminPage onExit={handleLogout} user={user} />
    }

    return null
  }

  return <LoginPage mode="admin" onAuthenticated={enterAdminHistoryEntry} />
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <AdminAppContent />
    </AuthProvider>
  )
}
