import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AiImagePage } from './AiImagePage'

describe('AiImagePage', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('returns to the file page', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()

    render(<AiImagePage onBack={onBack} />)

    await user.click(screen.getByRole('button', { name: '返回文件' }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('generates an image from prompt text', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ data: [{ b64_json: 'ZmFrZS1wbmc=' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<AiImagePage onBack={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '生图设置' }))
    const apiKeyInputs = screen.getAllByPlaceholderText('可留空，默认使用本地代理密钥')
    await user.type(apiKeyInputs[0], 'sk-test')
    
    await user.type(screen.getByRole('textbox', { name: '输入画面描述' }), '清晨的玻璃温室和蓝色陶瓷杯')
    await user.click(screen.getByRole('button', { name: '发送' }))

    await waitFor(
      () => {
        expect(screen.getByAltText('生成结果')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai-image/generations',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
          'Content-Type': 'application/json',
        }) as Record<string, string>,
      }),
    )
  })

  it('shows an API error when generation fails', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: { message: '余额不足' } }), {
            status: 402,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    )

    render(<AiImagePage onBack={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '生图设置' }))
    const apiKeyInputs = screen.getAllByPlaceholderText('可留空，默认使用本地代理密钥')
    await user.type(apiKeyInputs[0], 'sk-test')
    
    await user.type(screen.getByRole('textbox', { name: '输入画面描述' }), 'A clean commercial poster')
    await user.click(screen.getByRole('button', { name: '发送' }))

    await waitFor(() => {
      expect(screen.getByText('余额不足')).toBeInTheDocument()
    })
  })

  it('accepts a reference image upload', async () => {
    render(<AiImagePage onBack={vi.fn()} />)

    const file = new File(['image'], 'reference.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]')
    expect(input).not.toBeNull()

    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
    }

    await waitFor(() => {
      expect(screen.getByAltText('参考图')).toBeInTheDocument()
    })
  })

  it('shows an error and does not call fetch when the reference image is larger than 8MB', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(<AiImagePage onBack={vi.fn()} />)

    const file = new File([new Uint8Array(9 * 1024 * 1024)], 'large-reference.png', {
      type: 'image/png',
    })
    const input = document.querySelector('input[type="file"]')
    expect(input).not.toBeNull()

    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
    }

    expect(screen.getByText('参考图片不能超过 8MB')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows an error and does not call fetch when the reference file is not an image', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(<AiImagePage onBack={vi.fn()} />)

    const file = new File(['pdf'], 'reference.pdf', { type: 'application/pdf' })
    const input = document.querySelector('input[type="file"]')
    expect(input).not.toBeNull()

    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
    }

    expect(screen.getByText('请选择图片文件')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows a timeout error when fetch is aborted', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(Object.assign(new DOMException('Aborted', 'AbortError')))),
    )

    render(<AiImagePage onBack={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '生图设置' }))
    const apiKeyInputs = screen.getAllByPlaceholderText('可留空，默认使用本地代理密钥')
    await user.type(apiKeyInputs[0], 'sk-test')
    
    await user.type(screen.getByRole('textbox', { name: '输入画面描述' }), 'A clean commercial poster')
    await user.click(screen.getByRole('button', { name: '发送' }))

    await waitFor(() => {
      expect(screen.getByText('生成时间过长，请稍后重试或降低图片尺寸')).toBeInTheDocument()
    })
  })
})
