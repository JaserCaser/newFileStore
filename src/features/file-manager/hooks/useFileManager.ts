import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  BreadcrumbNode,
  FileCollectionView,
  FileItem,
  FileListParams,
  SortConfig,
  StorageInfo,
} from '../api'
import { useFileService } from '../api/use-file-service'

type UseFileManagerOptions = {
  readonly pageSize?: number
  readonly onError?: (message: string) => void
  readonly onSuccess?: (message: string) => void
}

type UseFileManagerReturn = {
  /** 当前文件列表 */
  files: readonly FileItem[]
  /** 是否加载中 */
  loading: boolean
  /** 错误信息 */
  error: string | null
  /** 当前文件夹 ID */
  currentParentId: string | null
  /** 当前集合视图 */
  activeView: FileCollectionView
  /** 面包屑路径 */
  breadcrumbs: readonly BreadcrumbNode[]
  /** 搜索关键字 */
  keyword: string
  /** 排序配置 */
  sort: SortConfig
  /** 已选中的文件 ID 集合 */
  selectedIds: ReadonlySet<string>
  /** 分页信息 */
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
  /** 存储用量 */
  storageInfo: StorageInfo | null

  /** 进入文件夹 */
  navigateTo: (parentId: string | null, name?: string) => void
  /** 切换集合视图 */
  setActiveView: (view: FileCollectionView) => void
  /** 返回上一级 */
  navigateUp: () => void
  /** 搜索 */
  setKeyword: (keyword: string) => void
  /** 排序 */
  setSort: (sort: SortConfig) => void
  /** 翻页 */
  setPage: (page: number) => void
  /** 切换选中 */
  toggleSelect: (id: string) => void
  /** 全选/取消全选 */
  toggleSelectAll: () => void
  /** 清除选择 */
  clearSelection: () => void

  /** 创建文件夹 */
  createFolder: (name: string) => Promise<void>
  /** 重命名 */
  rename: (id: string, name: string) => Promise<void>
  /** 删除选中项 */
  deleteSelected: () => Promise<void>
  /** 删除指定项 */
  deleteItems: (ids: readonly string[]) => Promise<void>
  /** 上传文件 */
  uploadFiles: (files: readonly File[]) => Promise<void>
  /** 通过磁力链接拉取文件 */
  pullMagnet: (magnetLink: string, name?: string) => Promise<void>
  /** 下载文件 */
  downloadFile: (id: string) => Promise<void>
  /** 复制文件 */
  copyItems: (ids: readonly string[]) => Promise<void>
  /** 移动文件 */
  moveItems: (ids: readonly string[], targetParentId: string | null) => Promise<void>
  /** 刷新列表 */
  refresh: () => Promise<void>
}

const RECENT_PREVIEW_PAGE_SIZE = 24

export function useFileManager(options: UseFileManagerOptions = {}): UseFileManagerReturn {
  const { pageSize = 50, onError, onSuccess } = options
  const service = useFileService()

  const [files, setFiles] = useState<readonly FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentParentId, setCurrentParentId] = useState<string | null>(null)
  const [activeView, setActiveViewState] = useState<FileCollectionView>('all')
  const [breadcrumbs, setBreadcrumbs] = useState<readonly BreadcrumbNode[]>([
    { id: 'root', name: '全部文件' },
  ])
  const [keyword, setKeyword] = useState('')
  const [sort, setSort] = useState<SortConfig>({ field: 'name', direction: 'asc' })
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, pageSize, total: 0, totalPages: 0 })
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)

  // 防止过期请求覆盖新数据
  const requestIdRef = useRef(0)

  const fetchFiles = useCallback(
    async (params: FileListParams) => {
      const reqId = ++requestIdRef.current
      setLoading(true)
      setError(null)

      try {
        const res = await service.listFiles(params)
        if (reqId === requestIdRef.current) {
          setFiles(res.items)
          setPagination(res.pagination)
        }
      } catch (err) {
        if (reqId === requestIdRef.current) {
          setError(err instanceof Error ? err.message : '加载失败')
        }
      } finally {
        if (reqId === requestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [service],
  )

  // 加载文件列表
  useEffect(() => {
    const base =
      activeView === 'all'
        ? { parentId: currentParentId, sort, page, pageSize, view: activeView }
        : activeView === 'recent'
          ? { sort, page, pageSize: RECENT_PREVIEW_PAGE_SIZE, view: activeView }
          : { sort, page, pageSize, view: activeView }
    const params: FileListParams = keyword ? { ...base, keyword } : base
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 数据获取后更新状态是标准模式
    void fetchFiles(params)
  }, [activeView, currentParentId, keyword, sort, page, pageSize, fetchFiles])

  // 加载存储用量
  useEffect(() => {
    void service.getStorageInfo().then(setStorageInfo)
  }, [service])

  const navigateTo = useCallback((parentId: string | null, name?: string) => {
    setActiveViewState('all')
    setCurrentParentId(parentId)
    setPage(1)
    setKeyword('')
    setSelectedIds(new Set())

    if (parentId === null) {
      setBreadcrumbs([{ id: 'root', name: '全部文件' }])
    } else {
      setBreadcrumbs((prev) => {
        // 点击面包屑中间项时截断
        const idx = prev.findIndex((b) => b.id === parentId)
        if (idx >= 0) {
          return prev.slice(0, idx + 1)
        }
        return [...prev, { id: parentId, name: name ?? '文件夹' }]
      })
    }
  }, [])

  const setActiveView = useCallback((view: FileCollectionView) => {
    setActiveViewState(view)
    setCurrentParentId(null)
    setPage(1)
    setKeyword('')
    setSelectedIds(new Set())

    const names: Record<FileCollectionView, string> = {
      all: '全部文件',
      recent: '最近使用',
      photos: '照片',
      office: 'Office 文档',
    }

    setBreadcrumbs([{ id: 'root', name: names[view] }])
  }, [])

  const navigateUp = useCallback(() => {
    if (breadcrumbs.length <= 1) return
    const parent = breadcrumbs[breadcrumbs.length - 2]
    navigateTo(parent.id === 'root' ? null : parent.id)
  }, [breadcrumbs, navigateTo])

  const refresh = useCallback(async () => {
    const base =
      activeView === 'all'
        ? { parentId: currentParentId, sort, page, pageSize, view: activeView }
        : activeView === 'recent'
          ? { sort, page, pageSize: RECENT_PREVIEW_PAGE_SIZE, view: activeView }
          : { sort, page, pageSize, view: activeView }
    const params: FileListParams = keyword ? { ...base, keyword } : base
    await fetchFiles(params)
    const info = await service.getStorageInfo()
    setStorageInfo(info)
  }, [activeView, fetchFiles, currentParentId, keyword, sort, page, pageSize, service])

  const createFolder = useCallback(
    async (name: string) => {
      try {
        await service.createFolder({ name, parentId: currentParentId })
        await refresh()
        onSuccess?.('文件夹创建成功')
      } catch (err) {
        onError?.(err instanceof Error ? err.message : '创建文件夹失败')
        throw err
      }
    },
    [service, currentParentId, refresh, onError, onSuccess],
  )

  const rename = useCallback(
    async (id: string, name: string) => {
      try {
        await service.rename({ id, name })
        await refresh()
        onSuccess?.('重命名成功')
      } catch (err) {
        onError?.(err instanceof Error ? err.message : '重命名失败')
        throw err
      }
    },
    [service, refresh, onError, onSuccess],
  )

  const deleteItems = useCallback(
    async (ids: readonly string[]) => {
      try {
        await service.delete(ids)
        setSelectedIds((prev) => {
          const next = new Set(prev)
          for (const id of ids) next.delete(id)
          return next
        })
        await refresh()
        onSuccess?.('删除成功')
      } catch (err) {
        onError?.(err instanceof Error ? err.message : '删除失败')
        throw err
      }
    },
    [service, refresh, onError, onSuccess],
  )

  const deleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return
    await deleteItems([...selectedIds])
  }, [selectedIds, deleteItems])

  const uploadFiles = useCallback(
    async (filesToUpload: readonly File[]) => {
      try {
        for (const file of filesToUpload) {
          await service.upload(file, currentParentId)
        }
        await refresh()
        onSuccess?.('上传成功')
      } catch (err) {
        onError?.(err instanceof Error ? err.message : '上传失败')
        throw err
      }
    },
    [service, currentParentId, refresh, onError, onSuccess],
  )

  const pullMagnet = useCallback(
    async (magnetLink: string, name?: string) => {
      try {
        await service.pullMagnet({
          magnetLink,
          parentId: currentParentId,
          ...(name ? { name } : {}),
        })
        await refresh()
        onSuccess?.('磁力链接已加入拉取队列')
      } catch (err) {
        onError?.(err instanceof Error ? err.message : '磁力链接拉取失败')
        throw err
      }
    },
    [service, currentParentId, refresh, onError, onSuccess],
  )

  const downloadFile = useCallback(
    async (id: string) => {
      try {
        const file = files.find((f) => f.id === id)
        if (!file) return
        const blob = await service.download(id)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)
        onSuccess?.('下载成功')
      } catch (err) {
        onError?.(err instanceof Error ? err.message : '下载失败')
        throw err
      }
    },
    [service, files, onError, onSuccess],
  )

  const copyItems = useCallback(
    async (ids: readonly string[]) => {
      try {
        await service.copy(ids)
        await refresh()
        onSuccess?.('复制成功')
      } catch (err) {
        onError?.(err instanceof Error ? err.message : '复制失败')
        throw err
      }
    },
    [service, refresh, onError, onSuccess],
  )

  const moveItems = useCallback(
    async (ids: readonly string[], targetParentId: string | null) => {
      try {
        await service.move({ ids, targetParentId })
        await refresh()
        onSuccess?.('移动成功')
      } catch (err) {
        onError?.(err instanceof Error ? err.message : '移动失败')
        throw err
      }
    },
    [service, refresh, onError, onSuccess],
  )

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === files.length) {
        return new Set()
      }
      return new Set(files.map((f) => f.id))
    })
  }, [files])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  return {
    files,
    loading,
    error,
    currentParentId,
    activeView,
    breadcrumbs,
    keyword,
    sort,
    selectedIds,
    pagination,
    storageInfo,
    navigateTo,
    setActiveView,
    navigateUp,
    setKeyword,
    setSort,
    setPage,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    createFolder,
    rename,
    deleteSelected,
    deleteItems,
    uploadFiles,
    pullMagnet,
    downloadFile,
    copyItems,
    moveItems,
    refresh,
  }
}
