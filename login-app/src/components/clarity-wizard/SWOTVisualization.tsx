import { useRef } from 'react'
import { type SWOTEntry } from '../../lib/swot'

interface SWOTVisualizationProps {
  entries: SWOTEntry[]
  onNext?: () => void
  isSubmitting?: boolean
}

const QUADRANT_COLORS = {
  strength: {
    bg: 'rgba(96, 165, 250, 0.25)', // info color with opacity
    bgSolid: '#1E3A5F', // darker blue for better contrast
    text: '#F4F6FF',
    icon: '💪',
    letter: 'S',
  },
  weakness: {
    bg: 'rgba(251, 191, 36, 0.25)', // warning color with opacity
    bgSolid: '#5C4A1A', // darker yellow/gold
    text: '#F4F6FF',
    icon: '⚠️',
    letter: 'W',
  },
  opportunity: {
    bg: 'rgba(52, 211, 153, 0.25)', // success color with opacity
    bgSolid: '#1A4D3A', // darker green
    text: '#F4F6FF',
    icon: '🤝',
    letter: 'O',
  },
  threat: {
    bg: 'rgba(251, 113, 133, 0.25)', // danger color with opacity
    bgSolid: '#5C1F2A', // darker red
    text: '#F4F6FF',
    icon: '⚠️',
    letter: 'T',
  },
}

export default function SWOTVisualization({ entries, onNext, isSubmitting = false }: SWOTVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  const getEntriesByType = (type: string) => {
    return entries.filter((e) => e.type === type)
  }

  const handleDownload = () => {
    if (!svgRef.current) return

    // Create a canvas to render the SVG
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const width = 1200
    const height = 800
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
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      // Convert canvas to PNG and download
      canvas.toBlob((blob) => {
        if (!blob) return
        const pngUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = 'swot-analysis.png'
        link.href = pngUrl
        link.click()
        URL.revokeObjectURL(pngUrl)
      })
    }
    img.src = url
  }

  const hasAnyEntries = entries.length > 0

  if (!hasAnyEntries) {
    return null
  }

  const strengths = getEntriesByType('strength')
  const weaknesses = getEntriesByType('weakness')
  const opportunities = getEntriesByType('opportunity')
  const threats = getEntriesByType('threat')

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-auro-text-primary">Your SWOT Analysis</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          {onNext && (
            <button
              onClick={onNext}
              disabled={isSubmitting}
              className="px-8 py-3 rounded-full bg-white text-[#0B0C10] font-medium hover:bg-[#8B5CF6] hover:text-[#F4F6FF] transition-all shadow-[0_10px_26px_-16px_rgba(0,0,0,0.55)] hover:shadow-[0_0_22px_0_rgba(139,92,246,0.30)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Next'}
            </button>
          )}
        </div>
      </div>

      <div className="glass-card p-8 rounded-2xl overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 1200 800"
          className="w-full h-auto"
          style={{ background: 'transparent' }}
        >
          {/* Title */}
          <text
            x="600"
            y="50"
            textAnchor="middle"
            style={{
              fontSize: '32px',
              fontWeight: '600',
              fill: '#F4F6FF',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            PERSONAL SWOT ANALYSIS
          </text>

          {/* Strengths Quadrant (Top Left) */}
          <g>
            <rect x="50" y="100" width="540" height="650" fill={QUADRANT_COLORS.strength.bgSolid} rx="18" />
            <rect x="50" y="100" width="540" height="650" fill={QUADRANT_COLORS.strength.bg} rx="18" />
            <text
              x="320"
              y="180"
              textAnchor="middle"
              style={{
                fontSize: '80px',
                fontWeight: '600',
                fill: 'rgba(244, 246, 255, 0.15)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {QUADRANT_COLORS.strength.letter}
            </text>
            <rect x="60" y="200" width="520" height="60" fill="rgba(35, 38, 51, 0.85)" rx="14" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
            <text
              x="90"
              y="240"
              style={{
                fontSize: '24px',
                fontWeight: '600',
                fill: '#F4F6FF',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {QUADRANT_COLORS.strength.icon} Strengths
            </text>
            {strengths.slice(0, 8).map((entry, idx) => (
              <text
                key={entry.id}
                x="90"
                y={290 + idx * 50}
                style={{
                  fontSize: '19.2px',
                  fill: 'rgba(244, 246, 255, 0.85)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                • {entry.content.length > 50 ? entry.content.slice(0, 50) + '...' : entry.content}
              </text>
            ))}
          </g>

          {/* Weaknesses Quadrant (Top Right) */}
          <g>
            <rect x="610" y="100" width="540" height="650" fill={QUADRANT_COLORS.weakness.bgSolid} rx="18" />
            <rect x="610" y="100" width="540" height="650" fill={QUADRANT_COLORS.weakness.bg} rx="18" />
            <text
              x="880"
              y="180"
              textAnchor="middle"
              style={{
                fontSize: '80px',
                fontWeight: '600',
                fill: 'rgba(244, 246, 255, 0.15)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {QUADRANT_COLORS.weakness.letter}
            </text>
            <rect x="620" y="200" width="520" height="60" fill="rgba(35, 38, 51, 0.85)" rx="14" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
            <text
              x="650"
              y="240"
              style={{
                fontSize: '24px',
                fontWeight: '600',
                fill: '#F4F6FF',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {QUADRANT_COLORS.weakness.icon} Weaknesses
            </text>
            {weaknesses.slice(0, 8).map((entry, idx) => (
              <text
                key={entry.id}
                x="650"
                y={290 + idx * 50}
                style={{
                  fontSize: '19.2px',
                  fill: 'rgba(244, 246, 255, 0.85)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                • {entry.content.length > 50 ? entry.content.slice(0, 50) + '...' : entry.content}
              </text>
            ))}
          </g>

          {/* Opportunities Quadrant (Bottom Left) */}
          <g>
            <rect x="50" y="425" width="540" height="325" fill={QUADRANT_COLORS.opportunity.bgSolid} rx="18" />
            <rect x="50" y="425" width="540" height="325" fill={QUADRANT_COLORS.opportunity.bg} rx="18" />
            <text
              x="320"
              y="505"
              textAnchor="middle"
              style={{
                fontSize: '80px',
                fontWeight: '600',
                fill: 'rgba(244, 246, 255, 0.15)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {QUADRANT_COLORS.opportunity.letter}
            </text>
            <rect x="60" y="525" width="520" height="60" fill="rgba(35, 38, 51, 0.85)" rx="14" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
            <text
              x="90"
              y="565"
              style={{
                fontSize: '24px',
                fontWeight: '600',
                fill: '#F4F6FF',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {QUADRANT_COLORS.opportunity.icon} Opportunities
            </text>
            {opportunities.slice(0, 3).map((entry, idx) => (
              <text
                key={entry.id}
                x="90"
                y={615 + idx * 50}
                style={{
                  fontSize: '19.2px',
                  fill: 'rgba(244, 246, 255, 0.85)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                • {entry.content.length > 50 ? entry.content.slice(0, 50) + '...' : entry.content}
              </text>
            ))}
          </g>

          {/* Threats Quadrant (Bottom Right) */}
          <g>
            <rect x="610" y="425" width="540" height="325" fill={QUADRANT_COLORS.threat.bgSolid} rx="18" />
            <rect x="610" y="425" width="540" height="325" fill={QUADRANT_COLORS.threat.bg} rx="18" />
            <text
              x="880"
              y="505"
              textAnchor="middle"
              style={{
                fontSize: '80px',
                fontWeight: '600',
                fill: 'rgba(244, 246, 255, 0.15)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {QUADRANT_COLORS.threat.letter}
            </text>
            <rect x="620" y="525" width="520" height="60" fill="rgba(35, 38, 51, 0.85)" rx="14" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
            <text
              x="650"
              y="565"
              style={{
                fontSize: '24px',
                fontWeight: '600',
                fill: '#F4F6FF',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {QUADRANT_COLORS.threat.icon} Threats
            </text>
            {threats.slice(0, 3).map((entry, idx) => (
              <text
                key={entry.id}
                x="650"
                y={615 + idx * 50}
                style={{
                  fontSize: '19.2px',
                  fill: 'rgba(244, 246, 255, 0.85)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                • {entry.content.length > 50 ? entry.content.slice(0, 50) + '...' : entry.content}
              </text>
            ))}
          </g>

          {/* Center dividing lines */}
          <line x1="600" y1="100" x2="600" y2="750" stroke="rgba(255, 255, 255, 0.14)" strokeWidth="2" />
          <line x1="50" y1="425" x2="1150" y2="425" stroke="rgba(255, 255, 255, 0.14)" strokeWidth="2" />
        </svg>
      </div>
    </div>
  )
}

