import type { User, UserProfileUpdate } from './types'

export type UserDirectoryRecord = User & {
  readonly passwordHash: string
  readonly canAccessAdmin: boolean
  readonly status: 'active' | 'suspended'
  readonly createdAt: string
  readonly storageQuotaGb: number
}

type StoredUserDirectoryRecord = Omit<UserDirectoryRecord, 'passwordHash'> & {
  readonly passwordHash?: string
  readonly password?: string
}

export type AuditLogEntry = {
  readonly id: string
  readonly time: string
  readonly actor: string
  readonly action: string
  readonly detail: string
  readonly level: 'info' | 'warning' | 'success'
}

export type OperationsSettings = {
  readonly maintenanceMode: boolean
  readonly registrationOpen: boolean
  readonly defaultStorageQuotaGb: number
}

const DIRECTORY_KEY = 'filestore_user_directory'
const AUDIT_KEY = 'filestore_admin_audit'
const SETTINGS_KEY = 'filestore_operations_settings'
const SUPER_ADMIN_PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'

const nowIso = () => new Date().toISOString()

export async function hashPassword(password: string): Promise<string> {
  const payload = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', payload)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 超级管理员配置 —— 仅用于本地开发 / 单机部署。
 * 生产环境应替换为后端 API 鉴权。
 */
export const SUPER_ADMIN = {
  account: 'admin',
  user: {
    id: 'admin-001',
    username: '超级管理员',
    account: 'admin',
    role: 'super_admin' as const,
    canAccessAdmin: true,
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00.000Z',
    storageQuotaGb: 100,
  } satisfies User,
}

const DEFAULT_SETTINGS: OperationsSettings = {
  maintenanceMode: false,
  registrationOpen: true,
  defaultStorageQuotaGb: 10,
}

const SUPER_ADMIN_RECORD: UserDirectoryRecord = {
  ...SUPER_ADMIN.user,
  passwordHash: SUPER_ADMIN_PASSWORD_HASH,
  canAccessAdmin: true,
  status: 'active',
  createdAt: '2024-01-01T00:00:00.000Z',
  storageQuotaGb: 100,
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function saveDirectory(records: readonly UserDirectoryRecord[]): void {
  const withoutDuplicateSuperAdmin = records.filter((user) => user.id !== SUPER_ADMIN_RECORD.id)
  localStorage.setItem(DIRECTORY_KEY, JSON.stringify([SUPER_ADMIN_RECORD, ...withoutDuplicateSuperAdmin]))
}

function loadDirectory(): UserDirectoryRecord[] {
  const records = readJson<StoredUserDirectoryRecord[]>(DIRECTORY_KEY, [])
  const normalized = records
    .filter((user) => user.id !== SUPER_ADMIN_RECORD.id)
    .filter((user): user is UserDirectoryRecord => Boolean(user.passwordHash))
  return [SUPER_ADMIN_RECORD, ...normalized]
}

async function loadStoredDirectory(): Promise<UserDirectoryRecord[]> {
  const records = readJson<StoredUserDirectoryRecord[]>(DIRECTORY_KEY, [])
  const normalized = await Promise.all(
    records
      .filter((user) => user.id !== SUPER_ADMIN_RECORD.id)
      .map(async ({ password, passwordHash, ...user }) => ({
        ...user,
        passwordHash: passwordHash ?? (password ? await hashPassword(password) : ''),
      })),
  )
  return [SUPER_ADMIN_RECORD, ...normalized.filter((user) => user.passwordHash.length > 0)]
}

function pushAudit(entry: Omit<AuditLogEntry, 'id' | 'time'>): void {
  const logs = readJson<AuditLogEntry[]>(AUDIT_KEY, [])
  const next: AuditLogEntry = {
    id: 'log-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
    time: nowIso(),
    ...entry,
  }
  localStorage.setItem(AUDIT_KEY, JSON.stringify([next, ...logs].slice(0, 80)))
}

function toPublicUser(user: UserDirectoryRecord): User {
  return {
    id: user.id,
    username: user.username,
    account: user.account,
    role: user.role,
    canAccessAdmin: user.canAccessAdmin,
    status: user.status,
    createdAt: user.createdAt,
    storageQuotaGb: user.storageQuotaGb,
    ...(user.lastLoginAt ? { lastLoginAt: user.lastLoginAt } : {}),
    ...(user.avatar ? { avatar: user.avatar } : {}),
    ...(user.email ? { email: user.email } : {}),
    ...(user.phone ? { phone: user.phone } : {}),
    ...(user.bio ? { bio: user.bio } : {}),
    ...(user.department ? { department: user.department } : {}),
    ...(user.location ? { location: user.location } : {}),
  }
}

/** 模拟 token 生成 */
export function generateToken(userId: string): string {
  return 'token_' + userId + '_' + Date.now().toString(36)
}

export function getOperationsSettings(): OperationsSettings {
  return readJson<OperationsSettings>(SETTINGS_KEY, DEFAULT_SETTINGS)
}

export function updateOperationsSettings(
  actor: User,
  patch: Partial<OperationsSettings>,
): OperationsSettings {
  const next = { ...getOperationsSettings(), ...patch }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  pushAudit({
    actor: actor.username,
    action: '更新系统配置',
    detail: '维护模式、注册开放状态或默认容量发生变更',
    level: 'info',
  })
  return next
}

export function getAuditLogs(): AuditLogEntry[] {
  const logs = readJson<AuditLogEntry[]>(AUDIT_KEY, [])
  if (logs.length > 0) return logs

  return [
    {
      id: 'seed-1',
      time: nowIso(),
      actor: '系统',
      action: '运维端初始化',
      detail: '已创建超级管理员，并默认只允许该账号进入后台运维端',
      level: 'success',
    },
  ]
}

export function clearAuditLogs(actor: User): AuditLogEntry[] {
  const entry: AuditLogEntry = {
    id: 'log-' + Date.now().toString(36),
    time: nowIso(),
    actor: actor.username,
    action: '清空审计日志',
    detail: '已清理历史审计记录，仅保留本次操作',
    level: 'warning',
  }
  localStorage.setItem(AUDIT_KEY, JSON.stringify([entry]))
  return [entry]
}

export function listManagedUsers(): UserDirectoryRecord[] {
  return loadDirectory()
}

export async function registerUser(
  username: string,
  account: string,
  password: string,
  email?: string,
): Promise<{ success: boolean; user?: User; message?: string }> {
  const settings = getOperationsSettings()
  if (!settings.registrationOpen) {
    return { success: false, message: '当前暂停开放新账号注册' }
  }

  const users = await loadStoredDirectory()
  if (users.some((u) => u.account === account)) {
    return { success: false, message: '该账号已被注册' }
  }

  const user: UserDirectoryRecord = {
    id: 'user-' + Date.now().toString(36),
    username,
    account,
    ...(email ? { email } : {}),
    role: 'user',
    passwordHash: await hashPassword(password),
    canAccessAdmin: false,
    status: 'active',
    createdAt: nowIso(),
    storageQuotaGb: settings.defaultStorageQuotaGb,
  }

  saveDirectory([...users, user])
  pushAudit({
    actor: '系统',
    action: '新账号注册',
    detail: `${username} 注册了产品账号，默认无后台运维权限`,
    level: 'info',
  })

  return { success: true, user: toPublicUser(user) }
}

export async function validateLogin(
  account: string,
  password: string,
  options?: { readonly requireAdminAccess?: boolean },
): Promise<{ success: boolean; user?: User; message?: string }> {
  const users = await loadStoredDirectory()
  const user = users.find((u) => u.account === account)
  const passwordHash = await hashPassword(password)

  if (user?.passwordHash !== passwordHash) {
    return { success: false, message: '账号或密码错误' }
  }

  if (user.status === 'suspended') {
    return { success: false, message: '该账号已被停用，请联系超级管理员' }
  }

  if (options?.requireAdminAccess && !user.canAccessAdmin) {
    return { success: false, message: '该账号尚未获得后台运维登录权限' }
  }

  const updatedUser: UserDirectoryRecord = { ...user, lastLoginAt: nowIso() }
  saveDirectory(users.map((item) => (item.id === user.id ? updatedUser : item)))

  return { success: true, user: toPublicUser(updatedUser) }
}

export function updateUserProfileInDirectory(id: string, profile: UserProfileUpdate): void {
  const users = loadDirectory()
  saveDirectory(users.map((user) => (user.id === id ? { ...user, ...profile } : user)))
}

export function setUserAdminAccess(
  actor: User,
  userId: string,
  canAccessAdmin: boolean,
): UserDirectoryRecord[] {
  const users = loadDirectory()
  const target = users.find((user) => user.id === userId)

  if (!target || target.role === 'super_admin') return users

  const next = users.map((user) =>
    user.id === userId
      ? { ...user, canAccessAdmin, role: canAccessAdmin ? ('admin' as const) : ('user' as const) }
      : user,
  )
  saveDirectory(next)
  pushAudit({
    actor: actor.username,
    action: canAccessAdmin ? '授予后台权限' : '撤销后台权限',
    detail: `${target.username}（${target.account}）${canAccessAdmin ? '现在可登录后台运维端' : '已不能登录后台运维端'}`,
    level: canAccessAdmin ? 'success' : 'warning',
  })
  return loadDirectory()
}

export function setUserStatus(
  actor: User,
  userId: string,
  status: 'active' | 'suspended',
): UserDirectoryRecord[] {
  const users = loadDirectory()
  const target = users.find((user) => user.id === userId)

  if (!target || target.role === 'super_admin') return users

  const next = users.map((user) => (user.id === userId ? { ...user, status } : user))
  saveDirectory(next)
  pushAudit({
    actor: actor.username,
    action: status === 'active' ? '启用账号' : '停用账号',
    detail: `${target.username}（${target.account}）状态调整为${status === 'active' ? '正常' : '停用'}`,
    level: status === 'active' ? 'success' : 'warning',
  })
  return loadDirectory()
}

export function setUserStorageQuota(
  actor: User,
  userId: string,
  storageQuotaGb: number,
): UserDirectoryRecord[] {
  const users = loadDirectory()
  const target = users.find((user) => user.id === userId)
  const normalizedQuota = Math.min(500, Math.max(1, Math.round(storageQuotaGb)))

  if (!target || target.role === 'super_admin') return users

  const next = users.map((user) =>
    user.id === userId ? { ...user, storageQuotaGb: normalizedQuota } : user,
  )
  saveDirectory(next)
  pushAudit({
    actor: actor.username,
    action: '调整账号容量',
    detail: `${target.username}（${target.account}）容量调整为 ${String(normalizedQuota)} GB`,
    level: 'info',
  })
  return loadDirectory()
}

export async function resetUserPassword(
  actor: User,
  userId: string,
): Promise<{ readonly users: UserDirectoryRecord[]; readonly password?: string }> {
  const users = await loadStoredDirectory()
  const target = users.find((user) => user.id === userId)

  if (!target || target.role === 'super_admin') return { users }

  const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const password = Array.from(bytes, (b) => chars[b % chars.length]).join('')
  const passwordHash = await hashPassword(password)
  const next = users.map((user) => (user.id === userId ? { ...user, passwordHash } : user))
  saveDirectory(next)
  pushAudit({
    actor: actor.username,
    action: '重置登录密码',
    detail: `${target.username}（${target.account}）的密码已被重置`,
    level: 'warning',
  })
  return { users: loadDirectory(), password }
}
