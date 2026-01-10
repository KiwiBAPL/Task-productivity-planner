import { useState, useEffect } from 'react'
import { getWheelOfLifeAreas, type WheelOfLifeArea } from '../../lib/wheel-of-life'
import { getSWOTEntries, type SWOTEntry } from '../../lib/swot'
// Skeleton components reserved for future loading state enhancement
// #region agent log
fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SupportiveContextPanel.tsx:1',message:'SupportiveContextPanel loading',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
// #endregion

interface SupportiveContextPanelProps {
  journeyId: string
}

export default function SupportiveContextPanel({ journeyId }: SupportiveContextPanelProps) {
  const [wheelAreas, setWheelAreas] = useState<WheelOfLifeArea[]>([])
  const [swotEntries, setSwotEntries] = useState<SWOTEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError('')

      try {
        // Load Wheel of Life data
        const wheelResult = await getWheelOfLifeAreas(journeyId)
        if (wheelResult.success && wheelResult.data) {
          setWheelAreas(wheelResult.data as WheelOfLifeArea[])
        }

        // Load SWOT data
        const swotResult = await getSWOTEntries(journeyId)
        if (swotResult.success && swotResult.data) {
          setSwotEntries(swotResult.data as SWOTEntry[])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load context data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [journeyId])

  // Get top 3 highest scores (strengths)
  const strengths = wheelAreas
    .filter((area) => area.score >= 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  // Get top 3 lowest scores (growth areas)
  const growthAreas = wheelAreas
    .filter((area) => area.score <= 4)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)

  // Group SWOT entries by type (prioritize entries with notes)
  const getEntriesByType = (type: 'strength' | 'weakness' | 'opportunity' | 'threat') => {
    return swotEntries
      .filter((entry) => entry.type === type)
      .sort((a, b) => {
        // Prioritize entries with notes
        if (a.notes && !b.notes) return -1
        if (!a.notes && b.notes) return 1
        return 0
      })
      .slice(0, 3)
  }

  const strengths_swot = getEntriesByType('strength')
  const weaknesses = getEntriesByType('weakness')
  const opportunities = getEntriesByType('opportunity')
  const threats = getEntriesByType('threat')

  if (isLoading) {
    return (
      <div className="glass-card p-5 rounded-2xl border border-auro-stroke-subtle sticky top-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
          <div className="h-4 bg-white/10 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-5 rounded-2xl border border-auro-stroke-subtle sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <svg className="w-5 h-5 text-auro-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-sm font-semibold text-auro-text-primary">Supportive Context</h3>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 rounded-xl bg-auro-danger/10 border border-auro-danger/30 mb-4">
          <p className="text-xs text-auro-danger">{error}</p>
        </div>
      )}

      {/* Wheel of Life Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-auro-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h4 className="text-xs font-medium text-auro-text-secondary uppercase tracking-wider">
            Wheel of Life
          </h4>
        </div>

        {wheelAreas.length === 0 ? (
          <p className="text-xs text-auro-text-tertiary italic">No data yet</p>
        ) : (
          <div className="space-y-4">
            {/* Strengths */}
            {strengths.length > 0 && (
              <div>
                <p className="text-xs font-medium text-auro-success mb-2">High Scores (≥ 8)</p>
                <ul className="space-y-1.5">
                  {strengths.map((area, index) => (
                    <li key={index} className="flex items-center justify-between text-xs">
                      <span className="text-auro-text-primary">{area.label}</span>
                      <span className="font-mono text-auro-success">{area.score}/10</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Growth Areas */}
            {growthAreas.length > 0 && (
              <div>
                <p className="text-xs font-medium text-auro-warning mb-2">Growth Areas (≤ 4)</p>
                <ul className="space-y-1.5">
                  {growthAreas.map((area, index) => (
                    <li key={index} className="flex items-center justify-between text-xs">
                      <span className="text-auro-text-primary">{area.label}</span>
                      <span className="font-mono text-auro-warning">{area.score}/10</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {strengths.length === 0 && growthAreas.length === 0 && (
              <p className="text-xs text-auro-text-tertiary italic">No notable scores yet</p>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-auro-divider mb-6" />

      {/* SWOT Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-auro-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h4 className="text-xs font-medium text-auro-text-secondary uppercase tracking-wider">
            SWOT Analysis
          </h4>
        </div>

        {swotEntries.length === 0 ? (
          <p className="text-xs text-auro-text-tertiary italic">No data yet</p>
        ) : (
          <div className="space-y-4">
            {/* Strengths */}
            {strengths_swot.length > 0 && (
              <div>
                <p className="text-xs font-medium text-auro-success mb-2">Strengths</p>
                <ul className="space-y-1.5">
                  {strengths_swot.map((entry, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-auro-text-primary">
                      <span className="text-auro-success mt-0.5">•</span>
                      <span className="flex-1 line-clamp-2">{entry.content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {weaknesses.length > 0 && (
              <div>
                <p className="text-xs font-medium text-auro-warning mb-2">Weaknesses</p>
                <ul className="space-y-1.5">
                  {weaknesses.map((entry, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-auro-text-primary">
                      <span className="text-auro-warning mt-0.5">•</span>
                      <span className="flex-1 line-clamp-2">{entry.content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Opportunities */}
            {opportunities.length > 0 && (
              <div>
                <p className="text-xs font-medium text-auro-info mb-2">Opportunities</p>
                <ul className="space-y-1.5">
                  {opportunities.map((entry, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-auro-text-primary">
                      <span className="text-auro-info mt-0.5">•</span>
                      <span className="flex-1 line-clamp-2">{entry.content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Threats */}
            {threats.length > 0 && (
              <div>
                <p className="text-xs font-medium text-auro-danger mb-2">Threats</p>
                <ul className="space-y-1.5">
                  {threats.map((entry, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-auro-text-primary">
                      <span className="text-auro-danger mt-0.5">•</span>
                      <span className="flex-1 line-clamp-2">{entry.content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
