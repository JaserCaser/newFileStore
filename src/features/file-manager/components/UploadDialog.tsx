import { Upload, X, FileUp, CheckCircle2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatFileSize } from '../api'
import './Dialog.css'
import './UploadDialog.css'

type UploadDialogProps = {
  readonly onClose: () => void
  readonly onUpload: (files: readonly File[]) => Promise<void>
}

export function UploadDialog({ onClose, onUpload }: UploadDialogProps) {
  const [files, setFiles] = useState<readonly File[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !uploading) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose, uploading])

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + '-' + String(f.size)))
      const incoming = Array.from(newFiles).filter(
        (f) => !existing.has(f.name + '-' + String(f.size)),
      )
      return [...prev, ...incoming]
    })
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files)
      }
    },
    [addFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }, [])

  const handleUpload = useCallback(() => {
    if (files.length === 0 || uploading) return
    setUploading(true)
    void onUpload(files)
      .then(() => {
        setDone(true)
        setTimeout(onClose, 800)
      })
      .finally(() => setUploading(false))
  }, [files, uploading, onUpload, onClose])

  return (
    <div className="fm-dialog-overlay" onClick={uploading ? undefined : onClose}>
      <div
        className="fm-dialog"
        role="dialog"
        aria-labelledby="upload-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fm-dialog-header">
          <div className="fm-dialog-title-row">
            <Upload size={20} />
            <h2 id="upload-title">上传文件</h2>
          </div>
          {!uploading && (
            <button className="fm-icon-btn" type="button" onClick={onClose} aria-label="关闭">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="fm-dialog-body">
          {done ? (
            <div className="fm-upload-done">
              <CheckCircle2 size={48} className="text-success" />
              <p>上传完成</p>
            </div>
          ) : (
            <>
              <div
                className={`fm-upload-dropzone ${dragging ? 'dragging' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
                }}
              >
                <FileUp size={32} />
                <p className="fm-upload-hint">拖拽文件到此处，或点击选择文件</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files)
                  }}
                />
              </div>

              {files.length > 0 && (
                <ul className="fm-upload-list">
                  {files.map((file, i) => (
                    <li key={file.name + '-' + String(file.size)} className="fm-upload-item">
                      <span className="fm-upload-item-name">{file.name}</span>
                      <span className="fm-upload-item-size">{formatFileSize(file.size)}</span>
                      {!uploading && (
                        <button
                          className="fm-icon-btn-small"
                          type="button"
                          onClick={() => removeFile(i)}
                          aria-label={`移除 ${file.name}`}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {!done && (
          <div className="fm-dialog-footer">
            <button
              className="fm-btn fm-btn-secondary"
              type="button"
              onClick={onClose}
              disabled={uploading}
            >
              取消
            </button>
            <button
              className="fm-btn fm-btn-primary"
              type="button"
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
            >
              {uploading ? '上传中…' : '上传 ' + String(files.length) + ' 个文件'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
