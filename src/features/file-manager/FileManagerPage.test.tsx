import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { FileServiceProvider } from './api/service-context'
import { FileManagerPage } from './FileManagerPage'

function noop() {
  /* noop */
}

function renderFileManager() {
  return render(
    <FileServiceProvider>
      <FileManagerPage onLogout={noop} />
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
})
