import { Copy, Download, Edit3, FolderInput, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import './ContextMenu.css'

export type ContextMenuAction = 'rename' | 'delete' | 'download' | 'move' | 'copy'

type FileContextMenuProps = {
  readonly x: number
  readonly y: number
  readonly fileName: string
  readonly onClose: () => void
  readonly onAction: (action: ContextMenuAction) => void
}

export function FileContextMenu({ x, y, fileName, onClose, onAction }: FileContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // 确保菜单不超出视口
  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const el = menuRef.current

    if (rect.right > window.innerWidth) {
      el.style.left = String(window.innerWidth - rect.width - 8) + 'px'
    }
    if (rect.bottom > window.innerHeight) {
      el.style.top = String(window.innerHeight - rect.height - 8) + 'px'
    }
  }, [])

  const handleAction = useCallback(
    (action: ContextMenuAction) => {
      onAction(action)
      onClose()
    },
    [onAction, onClose],
  )

  return (
    <div
      ref={menuRef}
      className="fm-context-menu"
      style={{ left: x, top: y }}
      role="menu"
      aria-label={`${fileName} 的操作菜单`}
    >
      <div className="fm-context-menu-header">{fileName}</div>

      <button
        className="fm-context-menu-item"
        type="button"
        role="menuitem"
        onClick={() => handleAction('rename')}
      >
        <Edit3 size={16} />
        <span>重命名</span>
      </button>

      <button
        className="fm-context-menu-item"
        type="button"
        role="menuitem"
        onClick={() => handleAction('download')}
      >
        <Download size={16} />
        <span>下载</span>
      </button>

      <button
        className="fm-context-menu-item"
        type="button"
        role="menuitem"
        onClick={() => handleAction('copy')}
      >
        <Copy size={16} />
        <span>复制</span>
      </button>

      <button
        className="fm-context-menu-item"
        type="button"
        role="menuitem"
        onClick={() => handleAction('move')}
      >
        <FolderInput size={16} />
        <span>移动到…</span>
      </button>

      <div className="fm-context-menu-divider" />

      <button
        className="fm-context-menu-item danger"
        type="button"
        role="menuitem"
        onClick={() => handleAction('delete')}
      >
        <Trash2 size={16} />
        <span>删除</span>
      </button>
    </div>
  )
}
