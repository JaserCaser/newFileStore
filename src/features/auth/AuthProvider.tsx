import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { AuthState, LoginParams, LoginResult, RegisterParams, User, UserProfileUpdate } from './types'
import { AuthContext, type AuthContextValue } from './auth-context'
import { generateToken, validateLogin, registerUser, updateUserProfileInDirectory } from './admin-config'

const STORAGE_KEY = 'filestore_auth'

function loadStoredAuth(): { user: User; token: string } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as { user: User; token: string }
    return data
  } catch {
    return null
  }
}

function persistAuth(user: User, token: string, remember: boolean): void {
  const serialized = JSON.stringify({ user, token })
  if (remember) {
    localStorage.setItem(STORAGE_KEY, serialized)
  } else {
    sessionStorage.setItem(STORAGE_KEY, serialized)
  }
}

function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
}

function updateStoredUser(user: User, token: string): void {
  const serialized = JSON.stringify({ user, token })
  if (localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, serialized)
  }
  if (sessionStorage.getItem(STORAGE_KEY)) {
    sessionStorage.setItem(STORAGE_KEY, serialized)
  }
}

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const stored = loadStoredAuth()
    if (stored) {
      return { user: stored.user, token: stored.token, isAuthenticated: true }
    }
    return { user: null, token: null, isAuthenticated: false }
  })

  const login = useCallback(
    async (
      params: LoginParams,
      options?: { readonly requireAdminAccess?: boolean },
    ): Promise<LoginResult> => {
    // 模拟网络延迟
    await new Promise<void>((resolve) => setTimeout(resolve, 300))

    const result = await validateLogin(params.account, params.password, options)
    if (result.success && result.user) {
      const token = generateToken(result.user.id)
      persistAuth(result.user, token, params.remember)
      setAuthState({ user: result.user, token, isAuthenticated: true })
      return { success: true, user: result.user, token }
    }

    return { success: false, message: result.message ?? '账号或密码错误' }
    },
    [],
  )

  const logout = useCallback(() => {
    clearAuth()
    setAuthState({ user: null, token: null, isAuthenticated: false })
  }, [])

  const register = useCallback(async (params: RegisterParams): Promise<LoginResult> => {
    await new Promise<void>((resolve) => setTimeout(resolve, 300))

    const result = await registerUser(params.username, params.account, params.password, params.email)
    if (result.success && result.user) {
      const token = generateToken(result.user.id)
      persistAuth(result.user, token, false)
      setAuthState({ user: result.user, token, isAuthenticated: true })
      return { success: true, user: result.user, token }
    }

    return { success: false, message: result.message ?? '注册失败' }
  }, [])

  const updateProfile = useCallback((profile: UserProfileUpdate): User | null => {
    const updateResult: { token: string | null; user: User | null } = { token: null, user: null }

    setAuthState((current) => {
      if (!current.user || !current.token) {
        return current
      }

      updateResult.token = current.token
      updateResult.user = { ...current.user, ...profile }
      updateUserProfileInDirectory(current.user.id, profile)
      return { ...current, user: updateResult.user }
    })

    if (updateResult.user && updateResult.token) {
      updateStoredUser(updateResult.user, updateResult.token)
    }

    return updateResult.user
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ ...authState, login, logout, register, updateProfile }),
    [authState, login, logout, register, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
