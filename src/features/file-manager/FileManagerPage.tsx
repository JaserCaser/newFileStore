import {
  AlertCircle,
  CheckSquare,
  Clock3,
  Cloud,
  FileText,
  Folder,
  Grid,
  HardDrive,
  Image as ImageIcon,
  List,
  LogOut,
  Magnet,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatFileSize } from './api'
import type { FileCollectionView, FileItem, SortConfig } from './api/types'
import type { User } from '../auth/types'
import { FileServiceProvider } from './api/service-context'
import { Breadcrumb } from './components/Breadcrumb'
import { ConfirmDialog } from './components/ConfirmDialog'
import { CreateFolderDialog } from './components/CreateFolderDialog'
import { type ContextMenuAction, FileContextMenu } from './components/FileContextMenu'
import { EmptyState, FileCard, LoadingSkeleton, SortButton } from './components/FileListParts'
import { MagnetDialog } from './components/MagnetDialog'
import { MoveDialog } from './components/MoveDialog'
import { RenameDialog } from './components/RenameDialog'
import { UploadDialog } from './components/UploadDialog'
import { useFileManager } from './hooks/useFileManager'
import { ToastContainer } from './components/Toast'
import { useToast } from './components/use-toast'
import './components/Toast.css'
import './components/Dialog.css'
import './components/Breadcrumb.css'
import './components/FileCard.css'
import './components/ContextMenu.css'
import './components/UploadDialog.css'
import './FileManagerPage.css'
import './FileManagerPage.motion.css'

// ─── 文件管理器主组件 ───

type FileManagerPageProps = {
  readonly onLogout: () => void
  readonly onOpenAiImage?: (() => void) | undefined
  readonly onOpenProfile?: (() => void) | undefined
  readonly user?: User | null | undefined
}

type FileManagerInnerProps = {
  readonly onLogout: () => void
  readonly onOpenAiImage: () => void
  readonly onOpenProfile: () => void
  readonly user?: User | null | undefined
}

const VIEW_META: Record<
  FileCollectionView,
  {
    readonly title: string
    readonly description: string
    readonly icon: typeof Folder
  }
> = {
  all: {
    title: '全部文件',
    description: '浏览文件夹层级，上传、移动和整理你的全部云端资料。',
    icon: Folder,
  },
  recent: {
    title: '最近使用',
    description: '按更新时间汇总最近打开、上传或编辑过的文件，跨文件夹快速回到工作现场。',
    icon: Clock3,
  },
  photos: {
    title: '照片',
    description: '集中查看 JPG、PNG、WebP、HEIC 等图片文件，适合快速筛选素材和相册。',
    icon: ImageIcon,
  },
  office: {
    title: 'Office 文档',
    description: '聚合 Word、Excel、PowerPoint 文件，合同、报表和演示稿都在这里。',
    icon: FileText,
  },
}

const SYSTEM_AVATAR_VARIANTS = ['aurora', 'ember', 'sprout', 'tide'] as const

function getSystemAvatarVariant(user?: User | null) {
  const seed = user?.id ?? user?.account ?? user?.username ?? 'guest'
  let hash = 0

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 9973
  }

  return SYSTEM_AVATAR_VARIANTS[hash % SYSTEM_AVATAR_VARIANTS.length]
}

function getAvatarInitials(user?: User | null) {
  const source = user?.username ?? user?.account ?? 'U'
  return source.trim().slice(0, 2).toUpperCase()
}

function SystemAvatar({ user }: { readonly user?: User | null | undefined }) {
  const variant = getSystemAvatarVariant(user)

  return (
    <span className={`fm-system-avatar fm-system-avatar-${variant}`}>
      <span className="fm-system-avatar-orbit" />
      <span className="fm-system-avatar-face">
        <span className="fm-system-avatar-eye" />
        <span className="fm-system-avatar-eye" />
        <span className="fm-system-avatar-smile" />
      </span>
      <span className="fm-system-avatar-initials">{getAvatarInitials(user)}</span>
    </span>
  )
}

function FileManagerInner({ onLogout, onOpenAiImage, onOpenProfile, user }: FileManagerInnerProps) {
  const toast = useToast()

  const {
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
  } = useFileManager({ onError: toast.error, onSuccess: toast.success })

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchInput, setSearchInput] = useState('')

  // 弹窗状态
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showMagnetPull, setShowMagnetPull] = useState(false)
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null)
  const [deleteBatch, setDeleteBatch] = useState(false)
  const [moveTarget, setMoveTarget] = useState<FileItem | null>(null)

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    file: FileItem
  } | null>(null)

  // 搜索防抖
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => setKeyword(value), 300)
    },
    [setKeyword],
  )

  const handleNavigate = useCallback(
    (parentId: string | null, name?: string) => {
      setSearchInput('')
      navigateTo(parentId, name)
    },
    [navigateTo],
  )

  const handleSwitchView = useCallback(
    (view: FileCollectionView) => {
      setSearchInput('')
      setActiveView(view)
      setSort({
        field: view === 'recent' ? 'modifiedAt' : 'name',
        direction: view === 'recent' ? 'desc' : 'asc',
      })
    },
    [setActiveView, setSort],
  )

  const handleSortChange = useCallback(
    (nextSort: SortConfig) => {
      setSort(nextSort)
      setPage(1)
    },
    [setPage, setSort],
  )

  // 组件卸载时清理防抖定时器
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // 双击进入文件夹
  const handleOpenFile = useCallback(
    (file: FileItem) => {
      if (file.type === 'folder') {
        handleNavigate(file.id, file.name)
      }
    },
    [handleNavigate],
  )

  // 右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent, file: FileItem) => {
    setContextMenu({ x: e.clientX, y: e.clientY, file })
  }, [])

  // 右键菜单动作
  const handleContextAction = useCallback(
    (action: ContextMenuAction, file: FileItem) => {
      switch (action) {
        case 'rename':
          setRenameTarget(file)
          break
        case 'delete':
          setDeleteTarget(file)
          break
        case 'download':
          void downloadFile(file.id)
          break
        case 'move':
          setMoveTarget(file)
          break
        case 'copy':
          void copyItems([file.id])
          break
      }
    },
    [downloadFile, copyItems],
  )

  // 拖拽上传
  const handleDropZone = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer.files.length > 0) {
        void uploadFiles(Array.from(e.dataTransfer.files))
      }
    },
    [uploadFiles],
  )

  const selectedCount = selectedIds.size
  const hasCustomAvatar = Boolean(user?.avatar)
  const activeViewMeta = VIEW_META[activeView]
  const ViewIcon = activeViewMeta.icon
  const canCreateFolder = activeView === 'all'

  return (
    <div className="fm-layout" onDragOver={(e) => e.preventDefault()} onDrop={handleDropZone}>
      {/* 侧边栏 */}
      <aside className="fm-sidebar" aria-label="侧边栏">
        <div className="fm-brand">
          <Cloud className="fm-brand-icon" size={24} />
          <span>FileStore</span>
        </div>

        <nav className="fm-nav">
          <button
            className={`fm-nav-item ${activeView === 'all' && currentParentId === null && !keyword ? 'active' : ''}`}
            type="button"
            onClick={() => handleNavigate(null)}
          >
            <Folder size={18} />
            <span>全部文件</span>
          </button>
          <button
            className={`fm-nav-item ${activeView === 'recent' ? 'active' : ''}`}
            type="button"
            onClick={() => handleSwitchView('recent')}
          >
            <Clock3 size={18} />
            <span>最近使用</span>
          </button>
          <button
            className={`fm-nav-item ${activeView === 'photos' ? 'active' : ''}`}
            type="button"
            onClick={() => handleSwitchView('photos')}
          >
            <ImageIcon size={18} />
            <span>照片</span>
          </button>
          <button
            className={`fm-nav-item ${activeView === 'office' ? 'active' : ''}`}
            type="button"
            onClick={() => handleSwitchView('office')}
          >
            <FileText size={18} />
            <span>Office 文档</span>
          </button>
        </nav>

        <div className="fm-sidebar-bottom">
          <button className="fm-ai-entry" type="button" onClick={onOpenAiImage}>
            <span className="fm-ai-entry-icon">
              <Sparkles size={18} />
            </span>
            <span className="fm-ai-entry-copy">
              <span>AI 生图</span>
              <small>文字或图片生成新素材</small>
            </span>
          </button>

          {storageInfo && (
            <div className="fm-storage">
              <div className="fm-storage-info">
                <span>
                  <HardDrive size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                  存储空间
                </span>
                <span>
                  {formatFileSize(storageInfo.used)} / {formatFileSize(storageInfo.total)}
                </span>
              </div>
              <div className="fm-storage-bar">
                <div
                  className="fm-storage-progress"
                  style={{ width: String((storageInfo.used / storageInfo.total) * 100) + '%' }}
                />
              </div>
            </div>
          )}
          <button className="fm-nav-item" type="button" onClick={onLogout}>
            <LogOut size={18} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="fm-main">
        <header className="fm-header">
          <div className="fm-search">
            <Search size={18} className="fm-search-icon" />
            <input
              type="text"
              placeholder="搜索文件、文件夹…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <div className="fm-header-actions">
            <div className="fm-view-toggle">
              <button
                className={`fm-icon-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="列表视图"
                type="button"
              >
                <List size={18} />
              </button>
              <button
                className={`fm-icon-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="网格视图"
                type="button"
              >
                <Grid size={18} />
              </button>
            </div>
            <button className="fm-icon-btn" title="设置" type="button" disabled>
              <Settings size={18} />
            </button>
            <button
              className={`fm-avatar ${hasCustomAvatar ? 'has-custom-avatar' : 'has-system-avatar'}`}
              type="button"
              title={user?.username ? `${user.username} 的个人资料` : '个人资料'}
              aria-label="Open profile settings"
              onClick={onOpenProfile}
            >
              {user?.avatar ? (
                <img className="fm-avatar-img" src={user.avatar} alt="" />
              ) : (
                <SystemAvatar user={user} />
              )}
              <span className="fm-avatar-ring" />
            </button>
          </div>
        </header>

        <div className="fm-content">
          {/* 错误提示 */}
          {error && (
            <div className="fm-error-banner" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button className="fm-icon-btn-small" type="button" onClick={() => void refresh()}>
                重试
              </button>
            </div>
          )}

          {/* 面包屑 + 工具栏 */}
          <div className="fm-toolbar">
            <div className="fm-toolbar-left">
              <Breadcrumb items={breadcrumbs} onNavigate={(id) => handleNavigate(id)} />
            </div>
            <div className="fm-toolbar-actions">
              <SortButton field="name" label="名称" current={sort} onSort={handleSortChange} />
              <SortButton field="modifiedAt" label="日期" current={sort} onSort={handleSortChange} />
              <SortButton field="size" label="大小" current={sort} onSort={handleSortChange} />
              <button
                className="fm-btn fm-btn-secondary"
                type="button"
                onClick={() => setShowCreateFolder(true)}
                disabled={!canCreateFolder}
                title={canCreateFolder ? '新建文件夹' : '请在全部文件中创建文件夹'}
              >
                <Plus size={16} />
                新建文件夹
              </button>
              <button
                className="fm-btn fm-btn-secondary"
                type="button"
                onClick={() => setShowMagnetPull(true)}
              >
                <Magnet size={16} />
                磁力拉取
              </button>
              <button
                className="fm-btn fm-btn-primary"
                type="button"
                onClick={() => setShowUpload(true)}
              >
                <Upload size={16} />
                上传文件
              </button>
            </div>
          </div>

          {/* 批量操作栏 */}
          {selectedCount > 0 && (
            <div className="fm-selection-bar">
              <span>已选择 {selectedCount} 项</span>
              <button className="fm-btn fm-btn-secondary" type="button" onClick={toggleSelectAll}>
                {selectedCount === files.length ? '取消全选' : '全选'}
              </button>
              <button
                className="fm-btn fm-btn-secondary"
                type="button"
                onClick={() => void copyItems([...selectedIds])}
              >
                复制
              </button>
              <button
                className="fm-btn fm-btn-danger"
                type="button"
                onClick={() => setDeleteBatch(true)}
              >
                <Trash2 size={14} />
                删除
              </button>
              <button className="fm-btn fm-btn-secondary" type="button" onClick={clearSelection}>
                取消选择
              </button>
            </div>
          )}

          <section
            className={`fm-view-panel fm-view-panel-${activeView}`}
            aria-label={activeViewMeta.title}
          >
            <div className="fm-view-icon">
              <ViewIcon size={22} />
            </div>
            <div>
              <h1>{activeViewMeta.title}</h1>
              <p>{activeViewMeta.description}</p>
            </div>
          </section>

          {/* 文件列表 */}
          <div className={`fm-file-container ${viewMode}`}>
            {viewMode === 'list' && (
              <div className="fm-list-header">
                <div className="fm-col-name">
                  <button
                    className={`fm-checkbox ${selectedIds.size === files.length && files.length > 0 ? 'checked' : ''}`}
                    type="button"
                    onClick={toggleSelectAll}
                    aria-label="全选"
                  >
                    {selectedIds.size === files.length && files.length > 0 && (
                      <CheckSquare size={16} />
                    )}
                  </button>
                  名称
                </div>
                <div className="fm-col-date">修改时间</div>
                <div className="fm-col-size">大小</div>
                <div className="fm-col-action" />
              </div>
            )}

            {loading ? (
              <LoadingSkeleton viewMode={viewMode} />
            ) : files.length === 0 ? (
              <EmptyState keyword={keyword} view={activeView} />
            ) : (
              <div className="fm-files">
                {files.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    viewMode={viewMode}
                    selected={selectedIds.has(file.id)}
                    onSelect={toggleSelect}
                    onOpen={handleOpenFile}
                    onContextMenu={handleContextMenu}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="fm-pagination">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`fm-page-btn ${p === pagination.page ? 'active' : ''}`}
                  type="button"
                  onClick={() => {
                    setPage(p)
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 右键菜单 */}
      {contextMenu && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          fileName={contextMenu.file.name}
          onClose={() => setContextMenu(null)}
          onAction={(action) => handleContextAction(action, contextMenu.file)}
        />
      )}

      {/* 弹窗 */}
      {showCreateFolder && (
        <CreateFolderDialog onClose={() => setShowCreateFolder(false)} onConfirm={createFolder} />
      )}

      {showUpload && <UploadDialog onClose={() => setShowUpload(false)} onUpload={uploadFiles} />}

      {showMagnetPull && (
        <MagnetDialog onClose={() => setShowMagnetPull(false)} onPull={pullMagnet} />
      )}

      {renameTarget && (
        <RenameDialog
          currentName={renameTarget.name}
          onClose={() => setRenameTarget(null)}
          onConfirm={(name) => rename(renameTarget.id, name)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="确认删除"
          message={`确定要删除「${deleteTarget.name}」吗？此操作不可撤销。`}
          confirmLabel="删除"
          danger
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteItems([deleteTarget.id])}
        />
      )}

      {deleteBatch && (
        <ConfirmDialog
          title="批量删除"
          message={'确定要删除选中的 ' + String(selectedCount) + ' 个项目吗？此操作不可撤销。'}
          confirmLabel={'删除 ' + String(selectedCount) + ' 项'}
          danger
          onClose={() => setDeleteBatch(false)}
          onConfirm={deleteSelected}
        />
      )}

      {moveTarget && (
        <MoveDialog
          fileIds={[moveTarget.id]}
          onClose={() => setMoveTarget(null)}
          onConfirm={async (targetId) => {
            await moveItems([moveTarget.id], targetId)
          }}
        />
      )}

      {/* Toast 通知 */}
      <ToastContainer messages={toast.messages} onDismiss={toast.dismiss} />
    </div>
  )
}

/** 对外导出的页面组件，包裹 ServiceProvider */
export function FileManagerPage({
  onLogout,
  onOpenAiImage,
  onOpenProfile,
  user,
}: FileManagerPageProps) {
  return (
    <FileServiceProvider>
      <FileManagerInner
        onLogout={onLogout}
        onOpenAiImage={onOpenAiImage ?? (() => undefined)}
        onOpenProfile={onOpenProfile ?? (() => undefined)}
        user={user}
      />
    </FileServiceProvider>
  )
}
