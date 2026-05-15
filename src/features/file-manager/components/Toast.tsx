import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export type ToastMessage = {
  readonly id: string
  readonly type: ToastType
  readonly text: string
}

type ToastProps = {
  readonly message: ToastMessage
  readonly onDismiss: (id: string) => void
}

const ICONS: Record<ToastType, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const COLORS: Record<ToastType, string> = {
  success: 'toast-success',
  error: 'toast-error',
  info: 'toast-info',
}

function ToastItem({ message, onDismiss }: ToastProps) {
  const Icon = ICONS[message.type]

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(message.id), 4000)
    return () => clearTimeout(timer)
  }, [message.id, onDismiss])

  return (
    <div className={`toast ${COLORS[message.type]}`} role="status">
      <Icon size={18} />
      <span className="toast-text">{message.text}</span>
      <button
        className="toast-close"
        type="button"
        onClick={() => onDismiss(message.id)}
        aria-label="关闭"
      >
        <X size={14} />
      </button>
    </div>
  )
}

type ToastContainerProps = {
  readonly messages: readonly ToastMessage[]
  readonly onDismiss: (id: string) => void
}

export function ToastContainer({ messages, onDismiss }: ToastContainerProps) {
  if (messages.length === 0) return null

  return (
    <div className="toast-container" aria-live="polite">
      {messages.map((msg) => (
        <ToastItem key={msg.id} message={msg} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
