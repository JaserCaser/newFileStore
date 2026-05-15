import { CheckCircle2, Magnet, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import './Dialog.css'

type MagnetDialogProps = {
  readonly onClose: () => void
  readonly onPull: (magnetLink: string, name?: string) => Promise<void>
}

function isValidMagnetLink(value: string): boolean {
  return /^magnet:\?xt=urn:btih:[a-z0-9]{32,40}(?:&.*)?$/i.test(value.trim())
}

function getMagnetDisplayName(value: string): string {
  const displayName = /(?:[?&])dn=([^&]+)/i.exec(value)?.[1]
  if (!displayName) return ''

  try {
    return decodeURIComponent(displayName.replace(/\+/g, ' ')).trim()
  } catch {
    return displayName.replace(/\+/g, ' ').trim()
  }
}

export function MagnetDialog({ onClose, onPull }: MagnetDialogProps) {
  const [magnetLink, setMagnetLink] = useState('')
  const [name, setName] = useState('')
  const [nameEdited, setNameEdited] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedLink = magnetLink.trim()
  const linkIsValid = isValidMagnetLink(trimmedLink)
  const suggestedName = useMemo(
    () => (linkIsValid ? getMagnetDisplayName(trimmedLink) : ''),
    [linkIsValid, trimmedLink],
  )
  const canSubmit = linkIsValid && !submitting
  const displayName = nameEdited ? name : suggestedName

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose, submitting])

  const handleSubmit = useCallback(
    (event: React.SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!canSubmit) {
        setError('请输入有效的磁力链接')
        return
      }

      setSubmitting(true)
      setError(null)
      void onPull(trimmedLink, displayName.trim() || undefined)
        .then(() => {
          setDone(true)
          setTimeout(onClose, 800)
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : '磁力链接拉取失败')
        })
        .finally(() => setSubmitting(false))
    },
    [canSubmit, displayName, onClose, onPull, trimmedLink],
  )

  return (
    <div className="fm-dialog-overlay" onClick={submitting ? undefined : onClose}>
      <form
        className="fm-dialog fm-dialog-magnet"
        role="dialog"
        aria-labelledby="magnet-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="fm-dialog-header">
          <div className="fm-dialog-title-row">
            <Magnet size={20} />
            <h2 id="magnet-title">磁力链接拉取</h2>
          </div>
          {!submitting && (
            <button className="fm-icon-btn" type="button" onClick={onClose} aria-label="关闭">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="fm-dialog-body">
          {done ? (
            <div className="fm-upload-done">
              <CheckCircle2 size={48} className="text-success" />
              <p>已加入拉取队列</p>
            </div>
          ) : (
            <div className="fm-magnet-form">
              <label className="fm-dialog-field">
                <span>磁力链接</span>
                <textarea
                  value={magnetLink}
                  onChange={(event) => {
                    setMagnetLink(event.target.value)
                    setError(null)
                  }}
                  placeholder="magnet:?xt=urn:btih:..."
                  rows={4}
                  autoFocus
                />
              </label>
              <label className="fm-dialog-field">
                <span>保存名称</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => {
                    setNameEdited(true)
                    setName(event.target.value)
                  }}
                  placeholder="自动识别"
                />
              </label>
              {error && <p className="fm-dialog-error">{error}</p>}
            </div>
          )}
        </div>

        {!done && (
          <div className="fm-dialog-footer">
            <button
              className="fm-btn fm-btn-secondary"
              type="button"
              onClick={onClose}
              disabled={submitting}
            >
              取消
            </button>
            <button className="fm-btn fm-btn-primary" type="submit" disabled={!canSubmit}>
              {submitting ? '拉取中…' : '开始拉取'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
