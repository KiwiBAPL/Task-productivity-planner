import { useEffect, useState } from 'react'
// #region agent log
fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Toast.tsx:1',message:'Toast component loading',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
// #endregion

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const typeConfig = {
    success: {
      bg: 'bg-auro-success/20',
      border: 'border-auro-success/30',
      text: 'text-auro-success',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-auro-danger/20',
      border: 'border-auro-danger/30',
      text: 'text-auro-danger',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-auro-info/20',
      border: 'border-auro-info/30',
      text: 'text-auro-info',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-auro-warning/20',
      border: 'border-auro-warning/30',
      text: 'text-auro-warning',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  }

  const config = typeConfig[type]

  return (
    <div
      className={`
        glass-card p-4 rounded-lg border
        ${config.bg} ${config.border} ${config.text}
        transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
        shadow-[0_10px_26px_-16px_rgba(0,0,0,0.55)]
        min-w-[280px] max-w-md
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>
        <p className="text-sm font-medium flex-1 leading-relaxed">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
