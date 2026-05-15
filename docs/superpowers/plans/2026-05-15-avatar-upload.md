# Avatar Upload Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户可以通过点击头像区域，选择本地图片上传（转 base64 持久化）或输入 URL 两种方式来更新头像。

**Architecture:** 新建独立 `AvatarEditor` 组件，替换 `ProfilePage` 中原有"头像 URL" `ProfileField` 和头像展示逻辑。头像区域变成可点击按钮，点击后弹出浮层 popover，提供上传/URL/移除三个操作。`sanitizeAvatarUrl` 扩展支持 `data:image/` 前缀。

**Tech Stack:** React 19, TypeScript, Vitest + React Testing Library, FileReader API, lucide-react

---

## File Structure

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/features/profile/AvatarEditor.tsx` | 新建 | 头像展示 + picker 弹窗（本地上传 + URL 输入 + 移除） |
| `src/features/profile/AvatarEditor.test.tsx` | 新建 | AvatarEditor 单元测试 |
| `src/features/profile/ProfilePage.tsx` | 修改 | 引入 AvatarEditor，移除 URL ProfileField，更新 sanitizeAvatarUrl |
| `src/features/profile/ProfilePage.test.tsx` | 修改 | 更新 avatar 相关断言，适配新交互 |
| `src/features/profile/ProfilePage.css` | 修改 | 头像触发按钮样式、popover 样式 |

---

## Task 1: 扩展 sanitizeAvatarUrl 支持 data URL

**Files:**
- Modify: `src/features/profile/ProfilePage.tsx:297-306`
- Modify: `src/features/profile/ProfilePage.test.tsx`

- [ ] **Step 1: 写入失败测试**

在 `ProfilePage.test.tsx` 的 `describe('ProfilePage')` 中添加：

```ts
it('preserves data URL avatar on submit without stripping it', async () => {
  const user = userEvent.setup()
  const updateProfile = vi.fn(() => mockUser)
  renderProfilePage({ updateProfile })

  const avatarInput = screen.getByDisplayValue('https://example.com/avatar.png')
  await user.clear(avatarInput)
  await user.type(avatarInput, 'data:image/png;base64,abc123')
  await user.click(screen.getByRole('button', { name: '保存资料' }))

  expect(updateProfile).toHaveBeenCalledWith(
    expect.objectContaining({ avatar: 'data:image/png;base64,abc123' }),
  )
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run src/features/profile/ProfilePage.test.tsx
```

Expected: 新增测试 FAIL（`avatar: ''` 而非 `data:image/...`）

- [ ] **Step 3: 修改 sanitizeAvatarUrl**

将 `ProfilePage.tsx` 末尾的 `sanitizeAvatarUrl` 替换为：

```ts
function sanitizeAvatarUrl(value: string): string {
  const url = value.trim()
  const normalized = url.toLowerCase()
  if (normalized.startsWith('data:image/')) return url
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) return url
  return ''
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run src/features/profile/ProfilePage.test.tsx
```

Expected: 所有测试 PASS

- [ ] **Step 5: 提交**

```bash
git add src/features/profile/ProfilePage.tsx src/features/profile/ProfilePage.test.tsx
git commit -m "feat: allow data:image/ URLs in sanitizeAvatarUrl"
```

---

## Task 2: 写入 AvatarEditor 失败测试

**Files:**
- Create: `src/features/profile/AvatarEditor.test.tsx`

- [ ] **Step 1: 创建测试文件**

```tsx
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AvatarEditor } from './AvatarEditor'

const mockOnChange = vi.fn()

function renderEditor(value = '', initials = 'AL') {
  return render(
    <AvatarEditor value={value} initials={initials} onChange={mockOnChange} />,
  )
}

describe('AvatarEditor', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('renders avatar img when value is an https URL', () => {
    renderEditor('https://example.com/a.png')
    const img = screen.getByRole('img', { name: 'User avatar' })
    expect(img).toHaveAttribute('src', 'https://example.com/a.png')
  })

  it('renders initials fallback when value is empty', () => {
    renderEditor('')
    expect(screen.queryByRole('img', { name: 'User avatar' })).toBeNull()
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('opens popover when avatar button is clicked', async () => {
    const user = userEvent.setup()
    renderEditor()
    expect(screen.queryByText('上传本地照片')).toBeNull()
    await user.click(screen.getByRole('button', { name: '修改头像' }))
    expect(screen.getByText('上传本地照片')).toBeInTheDocument()
    expect(screen.getByText('输入图片 URL')).toBeInTheDocument()
  })

  it('does not show remove button when value is empty', async () => {
    const user = userEvent.setup()
    renderEditor('')
    await user.click(screen.getByRole('button', { name: '修改头像' }))
    expect(screen.queryByText('移除头像')).toBeNull()
  })

  it('shows remove button when value is set, clears on click', async () => {
    const user = userEvent.setup()
    renderEditor('https://example.com/a.png')
    await user.click(screen.getByRole('button', { name: '修改头像' }))
    expect(screen.getByText('移除头像')).toBeInTheDocument()
    await user.click(screen.getByText('移除头像'))
    expect(mockOnChange).toHaveBeenCalledWith('')
    expect(screen.queryByText('移除头像')).toBeNull()
  })

  it('closes popover on outside click', async () => {
    const user = userEvent.setup()
    renderEditor()
    await user.click(screen.getByRole('button', { name: '修改头像' }))
    expect(screen.getByText('上传本地照片')).toBeInTheDocument()
    fireEvent.mousedown(document.body)
    expect(screen.queryByText('上传本地照片')).toBeNull()
  })

  it('calls onChange with base64 after valid file selected', async () => {
    const user = userEvent.setup()
    const fakeBase64 = 'data:image/png;base64,abc123'

    const mockReader = {
      readAsDataURL: vi.fn(),
      result: fakeBase64,
      onload: null as ((e: unknown) => void) | null,
    }
    vi.stubGlobal('FileReader', vi.fn(() => mockReader))
    mockReader.readAsDataURL.mockImplementation(() => {
      mockReader.onload?.({})
    })

    renderEditor()
    await user.click(screen.getByRole('button', { name: '修改头像' }))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    Object.defineProperty(fileInput, 'files', { value: [file] })
    fireEvent.change(fileInput)

    expect(mockReader.readAsDataURL).toHaveBeenCalledWith(file)
    expect(mockOnChange).toHaveBeenCalledWith(fakeBase64)
    vi.unstubAllGlobals()
  })

  it('shows error and does not call onChange when file exceeds 2MB', async () => {
    const user = userEvent.setup()
    renderEditor()
    await user.click(screen.getByRole('button', { name: '修改头像' }))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const bigFile = new File([new ArrayBuffer(3 * 1024 * 1024)], 'big.png', {
      type: 'image/png',
    })
    Object.defineProperty(fileInput, 'files', { value: [bigFile] })
    fireEvent.change(fileInput)

    expect(screen.getByText('图片不能超过 2MB，请选择更小的文件')).toBeInTheDocument()
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('calls onChange with URL after 600ms debounce', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderEditor()
    await user.click(screen.getByRole('button', { name: '修改头像' }))
    await user.click(screen.getByText('输入图片 URL'))

    const urlInput = screen.getByPlaceholderText('https://...')
    await user.type(urlInput, 'https://cdn.example.com/a.png')

    expect(mockOnChange).not.toHaveBeenCalled()
    vi.advanceTimersByTime(600)
    expect(mockOnChange).toHaveBeenCalledWith('https://cdn.example.com/a.png')
  })
})
```

- [ ] **Step 2: 运行确认全部失败**

```bash
npx vitest run src/features/profile/AvatarEditor.test.tsx
```

Expected: 所有测试 FAIL（`AvatarEditor` 不存在）

---

## Task 3: 实现 AvatarEditor 组件

**Files:**
- Create: `src/features/profile/AvatarEditor.tsx`

- [ ] **Step 1: 创建组件文件**

```tsx
import { Camera, FolderOpen, Link, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type AvatarEditorProps = {
  readonly value: string
  readonly initials: string
  readonly onChange: (value: string) => void
}

const MAX_FILE_SIZE = 2 * 1024 * 1024

export function AvatarEditor({ value, initials, onChange }: AvatarEditorProps) {
  const [open, setOpen] = useState(false)
  const [urlInputVisible, setUrlInputVisible] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')
  const [imgError, setImgError] = useState(false)
  const [fileError, setFileError] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setImgError(false)
  }, [value])

  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false)
        setUrlInputVisible(false)
        setFileError('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const displaySrc = imgError ? '' : resolveDisplaySrc(value)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setFileError('图片不能超过 2MB，请选择更小的文件')
      event.target.value = ''
      return
    }
    setFileError('')
    const reader = new FileReader()
    reader.onload = () => {
      onChange(reader.result as string)
      setOpen(false)
    }
    reader.readAsDataURL(file)
  }

  const handleUrlChange = (val: string) => {
    setUrlDraft(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onChange(val), 600)
  }

  const handleRemove = () => {
    onChange('')
    setUrlDraft('')
    setOpen(false)
  }

  return (
    <div className="avatar-editor" ref={wrapRef}>
      <button
        type="button"
        className="profile-avatar-wrap avatar-editor-trigger"
        aria-label="修改头像"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {displaySrc ? (
          <img
            className="profile-avatar-img"
            src={displaySrc}
            alt="User avatar"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="profile-avatar-fallback">{initials}</div>
        )}
        <span className="profile-camera" aria-hidden="true">
          <Camera size={18} />
        </span>
      </button>

      {open && (
        <div className="avatar-picker-popover" role="menu">
          <button
            type="button"
            className="avatar-picker-item"
            onClick={() => fileInputRef.current?.click()}
          >
            <FolderOpen size={16} />
            上传本地照片
          </button>
          <button
            type="button"
            className="avatar-picker-item"
            onClick={() => setUrlInputVisible((prev) => !prev)}
          >
            <Link size={16} />
            输入图片 URL
          </button>
          {value && (
            <button type="button" className="avatar-picker-item avatar-picker-danger" onClick={handleRemove}>
              <Trash2 size={16} />
              移除头像
            </button>
          )}
          {urlInputVisible && (
            <div className="avatar-picker-url">
              <input
                type="url"
                placeholder="https://..."
                value={urlDraft}
                onChange={(e) => handleUrlChange(e.target.value)}
                autoFocus
              />
            </div>
          )}
          {fileError && <p className="avatar-picker-error">{fileError}</p>}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="avatar-file-input"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}

function resolveDisplaySrc(value: string): string {
  const url = value.trim()
  const norm = url.toLowerCase()
  if (norm.startsWith('data:image/')) return url
  if (norm.startsWith('http://') || norm.startsWith('https://')) return url
  return ''
}
```

- [ ] **Step 2: 运行测试确认通过**

```bash
npx vitest run src/features/profile/AvatarEditor.test.tsx
```

Expected: 所有测试 PASS

- [ ] **Step 3: 提交**

```bash
git add src/features/profile/AvatarEditor.tsx src/features/profile/AvatarEditor.test.tsx
git commit -m "feat: add AvatarEditor component with local upload and URL input"
```

---

## Task 4: 将 AvatarEditor 集成到 ProfilePage

**Files:**
- Modify: `src/features/profile/ProfilePage.tsx`
- Modify: `src/features/profile/ProfilePage.test.tsx`

- [ ] **Step 1: 更新 ProfilePage 测试**

将 `ProfilePage.test.tsx` 全文替换为：

```tsx
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../auth/auth-context'
import type { User, UserProfileUpdate } from '../auth/types'
import { ProfilePage } from './ProfilePage'

const mockUser: User = {
  id: 'user-001',
  username: 'Alice',
  account: 'alice',
  role: 'user',
  avatar: 'https://example.com/avatar.png',
  email: 'alice@example.com',
  phone: '13800138000',
  bio: 'Product owner',
  department: 'Product',
  location: 'Shanghai',
}

function renderProfilePage({
  onBack = vi.fn(),
  updateProfile = vi.fn(),
  user = mockUser,
}: {
  readonly onBack?: () => void
  readonly updateProfile?: (profile: UserProfileUpdate) => User | null
  readonly user?: User
} = {}) {
  const authValue: AuthContextValue = {
    user,
    token: 'token-user-001',
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    updateProfile,
  }

  const view = render(
    <AuthContext.Provider value={authValue}>
      <ProfilePage onBack={onBack} />
    </AuthContext.Provider>,
  )

  return { ...view, onBack, updateProfile }
}

describe('ProfilePage', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('renders profile form fields with initial values from user', () => {
    renderProfilePage()

    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'User avatar' })).toHaveAttribute(
      'src',
      'https://example.com/avatar.png',
    )
    expect(screen.getByDisplayValue('alice@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('13800138000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Product')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Shanghai')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Product owner')).toBeInTheDocument()
  })

  it('updates profile completion when tracked fields change', async () => {
    const user = userEvent.setup()
    renderProfilePage()

    expect(screen.getByText('100%')).toBeInTheDocument()

    await user.clear(screen.getByDisplayValue('alice@example.com'))
    expect(screen.getByText('83%')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '修改头像' }))
    await user.click(screen.getByText('移除头像'))
    expect(screen.getByText('67%')).toBeInTheDocument()
  })

  it('submits trimmed profile data through updateProfile', async () => {
    const user = userEvent.setup()
    const updateProfile = vi.fn(() => mockUser)
    renderProfilePage({ updateProfile })

    await user.clear(screen.getByDisplayValue('Alice'))
    await user.type(screen.getByDisplayValue(''), '  Alice Zhang  ')
    await user.clear(screen.getByDisplayValue('alice@example.com'))
    await user.type(screen.getByDisplayValue(''), '  zhang@example.com  ')
    await user.clear(screen.getByDisplayValue('13800138000'))
    await user.type(screen.getByDisplayValue(''), '  13900139000  ')
    await user.clear(screen.getByDisplayValue('Product'))
    await user.type(screen.getByDisplayValue(''), '  Design  ')
    await user.clear(screen.getByDisplayValue('Shanghai'))
    await user.type(screen.getByDisplayValue(''), '  Hangzhou  ')
    await user.clear(screen.getByDisplayValue('Product owner'))
    await user.type(screen.getByDisplayValue(''), '  Likes clean files  ')

    await user.click(screen.getByRole('button', { name: '保存资料' }))

    expect(updateProfile).toHaveBeenCalledWith({
      username: 'Alice Zhang',
      avatar: 'https://example.com/avatar.png',
      email: 'zhang@example.com',
      phone: '13900139000',
      bio: 'Likes clean files',
      department: 'Design',
      location: 'Hangzhou',
    })
  })

  it('sanitizes unsafe avatar URL entered via AvatarEditor URL input', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const updateProfile = vi.fn(() => mockUser)
    renderProfilePage({ updateProfile })

    await user.click(screen.getByRole('button', { name: '修改头像' }))
    await user.click(screen.getByText('输入图片 URL'))
    await user.type(screen.getByPlaceholderText('https://...'), 'javascript:alert(1)')
    vi.advanceTimersByTime(600)

    await user.click(screen.getByRole('button', { name: '保存资料' }))

    expect(updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ avatar: '' }),
    )
  })

  it('submits data URL avatar without stripping it', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const updateProfile = vi.fn(() => mockUser)

    const fakeBase64 = 'data:image/png;base64,abc123'
    const mockReader = {
      readAsDataURL: vi.fn(),
      result: fakeBase64,
      onload: null as ((e: unknown) => void) | null,
    }
    vi.stubGlobal('FileReader', vi.fn(() => mockReader))
    mockReader.readAsDataURL.mockImplementation(() => mockReader.onload?.({}))

    renderProfilePage({ updateProfile })

    await user.click(screen.getByRole('button', { name: '修改头像' }))
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    Object.defineProperty(fileInput, 'files', { value: [file] })
    fireEvent.change(fileInput)
    vi.runAllTimers()

    await user.click(screen.getByRole('button', { name: '保存资料' }))

    expect(updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ avatar: fakeBase64 }),
    )
    vi.unstubAllGlobals()
  })

  it('calls onBack from back and cancel buttons', async () => {
    const user = userEvent.setup()
    const { onBack } = renderProfilePage()

    const buttons = screen.getAllByRole('button')
    const backButton = buttons[0]
    const actions = document.querySelector('.profile-actions')
    expect(actions).not.toBeNull()

    await user.click(backButton)
    await user.click(within(actions as HTMLElement).getAllByRole('button')[0])

    expect(onBack).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run src/features/profile/ProfilePage.test.tsx
```

Expected: 多个测试 FAIL（AvatarEditor 未集成）

- [ ] **Step 3: 更新 ProfilePage.tsx**

将 `ProfilePage.tsx` 全文替换为：

```tsx
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
  const normalized = url.toLowerCase()
  if (normalized.startsWith('data:image/')) return url
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) return url
  return ''
}
```

- [ ] **Step 4: 运行所有 profile 测试**

```bash
npx vitest run src/features/profile/
```

Expected: 所有测试 PASS

- [ ] **Step 5: 提交**

```bash
git add src/features/profile/ProfilePage.tsx src/features/profile/ProfilePage.test.tsx
git commit -m "feat: integrate AvatarEditor into ProfilePage, remove URL text field"
```

---

## Task 5: 添加 CSS 样式

**Files:**
- Modify: `src/features/profile/ProfilePage.css`

- [ ] **Step 1: 在 ProfilePage.css 末尾追加样式**

```css
/* AvatarEditor */
.avatar-editor {
  position: relative;
  flex: 0 0 auto;
}

.avatar-editor-trigger {
  display: block;
  width: 112px;
  height: 112px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 28px;
  cursor: pointer;
}

.avatar-editor-trigger:hover .profile-camera {
  background: var(--color-apple-blue);
}

.avatar-file-input {
  display: none;
}

.avatar-picker-popover {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  min-width: 200px;
  padding: 6px;
  background: var(--color-surface, #fff);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 14px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.14);
}

.avatar-picker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  color: var(--color-text);
  background: none;
  border: none;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}

.avatar-picker-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.avatar-picker-danger {
  color: #e53e3e;
}

.avatar-picker-url {
  padding: 6px 4px 2px;
}

.avatar-picker-url input {
  width: 100%;
  padding: 7px 10px;
  color: var(--color-text);
  background: var(--color-page, #f5f5f7);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}

.avatar-picker-url input:focus {
  border-color: var(--color-apple-blue, #0071e3);
}

.avatar-picker-error {
  margin: 4px 4px 0;
  padding: 6px 10px;
  color: #e53e3e;
  font-size: 12px;
  font-weight: 500;
}
```

- [ ] **Step 2: 运行全部测试确认无回归**

```bash
npx vitest run src/features/profile/
```

Expected: 所有测试 PASS

- [ ] **Step 3: 提交**

```bash
git add src/features/profile/ProfilePage.css
git commit -m "style: add AvatarEditor popover and trigger styles"
```

---

## Self-Review

**Spec 覆盖检查：**
- ✅ 点击头像弹出浮层（Task 3/4/5）
- ✅ 本地上传 → FileReader → base64 → onChange（Task 3）
- ✅ 2MB 限制 + 错误提示（Task 2/3）
- ✅ URL 输入 + 600ms 防抖（Task 2/3）
- ✅ 移除头像按钮（仅当有头像时）（Task 2/3）
- ✅ 点击外部关闭（Task 2/3）
- ✅ sanitizeAvatarUrl 支持 data:image/（Task 1）
- ✅ 移除原有"头像 URL" ProfileField（Task 4）
- ✅ CSS 样式（Task 5）

**占位符扫描：** 无 TBD / TODO，所有步骤含完整代码。

**类型一致性：**
- `AvatarEditorProps.onChange: (value: string) => void` — Task 2/3 一致
- `ProfilePage` 调用 `<AvatarEditor onChange={(value) => updateField('avatar', value)} />` — 匹配
- `sanitizeAvatarUrl` 函数签名在 Task 1 和 Task 4 中相同
