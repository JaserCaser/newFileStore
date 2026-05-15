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
    vi.unstubAllGlobals()
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

    const usernameInput = screen.getByDisplayValue('Alice')
    const emailInput = screen.getByDisplayValue('alice@example.com')
    const phoneInput = screen.getByDisplayValue('13800138000')
    const departmentInput = screen.getByDisplayValue('Product')
    const locationInput = screen.getByDisplayValue('Shanghai')
    const bioInput = screen.getByDisplayValue('Product owner')

    await user.clear(usernameInput)
    await user.type(screen.getByPlaceholderText('请输入显示名称'), '  Alice Zhang  ')
    await user.clear(emailInput)
    await user.type(screen.getByPlaceholderText('请输入邮箱'), '  zhang@example.com  ')
    await user.clear(phoneInput)
    await user.type(screen.getByPlaceholderText('请输入手机号'), '  13900139000  ')
    await user.clear(departmentInput)
    await user.type(screen.getByPlaceholderText('请输入部门/身份'), '  Design  ')
    await user.clear(locationInput)
    await user.type(screen.getByPlaceholderText('请输入所在地'), '  Hangzhou  ')
    await user.clear(bioInput)
    await user.type(screen.getByPlaceholderText('写一点关于自己的说明...'), '  Likes clean files  ')

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
    const user = userEvent.setup()
    const updateProfile = vi.fn(() => mockUser)
    renderProfilePage({ updateProfile })

    await user.click(screen.getByRole('button', { name: '修改头像' }))
    await user.click(screen.getByText('输入图片 URL'))

    // Switch to fake timers for the debounced URL input, then use fireEvent
    vi.useFakeTimers()
    const urlInput = screen.getByPlaceholderText('https://...')
    fireEvent.change(urlInput, { target: { value: 'javascript:alert(1)' } })
    vi.advanceTimersByTime(600)
    vi.useRealTimers()

    await user.click(screen.getByRole('button', { name: '保存资料' }))

    expect(updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ avatar: '' }),
    )
  })

  it('submits data URL avatar without stripping it', async () => {
    const user = userEvent.setup()
    const updateProfile = vi.fn(() => mockUser)

    const fakeBase64 = 'data:image/png;base64,abc123'
    let capturedInstance: { readAsDataURL: ReturnType<typeof vi.fn>; onload: ((e: unknown) => void) | null; result: string } | null = null
    vi.stubGlobal('FileReader', function (this: typeof capturedInstance) {
      capturedInstance = {
        readAsDataURL: vi.fn(function () {
          capturedInstance?.onload?.({})
        }),
        onload: null,
        result: fakeBase64,
      }
      return capturedInstance
    })

    renderProfilePage({ updateProfile })

    await user.click(screen.getByRole('button', { name: '修改头像' }))
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    Object.defineProperty(fileInput, 'files', { value: [file] })
    fireEvent.change(fileInput)

    await user.click(screen.getByRole('button', { name: '保存资料' }))

    expect(updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ avatar: fakeBase64 }),
    )
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
