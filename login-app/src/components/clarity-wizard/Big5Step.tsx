import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getJourneyById, getPreviousStep, updateJourney, type ClarityJourney } from '../../lib/clarity-wizard'

export default function Big5Step() {
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

  async function handleComplete() {
    if (!journeyId || !journey) return

    setIsSubmitting(true)
    setError('')

    try {
      // Mark journey as completed
      const result = await updateJourney(journeyId, { status: 'completed' })
      if (!result.success) {
        setError(result.error || 'Failed to complete journey')
        return
      }

      // Navigate back to home
      navigate('/clarity-wizard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete journey')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBack() {
    if (journey) {
      const prevRoute = getPreviousStep(journey, 'big-5')
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <span className="text-xs font-medium text-auro-text-tertiary uppercase tracking-wider">
                Step 6: Big 5 & OKRs
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-auro-text-primary mb-2">
              Define your Big 5 outcomes
            </h1>
            <p className="text-auro-text-secondary">
              Create 5 outcome buckets with 3 key results each to guide your journey.
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-auro-text-primary mb-3">
              Big 5 & OKRs Coming Soon
            </h2>
            <p className="text-auro-text-secondary max-w-md mx-auto mb-6">
              This feature is currently under development. Soon you'll be able to define your 5 main outcome buckets and set measurable key results for each one.
            </p>
            <div className="glass-card p-4 rounded-xl border border-auro-accent/20 bg-auro-accent/5 max-w-md mx-auto">
              <p className="text-sm text-auro-text-primary">
                <strong>What to expect:</strong> Define outcome statements following the template "[Who] will [change] so that [benefit]" and set 3 measurable OKRs for each bucket.
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
              onClick={handleComplete}
              disabled={isSubmitting}
              className="px-8 py-3 rounded-full bg-white text-[#0B0C10] font-medium hover:bg-[#8B5CF6] hover:text-[#F4F6FF] transition-all shadow-[0_10px_26px_-16px_rgba(0,0,0,0.55)] hover:shadow-[0_0_22px_0_rgba(139,92,246,0.30)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Completing...' : 'Complete Journey'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

