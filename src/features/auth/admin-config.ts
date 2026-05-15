import type { User } from './types'

/**
 * 超级管理员配置 —— 仅用于本地开发 / 单机部署。
 * 生产环境应替换为后端 API 鉴权。
 */
export const SUPER_ADMIN = {
  account: 'admin',
  password: 'admin123',
  user: {
    id: 'admin-001',
    username: '超级管理员',
    account: 'admin',
    role: 'super_admin' as const,
  } satisfies User,
}

/** 模拟 token 生成 */
export function generateToken(userId: string): string {
  return 'token_' + userId + '_' + Date.now().toString(36)
}

// Simple in-memory user store for development
const registeredUsers: User[] = []
const registeredPasswords = new Map<string, string>()

export function registerUser(
  username: string,
  account: string,
  password: string,
): { success: boolean; user?: User; message?: string } {
  if (registeredUsers.some((u) => u.account === account) || account === SUPER_ADMIN.account) {
    return { success: false, message: '该账号已被注册' }
  }

  const user: User = {
    id: 'user-' + Date.now().toString(36),
    username,
    account,
    role: 'user',
  }

  registeredUsers.push(user)
  registeredPasswords.set(user.id, password)

  return { success: true, user }
}

export function validateLogin(
  account: string,
  password: string,
): { success: boolean; user?: User; message?: string } {
  if (account === SUPER_ADMIN.account && password === SUPER_ADMIN.password) {
    return { success: true, user: SUPER_ADMIN.user }
  }

  const user = registeredUsers.find((u) => u.account === account)
  if (user && registeredPasswords.get(user.id) === password) {
    return { success: true, user }
  }

  return { success: false, message: '账号或密码错误' }
}
