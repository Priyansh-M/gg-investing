'use client'

import { useState, useEffect, useCallback } from 'react'
import Marquee from 'react-fast-marquee'
import { getLiveWatchlistQuotes } from '@/app/actions/marketSync'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function StockTicker() {
  const [stockData, setStockData] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchTickerData = useCallback(async () => {
    // Check for window to ensure client-side execution
    if (typeof window === 'undefined') return

    try {
      // 1. Get user favorites from localStorage
      let symbols = ['NVDA', 'AAPL', 'MSFT']
      const favKey = Object.keys(localStorage).find(key => key.startsWith('favorites_'))
      
      if (favKey) {
        const saved = localStorage.getItem(favKey)
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            if (Array.isArray(parsed) && parsed.length > 0) {
              symbols = parsed
            }
          } catch (e) {
            console.error("Error parsing stored favorites for ticker", e)
          }
        }
      }

      // 2. Cache Configuration
      const CACHE_KEY = 'ticker_price_cache'
      const TIME_KEY = 'ticker_last_fetched'
      const SYMBOLS_KEY = 'ticker_cached_symbols'
      const ONE_HOUR = 60 * 60 * 1000 // 1 hour in ms

      const cachedPrices = localStorage.getItem(CACHE_KEY)
      const lastFetched = localStorage.getItem(TIME_KEY)
      const cachedSymbols = localStorage.getItem(SYMBOLS_KEY)

      // 3. Cache Validation Check
      const symbolsUnchanged = cachedSymbols === JSON.stringify(symbols)
      const isCacheValid = lastFetched && (Date.now() - Number(lastFetched) < ONE_HOUR)

      if (cachedPrices && isCacheValid && symbolsUnchanged) {
        setStockData(JSON.parse(cachedPrices))
        setIsLoaded(true)
        return
      }

      // 4. Fetch Fresh Quotes Only When Cache Is Invalid
      const data = await getLiveWatchlistQuotes(symbols)
      const safeData = Array.isArray(data) ? data : []
      
      setStockData(safeData)
      
      // 5. Update Cache
      if (safeData.length > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(safeData))
        localStorage.setItem(TIME_KEY, Date.now().toString())
        localStorage.setItem(SYMBOLS_KEY, JSON.stringify(symbols))
      }
      
      setIsLoaded(true)
    } catch (error) {
      console.error("Ticker fetch error:", error)
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const runFetch = async () => {
      if (isMounted) {
        await fetchTickerData()
      }
    }

    runFetch()
    
    const handleSync = () => {
      if (isMounted) fetchTickerData()
    }

    window.addEventListener('favoritesUpdated', handleSync)
    
    return () => {
      isMounted = false
      window.removeEventListener('favoritesUpdated', handleSync)
    }
  }, [fetchTickerData])

  if (!isLoaded) {
    return (
      <div className="h-12 bg-[#0b0e14] border-b border-slate-800/60 w-full flex items-center justify-center text-xs text-slate-500">
        Loading market ticker...
      </div>
    )
  }

  if (stockData.length === 0) return null

  return (
    <div className="bg-[#0b0e14] border-b border-slate-800/60 w-full overflow-hidden flex items-center h-12">
      <Marquee 
        gradient={false} 
        speed={35} 
        pauseOnHover={true} 
        autoFill={false}
        play={true}
        className="overflow-hidden"
      >
        <div className="flex items-center gap-10 pr-10">
          {stockData.map((stock, index) => {
            const currentPrice = stock?.current_price || 0
            const change = stock?.change_percent || 0
            const isPositive = change > 0
            const isNeutral = change === 0

            return (
              <div key={`${stock.symbol}-${index}`} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <span className="text-white font-bold">{stock.symbol}</span>
                <span className="text-slate-300">${Number(currentPrice).toFixed(2)}</span>
                
                <span className={`flex items-center text-xs font-bold ${
                  isPositive ? 'text-emerald-400' : isNeutral ? 'text-slate-400' : 'text-red-400'
                }`}>
                  {isPositive && <TrendingUp size={14} className="mr-1" />}
                  {!isPositive && !isNeutral && <TrendingDown size={14} className="mr-1" />}
                  {isNeutral && <Minus size={14} className="mr-1" />}
                  {isPositive ? '+' : ''}{change.toFixed(2)}%
                </span>
              </div>
            )
          })}
        </div>
      </Marquee>
    </div>
  )
}