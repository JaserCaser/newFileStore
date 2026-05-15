import { FolderPlus, X } from 'lucide-react'
import { type SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react'
import './Dialog.css'

type CreateFolderDialogProps = {
  readonly onClose: () => void
  readonly onConfirm: (name: string) => Promise<void>
}

export function CreateFolderDialog({ onClose, onConfirm }: CreateFolderDialogProps) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleSubmit = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      const trimmed = name.trim()
      if (!trimmed || submitting) return

      setSubmitting(true)
      setError(null)
      void onConfirm(trimmed)
        .then(onClose)
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : '创建文件夹失败')
          setSubmitting(false)
        })
    },
    [name, submitting, onConfirm, onClose],
  )

  return (
    <div className="fm-dialog-overlay" onClick={onClose}>
      <div
        className="fm-dialog"
        role="dialog"
        aria-labelledby="create-folder-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fm-dialog-header">
          <div className="fm-dialog-title-row">
            <FolderPlus size={20} />
            <h2 id="create-folder-title">新建文件夹</h2>
          </div>
          <button className="fm-icon-btn" type="button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fm-dialog-body">
            <label className="fm-dialog-field">
              <span>文件夹名称</span>
              <input
                ref={inputRef}
                type="text"
                value={name}
                placeholder="输入文件夹名称"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            {error && (
              <p className="fm-dialog-error" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="fm-dialog-footer">
            <button className="fm-btn fm-btn-secondary" type="button" onClick={onClose}>
              取消
            </button>
            <button
              className="fm-btn fm-btn-primary"
              type="submit"
              disabled={!name.trim() || submitting}
            >
              {submitting ? '创建中…' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
