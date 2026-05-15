import { FolderInput, X, Folder } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { FileItem } from '../api'
import { useFileService } from '../api/use-file-service'
import './Dialog.css'

type MoveDialogProps = {
  readonly fileIds: readonly string[]
  readonly onClose: () => void
  readonly onConfirm: (targetParentId: string | null) => Promise<void>
}

export function MoveDialog({ fileIds, onClose, onConfirm }: MoveDialogProps) {
  const [folders, setFolders] = useState<readonly FileItem[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const service = useFileService()

  useEffect(() => {
    void service.listFiles({ parentId: null }).then((res) => {
      setFolders(res.items.filter((f) => f.type === 'folder'))
    })
  }, [service])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleSubmit = useCallback(() => {
    if (submitting) return
    setSubmitting(true)
    void onConfirm(selectedFolder)
      .then(onClose)
      .finally(() => setSubmitting(false))
  }, [submitting, selectedFolder, onConfirm, onClose])

  return (
    <div className="fm-dialog-overlay" onClick={onClose}>
      <div
        className="fm-dialog"
        role="dialog"
        aria-labelledby="move-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fm-dialog-header">
          <div className="fm-dialog-title-row">
            <FolderInput size={20} />
            <h2 id="move-title">移动到…</h2>
          </div>
          <button className="fm-icon-btn" type="button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="fm-dialog-body">
          <div className="fm-move-list">
            <button
              className={`fm-move-item ${selectedFolder === null ? 'selected' : ''}`}
              type="button"
              onClick={() => setSelectedFolder(null)}
            >
              <Folder size={18} fill="currentColor" style={{ color: 'var(--color-folder)' }} />
              <span>全部文件（根目录）</span>
            </button>
            {folders
              .filter((f) => !fileIds.includes(f.id))
              .map((folder) => (
                <button
                  key={folder.id}
                  className={`fm-move-item ${selectedFolder === folder.id ? 'selected' : ''}`}
                  type="button"
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <Folder size={18} fill="currentColor" style={{ color: 'var(--color-folder)' }} />
                  <span>{folder.name}</span>
                </button>
              ))}
          </div>
        </div>

        <div className="fm-dialog-footer">
          <button className="fm-btn fm-btn-secondary" type="button" onClick={onClose}>
            取消
          </button>
          <button
            className="fm-btn fm-btn-primary"
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '移动中…' : '移动到此处'}
          </button>
        </div>
      </div>
    </div>
  )
}
