'use client'

import { useState, useEffect } from 'react'
import { 
  RefreshCw, 
  Trash2, 
  AlertCircle, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react'
import { getLiveWatchlistQuotes } from '@/app/actions/marketSync'

interface FavoritesListProps {
  userId: string
}

function formatMarketCap(val: number | null | undefined): string {
  if (!val || isNaN(val) || val <= 0) return 'N/A'
  
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`
  return `$${val.toLocaleString()}`
}

export function FavoritesList({ userId }: FavoritesListProps) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [stockData, setStockData] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const storageKey = `favorites_${userId}`

  // 1. Initial Load
  useEffect(() => {
    if (!userId) return

    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFavorites(parsed)
        } else {
          setFavorites(['NVDA', 'AAPL', 'MSFT'])
        }
      } catch (e) {
        setFavorites(['NVDA', 'AAPL', 'MSFT'])
      }
    } else {
      setFavorites(['NVDA', 'AAPL', 'MSFT'])
    }
    setIsLoaded(true)
  }, [userId, storageKey])

  // 2. Sync listener
  useEffect(() => {
    const syncFavorites = () => {
      if (!userId) return
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            setFavorites(parsed)
          }
        } catch (e) {
          console.error("Failed to parse favorites sync", e)
        }
      }
    }

    window.addEventListener('favoritesUpdated', syncFavorites)
    window.addEventListener('storage', syncFavorites)

    return () => {
      window.removeEventListener('favoritesUpdated', syncFavorites)
      window.removeEventListener('storage', syncFavorites)
    }
  }, [userId, storageKey])

  // 3. Fetch from Finnhub
  useEffect(() => {
    if (!isLoaded || !userId) return 

    localStorage.setItem(storageKey, JSON.stringify(favorites))
    
    // -> ADDED: Notify ticker whenever favorites are saved/loaded on mount
    window.dispatchEvent(new Event('favoritesUpdated'))

    const fetchRealData = async () => {
      if (favorites.length === 0) {
        setStockData([])
        return
      }

      setIsRefreshing(true)
      try {
        const data = await getLiveWatchlistQuotes(favorites)
        setStockData(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching live stock data:", error)
        setStockData([])
      } finally {
        setTimeout(() => setIsRefreshing(false), 300)
      }
    }

    fetchRealData()
  }, [favorites, isLoaded, userId, storageKey])

  const removeFavorite = (symbolToRemove: string) => {
    setFavorites(prev => {
      const updated = prev.filter(sym => sym.toUpperCase() !== symbolToRemove.toUpperCase())
      localStorage.setItem(storageKey, JSON.stringify(updated))
      window.dispatchEvent(new Event('favoritesUpdated'))
      return updated
    })
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    setFavorites(prev => {
      const newFavs = [...prev]
      const temp = newFavs[index - 1]
      newFavs[index - 1] = newFavs[index]
      newFavs[index] = temp
      
      localStorage.setItem(storageKey, JSON.stringify(newFavs))
      window.dispatchEvent(new Event('favoritesUpdated'))
      return newFavs
    })
  }

  const moveDown = (index: number) => {
    if (index === favorites.length - 1) return
    setFavorites(prev => {
      const newFavs = [...prev]
      const temp = newFavs[index + 1]
      newFavs[index + 1] = newFavs[index]
      newFavs[index] = temp

      localStorage.setItem(storageKey, JSON.stringify(newFavs))
      window.dispatchEvent(new Event('favoritesUpdated'))
      return newFavs
    })
  }

  if (!isLoaded) {
    return (
      <div className="bg-[#121724] border border-slate-800 rounded-xl p-6 text-slate-400 text-sm">
        Loading watchlist...
      </div>
    )
  }

  const safeStockData = Array.isArray(stockData) ? stockData : []

  return (
    <div className="bg-[#121724] border border-slate-800 rounded-xl overflow-hidden p-6 relative">
      
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-white text-lg">Watchlist</h3>
          <p className="text-xs text-slate-400">Real-time market data matching your saved tickers</p>
        </div>
        
        <button 
          onClick={() => setFavorites([...favorites])} 
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors text-xs font-semibold disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Syncing...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {favorites.length === 0 && (
          <div className="text-center py-8 text-slate-500 flex flex-col items-center gap-2">
            <AlertCircle size={24} className="text-slate-600" />
            <p className="text-xs">Your watchlist is empty. Add stocks from the market tab!</p>
          </div>
        )}

        {favorites.map((favSymbol, index) => {
          const stock = safeStockData.find(
            (s: any) => s?.symbol?.toUpperCase() === favSymbol.toUpperCase()
          ) || {
            symbol: favSymbol,
            company_name: favSymbol,
            current_price: 0,
            market_cap: 0,
            change_percent: 0
          }

          // Variables cleanly mapped from Finnhub
          const marketCapValue = stock.market_cap || 0
          const currentPrice = stock.current_price || 0
          const change = stock.change_percent || 0 
          const isPositive = change >= 0

          return (
            <div key={`${favSymbol}-${index}`} className="bg-[#0b0e14] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-start border-b border-slate-800/60 pb-4 mb-4">
                <div>
                  <div className="text-[11px] font-medium mb-1.5 tracking-wide">
                    <span className="text-emerald-400">Equity</span>
                    <span className="text-slate-500"> | Market</span>
                  </div>
                  <h4 className="text-white font-bold text-lg">{stock.company_name} ({stock.symbol})</h4>
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-end gap-4">
                <div className="flex gap-8 sm:gap-16">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Market Price</div>
                    <div className="text-sm text-slate-200 font-semibold">
                      {currentPrice ? `$${Number(currentPrice).toFixed(2)}` : 'Loading...'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Market Cap</div>
                    <div className="text-sm text-slate-200 font-semibold">{formatMarketCap(marketCapValue)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Return (1D)</div>
                    <div className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{change.toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-transparent transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move Up"
                    >
                      <ChevronUp size={12} strokeWidth={3} />
                    </button>
                    <button 
                      onClick={() => moveDown(index)}
                      disabled={index === favorites.length - 1}
                      className="p-1 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-transparent transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move Down"
                    >
                      <ChevronDown size={12} strokeWidth={3} />
                    </button>
                  </div>

                  <button 
                    onClick={() => removeFavorite(favSymbol)}
                    className="flex items-center gap-1.5 h-full px-3 py-2 bg-slate-800/50 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded border border-transparent hover:border-red-900/50 transition-all text-xs font-medium"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>

              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}