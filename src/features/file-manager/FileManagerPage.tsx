import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckSquare,
  Cloud,
  FileArchive,
  FileAudio,
  File as FileIcon,
  Folder,
  Grid,
  HardDrive,
  Image as ImageIcon,
  List,
  LogOut,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Trash2,
  Upload,
  Video,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatFileSize } from './api'
import type { FileItem, FileType, SortConfig, SortField } from './api/types'
import { FileServiceProvider } from './api/service-context'
import { Breadcrumb } from './components/Breadcrumb'
import { ConfirmDialog } from './components/ConfirmDialog'
import { CreateFolderDialog } from './components/CreateFolderDialog'
import { type ContextMenuAction, FileContextMenu } from './components/FileContextMenu'
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

// ─── 图标映射 ───

const FILE_ICONS: Record<FileType, typeof FileIcon> = {
  folder: Folder,
  document: FileIcon,
  image: ImageIcon,
  video: Video,
  audio: FileAudio,
  archive: FileArchive,
  other: FileIcon,
}

const FILE_COLORS: Record<FileType, string> = {
  folder: 'folder',
  document: 'document',
  image: 'image',
  video: 'video',
  audio: 'audio',
  archive: 'archive',
  other: 'document',
}

function getFileIcon(type: FileType, size: number) {
  const Icon = FILE_ICONS[type]
  const colorClass = FILE_COLORS[type]
  if (type === 'folder') {
    return <Icon size={size} className={`fc-icon ${colorClass}`} fill="currentColor" />
  }
  return <Icon size={size} className={`fc-icon ${colorClass}`} />
}

// ─── 排序按钮 ───

type SortButtonProps = {
  readonly field: SortField
  readonly label: string
  readonly current: SortConfig
  readonly onSort: (config: SortConfig) => void
}

function SortButton({ field, label, current, onSort }: SortButtonProps) {
  const isActive = current.field === field
  const direction = isActive ? current.direction : 'asc'

  return (
    <button
      className={`fm-sort-btn ${isActive ? 'active' : ''}`}
      type="button"
      onClick={() =>
        onSort({
          field,
          direction: direction === 'asc' ? 'desc' : 'asc',
        })
      }
    >
      {label}
      {isActive && (direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
    </button>
  )
}

// ─── 文件卡片 ───

type FileCardProps = {
  readonly file: FileItem
  readonly viewMode: 'grid' | 'list'
  readonly selected: boolean
  readonly onSelect: (id: string) => void
  readonly onOpen: (file: FileItem) => void
  readonly onContextMenu: (e: React.MouseEvent, file: FileItem) => void
}

function FileCard({ file, viewMode, selected, onSelect, onOpen, onContextMenu }: FileCardProps) {
  const icon = getFileIcon(file.type, viewMode === 'grid' ? 32 : 20)

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      onContextMenu(e, file)
    },
    [onContextMenu, file],
  )

  const handleDoubleClick = useCallback(() => {
    onOpen(file)
  }, [onOpen, file])

  const handleCheckbox = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onSelect(file.id)
    },
    [onSelect, file.id],
  )

  if (viewMode === 'list') {
    return (
      <div
        className={`fm-list-row ${selected ? 'selected' : ''}`}
        tabIndex={0}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        <div className="fm-col-name">
          <button
            className={`fm-checkbox ${selected ? 'checked' : ''}`}
            type="button"
            onClick={handleCheckbox}
            aria-label={selected ? '取消选择' : '选择'}
          >
            {selected && <CheckSquare size={16} />}
          </button>
          {icon}
          <span className="fm-col-name-text">{file.name}</span>
        </div>
        <div className="fm-col-date">{new Date(file.modifiedAt).toLocaleDateString('zh-CN')}</div>
        <div className="fm-col-size">
          {file.type === 'folder' ? '-' : formatFileSize(file.size)}
        </div>
        <div className="fm-col-action">
          <button
            className="fm-icon-btn-small"
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onContextMenu(e, file)
            }}
            aria-label={`${file.name} 的操作`}
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`fm-grid-card ${selected ? 'selected' : ''}`}
      tabIndex={0}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      <button
        className={`fm-checkbox ${selected ? 'checked' : ''}`}
        type="button"
        onClick={handleCheckbox}
        aria-label={selected ? '取消选择' : '选择'}
      >
        {selected && <CheckSquare size={16} />}
      </button>
      <div className="fc-preview">{icon}</div>
      <div className="fc-info">
        <span className="fc-name" title={file.name}>
          {file.name}
        </span>
        <span className="fc-meta">
          {new Date(file.modifiedAt).toLocaleDateString('zh-CN')}
          {file.type !== 'folder' ? ` · ${formatFileSize(file.size)}` : ''}
        </span>
      </div>
    </div>
  )
}

// ─── 空状态 ───

function EmptyState({ keyword }: { readonly keyword?: string }) {
  return (
    <div className="fm-empty">
      <Folder size={64} className="fm-empty-icon" />
      <p className="fm-empty-title">{keyword ? '没有找到匹配的文件' : '此文件夹为空'}</p>
      <p className="fm-empty-hint">
        {keyword ? '尝试其他关键字' : '上传文件或创建新文件夹开始使用'}
      </p>
    </div>
  )
}

// ─── 加载骨架 ───

function LoadingSkeleton({ viewMode }: { readonly viewMode: 'grid' | 'list' }) {
  const count = viewMode === 'grid' ? 8 : 6
  return (
    <div className={`fm-files ${viewMode}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={viewMode === 'grid' ? 'fm-skeleton-card' : 'fm-skeleton-row'}>
          {viewMode === 'grid' && (
            <>
              <div className="fm-skeleton-preview" />
              <div className="fm-skeleton-text-group">
                <div className="fm-skeleton-text" />
                <div className="fm-skeleton-text fm-skeleton-text-short" />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── 文件管理器主组件 ───

function FileManagerInner({ onLogout }: { readonly onLogout: () => void }) {
  const toast = useToast()

  const {
    files,
    loading,
    error,
    currentParentId,
    breadcrumbs,
    keyword,
    sort,
    selectedIds,
    pagination,
    storageInfo,
    navigateTo,
    setKeyword,
    setSort,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    createFolder,
    rename,
    deleteSelected,
    deleteItems,
    uploadFiles,
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
        navigateTo(file.id, file.name)
      }
    },
    [navigateTo],
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
            className={`fm-nav-item ${currentParentId === null && !keyword ? 'active' : ''}`}
            type="button"
            onClick={() => navigateTo(null)}
          >
            <Folder size={18} />
            <span>全部文件</span>
          </button>
          <button className="fm-nav-item" type="button" disabled>
            <FileIcon size={18} />
            <span>最近使用</span>
          </button>
          <button className="fm-nav-item" type="button" disabled>
            <ImageIcon size={18} />
            <span>照片</span>
          </button>
        </nav>

        <div className="fm-sidebar-bottom">
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
            <div className="fm-avatar" aria-label="用户头像">
              U
            </div>
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
              <Breadcrumb items={breadcrumbs} onNavigate={(id) => navigateTo(id)} />
            </div>
            <div className="fm-toolbar-actions">
              <SortButton field="name" label="名称" current={sort} onSort={setSort} />
              <SortButton field="modifiedAt" label="日期" current={sort} onSort={setSort} />
              <SortButton field="size" label="大小" current={sort} onSort={setSort} />
              <button
                className="fm-btn fm-btn-secondary"
                type="button"
                onClick={() => setShowCreateFolder(true)}
              >
                <Plus size={16} />
                新建文件夹
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
              <EmptyState keyword={keyword} />
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
                    /* setPage(p) — 需要从 hook 暴露 */
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
export function FileManagerPage({ onLogout }: { readonly onLogout: () => void }) {
  return (
    <FileServiceProvider>
      <FileManagerInner onLogout={onLogout} />
    </FileServiceProvider>
  )
}
