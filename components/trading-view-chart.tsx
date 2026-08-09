'use client'

import { useEffect, useRef } from 'react'

interface ChartProps {
  symbol: string
}

export function TradingViewChart({ symbol }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous chart on stock switch
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol === 'BTC' ? 'CRYPTO:BTCUSD' : `NASDAQ:${symbol}`,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1', // 1 = Candlesticks
      locale: 'en',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      container_id: 'tradingview_chart_element'
    })

    containerRef.current.appendChild(script)
  }, [symbol])

  return (
    <div className="w-full h-[500px] bg-[#0b0e14] border border-slate-800 rounded-2xl overflow-hidden p-2 shadow-xl">
      <div 
        id="tradingview_chart_element" 
        ref={containerRef} 
        className="w-full h-full" 
      />
    </div>
  )
}