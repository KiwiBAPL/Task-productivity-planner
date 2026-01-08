import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAutosave } from '../../hooks/useAutosave'
import {
  getWheelOfLifeAreas,
  saveWheelOfLifeArea,
  deleteWheelOfLifeArea,
  type WheelOfLifeArea,
} from '../../lib/wheel-of-life'
import { getJourneyById, getNextStep, getPreviousStep, type ClarityJourney } from '../../lib/clarity-wizard'
import WheelChart from './WheelChart'

const DEFAULT_AREAS = [
  'Health',
  'Career',
  'Finances',
  'Relationships',
  'Personal Growth',
  'Fun',
  'Environment',
  'Community',
  'Spirituality',
]

export default function WheelOfLifeStep() {
  const { journeyId } = useParams<{ journeyId: string }>()
  const navigate = useNavigate()
  const svgRef = useRef<SVGSVGElement>(null)

  const [journey, setJourney] = useState<ClarityJourney | null>(null)
  const [areas, setAreas] = useState<WheelOfLifeArea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  // Load journey and areas on mount
  useEffect(() => {
    async function loadData() {
      if (!journeyId) {
        setError('Journey ID is required')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // Load journey
        const journeyResult = await getJourneyById(journeyId)
        if (!journeyResult.success || !journeyResult.data) {
          setError(journeyResult.error || 'Journey not found')
          setIsLoading(false)
          return
        }
        setJourney(journeyResult.data as ClarityJourney)

        // Load existing areas
        const areasResult = await getWheelOfLifeAreas(journeyId)
        if (areasResult.success && areasResult.data) {
          const existingAreas = areasResult.data as WheelOfLifeArea[]
          
          if (existingAreas.length > 0) {
            // Use existing areas
            setAreas(existingAreas)
          } else {
            // Initialize with default areas
            const defaultAreas: WheelOfLifeArea[] = DEFAULT_AREAS.map((label) => ({
              label,
              score: 5, // Default mid-range score
              notes: '',
            }))
            setAreas(defaultAreas)
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

  // Autosave hook for individual area
  const { save: autosaveArea } = useAutosave<{ index: number; area: WheelOfLifeArea }>(
    async ({ index, area }) => {
      if (!journeyId) return

      const result = await saveWheelOfLifeArea(journeyId, area)
      if (result.success && result.data) {
        // Update the area with the returned data (which includes ID for new areas)
        const savedArea = result.data as WheelOfLifeArea
        setAreas((prev) => {
          const updated = [...prev]
          updated[index] = savedArea
          return updated
        })
      } else {
        throw new Error(result.error || 'Failed to save area')
      }
    },
    { debounceMs: 300 }
  )

  const handleScoreChange = useCallback(
    (index: number, newScore: number) => {
      setAreas((prev) => {
        const updated = [...prev]
        updated[index] = { ...updated[index], score: newScore }
        autosaveArea({ index, area: updated[index] })
        return updated
      })
    },
    [autosaveArea]
  )

  const handleLabelChange = useCallback(
    (index: number, newLabel: string) => {
      setAreas((prev) => {
        const updated = [...prev]
        updated[index] = { ...updated[index], label: newLabel }
        autosaveArea({ index, area: updated[index] })
        return updated
      })
    },
    [autosaveArea]
  )

  const handleNotesChange = useCallback(
    (index: number, newNotes: string) => {
      setAreas((prev) => {
        const updated = [...prev]
        updated[index] = { ...updated[index], notes: newNotes }
        autosaveArea({ index, area: updated[index] })
        return updated
      })
    },
    [autosaveArea]
  )

  const handleAddArea = useCallback(() => {
    const newArea: WheelOfLifeArea = {
      label: 'New Area',
      score: 5,
      notes: '',
    }
    setAreas((prev) => [...prev, newArea])
  }, [])

  const handleDeleteArea = useCallback(
    async (index: number) => {
      const area = areas[index]
      
      // Prevent deleting default areas that are in the first 9 positions
      if (index < DEFAULT_AREAS.length && !area.id) {
        setError('Cannot delete default areas')
        return
      }

      if (area.id) {
        const result = await deleteWheelOfLifeArea(area.id)
        if (!result.success) {
          setError(result.error || 'Failed to delete area')
          return
        }
      }

      setAreas((prev) => prev.filter((_, i) => i !== index))
    },
    [areas]
  )

  const toggleNotes = useCallback((index: number) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      const key = String(index)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  async function handleNext() {
    if (!journeyId || !journey) return

    setIsSubmitting(true)
    setError('')

    try {
      // Save all areas that don't have IDs yet
      for (let i = 0; i < areas.length; i++) {
        const area = areas[i]
        if (!area.id) {
          const result = await saveWheelOfLifeArea(journeyId, area)
          if (!result.success) {
            throw new Error(`Failed to save ${area.label}`)
          }
        }
      }

      // Navigate to next step in linear flow
      const nextRoute = getNextStep(journey, 'wheel-of-life')
      navigate(nextRoute)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to proceed')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBack() {
    if (journeyId && journey) {
      const prevRoute = getPreviousStep(journey, 'wheel-of-life')
      navigate(prevRoute)
    } else {
      navigate('/clarity-wizard')
    }
  }

  function handleDownload() {
    if (!svgRef.current) return

    // Create a canvas to render the SVG
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const width = 1200
    const height = 1200
    canvas.width = width
    canvas.height = height

    // Fill with dark background for export
    ctx.fillStyle = '#0B0C10'
    ctx.fillRect(0, 0, width, height)

    // Serialize SVG to string
    const svgData = new XMLSerializer().serializeToString(svgRef.current)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    // Load SVG as image and draw to canvas
    const img = new Image()
    img.onload = () => {
      // Center the SVG on the canvas
      const svgWidth = svgRef.current?.width.baseVal.value || 550
      const svgHeight = svgRef.current?.height.baseVal.value || 550
      const offsetX = (width - svgWidth) / 2
      const offsetY = (height - svgHeight) / 2
      
      ctx.drawImage(img, offsetX, offsetY)
      URL.revokeObjectURL(url)

      // Convert canvas to PNG and download
      canvas.toBlob((blob) => {
        if (!blob) return
        const pngUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = 'wheel-of-life.png'
        link.href = pngUrl
        link.click()
        URL.revokeObjectURL(pngUrl)
      })
    }
    img.src = url
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
        <div className="glass-panel p-8 rounded-3xl max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-auro-accent-soft flex items-center justify-center">
                <svg className="w-4 h-4 text-auro-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20M6.34 6.34l11.32 11.32M6.34 17.66L17.66 6.34" />
                </svg>
              </div>
              <span className="text-xs font-medium text-auro-text-tertiary uppercase tracking-wider">
                Step 3: Wheel of Life
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-auro-text-primary mb-2">
              Rate your life areas
            </h1>
            <p className="text-auro-text-secondary mb-4">
              Assess different areas of your life on a scale of 1-10. This helps identify where to focus your energy.
            </p>
            
            {/* Top Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-8 py-3 rounded-full bg-white text-[#0B0C10] font-medium hover:bg-[#8B5CF6] hover:text-[#F4F6FF] transition-all shadow-[0_10px_26px_-16px_rgba(0,0,0,0.55)] hover:shadow-[0_0_22px_0_rgba(139,92,246,0.30)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Next'}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="glass-card p-4 rounded-xl border border-auro-danger/30 bg-auro-danger/10 mb-6">
              <p className="text-sm text-auro-danger">{error}</p>
            </div>
          )}

          {/* Main content: Chart + Areas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Radar Chart */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-xl px-4">
                <WheelChart
                  ref={svgRef}
                  areas={areas.map((a) => ({ label: a.label, score: a.score }))}
                  size={550}
                />
              </div>
            </div>

            {/* Areas List */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {areas.map((area, index) => {
                const isDefault = index < DEFAULT_AREAS.length && !area.id
                const notesExpanded = expandedNotes.has(String(index))

                return (
                  <div key={area.id || index} className="glass-card p-4 rounded-xl">
                    <div className="flex items-start gap-4">
                      {/* Label */}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={area.label}
                          onChange={(e) => handleLabelChange(index, e.target.value)}
                          className="w-full bg-transparent border-none text-auro-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-auro-accent rounded px-2 py-1"
                          disabled={isDefault}
                        />
                      </div>

                      {/* Score display */}
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-auro-accent min-w-[3ch] text-right">
                          {area.score}
                        </span>
                        {!isDefault && (
                          <button
                            onClick={() => handleDeleteArea(index)}
                            className="p-2 rounded-lg glass-control text-auro-text-tertiary hover:text-auro-danger hover:bg-auro-danger/10 transition-colors"
                            title="Delete area"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Slider */}
                    <div className="mt-3">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={area.score}
                        onChange={(e) => handleScoreChange(index, parseInt(e.target.value))}
                        className="w-full h-2 bg-auro-surface2 rounded-lg appearance-none cursor-pointer accent-auro-accent"
                        style={{
                          background: `linear-gradient(to right, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0.3) ${
                            ((area.score - 1) / 9) * 100
                          }%, rgba(255, 255, 255, 0.08) ${((area.score - 1) / 9) * 100}%, rgba(255, 255, 255, 0.08) 100%)`,
                        }}
                      />
                      <div className="flex justify-between text-xs text-auro-text-tertiary mt-1">
                        <span>1</span>
                        <span>5</span>
                        <span>10</span>
                      </div>
                    </div>

                    {/* Notes toggle */}
                    <button
                      onClick={() => toggleNotes(index)}
                      className="mt-3 text-sm text-auro-text-secondary hover:text-auro-text-primary transition-colors flex items-center gap-2"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${notesExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      {notesExpanded ? 'Hide notes' : 'Add notes'}
                    </button>

                    {/* Notes textarea */}
                    {notesExpanded && (
                      <textarea
                        value={area.notes || ''}
                        onChange={(e) => handleNotesChange(index, e.target.value)}
                        placeholder="What do you want to be different here?"
                        className="w-full mt-3 input-field rounded-xl min-h-[80px] resize-none"
                      />
                    )}
                  </div>
                )
              })}

              {/* Add area button */}
              <button
                onClick={handleAddArea}
                className="w-full glass-card p-4 rounded-xl border-2 border-dashed border-auro-stroke-subtle hover:border-auro-accent hover:bg-auro-accent/5 transition-all text-auro-text-secondary hover:text-auro-text-primary flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add custom area</span>
              </button>
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
              {isSubmitting ? 'Saving...' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

