import { Edit3, X } from 'lucide-react'
import { type SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react'
import './Dialog.css'

type RenameDialogProps = {
  readonly currentName: string
  readonly onClose: () => void
  readonly onConfirm: (name: string) => Promise<void>
}

export function RenameDialog({ currentName, onClose, onConfirm }: RenameDialogProps) {
  const [name, setName] = useState(currentName)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // 选中文件名部分（不含扩展名）
    const dotIndex = currentName.lastIndexOf('.')
    const input = inputRef.current
    if (input) {
      input.focus()
      if (dotIndex > 0) {
        input.setSelectionRange(0, dotIndex)
      } else {
        input.select()
      }
    }
  }, [currentName])

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
      if (!trimmed || trimmed === currentName || submitting) return

      setSubmitting(true)
      setError(null)
      void onConfirm(trimmed)
        .then(onClose)
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : '重命名失败')
          setSubmitting(false)
        })
    },
    [name, currentName, submitting, onConfirm, onClose],
  )

  return (
    <div className="fm-dialog-overlay" onClick={onClose}>
      <div
        className="fm-dialog"
        role="dialog"
        aria-labelledby="rename-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fm-dialog-header">
          <div className="fm-dialog-title-row">
            <Edit3 size={20} />
            <h2 id="rename-title">重命名</h2>
          </div>
          <button className="fm-icon-btn" type="button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fm-dialog-body">
            <label className="fm-dialog-field">
              <span>新名称</span>
              <input
                ref={inputRef}
                type="text"
                value={name}
                placeholder="输入新名称"
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
              disabled={!name.trim() || name.trim() === currentName || submitting}
            >
              {submitting ? '重命名中…' : '确认'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
