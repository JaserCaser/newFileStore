/** 用户角色 */
export type UserRole = 'super_admin' | 'admin' | 'user'

/** 用户信息 */
export type User = {
  readonly id: string
  readonly username: string
  readonly account: string
  readonly role: UserRole
  readonly avatar?: string
}

/** 登录参数 */
export type LoginParams = {
  readonly account: string
  readonly password: string
  readonly remember: boolean
}

/** 登录结果 */
export type LoginResult = {
  readonly success: boolean
  readonly user?: User
  readonly token?: string
  readonly message?: string
}

/** 认证状态 */
export type AuthState = {
  readonly user: User | null
  readonly token: string | null
  readonly isAuthenticated: boolean
}
