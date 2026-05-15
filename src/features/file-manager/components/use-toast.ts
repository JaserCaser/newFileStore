import { useCallback, useState } from 'react'
import type { ToastMessage, ToastType } from './Toast'

export function useToast() {
  const [messages, setMessages] = useState<readonly ToastMessage[]>([])

  const dismiss = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const addToast = useCallback((type: ToastType, text: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    setMessages((prev) => [...prev, { id, type, text }])
  }, [])

  const success = useCallback((text: string) => addToast('success', text), [addToast])
  const error = useCallback((text: string) => addToast('error', text), [addToast])
  const info = useCallback((text: string) => addToast('info', text), [addToast])

  return { messages, dismiss, success, error, info }
}
