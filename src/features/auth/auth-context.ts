import { createContext } from 'react'
import type { AuthState, LoginParams, LoginResult } from './types'

export type RegisterParams = {
  readonly username: string
  readonly account: string
  readonly password: string
}

export type AuthContextValue = AuthState & {
  login: (params: LoginParams) => Promise<LoginResult>
  logout: () => void
  register: (params: RegisterParams) => Promise<LoginResult>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
