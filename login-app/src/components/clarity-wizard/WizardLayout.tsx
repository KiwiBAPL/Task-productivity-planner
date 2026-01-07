import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface WizardLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  onBack?: () => void
  onNext?: () => void
  showBack?: boolean
  showNext?: boolean
}

export default function WizardLayout({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  showBack = true,
  showNext = false,
}: WizardLayoutProps) {
  const navigate = useNavigate()

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-auro-bg0">
        <div className="absolute inset-0 gradient-radial-top-left" />
        <div className="absolute inset-0 gradient-radial-mid-left" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="glass-panel p-8 rounded-3xl max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-auro-text-primary mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-auro-text-secondary">{subtitle}</p>
            )}
          </div>

          <div className="mb-8">
            {children}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-auro-divider">
            {showBack && (
              <button
                onClick={onBack || (() => navigate(-1))}
                className="px-6 py-3 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-colors"
              >
                Back
              </button>
            )}
            {showNext && (
              <button
                onClick={onNext}
                className="ml-auto px-6 py-3 rounded-full bg-white/92 text-auro-text-inverse font-medium hover:bg-white transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

