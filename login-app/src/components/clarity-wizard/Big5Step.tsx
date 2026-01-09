import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getJourneyById, getPreviousStep, updateJourney, type ClarityJourney } from '../../lib/clarity-wizard'
import { getBig5Buckets, type Big5BucketWithOKRs, type Big5OKR } from '../../lib/big5'
import Big5Card from './Big5Card'
import SupportiveContextPanel from './SupportiveContextPanel'

export default function Big5Step() {
  const { journeyId } = useParams<{ journeyId: string }>()
  const navigate = useNavigate()
  const [journey, setJourney] = useState<ClarityJourney | null>(null)
  const [buckets, setBuckets] = useState<Big5BucketWithOKRs[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load journey and buckets on mount
  useEffect(() => {
    async function loadData() {
      if (!journeyId) return

      setIsLoading(true)
      setError('')

      try {
        // Load journey
        const journeyResult = await getJourneyById(journeyId)
        if (!journeyResult.success || !journeyResult.data) {
          setError(journeyResult.error || 'Journey not found')
          setIsLoading(false)
          return
        }
        setJourney(journeyResult.data as ClarityJourney)

        // Load existing buckets
        const bucketsResult = await getBig5Buckets(journeyId)
        if (bucketsResult.success && bucketsResult.data) {
          const existingBuckets = bucketsResult.data as Big5BucketWithOKRs[]
          
          if (existingBuckets.length > 0) {
            // Use existing buckets, ensure they have 3 OKRs each
            const bucketsWithOKRs = existingBuckets.map((bucket) => {
              // Ensure we have exactly 3 OKRs
              const okrs = [...bucket.okrs]
              while (okrs.length < 3) {
                okrs.push({
                  order_index: okrs.length,
                  description: '',
                  metric_type: 'number',
                  target_value_number: null,
                  target_value_text: null,
                })
              }
              return { ...bucket, okrs: okrs.slice(0, 3) }
            })
            setBuckets(bucketsWithOKRs)
          } else {
            // Initialize with 5 empty buckets
            const emptyBuckets: Big5BucketWithOKRs[] = Array.from({ length: 5 }, (_, i) => ({
              order_index: i,
              title: '',
              statement: '',
              okrs: Array.from({ length: 3 }, (_, j) => ({
                order_index: j,
                description: '',
                metric_type: 'number',
                target_value_number: null,
                target_value_text: null,
              })) as Big5OKR[],
            }))
            setBuckets(emptyBuckets)
          }
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [journeyId])

  // Calculate completion count
  const completedCount = buckets.filter((bucket) => {
    return (
      bucket.title.trim().length > 0 &&
      bucket.statement.trim().length >= 10 &&
      bucket.okrs.length === 3 &&
      bucket.okrs.every((okr) => okr.description.trim().length > 0)
    )
  }).length

  // Handle bucket update
  const handleBucketUpdate = useCallback((updatedBucket: Big5BucketWithOKRs) => {
    setBuckets((prev) =>
      prev.map((bucket) =>
        bucket.order_index === updatedBucket.order_index ? updatedBucket : bucket
      )
    )
  }, [])

  // Handle completion
  async function handleComplete() {
    if (!journeyId || !journey) return

    // Validate all buckets are completed
    if (completedCount < 5) {
      setError('Please complete all 5 outcomes before finishing. Each outcome needs a title, statement, and 3 key results.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Mark Big 5 as done and journey as completed
      const result = await updateJourney(journeyId, { big5_done: true, status: 'completed' })
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
          <p className="text-auro-text-secondary mb-4">
            Create 5 outcome buckets with 3 key results each to guide your journey.
          </p>
          
          {/* Progress Indicator */}
          <div className="glass-card p-4 rounded-xl inline-flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-auro-accent-soft flex items-center justify-center">
                <span className="text-lg font-bold text-auro-accent">{completedCount}</span>
              </div>
              <div>
                <p className="text-xs text-auro-text-tertiary">Outcomes Completed</p>
                <p className="text-sm font-semibold text-auro-text-primary">{completedCount} of 5</p>
              </div>
            </div>
            <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-auro-accent transition-all duration-300"
                style={{ width: `${(completedCount / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="glass-card p-4 rounded-xl border border-auro-danger/30 bg-auro-danger/10 mb-6">
            <p className="text-sm text-auro-danger">{error}</p>
          </div>
        )}

        {/* Main Content: 2-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Left: Big 5 Cards */}
          <div className="flex-1 space-y-6">
            {buckets.map((bucket) => (
              <Big5Card
                key={bucket.order_index}
                bucket={bucket}
                journeyId={journeyId!}
                onUpdate={handleBucketUpdate}
              />
            ))}
          </div>

          {/* Right: Supportive Context Panel */}
          <div className="lg:w-[380px] shrink-0">
            <SupportiveContextPanel journeyId={journeyId!} />
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
            disabled={isSubmitting || completedCount < 5}
            className="px-8 py-3 rounded-full bg-white text-[#0B0C10] font-medium hover:bg-[#8B5CF6] hover:text-[#F4F6FF] transition-all shadow-[0_10px_26px_-16px_rgba(0,0,0,0.55)] hover:shadow-[0_0_22px_0_rgba(139,92,246,0.30)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Completing...' : 'Complete Journey'}
          </button>
        </div>
      </div>
    </div>
  )
}

