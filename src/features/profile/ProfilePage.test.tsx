import { cleanup, render, screen, within } from '@testing-library/react'
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
  })

  it('renders profile form fields with initial values from user', () => {
    renderProfilePage()

    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://example.com/avatar.png')).toBeInTheDocument()
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

    await user.clear(screen.getByDisplayValue('https://example.com/avatar.png'))

    expect(screen.getByText('67%')).toBeInTheDocument()
  })

  it('submits trimmed profile data through updateProfile', async () => {
    const user = userEvent.setup()
    const updateProfile = vi.fn(() => mockUser)
    renderProfilePage({ updateProfile })

    const usernameInput = screen.getByDisplayValue('Alice')
    const avatarInput = screen.getByDisplayValue('https://example.com/avatar.png')
    const emailInput = screen.getByDisplayValue('alice@example.com')
    const phoneInput = screen.getByDisplayValue('13800138000')
    const departmentInput = screen.getByDisplayValue('Product')
    const locationInput = screen.getByDisplayValue('Shanghai')
    const bioInput = screen.getByDisplayValue('Product owner')

    await user.clear(usernameInput)
    await user.type(usernameInput, '  Alice Zhang  ')
    await user.clear(avatarInput)
    await user.type(avatarInput, '  https://cdn.example.com/a.png  ')
    await user.clear(emailInput)
    await user.type(emailInput, '  zhang@example.com  ')
    await user.clear(phoneInput)
    await user.type(phoneInput, '  13900139000  ')
    await user.clear(departmentInput)
    await user.type(departmentInput, '  Design  ')
    await user.clear(locationInput)
    await user.type(locationInput, '  Hangzhou  ')
    await user.clear(bioInput)
    await user.type(bioInput, '  Likes clean files  ')

    await user.click(screen.getByRole('button', { name: '保存资料' }))

    expect(updateProfile).toHaveBeenCalledWith({
      username: 'Alice Zhang',
      avatar: 'https://cdn.example.com/a.png',
      email: 'zhang@example.com',
      phone: '13900139000',
      bio: 'Likes clean files',
      department: 'Design',
      location: 'Hangzhou',
    })
  })

  it('clears unsafe avatar url before submit', async () => {
    const user = userEvent.setup()
    const updateProfile = vi.fn(() => mockUser)
    renderProfilePage({ updateProfile })

    const avatarInput = screen.getByDisplayValue('https://example.com/avatar.png')
    await user.clear(avatarInput)
    await user.type(avatarInput, 'javascript:alert(1)')
    await user.click(screen.getByRole('button', { name: '保存资料' }))

    expect(updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        avatar: '',
      }),
    )
  })

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
