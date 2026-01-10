// #region agent log
fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SkeletonLoader.tsx:1',message:'SkeletonLoader loading',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
// #endregion

interface SkeletonLoaderProps {
  className?: string
}

export function SkeletonLoader({ className = '' }: SkeletonLoaderProps) {
  return (
    <div
      className={`animate-pulse bg-auro-surface2 rounded-xl ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function SkeletonCard({ className = '' }: SkeletonLoaderProps) {
  return (
    <div
      className={`glass-card p-6 rounded-2xl space-y-4 ${className}`}
      role="status"
      aria-label="Loading content"
    >
      <div className="flex items-center gap-4">
        <SkeletonLoader className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader className="h-4 w-3/4" />
          <SkeletonLoader className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonLoader className="h-3 w-full" />
        <SkeletonLoader className="h-3 w-5/6" />
        <SkeletonLoader className="h-3 w-4/6" />
      </div>
      <span className="sr-only">Loading content...</span>
    </div>
  )
}

export function SkeletonText({ 
  lines = 3, 
  className = '' 
}: { 
  lines?: number
  className?: string 
}) {
  return (
    <div className={`space-y-2 ${className}`} role="status" aria-label="Loading text">
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLoader
          key={i}
          className={`h-3 ${
            i === lines - 1 ? 'w-4/6' : i % 2 === 0 ? 'w-full' : 'w-5/6'
          }`}
        />
      ))}
      <span className="sr-only">Loading text...</span>
    </div>
  )
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <svg
      className={`${sizeClasses[size]} animate-spin text-auro-accent ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
      <span className="sr-only">Loading...</span>
    </svg>
  )
}

export function SkeletonForm({ className = '' }: SkeletonLoaderProps) {
  return (
    <div className={`glass-panel p-8 rounded-3xl ${className}`} role="status" aria-label="Loading form">
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-3">
          <SkeletonLoader className="w-8 h-8 rounded-full" />
          <SkeletonLoader className="h-3 w-32" />
        </div>
        <SkeletonLoader className="h-8 w-2/3" />
        <SkeletonLoader className="h-4 w-full" />
      </div>
      
      <div className="space-y-6">
        <div>
          <SkeletonLoader className="h-3 w-24 mb-2" />
          <SkeletonLoader className="h-10 w-full rounded-xl" />
        </div>
        <div>
          <SkeletonLoader className="h-3 w-32 mb-2" />
          <SkeletonLoader className="h-10 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SkeletonLoader className="h-3 w-20 mb-2" />
            <SkeletonLoader className="h-10 w-full rounded-xl" />
          </div>
          <div>
            <SkeletonLoader className="h-3 w-20 mb-2" />
            <SkeletonLoader className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-8 pt-6 border-t border-auro-divider">
        <SkeletonLoader className="h-10 w-24 rounded-full" />
        <SkeletonLoader className="h-10 w-32 rounded-full" />
      </div>
      <span className="sr-only">Loading form...</span>
    </div>
  )
}

export function SkeletonGrid({ 
  columns = 2, 
  rows = 2,
  className = '' 
}: { 
  columns?: number
  rows?: number
  className?: string 
}) {
  return (
    <div 
      className={`grid gap-6 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      role="status" 
      aria-label="Loading grid"
    >
      {Array.from({ length: columns * rows }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
      <span className="sr-only">Loading grid...</span>
    </div>
  )
}
