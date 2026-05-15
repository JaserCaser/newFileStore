import { createContext } from 'react'
import type { AuthState, LoginParams, LoginResult, RegisterParams, User, UserProfileUpdate } from './types'

export type AuthContextValue = AuthState & {
  login: (params: LoginParams, options?: { readonly requireAdminAccess?: boolean }) => Promise<LoginResult>
  logout: () => void
  register: (params: RegisterParams) => Promise<LoginResult>
  updateProfile: (profile: UserProfileUpdate) => User | null
}

export const AuthContext = createContext<AuthContextValue | null>(null)
