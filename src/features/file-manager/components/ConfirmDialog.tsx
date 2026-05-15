import { AlertTriangle, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import './Dialog.css'

type ConfirmDialogProps = {
  readonly title: string
  readonly message: string
  readonly confirmLabel?: string
  readonly danger?: boolean
  readonly onClose: () => void
  readonly onConfirm: () => Promise<void>
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = '确认',
  danger = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleConfirm = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
      setSubmitting(false)
    }
  }, [submitting, onConfirm, onClose])

  return (
    <div className="fm-dialog-overlay" onClick={onClose}>
      <div
        className="fm-dialog fm-dialog-sm"
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fm-dialog-header">
          <div className="fm-dialog-title-row">
            {danger && <AlertTriangle size={20} className="text-danger" />}
            <h2 id="confirm-title">{title}</h2>
          </div>
          <button className="fm-icon-btn" type="button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="fm-dialog-body">
          <p id="confirm-message" className="fm-dialog-message">
            {message}
          </p>
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
            className={`fm-btn ${danger ? 'fm-btn-danger' : 'fm-btn-primary'}`}
            type="button"
            onClick={() => void handleConfirm()}
            disabled={submitting}
          >
            {submitting ? '处理中…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
