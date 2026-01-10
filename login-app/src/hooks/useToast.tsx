import { useState, useCallback } from 'react'
import { Toast, ToastType } from '../components/Toast'

interface ToastMessage {
  id: string
  message: string
  type: ToastType
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const ToastContainer = () => (
    <div className="fixed top-6 right-6 z-50 space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  )

  return { showToast, ToastContainer }
}
