import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Shield,
  UserRound,
} from 'lucide-react'
import { useMemo, useState, type ReactNode, type SyntheticEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import type { UserProfileUpdate } from '../auth/types'
import { AvatarEditor } from './AvatarEditor'
import { isValidAvatarUrl } from './avatar-utils'
import './ProfilePage.css'

type ProfilePageProps = {
  readonly onBack: () => void
}

type ProfileFormState = Required<
  Pick<
    UserProfileUpdate,
    'username' | 'avatar' | 'email' | 'phone' | 'bio' | 'department' | 'location'
  >
>

const ROLE_LABELS = {
  super_admin: '超级管理员',
  admin: '管理员',
  user: '普通用户',
} as const

export function ProfilePage({ onBack }: ProfilePageProps) {
  const { user, updateProfile } = useAuth()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<ProfileFormState>(() => ({
    username: user?.username ?? '',
    avatar: user?.avatar ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    bio: user?.bio ?? '',
    department: user?.department ?? '',
    location: user?.location ?? '',
  }))

  const profileCompletion = useMemo(() => {
    const values = [
      form.username,
      form.avatar,
      form.email,
      form.phone,
      form.department,
      form.location,
    ]
    const filled = values.filter((value) => value.trim()).length
    return Math.round((filled / values.length) * 100)
  }, [form])

  if (!user) {
    return null
  }

  const initials = getInitials(form.username || user.account)
  const roleLabel = ROLE_LABELS[user.role]
  const profileCompletionText = String(profileCompletion)

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const username = form.username.trim()
    const avatar = sanitizeAvatarUrl(form.avatar)
    const email = form.email.trim()
    const phone = form.phone.trim()
    const bio = form.bio.trim()
    const department = form.department.trim()
    const location = form.location.trim()

    updateProfile({ username: username || user.username, avatar, email, phone, bio, department, location })
    setForm({ username: username || user.username, avatar, email, phone, bio, department, location })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  const updateField = (field: keyof ProfileFormState, value: string) => {
    setSaved(false)
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <main className="profile-page">
      <header className="profile-topbar">
        <button className="profile-back-btn" type="button" onClick={onBack}>
          <ArrowLeft size={18} />
          返回文件
        </button>
        <div className="profile-status">
          <Shield size={17} />
          <span>账号资料</span>
        </div>
      </header>

      <section className="profile-hero" aria-labelledby="profile-title">
        <AvatarEditor
          value={form.avatar}
          initials={initials}
          onChange={(value) => updateField('avatar', value)}
        />

        <div className="profile-heading">
          <p className="profile-eyebrow">Personal settings</p>
          <h1 id="profile-title">{form.username || user.username}</h1>
          <div className="profile-meta">
            <span>
              <BadgeCheck size={16} />
              {roleLabel}
            </span>
            <span>{user.account}</span>
          </div>
        </div>

        <div className="profile-score" aria-label={`资料完整度 ${profileCompletionText}%`}>
          <strong>{profileCompletion}%</strong>
          <span>完整度</span>
          <div className="profile-score-bar">
            <div style={{ width: `${profileCompletionText}%` }} />
          </div>
        </div>
      </section>

      <form className="profile-grid" onSubmit={handleSubmit}>
        <section className="profile-panel profile-panel-main" aria-labelledby="basic-info-title">
          <div className="profile-panel-heading">
            <h2 id="basic-info-title">基础信息</h2>
            <p>这些内容会用于头像入口、协作标识和账号展示。</p>
          </div>

          <div className="profile-fields">
            <ProfileField
              icon={<UserRound size={18} />}
              label="显示名称"
              value={form.username}
              onChange={(value) => updateField('username', value)}
            />
            <ProfileField
              icon={<Mail size={18} />}
              label="邮箱"
              type="email"
              value={form.email}
              onChange={(value) => updateField('email', value)}
            />
            <ProfileField
              icon={<Phone size={18} />}
              label="手机号"
              value={form.phone}
              onChange={(value) => updateField('phone', value)}
            />
            <ProfileField
              icon={<Building2 size={18} />}
              label="部门/身份"
              value={form.department}
              onChange={(value) => updateField('department', value)}
            />
            <ProfileField
              icon={<MapPin size={18} />}
              label="所在地"
              value={form.location}
              onChange={(value) => updateField('location', value)}
            />
          </div>
        </section>

        <aside className="profile-panel profile-side" aria-labelledby="security-title">
          <div className="profile-panel-heading">
            <h2 id="security-title">账号状态</h2>
            <p>当前登录会话和权限概览。</p>
          </div>
          <div className="profile-kv">
            <span>账号</span>
            <strong>{user.account}</strong>
          </div>
          <div className="profile-kv">
            <span>角色</span>
            <strong>{roleLabel}</strong>
          </div>
          <div className="profile-kv">
            <span>用户 ID</span>
            <strong>{user.id}</strong>
          </div>
        </aside>

        <section className="profile-panel profile-bio" aria-labelledby="bio-title">
          <div className="profile-panel-heading">
            <h2 id="bio-title">个人简介</h2>
            <p>用于记录备注、偏好或团队中的职责说明。</p>
          </div>
          <textarea
            value={form.bio}
            placeholder="写一点关于自己的说明..."
            onChange={(event) => updateField('bio', event.target.value)}
          />
        </section>

        <div className="profile-actions">
          {saved && (
            <span className="profile-saved" role="status">
              <CheckCircle2 size={16} />
              已保存
            </span>
          )}
          <button className="fm-btn fm-btn-secondary" type="button" onClick={onBack}>
            取消
          </button>
          <button className="fm-btn fm-btn-primary" type="submit">
            保存资料
          </button>
        </div>
      </form>
    </main>
  )
}

function ProfileField({
  icon,
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  readonly icon: ReactNode
  readonly label: string
  readonly onChange: (value: string) => void
  readonly placeholder?: string
  readonly type?: string
  readonly value: string
}) {
  return (
    <label className="profile-field">
      <span>
        {icon}
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder ?? `请输入${label}`}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function getInitials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || 'U'
}

function sanitizeAvatarUrl(value: string): string {
  const url = value.trim()
  return isValidAvatarUrl(url) ? url : ''
}
