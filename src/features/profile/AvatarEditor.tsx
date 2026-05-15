import { Camera, FolderOpen, Link, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type AvatarEditorProps = {
  readonly value: string
  readonly initials: string
  readonly onChange: (value: string) => void
}

const MAX_FILE_SIZE = 2 * 1024 * 1024

export function AvatarEditor({ value, initials, onChange }: AvatarEditorProps) {
  const [open, setOpen] = useState(false)
  const [urlInputVisible, setUrlInputVisible] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')
  const [imgError, setImgError] = useState(false)
  const [fileError, setFileError] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setImgError(false)
  }, [value])

  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false)
        setUrlInputVisible(false)
        setFileError('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const displaySrc = imgError ? '' : resolveDisplaySrc(value)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setFileError('图片不能超过 2MB，请选择更小的文件')
      event.target.value = ''
      return
    }
    setFileError('')
    const reader = new FileReader()
    reader.onload = () => {
      onChange(reader.result as string)
      setOpen(false)
    }
    reader.readAsDataURL(file)
  }

  const handleUrlChange = (val: string) => {
    setUrlDraft(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onChange(val), 600)
  }

  const handleRemove = () => {
    onChange('')
    setUrlDraft('')
    setOpen(false)
  }

  return (
    <div className="avatar-editor" ref={wrapRef}>
      <button
        type="button"
        className="profile-avatar-wrap avatar-editor-trigger"
        aria-label="修改头像"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {displaySrc ? (
          <img
            className="profile-avatar-img"
            src={displaySrc}
            alt="User avatar"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="profile-avatar-fallback">{initials}</div>
        )}
        <span className="profile-camera" aria-hidden="true">
          <Camera size={18} />
        </span>
      </button>

      {open && (
        <div className="avatar-picker-popover" role="menu">
          <button
            type="button"
            className="avatar-picker-item"
            onClick={() => fileInputRef.current?.click()}
          >
            <FolderOpen size={16} />
            上传本地照片
          </button>
          <button
            type="button"
            className="avatar-picker-item"
            onClick={() => setUrlInputVisible((prev) => !prev)}
          >
            <Link size={16} />
            输入图片 URL
          </button>
          {value && (
            <button type="button" className="avatar-picker-item avatar-picker-danger" onClick={handleRemove}>
              <Trash2 size={16} />
              移除头像
            </button>
          )}
          {urlInputVisible && (
            <div className="avatar-picker-url">
              <input
                type="url"
                placeholder="https://..."
                value={urlDraft}
                onChange={(e) => handleUrlChange(e.target.value)}
                autoFocus
              />
            </div>
          )}
          {fileError && <p className="avatar-picker-error">{fileError}</p>}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="avatar-file-input"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}

function resolveDisplaySrc(value: string): string {
  const url = value.trim()
  const norm = url.toLowerCase()
  if (norm.startsWith('data:image/')) return url
  if (norm.startsWith('http://') || norm.startsWith('https://')) return url
  return ''
}
