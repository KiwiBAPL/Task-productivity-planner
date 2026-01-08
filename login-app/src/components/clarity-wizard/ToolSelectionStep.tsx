import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getJourneyById, getNextStep, type ClarityJourney } from '../../lib/clarity-wizard'

interface Tool {
  id: string
  name: string
  description: string
  timeEstimate: string
  icon: JSX.Element
}

const tools: Tool[] = [
  {
    id: 'wheel-of-life',
    name: 'Wheel of Life',
    description: 'Rate different life domains to see where you want focus',
    timeEstimate: '5-10 minutes',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20M6.34 6.34l11.32 11.32M6.34 17.66L17.66 6.34" />
      </svg>
    ),
  },
  {
    id: 'swot',
    name: 'SWOT Analysis',
    description: 'Holistic self-view to inform your Big 5 and Vision Board',
    timeEstimate: '10-15 minutes',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h7M4 10h7M4 14h7M4 18h7M15 6h5M15 10h5M15 14h5M15 18h5M11 3v18M3 12h18" />
        <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'vision-board',
    name: 'Vision Board',
    description: 'Create a digital collage of inspiring images for your focus period',
    timeEstimate: '15-20 minutes',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'big5',
    name: 'Big 5 & OKRs',
    description: 'Define 5 outcome buckets with 3 OKRs each',
    timeEstimate: '20-30 minutes',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
]

export default function ToolSelectionStep() {
  const { journeyId } = useParams<{ journeyId: string }>()
  const navigate = useNavigate()
  const [journey, setJourney] = useState<ClarityJourney | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function loadJourney() {
      if (!journeyId) return
      
      setIsLoading(true)
      try {
        const result = await getJourneyById(journeyId)
        if (result.success && result.data) {
          setJourney(result.data as ClarityJourney)
        } else {
          setError(result.error || 'Journey not found')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load journey')
      } finally {
        setIsLoading(false)
      }
    }
    loadJourney()
  }, [journeyId])

  async function handleNext() {
    if (!journeyId || !journey) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      // Navigate to next step in linear flow
      const nextRoute = getNextStep(journey, 'tools')
      navigate(nextRoute)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to proceed')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBack() {
    if (journeyId) {
      navigate(`/clarity-wizard/${journeyId}/period`)
    } else {
      navigate('/clarity-wizard')
    }
  }

  if (isLoading) {
    return (
      <div className="relative w-full min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-auro-bg0">
          <div className="absolute inset-0 gradient-radial-top-left" />
          <div className="absolute inset-0 gradient-radial-mid-left" />
        </div>
        <div className="relative z-10 container mx-auto px-6 py-12 flex items-center justify-center min-h-screen">
          <div className="text-auro-text-secondary">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-auro-bg0">
        <div className="absolute inset-0 gradient-radial-top-left" />
        <div className="absolute inset-0 gradient-radial-mid-left" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="glass-panel p-8 rounded-3xl max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-auro-accent-soft flex items-center justify-center">
                <svg className="w-4 h-4 text-auro-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <span className="text-xs font-medium text-auro-text-tertiary uppercase tracking-wider">Step 2 of 6</span>
            </div>
            <h1 className="text-3xl font-semibold text-auro-text-primary mb-2">
              Your Journey Tools
            </h1>
            <p className="text-auro-text-secondary">
              Work through these exercises to inform your Big 5 outcomes. Each tool provides valuable insights for your journey.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="glass-card p-4 rounded-xl border border-auro-danger/30 bg-auro-danger/10 mb-6">
              <p className="text-sm text-auro-danger">{error}</p>
            </div>
          )}

          {/* Tools grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="glass-card p-6 rounded-2xl hover:bg-white/[0.06] transition-all cursor-default"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-auro-accent-soft flex items-center justify-center flex-shrink-0">
                    <div className="text-auro-accent">
                      {tool.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-auro-text-primary mb-2">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-auro-text-secondary mb-3">
                      {tool.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-auro-text-tertiary">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{tool.timeEstimate}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info box */}
          <div className="glass-card p-4 rounded-xl border border-auro-accent/20 bg-auro-accent/5 mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-auro-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-auro-text-primary">
                  <strong>Take your time:</strong> These tools are designed to help you reflect deeply. You can save and return anytime. Your progress is automatically saved as you work through each tool.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-auro-divider">
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-8 py-3 rounded-full bg-white text-[#0B0C10] font-medium hover:bg-[#8B5CF6] hover:text-[#F4F6FF] transition-all shadow-[0_10px_26px_-16px_rgba(0,0,0,0.55)] hover:shadow-[0_0_22px_0_rgba(139,92,246,0.30)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Loading...' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

