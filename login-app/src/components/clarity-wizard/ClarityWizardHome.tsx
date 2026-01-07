import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getActiveJourney,
  getPastJourneys,
  archiveJourney,
  formatDate,
  calculateMonths,
  type ClarityJourney,
} from '../../lib/clarity-wizard'
import { useAuth } from '../../hooks/useAuth'

export default function ClarityWizardHome() {
  console.log('ClarityWizardHome component rendering')
  const navigate = useNavigate()
  const { userId, isLoading: authLoading } = useAuth()
  const [activeJourney, setActiveJourney] = useState<ClarityJourney | null>(null)
  const [pastJourneys, setPastJourneys] = useState<ClarityJourney[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isArchiving, setIsArchiving] = useState(false)

  // Define loadJourneys at component level so it can be called from handlers
  async function loadJourneys(userIdToUse: string) {
    setIsLoading(true)
    setError('')

    try {
      console.log('Loading journeys for userId:', userIdToUse)

      // Add timeout wrapper to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout: Failed to load journeys after 10 seconds'))
        }, 10000)
      })

      // Run both queries in parallel with timeout
      const queriesPromise = Promise.all([
        getActiveJourney(userIdToUse),
        getPastJourneys(userIdToUse),
      ])

      const [activeResult, pastResult] = await Promise.race([
        queriesPromise,
        timeoutPromise,
      ])

      console.log('Active journey result:', activeResult)
      console.log('Past journeys result:', pastResult)

      // Handle active journey result
      if (activeResult.success) {
        const journey = activeResult.data as ClarityJourney | undefined
        console.log('Setting active journey:', journey)
        setActiveJourney(journey || null)
      } else {
        console.error('Error loading active journey:', activeResult.error)
        // Don't set error for missing journeys - that's normal
        if (activeResult.error && !activeResult.error.includes('does not exist')) {
          setError(activeResult.error || 'Failed to load journey')
        }
        setActiveJourney(null)
      }

      // Handle past journeys result
      if (pastResult.success) {
        setPastJourneys((pastResult.data as ClarityJourney[]) || [])
      } else {
        console.error('Error loading past journeys:', pastResult.error)
        // Don't set error for missing journeys - that's normal
        if (pastResult.error && !pastResult.error.includes('does not exist')) {
          setError(pastResult.error || 'Failed to load past journeys')
        }
        setPastJourneys([])
      }
    } catch (err) {
      console.error('Unexpected error loading journeys:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load journeys'
      setError(errorMessage)
      setActiveJourney(null)
      setPastJourneys([])
    } finally {
      console.log('Setting loading to false')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Safety timeout to prevent infinite loading; cancelled on success/early exit
    let safetyTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      console.warn('Safety timeout: Force setting loading to false after 15 seconds')
      setIsLoading(false)
    }, 15000)

    function clearSafetyTimeout() {
      if (safetyTimeout) {
        clearTimeout(safetyTimeout)
        safetyTimeout = null
      }
    }

    // Wait for auth to load, then load journeys
    if (!authLoading && userId) {
      console.log('Auth loaded, calling loadJourneys with userId:', userId)
      loadJourneys(userId).finally(clearSafetyTimeout)
    } else if (!authLoading && !userId) {
      console.log('Auth loaded but no userId')
      setIsLoading(false)
      clearSafetyTimeout()
    }

    return () => {
      clearSafetyTimeout()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, userId])

  function handleStartNewJourney() {
    // Navigate to period step - journey will be created there
    navigate('/clarity-wizard/new/period')
  }

  async function handleArchiveJourney(journeyId: string) {
    if (!confirm('Are you sure you want to close this journey? You can view it later in your past journeys.')) {
      return
    }

    if (!userId) {
      setError('User not authenticated')
      return
    }

    setIsArchiving(true)
    try {
      const result = await archiveJourney(journeyId)

      if (result.success) {
        await loadJourneys(userId)
      } else {
        setError(result.error || 'Failed to archive journey')
      }
    } finally {
      setIsArchiving(false)
    }
  }

  function getStatusBadge(status: ClarityJourney['status']) {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium'
    switch (status) {
      case 'draft':
        return (
          <span className={`${baseClasses} bg-auro-warning/20 text-auro-warning border border-auro-warning/30`}>
            Draft
          </span>
        )
      case 'completed':
        return (
          <span className={`${baseClasses} bg-auro-success/20 text-auro-success border border-auro-success/30`}>
            Completed
          </span>
        )
      case 'archived':
        return (
          <span className={`${baseClasses} bg-auro-surface2 text-auro-text-secondary border border-auro-stroke-subtle`}>
            Archived
          </span>
        )
    }
  }

  if (authLoading || isLoading) {
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="glass-panel p-8 rounded-3xl">
            <h1 className="text-3xl font-semibold text-auro-text-primary mb-2">
              Design your next journey
            </h1>
            <p className="text-auro-text-secondary mb-6">
              Create a focused plan for your next period
            </p>
            <button
              onClick={handleStartNewJourney}
              className="inline-block px-6 py-3 rounded-full bg-white text-[#0B0C10] font-medium hover:bg-[#8B5CF6] hover:text-[#F4F6FF] transition-all shadow-[0_10px_26px_-16px_rgba(0,0,0,0.55)] hover:shadow-[0_0_22px_0_rgba(139,92,246,0.30)]"
            >
              Start a new journey
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="glass-card p-4 rounded-xl border border-auro-danger/30 bg-auro-danger/10">
              <p className="text-sm text-auro-danger">{error}</p>
            </div>
          )}

          {/* Current Journey Section - only shown when there's an active journey */}
          {activeJourney && (
            <div className="glass-panel p-6 rounded-3xl">
              <h2 className="text-xl font-semibold text-auro-text-primary mb-4">
                Current Journey
              </h2>
              <div className="glass-card p-4 rounded-xl mb-4">
                <div className="flex items-start gap-4">
                  {activeJourney.cover_image_url && (
                    <img
                      src={activeJourney.cover_image_url}
                      alt={activeJourney.name || 'Journey cover'}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-medium text-auro-text-primary">
                        {activeJourney.name || 'My Journey'}
                      </h3>
                      {getStatusBadge(activeJourney.status)}
                    </div>
                    <p className="text-sm text-auro-text-secondary">
                      {formatDate(activeJourney.period_start)} - {formatDate(activeJourney.period_end)}
                      {' '}({calculateMonths(activeJourney.period_start, activeJourney.period_end)} months)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {activeJourney.status === 'draft' ? (
                  <Link
                    to={`/clarity-wizard/${activeJourney.id}/period`}
                    className="px-6 py-3 rounded-full bg-white text-[#0B0C10] font-medium hover:bg-[#8B5CF6] hover:text-[#F4F6FF] transition-all shadow-[0_10px_26px_-16px_rgba(0,0,0,0.55)] hover:shadow-[0_0_22px_0_rgba(139,92,246,0.30)]"
                  >
                    Update journey
                  </Link>
                ) : (
                  <Link
                    to={`/clarity-wizard/${activeJourney.id}/summary`}
                    className="px-6 py-3 rounded-full bg-white text-[#0B0C10] font-medium hover:bg-[#8B5CF6] hover:text-[#F4F6FF] transition-all shadow-[0_10px_26px_-16px_rgba(0,0,0,0.55)] hover:shadow-[0_0_22px_0_rgba(139,92,246,0.30)]"
                  >
                    View journey
                  </Link>
                )}
                <button
                  onClick={() => handleArchiveJourney(activeJourney.id)}
                  disabled={isArchiving}
                  className="px-6 py-3 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isArchiving ? 'Closing...' : 'Close journey'}
                </button>
              </div>
            </div>
          )}

          {/* Past Journeys Section */}
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-xl font-semibold text-auro-text-primary mb-4">
              Past Journeys
            </h2>
            {pastJourneys.length > 0 ? (
              <div className="space-y-3">
                {pastJourneys.map((journey) => (
                  <div
                    key={journey.id}
                    className="glass-card p-4 rounded-xl hover:border-auro-stroke-strong transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {journey.cover_image_url && (
                        <img
                          src={journey.cover_image_url}
                          alt={journey.name || 'Journey cover'}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-base font-medium text-auro-text-primary">
                            {journey.name || 'My Journey'}
                          </h3>
                          {getStatusBadge(journey.status)}
                        </div>
                        <p className="text-sm text-auro-text-secondary mb-1">
                          {formatDate(journey.period_start)} - {formatDate(journey.period_end)}
                        </p>
                        <p className="text-xs text-auro-text-tertiary">
                          Completed {formatDate(journey.updated_at)}
                        </p>
                      </div>
                      <Link
                        to={`/clarity-wizard/${journey.id}/view`}
                        className="px-4 py-2 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-all text-sm font-medium flex-shrink-0"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-auro-text-secondary text-center py-4">
                No past journeys yet. Completed journeys will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
