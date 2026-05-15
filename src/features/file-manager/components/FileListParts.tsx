import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileCode2,
  FileQuestionMark,
  FileSpreadsheet,
  FileText,
  Folder,
  Image as ImageIcon,
  MoreVertical,
  Music2,
  Presentation,
  Video,
} from 'lucide-react'
import { useCallback, type MouseEvent } from 'react'
import { formatFileSize } from '../api'
import type { FileCollectionView, FileItem, FileType, SortConfig, SortField } from '../api/types'

type FileVisual = {
  readonly icon: typeof FileIcon
  readonly tone: string
  readonly label: string
}

const TYPE_VISUALS: Record<FileType, FileVisual> = {
  folder: { icon: Folder, tone: 'folder', label: 'DIR' },
  document: { icon: FileText, tone: 'document', label: 'DOC' },
  image: { icon: ImageIcon, tone: 'image', label: 'IMG' },
  video: { icon: Video, tone: 'video', label: 'MOV' },
  audio: { icon: Music2, tone: 'audio', label: 'AUD' },
  archive: { icon: FileArchive, tone: 'archive', label: 'ZIP' },
  other: { icon: FileQuestionMark, tone: 'other', label: 'FILE' },
}

const EXTENSION_VISUALS: Record<string, FileVisual> = {
  pdf: { icon: FileText, tone: 'pdf', label: 'PDF' },
  doc: { icon: FileText, tone: 'word', label: 'DOC' },
  docx: { icon: FileText, tone: 'word', label: 'DOCX' },
  xls: { icon: FileSpreadsheet, tone: 'sheet', label: 'XLS' },
  xlsx: { icon: FileSpreadsheet, tone: 'sheet', label: 'XLSX' },
  csv: { icon: FileSpreadsheet, tone: 'sheet', label: 'CSV' },
  ppt: { icon: Presentation, tone: 'slide', label: 'PPT' },
  pptx: { icon: Presentation, tone: 'slide', label: 'PPTX' },
  txt: { icon: FileText, tone: 'text', label: 'TXT' },
  md: { icon: FileText, tone: 'text', label: 'MD' },
  json: { icon: FileCode2, tone: 'code', label: 'JSON' },
  js: { icon: FileCode2, tone: 'code', label: 'JS' },
  jsx: { icon: FileCode2, tone: 'code', label: 'JSX' },
  ts: { icon: FileCode2, tone: 'code', label: 'TS' },
  tsx: { icon: FileCode2, tone: 'code', label: 'TSX' },
  html: { icon: FileCode2, tone: 'code', label: 'HTML' },
  css: { icon: FileCode2, tone: 'code', label: 'CSS' },
  zip: { icon: FileArchive, tone: 'archive', label: 'ZIP' },
  rar: { icon: FileArchive, tone: 'archive', label: 'RAR' },
  '7z': { icon: FileArchive, tone: 'archive', label: '7Z' },
  mp3: { icon: FileAudio, tone: 'audio', label: 'MP3' },
  wav: { icon: FileAudio, tone: 'audio', label: 'WAV' },
  flac: { icon: FileAudio, tone: 'audio', label: 'FLAC' },
  mp4: { icon: Video, tone: 'video', label: 'MP4' },
  mov: { icon: Video, tone: 'video', label: 'MOV' },
  webm: { icon: Video, tone: 'video', label: 'WEBM' },
  jpg: { icon: ImageIcon, tone: 'image', label: 'JPG' },
  jpeg: { icon: ImageIcon, tone: 'image', label: 'JPG' },
  png: { icon: ImageIcon, tone: 'image', label: 'PNG' },
  webp: { icon: ImageIcon, tone: 'image', label: 'WEBP' },
  heic: { icon: ImageIcon, tone: 'image', label: 'HEIC' },
  gif: { icon: ImageIcon, tone: 'image', label: 'GIF' },
}

type SortButtonProps = {
  readonly field: SortField
  readonly label: string
  readonly current: SortConfig
  readonly onSort: (config: SortConfig) => void
}

type FileCardProps = {
  readonly file: FileItem
  readonly viewMode: 'grid' | 'list'
  readonly selected: boolean
  readonly onSelect: (id: string) => void
  readonly onOpen: (file: FileItem) => void
  readonly onContextMenu: (event: MouseEvent, file: FileItem) => void
}

function getExtension(fileName: string) {
  const match = /\.([^.]+)$/.exec(fileName)
  return match?.[1]?.toLowerCase() ?? ''
}

function getFileVisual(file: FileItem): FileVisual {
  if (file.type === 'folder') return TYPE_VISUALS.folder

  const extension = getExtension(file.name)
  return EXTENSION_VISUALS[extension] ?? TYPE_VISUALS[file.type]
}

function FileBadge({ file, compact = false }: { readonly file: FileItem; readonly compact?: boolean }) {
  const visual = getFileVisual(file)
  const Icon = visual.icon
  const isFolder = file.type === 'folder'

  return (
    <span className={`fc-badge fc-badge-${visual.tone} ${compact ? 'compact' : ''}`}>
      <span className="fc-badge-glow" />
      <Icon
        size={compact ? 18 : 34}
        className="fc-icon"
        strokeWidth={isFolder ? 1.8 : 2}
        {...(isFolder ? { fill: 'currentColor' } : {})}
      />
      {!compact && <span className="fc-badge-label">{visual.label}</span>}
    </span>
  )
}

export function SortButton({ field, label, current, onSort }: SortButtonProps) {
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

export function FileCard({
  file,
  viewMode,
  selected,
  onSelect,
  onOpen,
  onContextMenu,
}: FileCardProps) {
  const badge = <FileBadge file={file} compact={viewMode === 'list'} />

  const handleContextMenu = useCallback(
    (event: MouseEvent) => {
      event.preventDefault()
      onContextMenu(event, file)
    },
    [onContextMenu, file],
  )

  const handleDoubleClick = useCallback(() => {
    onOpen(file)
  }, [onOpen, file])

  const handleCheckbox = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation()
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
          {badge}
          <span className="fm-col-name-text">{file.name}</span>
        </div>
        <div className="fm-col-date">{new Date(file.modifiedAt).toLocaleDateString('zh-CN')}</div>
        <div className="fm-col-size">{file.type === 'folder' ? '-' : formatFileSize(file.size)}</div>
        <div className="fm-col-action">
          <button
            className="fm-icon-btn-small"
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onContextMenu(event, file)
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
      <div className="fc-preview">{badge}</div>
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

const EMPTY_COPY: Record<FileCollectionView, { readonly title: string; readonly hint: string }> = {
  all: {
    title: '此文件夹为空',
    hint: '上传文件或创建新文件夹开始使用',
  },
  recent: {
    title: '暂无最近使用的文件',
    hint: '上传、复制或重命名文件后会出现在这里',
  },
  photos: {
    title: '暂无照片',
    hint: '上传 JPG、PNG、WebP 或 HEIC 图片后会显示在这里',
  },
  office: {
    title: '暂无 Office 文档',
    hint: '上传 Word、Excel 或 PowerPoint 文件后会显示在这里',
  },
}

export function EmptyState({
  keyword,
  view = 'all',
}: {
  readonly keyword?: string
  readonly view?: FileCollectionView
}) {
  const copy = EMPTY_COPY[view]

  return (
    <div className="fm-empty">
      <Folder size={64} className="fm-empty-icon" />
      <p className="fm-empty-title">{keyword ? '没有找到匹配的文件' : copy.title}</p>
      <p className="fm-empty-hint">{keyword ? '尝试其他关键字或切换到其他分类' : copy.hint}</p>
    </div>
  )
}

export function LoadingSkeleton({ viewMode }: { readonly viewMode: 'grid' | 'list' }) {
  const count = viewMode === 'grid' ? 8 : 6

  return (
    <div className={`fm-files ${viewMode}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={viewMode === 'grid' ? 'fm-skeleton-card' : 'fm-skeleton-row'}>
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
