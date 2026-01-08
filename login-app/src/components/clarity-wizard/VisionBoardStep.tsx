import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getJourneyById, getNextStep, getPreviousStep, type ClarityJourney } from '../../lib/clarity-wizard'

export default function VisionBoardStep() {
  const { journeyId } = useParams<{ journeyId: string }>()
  const navigate = useNavigate()
  const [journey, setJourney] = useState<ClarityJourney | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  function handleNext() {
    if (!journey) return

    setIsSubmitting(true)
    try {
      const nextRoute = getNextStep(journey, 'vision-board')
      navigate(nextRoute)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to proceed')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBack() {
    if (journey) {
      const prevRoute = getPreviousStep(journey, 'vision-board')
      navigate(prevRoute)
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-auro-text-tertiary uppercase tracking-wider">
                Step 5: Vision Board
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-auro-text-primary mb-2">
              Create your vision board
            </h1>
            <p className="text-auro-text-secondary">
              Build a digital collage of inspiring images for your focus period.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="glass-card p-4 rounded-xl border border-auro-danger/30 bg-auro-danger/10 mb-6">
              <p className="text-sm text-auro-danger">{error}</p>
            </div>
          )}

          {/* Placeholder Content */}
          <div className="glass-card p-12 rounded-2xl mb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-auro-accent-soft flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-auro-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-auro-text-primary mb-3">
              Vision Board Coming Soon
            </h2>
            <p className="text-auro-text-secondary max-w-md mx-auto mb-6">
              This feature is currently under development. Soon you'll be able to create a beautiful digital vision board with images that inspire and motivate you toward your goals.
            </p>
            <div className="glass-card p-4 rounded-xl border border-auro-accent/20 bg-auro-accent/5 max-w-md mx-auto">
              <p className="text-sm text-auro-text-primary">
                <strong>What to expect:</strong> Upload images, arrange them in a collage, add captions, and create a visual representation of your aspirations.
              </p>
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

