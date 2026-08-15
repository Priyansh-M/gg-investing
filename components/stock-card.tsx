'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { removeStock } from '@/app/actions/stockManagement' // Update import path if needed

interface StockCardProps {
  symbol: string
  name: string
  fallbackPrice?: number
  fallbackReturn?: number
  marketCap?: string
  onRemove?: (symbol: string) => void
}

interface FinnhubQuote {
  c: number  // Current price
  dp: number // Daily percent change
}

export function StockCard({
  symbol,
  name,
  fallbackPrice = 150.00,
  fallbackReturn = 0.00,
  marketCap = 'N/A',
  onRemove
}: StockCardProps) {
  const router = useRouter()
  const [price, setPrice] = useState<number | null>(null)
  const [percentChange, setPercentChange] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isRemoving, startTransition] = useTransition()

  useEffect(() => {
    let isMounted = true

    async function fetchStockQuote() {
      try {
        const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY

        if (!apiKey) {
          throw new Error("Missing NEXT_PUBLIC_FINNHUB_API_KEY in .env.local")
        }

        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
        )

        if (!response.ok) {
          throw new Error(`Finnhub returned HTTP status ${response.status}`)
        }

        const data: FinnhubQuote = await response.json()

        if (isMounted) {
          if (data && typeof data.c === 'number' && data.c > 0) {
            setPrice(data.c)
            setPercentChange(data.dp ?? 0)
          } else {
            setPrice(fallbackPrice)
            setPercentChange(fallbackReturn)
          }
        }
      } catch (error) {
        console.warn(`[Finnhub Quote] Using fallback data for ${symbol}:`, error)
        if (isMounted) {
          setPrice(fallbackPrice)
          setPercentChange(fallbackReturn)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchStockQuote()

    return () => {
      isMounted = false
    }
  }, [symbol, fallbackPrice, fallbackReturn])

  // Handle stock removal and refresh UI
  const handleRemove = () => {
    startTransition(async () => {
      const res = await removeStock(symbol)
      if (res?.success) {
        if (onRemove) onRemove(symbol)
        router.refresh() // Purges Next.js cache to remove card immediately
      } else {
        alert(`Failed to remove stock: ${res?.error || 'Unknown error'}`)
      }
    })
  }

  const isPositive = (percentChange ?? 0) >= 0

  return (
    <div className="bg-[#121724] border border-slate-800 p-5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-colors relative group">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            Equity | Market
          </span>
          
          {/* Remove Stock Button */}
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-xs text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50 px-2 py-0.5 rounded hover:bg-red-950/40 border border-transparent hover:border-red-800/40"
            title="Remove from portfolio"
          >
            {isRemoving ? 'Deleting...' : 'Remove'}
          </button>
        </div>

        <h3 className="text-lg font-bold text-white mb-4 pr-12">
          {name} ({symbol})
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-4 text-xs">
        {/* Market Price */}
        <div>
          <p className="text-slate-500 mb-1">Market Price</p>
          {loading ? (
            <div className="h-5 w-16 bg-slate-800 rounded animate-pulse mt-1" />
          ) : (
            <p className="font-bold text-white text-sm">
              ${price?.toFixed(2)}
            </p>
          )}
        </div>

        {/* Market Cap */}
        <div>
          <p className="text-slate-500 mb-1">Market Cap</p>
          <p className="font-semibold text-slate-300 mt-1">{marketCap}</p>
        </div>

        {/* 1D Return */}
        <div>
          <p className="text-slate-500 mb-1">Return (1D)</p>
          {loading ? (
            <div className="h-5 w-12 bg-slate-800 rounded animate-pulse mt-1" />
          ) : (
            <p className={`font-bold mt-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{percentChange?.toFixed(2)}%
            </p>
          )}
        </div>
      </div>
    </div>
  )
}