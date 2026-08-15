"use client"

import { useState, useEffect, memo, FC } from 'react'
import Marquee from 'react-fast-marquee'
import { getLiveWatchlistQuotes } from '@/app/actions/marketSync'

const DEFAULT_TICKERS = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMZN']

interface StockTickerProps {
  userId?: string
}

const StockTickerComponent: FC<StockTickerProps> = ({ userId }) => {
  const [stocks, setStocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch live market quotes for saved tickers
  const fetchTickerData = async () => {
    let savedTickers: string[] = DEFAULT_TICKERS

    if (typeof window !== 'undefined') {
      let saved: string | null = null

      // 1. Check specific key if userId is passed
      if (userId) {
        saved = localStorage.getItem(`favorites_${userId}`)
      }

      // 2. If no userId or specific key found, search for any user's favorites key
      if (!saved) {
        const matchingKey = Object.keys(localStorage).find((key) =>
          key.startsWith('favorites_')
        )
        if (matchingKey) {
          saved = localStorage.getItem(matchingKey)
        }
      }

      // 3. Parse saved favorites if they exist and aren't empty
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            savedTickers = parsed
          }
        } catch (e) {
          console.error("Failed to parse ticker favorites:", e)
        }
      }
    }

    try {
      const data = await getLiveWatchlistQuotes(savedTickers)
      if (Array.isArray(data) && data.length > 0) {
        setStocks(data)
      }
    } catch (err) {
      console.error("Error fetching live ticker quotes:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickerData()

    const handleSync = () => fetchTickerData()

    window.addEventListener('favoritesUpdated', handleSync)
    window.addEventListener('storage', handleSync)

    return () => {
      window.removeEventListener('favoritesUpdated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [userId])

  if (loading && stocks.length === 0) {
    return (
      <div className="w-full bg-[#0b0e14] border-b border-slate-800/80 py-2 text-center text-xs text-slate-500">
        Loading live market ticker...
      </div>
    )
  }

  if (stocks.length === 0) return null

  return (
    <div className="w-full bg-[#0b0e14] border-b border-slate-800/80 py-2 overflow-hidden select-none">
      <Marquee direction="left" speed={35} gradient={false}>
        {stocks.map((stock, index) => {
          const symbol = stock.symbol || 'N/A'
          const price = stock.current_price || 0
          const change = stock.change_percent || 0
          const isUp = change > 0
          const isDown = change < 0

          const changeColor = isUp
            ? "text-emerald-400"
            : isDown
              ? "text-red-400"
              : "text-slate-400"

          return (
            <span
              key={`${symbol}-${index}`}
              className="inline-flex items-center gap-2 mx-6 text-xs font-semibold tabular-nums"
            >
              <span className="text-slate-400 font-bold">
                ${symbol.toUpperCase()}
              </span>
              <span className="text-slate-200">
                ${Number(price).toFixed(2)}
              </span>
              <span className={`inline-flex items-center gap-0.5 ${changeColor}`}>
                {isUp ? "▲" : isDown ? "▼" : "—"}
                {isUp ? "+" : ""}
                {Number(change).toFixed(2)}%
              </span>
            </span>
          )
        })}
      </Marquee>
    </div>
  )
}

export const StockTicker = memo(StockTickerComponent)