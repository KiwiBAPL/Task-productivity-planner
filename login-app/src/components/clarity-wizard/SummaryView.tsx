import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getJourneyById, formatDate, calculateMonths, type ClarityJourney } from '../../lib/clarity-wizard'
import { getBig5Buckets, type Big5BucketWithOKRs } from '../../lib/big5'
import { getWheelOfLifeAreas, type WheelOfLifeArea } from '../../lib/wheel-of-life'
import { getSWOTEntries, type SWOTEntry } from '../../lib/swot'
import { getVisionBoardImages, type VisionBoardImage, type VisionBoardVersion } from '../../lib/vision-board'
import { supabase } from '../../lib/supabase'
import WheelChart from './WheelChart'
import SWOTVisualization from './SWOTVisualization'
import { SkeletonCard, SkeletonLoader, SkeletonGrid } from '../SkeletonLoader'

export default function SummaryView() {
  const { journeyId } = useParams<{ journeyId: string }>()
  const navigate = useNavigate()
  const [journey, setJourney] = useState<ClarityJourney | null>(null)
  const [buckets, setBuckets] = useState<Big5BucketWithOKRs[]>([])
  const [wheelAreas, setWheelAreas] = useState<WheelOfLifeArea[]>([])
  const [swotEntries, setSWOTEntries] = useState<SWOTEntry[]>([])
  const [visionBoardVersion, setVisionBoardVersion] = useState<VisionBoardVersion | null>(null)
  const [visionBoardImages, setVisionBoardImages] = useState<VisionBoardImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const wheelChartRef = useRef<SVGSVGElement>(null)
  const swotRef = useRef<SVGSVGElement>(null)

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

        // Load Big 5 buckets
        const bucketsResult = await getBig5Buckets(journeyId)
        if (bucketsResult.success && bucketsResult.data) {
          setBuckets(bucketsResult.data as Big5BucketWithOKRs[])
        }

        // Load Wheel of Life areas
        const wheelResult = await getWheelOfLifeAreas(journeyId)
        if (wheelResult.success && wheelResult.data) {
          setWheelAreas(wheelResult.data as WheelOfLifeArea[])
        }

        // Load SWOT entries
        const swotResult = await getSWOTEntries(journeyId)
        if (swotResult.success && swotResult.data) {
          setSWOTEntries(swotResult.data as SWOTEntry[])
        }

        // Load committed vision board version
        const { data: versionData } = await supabase
          .from('vision_board_versions')
          .select('*')
          .eq('journey_id', journeyId)
          .eq('is_committed', true)
          .eq('is_current', true)
          .maybeSingle()

        if (versionData) {
          setVisionBoardVersion(versionData)
          
          // Load vision board images
          const imagesResult = await getVisionBoardImages(versionData.id)
          if (imagesResult.success && imagesResult.data) {
            setVisionBoardImages(imagesResult.data as VisionBoardImage[])
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

  function handleUsePlanner() {
    // Placeholder - navigate to dashboard with message
    navigate('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="relative w-full min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-auro-bg0">
          <div className="absolute inset-0 gradient-radial-top-left" />
          <div className="absolute inset-0 gradient-radial-mid-left" />
        </div>
        <div className="relative z-10 container mx-auto px-6 py-12 max-w-7xl">
          <div className="mb-8 space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonLoader className="w-10 h-10 rounded-full" />
              <SkeletonLoader className="h-3 w-32" />
            </div>
            <SkeletonLoader className="h-10 w-1/2" />
            <SkeletonLoader className="h-4 w-1/3" />
          </div>
          <div className="flex items-center gap-4 mb-8">
            <SkeletonLoader className="h-10 w-40 rounded-full" />
            <SkeletonLoader className="h-10 w-32 rounded-full" />
            <SkeletonLoader className="h-10 w-32 rounded-full" />
          </div>
          <SkeletonCard className="mb-8" />
          <SkeletonGrid columns={2} rows={1} className="mb-8" />
          <div className="space-y-6">
            {Array.from({ length: 3 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
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
          <div className="glass-card p-6 rounded-xl border border-auro-danger/30 bg-auro-danger/10">
            <p className="text-sm text-auro-danger">{error || 'Journey not found'}</p>
          </div>
          <button
            onClick={() => navigate('/clarity-wizard')}
            className="mt-4 px-6 py-3 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const periodMonths = calculateMonths(journey.period_start, journey.period_end)

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-auro-bg0">
        <div className="absolute inset-0 gradient-radial-top-left" />
        <div className="absolute inset-0 gradient-radial-mid-left" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-auro-accent-soft flex items-center justify-center">
              <svg className="w-5 h-5 text-auro-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-auro-text-tertiary uppercase tracking-wider">
              Journey Complete
            </span>
          </div>
          <h1 className="text-4xl font-semibold text-auro-text-primary mb-3">
            {journey.name || 'My Journey'}
          </h1>
          <div className="flex items-center gap-4 text-auro-text-secondary">
            <span>{formatDate(journey.period_start)} - {formatDate(journey.period_end)}</span>
            <span className="text-auro-text-tertiary">•</span>
            <span>{periodMonths} {periodMonths === 1 ? 'month' : 'months'}</span>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleUsePlanner}
            className="px-8 py-3 rounded-full bg-white text-[#0B0C10] font-medium hover:bg-[#8B5CF6] hover:text-[#F4F6FF] transition-all shadow-[0_10px_26px_-16px_rgba(0,0,0,0.55)] hover:shadow-[0_0_22px_0_rgba(139,92,246,0.30)]"
          >
            Use in Planner
          </button>
          <Link
            to={`/clarity-wizard/${journeyId}/big-5`}
            className="px-6 py-3 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-colors"
          >
            Edit Big 5
          </Link>
          <button
            onClick={() => navigate('/clarity-wizard')}
            className="px-6 py-3 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-colors"
          >
            Back to Home
          </button>
        </div>

        {/* Vision Board Banner */}
        {visionBoardVersion && visionBoardImages.length > 0 && (
          <div className="mb-8">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-auro-text-primary">Vision Board</h2>
                <Link
                  to={`/clarity-wizard/${journeyId}/vision-board`}
                  className="text-sm text-auro-accent hover:text-auro-accent/80 transition-colors"
                >
                  Edit →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {visionBoardImages.map((image) => (
                  <div key={image.id} className="aspect-square rounded-xl overflow-hidden bg-white/5">
                    {image.element_type === 'text' ? (
                      <div 
                        className="w-full h-full flex items-center justify-center p-3 text-xs text-auro-text-primary"
                        dangerouslySetInnerHTML={{ __html: image.text_content || '' }}
                      />
                    ) : (
                      <img
                        src={image.preview_url}
                        alt={image.caption || 'Vision board image'}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tools Section - Wheel of Life and SWOT side by side */}
        {(wheelAreas.length > 0 || swotEntries.length > 0) && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-auro-text-primary mb-6">Tools Overview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Wheel of Life */}
              {wheelAreas.length > 0 && (
                <div className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-auro-text-primary">Wheel of Life</h3>
                    <Link
                      to={`/clarity-wizard/${journeyId}/wheel-of-life`}
                      className="text-sm text-auro-accent hover:text-auro-accent/80 transition-colors"
                    >
                      Edit →
                    </Link>
                  </div>
                  <div className="flex items-center justify-center">
                    <WheelChart ref={wheelChartRef} areas={wheelAreas} size={400} />
                  </div>
                </div>
              )}

              {/* SWOT Analysis */}
              {swotEntries.length > 0 && (
                <div className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-auro-text-primary">SWOT Analysis</h3>
                    <Link
                      to={`/clarity-wizard/${journeyId}/swot`}
                      className="text-sm text-auro-accent hover:text-auro-accent/80 transition-colors"
                    >
                      Edit →
                    </Link>
                  </div>
                  <div className="flex items-center justify-center">
                    <SWOTVisualization ref={swotRef} entries={swotEntries} size={400} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Big 5 Outcomes Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-auro-text-primary">Big 5 Outcomes</h2>
            <Link
              to={`/clarity-wizard/${journeyId}/big-5`}
              className="text-sm text-auro-accent hover:text-auro-accent/80 transition-colors"
            >
              Edit →
            </Link>
          </div>

          {buckets.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl text-center">
              <p className="text-auro-text-secondary">No Big 5 outcomes defined yet.</p>
              <Link
                to={`/clarity-wizard/${journeyId}/big-5`}
                className="mt-4 inline-block px-6 py-3 rounded-full bg-white text-[#0B0C10] font-medium hover:bg-[#8B5CF6] hover:text-[#F4F6FF] transition-all"
              >
                Define Big 5
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {buckets.map((bucket) => (
                <div key={bucket.id || bucket.order_index} className="glass-card p-6 rounded-2xl border border-auro-stroke-subtle">
                  {/* Bucket Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-auro-accent-soft flex items-center justify-center">
                      <span className="text-sm font-semibold text-auro-accent">
                        {bucket.order_index + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-auro-text-primary">
                      {bucket.title || `Outcome ${bucket.order_index + 1}`}
                    </h3>
                  </div>

                  {/* Statement */}
                  <p className="text-auro-text-secondary mb-6 leading-relaxed">
                    {bucket.statement}
                  </p>

                  {/* Divider */}
                  <div className="border-t border-auro-divider mb-4" />

                  {/* OKRs */}
                  <div>
                    <h4 className="text-sm font-semibold text-auro-text-primary mb-3">
                      Key Results
                    </h4>
                    <div className="space-y-3">
                      {bucket.okrs.map((okr, index) => (
                        <div key={okr.id || index} className="flex gap-3">
                          <span className="text-xs font-medium text-auro-text-tertiary mt-1">
                            {index + 1}.
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-auro-text-primary mb-1">
                              {okr.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-auro-text-tertiary">
                              <span className="capitalize">{okr.metric_type}</span>
                              {okr.metric_type === 'percentage' && okr.target_value_number && (
                                <span>• Target: {okr.target_value_number}%</span>
                              )}
                              {okr.metric_type === 'number' && okr.target_value_number && (
                                <span>• Target: {okr.target_value_number}</span>
                              )}
                              {okr.metric_type === 'boolean' && okr.target_value_text && (
                                <span>• Target: {okr.target_value_text}</span>
                              )}
                              {okr.metric_type === 'other' && okr.target_value_text && (
                                <span>• Target: {okr.target_value_text}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Edit Links */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold text-auro-text-primary mb-4">Quick Edit</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to={`/clarity-wizard/${journeyId}/period`}
              className="px-4 py-2 rounded-lg glass-control text-sm text-auro-text-primary hover:bg-white/8 transition-colors text-center"
            >
              Period
            </Link>
            <Link
              to={`/clarity-wizard/${journeyId}/wheel-of-life`}
              className="px-4 py-2 rounded-lg glass-control text-sm text-auro-text-primary hover:bg-white/8 transition-colors text-center"
            >
              Wheel of Life
            </Link>
            <Link
              to={`/clarity-wizard/${journeyId}/swot`}
              className="px-4 py-2 rounded-lg glass-control text-sm text-auro-text-primary hover:bg-white/8 transition-colors text-center"
            >
              SWOT
            </Link>
            <Link
              to={`/clarity-wizard/${journeyId}/vision-board`}
              className="px-4 py-2 rounded-lg glass-control text-sm text-auro-text-primary hover:bg-white/8 transition-colors text-center"
            >
              Vision Board
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
