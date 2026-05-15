import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { LoginPage } from './LoginPage'

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>)
}

describe('LoginPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the new Apple-like login page by default', () => {
    renderWithAuth(<LoginPage />)

    expect(screen.getByRole('form', { name: '个人空间登录表单' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '欢迎回来' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '切换旧登录页面' })).toBeInTheDocument()
    expect(screen.queryByText('后台')).not.toBeInTheDocument()
    expect(screen.queryByText('后台管理')).not.toBeInTheDocument()
  })

  it('switches to the legacy personal space login page', async () => {
    const user = userEvent.setup()

    renderWithAuth(<LoginPage />)

    await user.click(screen.getByRole('button', { name: '切换旧登录页面' }))

    expect(screen.getByText('登录个人空间')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '切换新登录页面' })).toBeInTheDocument()
  })

  it('switches between login and register on the legacy page', async () => {
    const user = userEvent.setup()

    renderWithAuth(<LoginPage />)

    await user.click(screen.getByRole('button', { name: '切换旧登录页面' }))
    await user.click(screen.getByRole('button', { name: '注册' }))

    expect(screen.getByRole('form', { name: '个人空间注册表单' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '返回登录' }))

    expect(screen.getByRole('form', { name: '个人空间登录表单' })).toBeInTheDocument()
  })

  it('flips to the register form and back to login', async () => {
    const user = userEvent.setup()

    renderWithAuth(<LoginPage />)

    await user.click(screen.getByRole('button', { name: '注册' }))

    const registerForm = screen.getByRole('form', { name: '个人空间注册表单' })

    expect(registerForm).toBeInTheDocument()
    expect(within(registerForm).getByLabelText('用户名')).toBeInTheDocument()
    expect(within(registerForm).getByLabelText('账号')).toBeInTheDocument()
    expect(within(registerForm).getByLabelText('密码')).toBeInTheDocument()
    expect(within(registerForm).queryByLabelText('确认密码')).not.toBeInTheDocument()
    expect(within(registerForm).queryByLabelText('验证码')).not.toBeInTheDocument()
    expect(within(registerForm).getByLabelText('绑定邮箱（可选）')).toBeInTheDocument()
    expect(within(registerForm).getByLabelText('按顺序点击图案中的文字')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '返回登录' }))

    expect(screen.getByRole('form', { name: '个人空间登录表单' })).toBeInTheDocument()
  })

  it('requires ordered character verification before registration', async () => {
    const user = userEvent.setup()

    renderWithAuth(<LoginPage />)

    await user.click(screen.getByRole('button', { name: '注册' }))

    const registerForm = screen.getByRole('form', { name: '个人空间注册表单' })
    const registerButton = within(registerForm).getByRole('button', { name: '注册' })

    expect(registerButton).toBeDisabled()
    const prompt = within(registerForm).getByText(/^请依次点击：/)
    const characters = prompt.textContent.replace('请依次点击：', '').split('、')

    expect(characters).toHaveLength(4)

    for (const character of characters) {
      await user.click(within(registerForm).getByRole('button', { name: `点击字符${character}` }))
    }

    expect(within(registerForm).getByText('验证正确')).toBeInTheDocument()
    expect(registerButton).toBeEnabled()
  })

  it('renders account and password inputs', () => {
    renderWithAuth(<LoginPage />)

    const loginForm = screen.getByRole('form', { name: '个人空间登录表单' })

    expect(within(loginForm).getByLabelText('账号')).toBeInTheDocument()
    expect(within(loginForm).getByLabelText('密码')).toBeInTheDocument()
  })

  it('toggles password visibility on the login form', async () => {
    const user = userEvent.setup()

    renderWithAuth(<LoginPage />)

    const loginForm = screen.getByRole('form', { name: '个人空间登录表单' })
    const passwordInput = within(loginForm).getByLabelText('密码')

    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(within(loginForm).getByRole('button', { name: '显示密码' }))

    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(within(loginForm).getByRole('button', { name: '隐藏密码' }))

    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('renders a submit button with login text', () => {
    renderWithAuth(<LoginPage />)

    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
  })

  it('renders remember checkbox as a serializable form field', () => {
    renderWithAuth(<LoginPage />)

    expect(screen.getByLabelText('保持登录')).toHaveAttribute('name', 'remember')
  })
})
