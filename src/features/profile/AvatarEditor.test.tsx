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
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('上传本地照片')).toBeNull()
  })

  it('calls onChange with base64 after valid file selected', async () => {
    const user = userEvent.setup()
    const fakeBase64 = 'data:image/png;base64,abc123'

    // Capture instance so readAsDataURL can invoke the onload set by the component
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let capturedInstance: any
    const readAsDataURL = vi.fn(function (_file: File) {
      capturedInstance?.onload?.({})
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.stubGlobal('FileReader', function (this: any) {
      this.result = fakeBase64
      this.onload = null
      this.readAsDataURL = readAsDataURL
      capturedInstance = this
    })
    const mockReader = { readAsDataURL }

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
    const user = userEvent.setup()
    renderEditor()
    await user.click(screen.getByRole('button', { name: '修改头像' }))
    await user.click(screen.getByText('输入图片 URL'))

    vi.useFakeTimers()
    const urlInput = screen.getByPlaceholderText('https://...')
    fireEvent.change(urlInput, { target: { value: 'https://cdn.example.com/a.png' } })

    expect(mockOnChange).not.toHaveBeenCalled()
    vi.advanceTimersByTime(600)
    expect(mockOnChange).toHaveBeenCalledWith('https://cdn.example.com/a.png')
  })
})
