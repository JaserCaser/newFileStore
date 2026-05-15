import {
  Activity,
  CheckCircle2,
  Database,
  Download,
  HardDrive,
  KeyRound,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { User } from '../auth/types'
import {
  clearAuditLogs,
  getAuditLogs,
  getOperationsSettings,
  listManagedUsers,
  resetUserPassword,
  setUserAdminAccess,
  setUserStorageQuota,
  setUserStatus,
  updateOperationsSettings,
  type AuditLogEntry,
  type OperationsSettings,
  type UserDirectoryRecord,
} from '../auth/admin-config'
import './OperationsAdminPage.css'

type OperationsAdminPageProps = {
  readonly onExit: () => void
  readonly user: User
}

const statusText: Record<UserDirectoryRecord['status'], string> = {
  active: '正常',
  suspended: '停用',
}

type UserFilter = 'all' | 'admin' | 'suspended' | 'product'

function formatDate(value?: string): string {
  if (!value) return '尚未登录'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatStorage(gb: number): string {
  return `${String(gb)} GB`
}

export function OperationsAdminPage({ onExit, user }: OperationsAdminPageProps) {
  const [users, setUsers] = useState<UserDirectoryRecord[]>(() => listManagedUsers())
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => getAuditLogs())
  const [settings, setSettings] = useState<OperationsSettings>(() => getOperationsSettings())
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<UserFilter>('all')
  const [notice, setNotice] = useState<string | null>(null)

  const stats = useMemo(() => {
    const totalUsers = users.length
    const adminUsers = users.filter((item) => item.canAccessAdmin).length
    const suspendedUsers = users.filter((item) => item.status === 'suspended').length
    const storageQuota = users.reduce((sum, item) => sum + item.storageQuotaGb, 0)

    return { adminUsers, storageQuota, suspendedUsers, totalUsers }
  }, [users])

  const filteredUsers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    return users.filter((item) => {
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        item.username.toLowerCase().includes(normalizedKeyword) ||
        item.account.toLowerCase().includes(normalizedKeyword) ||
        item.email?.toLowerCase().includes(normalizedKeyword)

      const matchesFilter =
        filter === 'all' ||
        (filter === 'admin' && item.canAccessAdmin) ||
        (filter === 'suspended' && item.status === 'suspended') ||
        (filter === 'product' && !item.canAccessAdmin && item.status === 'active')

      return matchesKeyword && matchesFilter
    })
  }, [filter, keyword, users])

  const refresh = () => {
    setUsers(listManagedUsers())
    setLogs(getAuditLogs())
    setSettings(getOperationsSettings())
  }

  const toggleAdminAccess = (target: UserDirectoryRecord) => {
    setUsers(setUserAdminAccess(user, target.id, !target.canAccessAdmin))
    setLogs(getAuditLogs())
  }

  const toggleUserStatus = (target: UserDirectoryRecord) => {
    const nextStatus = target.status === 'active' ? 'suspended' : 'active'
    setUsers(setUserStatus(user, target.id, nextStatus))
    setLogs(getAuditLogs())
  }

  const changeQuota = (target: UserDirectoryRecord, value: number) => {
    setUsers(setUserStorageQuota(user, target.id, value))
    setLogs(getAuditLogs())
  }

  const handlePasswordReset = async (target: UserDirectoryRecord) => {
    const result = await resetUserPassword(user, target.id)
    setUsers(result.users)
    setLogs(getAuditLogs())
    if (result.password) {
      setNotice(`${target.username} 的临时密码：${result.password}`)
      window.setTimeout(() => setNotice(null), 15_000)
    }
  }

  const clearLogs = () => {
    setLogs(clearAuditLogs(user))
    setNotice('审计日志已清空，并保留本次清理记录')
  }

  const exportLogs = () => {
    const content = JSON.stringify(logs, null, 2)
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `filestore-audit-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const patchSettings = (patch: Partial<OperationsSettings>) => {
    setSettings(updateOperationsSettings(user, patch))
    setLogs(getAuditLogs())
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="ops-page">
      <aside className="ops-sidebar">
        <div className="ops-brand">
          <ShieldCheck size={24} />
          <span>FileStore Ops</span>
        </div>

        <nav className="ops-nav" aria-label="后台运维导航">
          <button type="button" onClick={() => scrollToSection('ops-overview')}>
            <Activity size={18} />
            总览
          </button>
          <button type="button" onClick={() => scrollToSection('ops-users')}>
            <Users size={18} />
            账号准入
          </button>
          <button type="button" onClick={() => scrollToSection('ops-settings')}>
            <SlidersHorizontal size={18} />
            系统配置
          </button>
          <button type="button" onClick={() => scrollToSection('ops-audit')}>
            <Database size={18} />
            审计日志
          </button>
        </nav>

        <div className="ops-identity">
          <span>{user.username}</span>
          <small>{user.account}</small>
        </div>
      </aside>

      <main className="ops-main">
        <header className="ops-header">
          <div>
            <p>后台运维管理</p>
            <h1>系统状态与账号准入</h1>
          </div>
          <div className="ops-header-actions">
            <button className="ops-icon-button" type="button" onClick={refresh} title="刷新">
              <RefreshCw size={18} />
            </button>
            <button className="ops-button ops-button-secondary" type="button" onClick={onExit}>
              <LogOut size={18} />
              退出后台
            </button>
          </div>
        </header>

        <section className="ops-metrics" id="ops-overview" aria-label="运维总览">
          <Metric icon={Users} label="账号总数" value={String(stats.totalUsers)} tone="blue" />
          <Metric icon={UserCheck} label="可进后台" value={String(stats.adminUsers)} tone="green" />
          <Metric icon={ShieldOff} label="停用账号" value={String(stats.suspendedUsers)} tone="orange" />
          <Metric icon={HardDrive} label="分配容量" value={formatStorage(stats.storageQuota)} tone="black" />
        </section>

        {notice ? (
          <div className="ops-notice" role="status">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)}>
              知道了
            </button>
          </div>
        ) : null}

        <section className="ops-panel" id="ops-users">
          <div className="ops-panel-heading">
            <div>
              <h2>账号准入</h2>
              <p>产品账号与后台账号共用一个账号库，只有超管或被勾选授权的账号可以登录后台。</p>
            </div>
          </div>

          <div className="ops-user-tools">
            <label className="ops-search">
              <Search size={16} />
              <input
                type="search"
                value={keyword}
                placeholder="搜索用户名、账号、邮箱"
                onChange={(event) => setKeyword(event.currentTarget.value)}
              />
            </label>
            <div className="ops-segments" aria-label="账号筛选">
              <button className={filter === 'all' ? 'active' : ''} type="button" onClick={() => setFilter('all')}>
                全部
              </button>
              <button className={filter === 'admin' ? 'active' : ''} type="button" onClick={() => setFilter('admin')}>
                运维账号
              </button>
              <button className={filter === 'product' ? 'active' : ''} type="button" onClick={() => setFilter('product')}>
                产品账号
              </button>
              <button className={filter === 'suspended' ? 'active' : ''} type="button" onClick={() => setFilter('suspended')}>
                已停用
              </button>
            </div>
          </div>

          <div className="ops-table" role="table" aria-label="账号准入列表">
            <div className="ops-table-row ops-table-head" role="row">
              <span role="columnheader">账号</span>
              <span role="columnheader">角色</span>
              <span role="columnheader">状态</span>
              <span role="columnheader">后台权限</span>
              <span role="columnheader">容量</span>
              <span role="columnheader">最近登录</span>
              <span role="columnheader">操作</span>
            </div>
            {filteredUsers.map((item) => {
              const locked = item.role === 'super_admin'
              return (
                <div className="ops-table-row" role="row" key={item.id}>
                  <span role="cell">
                    <strong>{item.username}</strong>
                    <small>{item.account}</small>
                  </span>
                  <span role="cell">{item.role === 'super_admin' ? '超级管理员' : item.role === 'admin' ? '运维账号' : '产品账号'}</span>
                  <span role="cell">
                    <span className={`ops-status ops-status-${item.status}`}>
                      <CheckCircle2 size={14} />
                      {statusText[item.status]}
                    </span>
                  </span>
                  <span role="cell">
                    <label className="ops-switch">
                      <input
                        type="checkbox"
                        checked={item.canAccessAdmin}
                        disabled={locked}
                        onChange={() => toggleAdminAccess(item)}
                      />
                      <span />
                    </label>
                  </span>
                  <span role="cell">
                    <input
                      className="ops-quota-input"
                      min={1}
                      max={500}
                      type="number"
                      value={item.storageQuotaGb}
                      onChange={(event) => changeQuota(item, Number(event.currentTarget.value))}
                    />
                  </span>
                  <span role="cell">{formatDate(item.lastLoginAt)}</span>
                  <span className="ops-row-actions" role="cell">
                    <button
                      className="ops-icon-mini"
                      type="button"
                      title="重置密码"
                      disabled={locked}
                      onClick={() => {
                        void handlePasswordReset(item)
                      }}
                    >
                      <KeyRound size={15} />
                    </button>
                    <button
                      className="ops-link-button"
                      type="button"
                      disabled={locked}
                      onClick={() => toggleUserStatus(item)}
                    >
                      {item.status === 'active' ? '停用' : '启用'}
                    </button>
                  </span>
                </div>
              )
            })}
            {filteredUsers.length === 0 ? (
              <div className="ops-empty">没有找到匹配账号</div>
            ) : null}
          </div>
        </section>

        <section className="ops-grid">
          <div className="ops-panel" id="ops-settings">
            <div className="ops-panel-heading">
              <div>
                <h2>系统配置</h2>
                <p>这里放置最基础的运维开关，后续可替换为后端配置中心。</p>
              </div>
            </div>
            <div className="ops-setting-list">
              <SettingSwitch
                title="维护模式"
                description="开启后前台可提示系统维护中"
                checked={settings.maintenanceMode}
                onChange={(checked) => patchSettings({ maintenanceMode: checked })}
              />
              <SettingSwitch
                title="开放注册"
                description="关闭后新产品账号无法注册"
                checked={settings.registrationOpen}
                onChange={(checked) => patchSettings({ registrationOpen: checked })}
              />
              <label className="ops-quota">
                <span>
                  默认容量
                  <small>新账号注册时获得的初始空间</small>
                </span>
                <input
                  min={1}
                  max={100}
                  type="number"
                  value={settings.defaultStorageQuotaGb}
                  onChange={(event) =>
                    patchSettings({ defaultStorageQuotaGb: Number(event.currentTarget.value) })
                  }
                />
              </label>
            </div>
          </div>

          <div className="ops-panel" id="ops-audit">
            <div className="ops-panel-heading">
              <div>
                <h2>审计日志</h2>
                <p>记录后台权限、账号状态和配置变更。</p>
              </div>
              <div className="ops-panel-actions">
                <button className="ops-icon-button" type="button" title="导出日志" onClick={exportLogs}>
                  <Download size={17} />
                </button>
                <button className="ops-icon-button" type="button" title="清空日志" onClick={clearLogs}>
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
            <div className="ops-log-list">
              {logs.slice(0, 8).map((log) => (
                <article className={`ops-log ops-log-${log.level}`} key={log.id}>
                  <span>{formatDate(log.time)}</span>
                  <strong>{log.action}</strong>
                  <p>{log.actor}：{log.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  tone,
  value,
}: {
  readonly icon: LucideIcon
  readonly label: string
  readonly tone: 'black' | 'blue' | 'green' | 'orange'
  readonly value: string
}) {
  return (
    <article className={`ops-metric ops-metric-${tone}`}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function SettingSwitch({
  checked,
  description,
  onChange,
  title,
}: {
  readonly checked: boolean
  readonly description: string
  readonly onChange: (checked: boolean) => void
  readonly title: string
}) {
  return (
    <label className="ops-setting">
      <span>
        {title}
        <small>{description}</small>
      </span>
      <span className="ops-switch">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} />
        <span />
      </span>
    </label>
  )
}
