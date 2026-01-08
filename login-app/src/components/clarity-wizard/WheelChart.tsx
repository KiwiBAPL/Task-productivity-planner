import { useMemo, forwardRef } from 'react'

interface WheelChartProps {
  areas: Array<{
    label: string
    score: number // 1-10
  }>
  size?: number
}

const WheelChart = forwardRef<SVGSVGElement, WheelChartProps>(({ areas, size = 400 }, ref) => {
  // Add generous padding for labels to prevent cutoff on all sides
  const padding = 80
  const innerSize = size - (padding * 2)
  const centerX = size / 2
  const centerY = size / 2
  const maxRadius = innerSize * 0.38
  const labelRadius = maxRadius + 60

  // Calculate polygon points and labels
  const { polygonPoints, labels } = useMemo(() => {
    if (areas.length === 0) {
      return { polygonPoints: '', labels: [] }
    }

    const points: string[] = []
    const labelData: Array<{
      x: number
      y: number
      label: string
      words: string[]
      align: 'start' | 'middle' | 'end'
      baseline: string
    }> = []

    areas.forEach((area, index) => {
      const angle = (index * 360) / areas.length - 90 // Start from top
      const angleRad = (angle * Math.PI) / 180
      
      // Calculate point position based on score (1-10)
      const radius = (area.score / 10) * maxRadius
      const x = centerX + radius * Math.cos(angleRad)
      const y = centerY + radius * Math.sin(angleRad)
      points.push(`${x},${y}`)

      // Calculate label position with extra spacing
      const labelX = centerX + labelRadius * Math.cos(angleRad)
      const labelY = centerY + labelRadius * Math.sin(angleRad)
      
      // Determine text alignment based on angle
      let align: 'start' | 'middle' | 'end' = 'middle'
      let baseline = 'middle'
      
      const cosAngle = Math.cos(angleRad)
      const sinAngle = Math.sin(angleRad)
      
      // Improve alignment for better label positioning
      if (Math.abs(cosAngle) > 0.2) {
        align = cosAngle > 0 ? 'start' : 'end'
      }
      
      if (Math.abs(sinAngle) > 0.2) {
        baseline = sinAngle > 0 ? 'hanging' : 'baseline'
      }

      // Split multi-word labels for better wrapping
      const words = area.label.split(' ')
      
      labelData.push({
        x: labelX,
        y: labelY,
        label: area.label,
        words,
        align,
        baseline,
      })
    })

    return {
      polygonPoints: points.join(' '),
      labels: labelData,
    }
  }, [areas, centerX, centerY, maxRadius, labelRadius])

  // Generate concentric circles for score levels
  const circles = useMemo(() => {
    return [2, 4, 6, 8, 10].map((level) => ({
      level,
      radius: (level / 10) * maxRadius,
    }))
  }, [maxRadius])

  // Generate radial lines
  const radialLines = useMemo(() => {
    if (areas.length === 0) return []

    return areas.map((_, index) => {
      const angle = (index * 360) / areas.length - 90
      const angleRad = (angle * Math.PI) / 180
      const x = centerX + maxRadius * Math.cos(angleRad)
      const y = centerY + maxRadius * Math.sin(angleRad)
      return { x, y }
    })
  }, [areas, centerX, centerY, maxRadius])

  if (areas.length === 0) {
    return (
      <div
        className="flex items-center justify-center glass-card rounded-2xl"
        style={{ width: size, height: size }}
      >
        <p className="text-auro-text-tertiary text-sm">No areas to display</p>
      </div>
    )
  }

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="wheel-chart"
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      <defs>
        <linearGradient id="wheelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(139, 92, 246, 0.3)" />
          <stop offset="100%" stopColor="rgba(139, 92, 246, 0.1)" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Concentric circles for score levels */}
      {circles.map(({ level, radius }) => (
        <g key={level}>
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
          />
          {/* Score labels */}
          <text
            x={centerX}
            y={centerY - radius - 5}
            fill="rgba(255, 255, 255, 0.3)"
            fontSize="10"
            textAnchor="middle"
            dominantBaseline="baseline"
          >
            {level}
          </text>
        </g>
      ))}

      {/* Radial lines */}
      {radialLines.map((point, index) => (
        <line
          key={index}
          x1={centerX}
          y1={centerY}
          x2={point.x}
          y2={point.y}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
        />
      ))}

      {/* Data polygon */}
      {polygonPoints && (
        <g>
          {/* Fill */}
          <polygon
            points={polygonPoints}
            fill="url(#wheelGradient)"
            stroke="rgba(139, 92, 246, 0.6)"
            strokeWidth="2"
            style={{
              transition: 'all 0.3s ease-in-out',
            }}
          />
          {/* Data points */}
          {polygonPoints.split(' ').map((point, index) => {
            const [x, y] = point.split(',').map(Number)
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="rgba(139, 92, 246, 1)"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="2"
                filter="url(#glow)"
                style={{
                  transition: 'all 0.3s ease-in-out',
                }}
              />
            )
          })}
        </g>
      )}

      {/* Area labels */}
      {labels.map((label, index) => {
        // Handle multi-word labels by splitting into multiple lines if needed
        if (label.words.length > 2) {
          const midPoint = Math.ceil(label.words.length / 2)
          const line1 = label.words.slice(0, midPoint).join(' ')
          const line2 = label.words.slice(midPoint).join(' ')
          
          return (
            <text
              key={index}
              x={label.x}
              y={label.y}
              fill="rgba(255, 255, 255, 0.9)"
              fontSize="12"
              fontWeight="500"
              textAnchor={label.align}
              dominantBaseline={label.baseline}
              style={{
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <tspan x={label.x} dy="-0.5em">{line1}</tspan>
              <tspan x={label.x} dy="1.2em">{line2}</tspan>
            </text>
          )
        }
        
        return (
          <text
            key={index}
            x={label.x}
            y={label.y}
            fill="rgba(255, 255, 255, 0.9)"
            fontSize="12"
            fontWeight="500"
            textAnchor={label.align}
            dominantBaseline={label.baseline}
            style={{
              transition: 'all 0.3s ease-in-out',
            }}
          >
            {label.label}
          </text>
        )
      })}
    </svg>
  )
})

WheelChart.displayName = 'WheelChart'

export default WheelChart
