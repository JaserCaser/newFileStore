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

    await user.type(screen.getByLabelText('API Key'), 'sk-test')
    await user.type(screen.getByLabelText('描述内容'), '清晨的玻璃温室和蓝色陶瓷杯')
    await user.click(screen.getByRole('button', { name: '生成图片' }))

    await waitFor(
      () => {
        expect(screen.getByAltText('AI 生成结果')).toBeInTheDocument()
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

    await user.type(screen.getByLabelText('API Key'), 'sk-test')
    await user.type(screen.getByLabelText('描述内容'), 'A clean commercial poster')
    await user.click(screen.getByRole('button', { name: '生成图片' }))

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
      expect(screen.getByText('reference.png')).toBeInTheDocument()
    })
  })
})
