import { useCallback, useEffect, useState } from 'react'
import { AuthProvider } from './features/auth/AuthProvider'
import { useAuth } from './features/auth/useAuth'
import { LoginPage } from './features/auth/LoginPage'
import { AiImagePage } from './features/ai-image/AiImagePage'
import { FileManagerPage } from './features/file-manager/FileManagerPage'
import { ProfilePage } from './features/profile/ProfilePage'

const FILES_ROUTE_HASH = '#/files'
const AI_IMAGE_ROUTE_HASH = '#/ai-image'

type ActivePage = 'files' | 'profile' | 'ai-image'

type ViewTransitionDocument = Document & {
  readonly startViewTransition?: (callback: () => void) => {
    readonly finished: Promise<void>
  }
}

function getRouteHash(): string {
  return window.location.hash
}

function runViewTransition(callback: () => void): void {
  const startViewTransition = (document as ViewTransitionDocument).startViewTransition
  if (typeof startViewTransition !== 'function') {
    callback()
    return
  }

  startViewTransition.call(document, callback)
}

function isAuthenticatedHistoryEntry(): boolean {
  return getAuthenticatedPageFromHash(getRouteHash()) !== null
}

function getAuthenticatedPageFromHash(hash: string): ActivePage | null {
  if (hash === FILES_ROUTE_HASH) return 'files'
  if (hash === AI_IMAGE_ROUTE_HASH) return 'ai-image'
  return null
}

function pushAuthenticatedRoute(routeHash: string): void {
  const nextUrl = `${window.location.pathname}${window.location.search}${routeHash}`

  if (getRouteHash() === routeHash) {
    window.history.replaceState({ filestoreRoute: routeHash.slice(2) }, '', nextUrl)
    return
  }

  window.history.pushState({ filestoreRoute: routeHash.slice(2) }, '', nextUrl)
}

function enterHistoryEntry(): void {
  pushAuthenticatedRoute(FILES_ROUTE_HASH)
}

function leaveAuthenticatedHistoryEntry(): void {
  if (!isAuthenticatedHistoryEntry()) return

  const loginUrl = `${window.location.pathname}${window.location.search}`
  window.history.replaceState(null, '', loginUrl)
}

function AppContent() {
  const { isAuthenticated, logout, user } = useAuth()
  const [activePage, setActivePage] = useState<ActivePage>(
    () => getAuthenticatedPageFromHash(getRouteHash()) ?? 'files',
  )
  const [, setRouteHash] = useState(() => getRouteHash())

  const handleLogout = useCallback(() => {
    setActivePage('files')
    leaveAuthenticatedHistoryEntry()
    setRouteHash(getRouteHash())
    logout()
  }, [logout])

  const handleAuthenticatedRouteLeave = useCallback(() => {
    const nextHash = getRouteHash()
    const nextPage = getAuthenticatedPageFromHash(nextHash)
    setRouteHash(nextHash)
    if (!isAuthenticated) return
    if (nextPage) {
      setActivePage(nextPage)
      return
    }

    setActivePage('files')
    logout()
  }, [isAuthenticated, logout])

  const openFiles = useCallback(() => {
    runViewTransition(() => {
      setActivePage('files')
      pushAuthenticatedRoute(FILES_ROUTE_HASH)
      setRouteHash(getRouteHash())
    })
  }, [])

  const openAiImage = useCallback(() => {
    runViewTransition(() => {
      setActivePage('ai-image')
      pushAuthenticatedRoute(AI_IMAGE_ROUTE_HASH)
      setRouteHash(getRouteHash())
    })
  }, [])

  useEffect(() => {
    window.addEventListener('popstate', handleAuthenticatedRouteLeave)
    window.addEventListener('hashchange', handleAuthenticatedRouteLeave)

    return () => {
      window.removeEventListener('popstate', handleAuthenticatedRouteLeave)
      window.removeEventListener('hashchange', handleAuthenticatedRouteLeave)
    }
  }, [handleAuthenticatedRouteLeave])

  if (isAuthenticated) {
    if (activePage === 'profile') {
      return <ProfilePage onBack={() => setActivePage('files')} />
    }

    if (activePage === 'ai-image') {
      return <AiImagePage onBack={openFiles} user={user} />
    }

    return (
      <FileManagerPage
        onLogout={handleLogout}
        onOpenAiImage={openAiImage}
        onOpenProfile={() => setActivePage('profile')}
        user={user}
      />
    )
  }

  return <LoginPage onAuthenticated={enterHistoryEntry} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
