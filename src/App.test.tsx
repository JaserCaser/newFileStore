import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App auth history', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    sessionStorage.clear()
    window.history.replaceState(null, '', '/')
  })

  it('returns to the login page when the browser goes back from the file list', async () => {
    const user = userEvent.setup()

    render(<App />)

    const loginForm = screen.getByRole('form', { name: '个人空间登录表单' })
    await user.type(within(loginForm).getByLabelText('账号'), 'admin')
    await user.type(within(loginForm).getByLabelText('密码'), 'admin123')
    await user.click(within(loginForm).getByRole('button', { name: '登录' }))

    await waitFor(() => {
      expect(screen.getByText('FileStore')).toBeInTheDocument()
    })
    expect(window.location.hash).toBe('#/files')

    window.history.back()
    window.dispatchEvent(new PopStateEvent('popstate'))

    await waitFor(() => {
      expect(screen.getByRole('form', { name: '个人空间登录表单' })).toBeInTheDocument()
    })
    expect(screen.queryByText('FileStore')).not.toBeInTheDocument()
  })
})
