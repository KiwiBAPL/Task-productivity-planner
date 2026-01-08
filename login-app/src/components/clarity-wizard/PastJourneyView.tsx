import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getJourneyById,
  formatDate,
  calculateMonths,
  type ClarityJourney,
} from '../../lib/clarity-wizard'
import { supabase } from '../../lib/supabase'

interface WheelOfLifeArea {
  id: string
  label: string
  score: number
  notes: string | null
}

interface SWOTEntry {
  id: string
  type: 'strength' | 'weakness' | 'opportunity' | 'threat'
  content: string
  notes: string | null
}

interface Big5Bucket {
  id: string
  title: string
  statement: string
  order_index: number
  okrs: Array<{
    id: string
    description: string
    metric_type: string
    target_value_number: number | null
    target_value_text: string | null
  }>
}

export default function PastJourneyView() {
  const { journeyId } = useParams<{ journeyId: string }>()
  const [journey, setJourney] = useState<ClarityJourney | null>(null)
  const [wheelOfLifeAreas, setWheelOfLifeAreas] = useState<WheelOfLifeArea[]>([])
  const [swotEntries, setSWOTEntries] = useState<SWOTEntry[]>([])
  const [big5Buckets, setBig5Buckets] = useState<Big5Bucket[]>([])
  const [hasVisionBoard, setHasVisionBoard] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (journeyId) {
      loadJourneyData()
    }
  }, [journeyId])

  async function loadJourneyData() {
    if (!journeyId) return

    setIsLoading(true)
    setError('')

    try {
      // Load journey
      const journeyResult = await getJourneyById(journeyId)
      if (!journeyResult.success || !journeyResult.data || Array.isArray(journeyResult.data)) {
        setError(journeyResult.error || 'Journey not found')
        setIsLoading(false)
        return
      }
      const journeyData = journeyResult.data as ClarityJourney
      setJourney(journeyData)

      // Load related data in parallel (all tools are part of the workflow)
      const [wheelResult, swotResult, big5Result, visionResult] = await Promise.all([
        supabase
          .from('wheel_of_life_areas')
          .select('*')
          .eq('journey_id', journeyId)
          .order('created_at'),
        supabase
          .from('swot_entries')
          .select('*')
          .eq('journey_id', journeyId)
          .order('created_at'),
        supabase
          .from('big5_buckets')
          .select('*, big5_okrs(*)')
          .eq('journey_id', journeyId)
          .order('order_index'),
        supabase
          .from('vision_board_versions')
          .select('id')
          .eq('journey_id', journeyId)
          .eq('is_committed', true)
          .limit(1),
      ])

      if (wheelResult.data) setWheelOfLifeAreas(wheelResult.data as WheelOfLifeArea[])
      if (swotResult.data) setSWOTEntries(swotResult.data as SWOTEntry[])
      if (big5Result.data) {
        setBig5Buckets(
          (big5Result.data as any[]).map((bucket) => ({
            ...bucket,
            okrs: bucket.big5_okrs || [],
          }))
        )
      }
      if (visionResult.data && visionResult.data.length > 0) {
        setHasVisionBoard(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load journey data')
    } finally {
      setIsLoading(false)
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

  if (error || !journey) {
    return (
      <div className="relative w-full min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-auro-bg0">
          <div className="absolute inset-0 gradient-radial-top-left" />
          <div className="absolute inset-0 gradient-radial-mid-left" />
        </div>
        <div className="relative z-10 container mx-auto px-6 py-12">
          <div className="glass-panel p-8 rounded-3xl max-w-4xl mx-auto">
            <p className="text-auro-text-danger mb-4">{error || 'Journey not found'}</p>
            <Link
              to="/clarity-wizard"
              className="inline-block px-6 py-3 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-all"
            >
              Back to home
            </Link>
          </div>
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
          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-semibold text-auro-text-primary mb-2">
                  {journey.name || 'My Journey'}
                </h1>
                <p className="text-auro-text-secondary">
                  {formatDate(journey.period_start)} - {formatDate(journey.period_end)}
                  {' '}({calculateMonths(journey.period_start, journey.period_end)} months)
                </p>
              </div>
              <Link
                to="/clarity-wizard"
                className="px-4 py-2 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-all text-sm font-medium"
              >
                Back to home
              </Link>
            </div>

            {/* Tools used indicators */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-auro-accent-soft text-auro-text-primary text-xs font-medium border border-auro-accent/35">
                Wheel of Life
              </span>
              <span className="px-3 py-1 rounded-full bg-auro-accent-soft text-auro-text-primary text-xs font-medium border border-auro-accent/35">
                SWOT
              </span>
              <span className="px-3 py-1 rounded-full bg-auro-accent-soft text-auro-text-primary text-xs font-medium border border-auro-accent/35">
                Vision Board
              </span>
              <span className="px-3 py-1 rounded-full bg-auro-accent-soft text-auro-text-primary text-xs font-medium border border-auro-accent/35">
                Big 5 & OKRs
              </span>
            </div>
          </div>

          {/* Wheel of Life */}
          {wheelOfLifeAreas.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl">
              <h2 className="text-xl font-semibold text-auro-text-primary mb-4">
                Wheel of Life
              </h2>
              <div className="space-y-3">
                {wheelOfLifeAreas.map((area) => (
                  <div key={area.id} className="glass-card p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-auro-text-primary">
                        {area.label}
                      </span>
                      <span className="text-sm text-auro-text-secondary">
                        {area.score}/10
                      </span>
                    </div>
                    {area.notes && (
                      <p className="text-xs text-auro-text-tertiary mt-2">{area.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SWOT Analysis */}
          {swotEntries.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl">
              <h2 className="text-xl font-semibold text-auro-text-primary mb-4">
                SWOT Analysis
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {['strength', 'weakness', 'opportunity', 'threat'].map((type) => {
                  const entries = swotEntries.filter((e) => e.type === type)
                  if (entries.length === 0) return null

                  return (
                    <div key={type} className="glass-card p-4 rounded-xl">
                      <h3 className="text-sm font-semibold text-auro-text-primary mb-3 capitalize">
                        {type}s
                      </h3>
                      <ul className="space-y-2">
                        {entries.map((entry) => (
                          <li key={entry.id} className="text-sm text-auro-text-secondary">
                            {entry.content}
                            {entry.notes && (
                              <span className="block text-xs text-auro-text-tertiary mt-1">
                                {entry.notes}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Vision Board */}
          {hasVisionBoard && (
            <div className="glass-panel p-6 rounded-3xl">
              <h2 className="text-xl font-semibold text-auro-text-primary mb-4">
                Vision Board
              </h2>
              <p className="text-sm text-auro-text-secondary">
                Vision board was created for this journey.
              </p>
            </div>
          )}

          {/* Big 5 & OKRs */}
          {big5Buckets.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl">
              <h2 className="text-xl font-semibold text-auro-text-primary mb-4">
                Big 5 Outcomes & OKRs
              </h2>
              <div className="space-y-4">
                {big5Buckets
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((bucket) => (
                    <div key={bucket.id} className="glass-card p-5 rounded-xl">
                      <h3 className="text-base font-semibold text-auro-text-primary mb-2">
                        {bucket.title}
                      </h3>
                      <p className="text-sm text-auro-text-secondary mb-4">{bucket.statement}</p>
                      {bucket.okrs && bucket.okrs.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-auro-text-tertiary uppercase tracking-wider mb-2">
                            Key Results
                          </h4>
                          {bucket.okrs.map((okr) => (
                            <div key={okr.id} className="text-sm text-auro-text-secondary">
                              <span className="font-medium">{okr.description}</span>
                              {okr.metric_type === 'number' && okr.target_value_number && (
                                <span className="text-auro-text-tertiary ml-2">
                                  → {okr.target_value_number}
                                </span>
                              )}
                              {okr.metric_type === 'percentage' && okr.target_value_number && (
                                <span className="text-auro-text-tertiary ml-2">
                                  → {okr.target_value_number}%
                                </span>
                              )}
                              {okr.metric_type === 'boolean' && (
                                <span className="text-auro-text-tertiary ml-2">→ Yes/No</span>
                              )}
                              {okr.metric_type === 'other' && okr.target_value_text && (
                                <span className="text-auro-text-tertiary ml-2">
                                  → {okr.target_value_text}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

