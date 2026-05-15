import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { User } from '../auth/types'
import { FileServiceProvider } from './api/service-context'
import { FileManagerPage } from './FileManagerPage'

function noop() {
  /* noop */
}

const mockUser: User = {
  id: 'user-001',
  username: 'Alice',
  account: 'alice',
  role: 'user',
}

function renderFileManager({
  onOpenAiImage,
  onOpenProfile,
  user,
}: {
  readonly onOpenAiImage?: () => void
  readonly onOpenProfile?: () => void
  readonly user?: User
} = {}) {
  return render(
    <FileServiceProvider>
      <FileManagerPage
        onLogout={noop}
        onOpenAiImage={onOpenAiImage}
        onOpenProfile={onOpenProfile}
        user={user}
      />
    </FileServiceProvider>,
  )
}

describe('FileManagerPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the file list with initial mock data', async () => {
    renderFileManager()

    expect(screen.getByText('FileStore')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('工作文档')).toBeInTheDocument()
    })

    expect(screen.getByText('家庭相册')).toBeInTheDocument()
    expect(screen.getByText('项目资料')).toBeInTheDocument()
    expect(screen.getByText('年度报告.pdf')).toBeInTheDocument()
  })

  it('switches between grid and list view', async () => {
    const user = userEvent.setup()
    renderFileManager()

    await waitFor(() => {
      expect(screen.getByText('工作文档')).toBeInTheDocument()
    })

    const listViewBtn = screen.getByTitle('列表视图')
    await user.click(listViewBtn)

    expect(screen.getByText('修改时间')).toBeInTheDocument()
    expect(document.querySelector('.fm-col-size')).toBeInTheDocument()

    const gridViewBtn = screen.getByTitle('网格视图')
    await user.click(gridViewBtn)

    expect(document.querySelector('.fm-col-size')).not.toBeInTheDocument()
  })

  it('searches files by keyword', async () => {
    const user = userEvent.setup()
    renderFileManager()

    await waitFor(() => {
      expect(screen.getByText('工作文档')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('搜索文件、文件夹…')
    await user.type(searchInput, '年度报告')

    await waitFor(
      () => {
        expect(screen.getByText('年度报告.pdf')).toBeInTheDocument()
        expect(screen.queryByText('工作文档')).not.toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it('shows recently used files across folders', async () => {
    const user = userEvent.setup()
    renderFileManager()

    await user.click(screen.getByRole('button', { name: /最近使用/ }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '最近使用' })).toBeInTheDocument()
      expect(screen.getByText('生日晚餐.webp')).toBeInTheDocument()
    })

    expect(screen.getByText('需求清单.xls')).toBeInTheDocument()
    expect(screen.queryByText('工作文档')).not.toBeInTheDocument()
  })

  it('shows the photos page with only image files', async () => {
    const user = userEvent.setup()
    renderFileManager()

    await user.click(screen.getByRole('button', { name: /照片/ }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '照片' })).toBeInTheDocument()
      expect(screen.getByText('海边假期.heic')).toBeInTheDocument()
    })

    expect(screen.getByText('设计草图.png')).toBeInTheDocument()
    expect(screen.queryByText('年度报告.pdf')).not.toBeInTheDocument()
  })

  it('disables the create folder button in recent and photos views', async () => {
    const user = userEvent.setup()
    renderFileManager()

    await waitFor(() => {
      expect(screen.getByText('工作文档')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /最近使用/ }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '新建文件夹' })).toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: /照片/ }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '新建文件夹' })).toBeDisabled()
    })
  })

  it('shows the Office document page with Word Excel and PowerPoint files', async () => {
    const user = userEvent.setup()
    renderFileManager()

    await user.click(screen.getByRole('button', { name: /Office 文档/ }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Office 文档' })).toBeInTheDocument()
      expect(screen.getByText('会议记录.docx')).toBeInTheDocument()
    })

    expect(screen.getByText('Q1 财报.xlsx')).toBeInTheDocument()
    expect(screen.getByText('产品路线图.pptx')).toBeInTheDocument()
    expect(screen.queryByText('年度报告.pdf')).not.toBeInTheDocument()
  })

  it('disables the create folder button in recent, photos and office views', async () => {
    const user = userEvent.setup()
    renderFileManager()

    await waitFor(() => {
      expect(screen.getByText('工作文档')).toBeInTheDocument()
    })

    // 最近使用视图
    await user.click(screen.getByRole('button', { name: /最近使用/ }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '新建文件夹' })).toBeDisabled(),
    )

    // 照片视图
    await user.click(screen.getByRole('button', { name: /照片/ }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '新建文件夹' })).toBeDisabled(),
    )

    // Office 文档视图
    await user.click(screen.getByRole('button', { name: /Office 文档/ }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '新建文件夹' })).toBeDisabled(),
    )

    // 切回全部文件视图，按钮恢复可用
    await user.click(screen.getByRole('button', { name: /全部文件/ }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '新建文件夹' })).toBeEnabled(),
    )
  })

  it('opens create folder dialog', async () => {
    const user = userEvent.setup()
    renderFileManager()

    await waitFor(() => {
      expect(screen.getByText('工作文档')).toBeInTheDocument()
    })

    await user.click(screen.getByText('新建文件夹'))

    expect(screen.getByRole('dialog', { name: '新建文件夹' })).toBeInTheDocument()
    expect(screen.getByLabelText('文件夹名称')).toBeInTheDocument()
  })

  it('opens upload dialog', async () => {
    const user = userEvent.setup()
    renderFileManager()

    await waitFor(() => {
      expect(screen.getByText('工作文档')).toBeInTheDocument()
    })

    await user.click(screen.getByText('上传文件'))

    expect(screen.getByRole('dialog', { name: '上传文件' })).toBeInTheDocument()
  })

  it('pulls a file from a magnet link', async () => {
    const user = userEvent.setup()
    renderFileManager()

    await waitFor(() => {
      expect(screen.getByText('工作文档')).toBeInTheDocument()
    })

    await user.click(screen.getByText('磁力拉取'))

    expect(screen.getByRole('dialog', { name: '磁力链接拉取' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('磁力链接'), {
      target: {
        value:
          'magnet:?xt=urn:btih:1234567890abcdef1234567890abcdef12345678&dn=%E6%BC%94%E7%A4%BA%E8%A7%86%E9%A2%91.mp4',
      },
    })
    await user.click(screen.getByRole('button', { name: '开始拉取' }))

    await waitFor(
      () => {
        expect(screen.getByText('演示视频.mp4')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('shows context menu on right click', async () => {
    renderFileManager()

    await waitFor(() => {
      expect(screen.getByText('工作文档')).toBeInTheDocument()
    })

    const fileCard = screen.getByText('年度报告.pdf').closest('[tabindex]')
    expect(fileCard).not.toBeNull()
    if (fileCard) fireEvent.contextMenu(fileCard)

    expect(screen.getByText('重命名')).toBeInTheDocument()
    expect(screen.getByText('删除')).toBeInTheDocument()
    expect(screen.getByText('下载')).toBeInTheDocument()
    expect(screen.getByText('移动到…')).toBeInTheDocument()
    expect(screen.getByText('复制')).toBeInTheDocument()
  })

  it('navigates into a folder via breadcrumb', async () => {
    const user = userEvent.setup()
    renderFileManager()

    await waitFor(() => {
      expect(screen.getByText('工作文档')).toBeInTheDocument()
    })

    const folderCard = screen.getByText('工作文档').closest('[tabindex]')
    expect(folderCard).not.toBeNull()
    if (folderCard) fireEvent.doubleClick(folderCard)

    await waitFor(() => {
      expect(screen.getByText('Q1 财报.xlsx')).toBeInTheDocument()
    })

    expect(screen.getByText('产品路线图.pptx')).toBeInTheDocument()

    const breadcrumbNav = screen.getByRole('navigation', { name: '文件路径' })
    const rootLink = within(breadcrumbNav).getByRole('button', { name: /全部文件/ })
    await user.click(rootLink)

    await waitFor(() => {
      expect(screen.getByText('家庭相册')).toBeInTheDocument()
    })
  })

  it('selects and deselects files', async () => {
    const user = userEvent.setup()
    renderFileManager()

    await waitFor(() => {
      expect(screen.getByText('工作文档')).toBeInTheDocument()
    })

    const checkboxes = screen.getAllByRole('button', { name: '选择' })
    await user.click(checkboxes[0])

    expect(screen.getByText(/已选择 1 项/)).toBeInTheDocument()

    const selectionBar = document.querySelector('.fm-selection-bar')
    expect(selectionBar).not.toBeNull()
    const clearBtn = within(selectionBar as HTMLElement).getByText('取消选择')
    await user.click(clearBtn)

    expect(screen.queryByText(/已选择/)).not.toBeInTheDocument()
  })

  it('shows empty state when no files match search', async () => {
    const user = userEvent.setup()
    renderFileManager()

    await waitFor(() => {
      expect(screen.getByText('工作文档')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('搜索文件、文件夹…')
    await user.type(searchInput, 'nonexistent_xyz_file')

    await waitFor(() => {
      expect(screen.getByText('没有找到匹配的文件')).toBeInTheDocument()
    })
  })

  it('shows loading skeleton initially', () => {
    renderFileManager()

    const skeletons = document.querySelectorAll('.fm-skeleton-card, .fm-skeleton-row')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('sorts files by clicking sort buttons', async () => {
    const user = userEvent.setup()
    renderFileManager()

    await waitFor(() => {
      expect(screen.getByText('工作文档')).toBeInTheDocument()
    })

    const nameSortBtn = screen.getByRole('button', { name: '名称' })
    await user.click(nameSortBtn)

    await waitFor(() => {
      const cards = document.querySelectorAll('.fm-grid-card')
      const names = Array.from(cards).map((card) => {
        const nameEl = card.querySelector('.fc-name')
        return nameEl?.textContent ?? ''
      })
      const sorted = [...names].sort((a, b) => a.localeCompare(b, 'zh-CN'))
      expect(names).toEqual(sorted)
    })
  })

  it('renders avatar entry and opens profile when clicked', async () => {
    const user = userEvent.setup()
    const onOpenProfile = vi.fn()

    renderFileManager({ onOpenProfile, user: mockUser })

    const avatarButton = screen.getByRole('button', { name: 'Open profile settings' })

    expect(avatarButton).toBeInTheDocument()

    await user.click(avatarButton)

    expect(onOpenProfile).toHaveBeenCalledTimes(1)
  })

  it('opens the AI image page from the sidebar entry', async () => {
    const user = userEvent.setup()
    const onOpenAiImage = vi.fn()

    renderFileManager({ onOpenAiImage })

    await user.click(screen.getByRole('button', { name: /AI 生图/ }))

    expect(onOpenAiImage).toHaveBeenCalledTimes(1)
  })
})
