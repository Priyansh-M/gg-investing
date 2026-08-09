'use client'

import { useState, useEffect } from 'react'

interface PortfolioChartProps {
  userId?: string
}

// Deterministic chart data generator to prevent server/client mismatches
const generateChartData = (timeframe: string) => {
  const points = timeframe === '1D' ? 12 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 50
  const baseValue = 1000
  const data = []
  
  let current = baseValue
  for (let i = 0; i < points; i++) {
    // Smooth mathematical curve instead of pure random to ensure stability
    const variation = Math.sin(i * 0.6) * 12 + Math.cos(i * 0.4) * 8
    current = Math.max(800, current + variation)
    data.push({
      label: `T${i + 1}`,
      value: Number(current.toFixed(2))
    })
  }
  return data
}

export function PortfolioChart({ userId }: PortfolioChartProps) {
  const [mounted, setMounted] = useState(false)
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '1Y' | 'ALL'>('1M')

  // Prevent SSR Hydration Mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="bg-[#121724] border border-slate-800 p-6 rounded-xl h-[280px] flex items-center justify-center">
        <div className="animate-pulse text-slate-500 text-sm">Loading Chart...</div>
      </div>
    )
  }

  const data = generateChartData(timeframe)
  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const height = 180
  const width = 600

  const pointsString = data.map((d, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((d.value - min) / range) * (height - 30) - 15
    return `${x},${y}`
  }).join(' ')

  const areaString = `0,${height} ${pointsString} ${width},${height}`
  const isPositive = values[values.length - 1] >= values[0]
  const strokeColor = isPositive ? '#10b981' : '#ef4444'
  const gradientId = `portfolioGradient-${userId || 'default'}`

  return (
    <div className="bg-[#121724] border border-slate-800 p-6 rounded-xl flex flex-col justify-between space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-white text-base">Portfolio Performance</h3>
          <p className="text-xs text-slate-400">Track total asset evaluation trends</p>
        </div>

        <div className="flex bg-[#0b0e14] p-1 rounded-lg border border-slate-800 text-xs">
          {(['1D', '1W', '1M', '1Y', 'ALL'] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full overflow-hidden pt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <polygon points={areaString} fill={`url(#${gradientId})`} />

          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsString}
          />
        </svg>
      </div>
    </div>
  )
}

export default PortfolioChart