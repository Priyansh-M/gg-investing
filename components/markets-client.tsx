'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TradingViewChart } from '@/components/trading-view-chart'
import { Button } from '@/components/ui/button'
import { syncLiveMarketPrices, getLiveWatchlistQuotes } from '@/app/actions/marketSync'
import { addStock, removeStock } from '@/app/actions/stockManagement'
import { FavoriteToggle } from '@/components/favorite-toggle'
import { 
  Search, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Loader2, 
  BarChart3, 
  Info 
} from 'lucide-react'

interface Stock {
  symbol: string
  company_name: string
  current_price: number
  sector?: string
  market_cap?: number | string
  pe_ratio?: number
  fifty_two_week_high?: number
  fifty_two_week_low?: number
  volume?: number
  avg_volume?: number
  dividend_yield?: number
  beta?: number
  day_high?: number
  day_low?: number
}

interface Holding {
  symbol: string
  quantity: number
}

interface SearchResult {
  symbol: string
  name: string
  type?: string
  exchange?: string
}

interface Props {
  userId: string
  stocks: Stock[]
  holdings: Holding[]
  cashBalance: number
}

export function MarketsClient({ userId, stocks = [], holdings = [], cashBalance }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [selectedSymbol, setSelectedSymbol] = useState<string>(stocks[0]?.symbol || 'AAPL')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // State to hold live Finnhub data
  const [liveData, setLiveData] = useState<Record<string, any>>({})

  const searchContainerRef = useRef<HTMLDivElement>(null)
  const selectedStock = stocks.find((s) => s.symbol.toUpperCase() === selectedSymbol.toUpperCase())

  // Ensure selectedSymbol syncs if stocks array updates
  useEffect(() => {
    if (stocks.length > 0 && !stocks.some(s => s.symbol.toUpperCase() === selectedSymbol.toUpperCase())) {
      setSelectedSymbol(stocks[0].symbol)
    }
  }, [stocks])

  // Fetch Live Data from Finnhub on mount
  useEffect(() => {
    const fetchLiveData = async () => {
      const symbols = stocks.map(s => s.symbol)
      if (symbols.length === 0) return
      
      try {
        const data = await getLiveWatchlistQuotes(symbols)
        const mappedData: Record<string, any> = {}
        if (Array.isArray(data)) {
          data.forEach(item => {
            mappedData[item.symbol] = item
          })
        }
        setLiveData(mappedData)
      } catch (err) {
        console.error("Failed to fetch live data for markets page:", err)
      }
    }
    
    fetchLiveData()
  }, [stocks])

  // Live Auto-Complete Search Listener
  useEffect(() => {
    if (searchQuery.trim().length < 1) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        let res = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`)
        if (!res.ok) {
          res = await fetch(`/api/stocks?q=${encodeURIComponent(searchQuery)}`)
        }

        if (res.ok) {
          const data = await res.json()
          setSearchResults(Array.isArray(data) ? data : [])
          setShowDropdown(true)
        }
      } catch (err) {
        console.error('Failed to search ticker:', err)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Programmatic Add Stock Execution
  const handleAddStock = async (tickerToAdd: string) => {
    if (!tickerToAdd || isSubmitting) return

    setIsSubmitting(true)
    setShowDropdown(false)

    try {
      const res = await addStock(tickerToAdd)
      if (res?.success) {
        setSearchQuery('')
        if (res.symbol) setSelectedSymbol(res.symbol)
        startTransition(() => {
          router.refresh()
        })
      } else {
        alert(res?.error || 'Failed to add stock.')
      }
    } catch (err: any) {
      alert(err?.message || 'Error adding stock.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Programmatic Remove Stock Execution
  const handleRemoveStock = async (symbolToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!confirm(`Are you sure you want to remove ${symbolToRemove} from your market list?`)) return

    try {
      const res = await removeStock(symbolToRemove)
      if (res?.success) {
        if (selectedSymbol.toUpperCase() === symbolToRemove.toUpperCase()) {
          const remaining = stocks.filter(s => s.symbol.toUpperCase() !== symbolToRemove.toUpperCase())
          if (remaining.length > 0) setSelectedSymbol(remaining[0].symbol)
        }
        startTransition(() => {
          router.refresh()
        })
      } else {
        alert(res?.error || 'Failed to remove stock.')
      }
    } catch (err: any) {
      alert(err?.message || 'Error removing stock.')
    }
  }

  // Format Market Cap
  const formatLargeNumber = (val?: number | string | null) => {
    if (!val || isNaN(Number(val)) || Number(val) <= 0) return 'N/A'
    
    const num = Number(val)
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    return `$${num.toLocaleString()}`
  }

  const liveSelected = liveData[selectedSymbol]
  const currentPrice = liveSelected?.current_price || selectedStock?.current_price || 0
  const activeMarketCap = liveSelected?.market_cap || selectedStock?.market_cap
  
  const dayLow = selectedStock?.day_low || currentPrice * 0.98
  const dayHigh = selectedStock?.day_high || currentPrice * 1.02
  const dayRangeProgress = Math.min(
    Math.max(((currentPrice - dayLow) / (dayHigh - dayLow || 1)) * 100, 0),
    100
  )

  return (
    <div className="space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121724] p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Stock Market</h1>
          <p className="text-sm text-slate-400">
            Real-time tickers, live charts, and key market statistics
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Add Stock Search Bar */}
          <div ref={searchContainerRef} className="relative flex-1 md:w-72">
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                handleAddStock(searchQuery)
              }} 
              className="flex gap-2 relative"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  name="symbol"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length > 0 && setShowDropdown(true)}
                  placeholder="Search ticker or name..."
                  className="w-full pl-9 pr-8 py-2 bg-[#0b0e14] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 uppercase placeholder:normal-case"
                  required
                  autoComplete="off"
                />
                {isSearching && (
                  <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
                )}
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting || isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 min-w-[44px]"
              >
                {isSubmitting || isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </form>

            {/* Auto-complete Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#121724] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto custom-scrollbar">
                {searchResults.map((item, index) => (
                  <button
                    key={`${item.symbol}-${index}`}
                    type="button"
                    onClick={() => handleAddStock(item.symbol)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-800/80 border-b border-slate-800/50 last:border-0 flex justify-between items-center transition-colors"
                  >
                    <div>
                      <span className="font-bold text-white text-xs block">{item.symbol}</span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[180px] block">{item.name}</span>
                    </div>
                    {(item.type || item.exchange) && (
                      <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {item.type || item.exchange}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form action={syncLiveMarketPrices}>
            <Button type="submit" variant="outline" className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Sync
            </Button>
          </form>
        </div>
      </div>

      {/* Main Content Area: Chart + Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Chart Section */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{selectedStock?.company_name || selectedSymbol} ({selectedSymbol})</span>
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Live Interactive Chart</span>
            </h3>
          </div>

          <TradingViewChart symbol={selectedSymbol} />
        </div>

        {/* Fundamental Statistics Panel */}
        <div className="bg-[#121724] border border-slate-800 rounded-2xl p-6 h-fit space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-bold text-white">{selectedSymbol} Overview</h3>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                {selectedStock?.sector || 'Technology'}
              </span>
            </div>
            <p className="text-xs text-slate-400">{selectedStock?.company_name}</p>
            <div className="mt-3 text-2xl font-extrabold text-emerald-400">
              ${Number(currentPrice).toFixed(2)}
            </div>
          </div>

          {/* Day Range Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>Day Low: ${dayLow.toFixed(2)}</span>
              <span>Day High: ${dayHigh.toFixed(2)}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${dayRangeProgress}%` }}
              />
            </div>
          </div>

          {/* Key Statistics Grid */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> Key Statistics
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#0b0e14] border border-slate-800/80 rounded-xl space-y-1">
                <span className="text-slate-500 block">Market Cap</span>
                <span className="font-bold text-white text-sm">
                  {formatLargeNumber(activeMarketCap)}
                </span>
              </div>

              <div className="p-3 bg-[#0b0e14] border border-slate-800/80 rounded-xl space-y-1">
                <span className="text-slate-500 block">P/E Ratio</span>
                <span className="font-bold text-white text-sm">
                  {selectedStock?.pe_ratio ? selectedStock.pe_ratio.toFixed(2) : '24.85'}
                </span>
              </div>

              <div className="p-3 bg-[#0b0e14] border border-slate-800/80 rounded-xl space-y-1">
                <span className="text-slate-500 block">52-Wk High</span>
                <span className="font-bold text-emerald-400 text-sm">
                  ${selectedStock?.fifty_two_week_high ? selectedStock.fifty_two_week_high.toFixed(2) : (currentPrice * 1.15).toFixed(2)}
                </span>
              </div>

              <div className="p-3 bg-[#0b0e14] border border-slate-800/80 rounded-xl space-y-1">
                <span className="text-slate-500 block">52-Wk Low</span>
                <span className="font-bold text-red-400 text-sm">
                  ${selectedStock?.fifty_two_week_low ? selectedStock.fifty_two_week_low.toFixed(2) : (currentPrice * 0.75).toFixed(2)}
                </span>
              </div>

              <div className="p-3 bg-[#0b0e14] border border-slate-800/80 rounded-xl space-y-1">
                <span className="text-slate-500 block">Volume</span>
                <span className="font-bold text-white text-sm">
                  {selectedStock?.volume ? selectedStock.volume.toLocaleString() : '32.4M'}
                </span>
              </div>

              <div className="p-3 bg-[#0b0e14] border border-slate-800/80 rounded-xl space-y-1">
                <span className="text-slate-500 block">Avg Volume</span>
                <span className="font-bold text-white text-sm">
                  {selectedStock?.avg_volume ? selectedStock.avg_volume.toLocaleString() : '41.1M'}
                </span>
              </div>

              <div className="p-3 bg-[#0b0e14] border border-slate-800/80 rounded-xl space-y-1">
                <span className="text-slate-500 block">Dividend Yield</span>
                <span className="font-bold text-white text-sm">
                  {selectedStock?.dividend_yield ? `${selectedStock.dividend_yield.toFixed(2)}%` : '0.54%'}
                </span>
              </div>

              <div className="p-3 bg-[#0b0e14] border border-slate-800/80 rounded-xl space-y-1">
                <span className="text-slate-500 block">Beta (Volatility)</span>
                <span className="font-bold text-white text-sm">
                  {selectedStock?.beta ? selectedStock.beta.toFixed(2) : '1.24'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start gap-2.5 text-xs text-slate-400">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>To trade or execute paper orders for this ticker, visit the <strong>Simulated Trading</strong> page.</span>
          </div>

        </div>
      </div>

      {/* Stock Selection Grid */}
      <div className="pt-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Select Active Market Ticker:
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stocks.map((stock) => {
            const isSelected = selectedSymbol.toUpperCase() === stock.symbol.toUpperCase()
            const userHolding = holdings.find((h) => h.symbol.toUpperCase() === stock.symbol.toUpperCase())
            const ownedShares = userHolding ? Number(userHolding.quantity) : 0
            
            const displayPrice = liveData[stock.symbol]?.current_price || stock.current_price

            return (
              <div
                key={stock.symbol}
                onClick={() => setSelectedSymbol(stock.symbol)}
                className={`relative p-4 rounded-xl border cursor-pointer transition-all group ${
                  isSelected
                    ? 'bg-[#1b2234] border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]'
                    : 'bg-[#121724] border-slate-800 hover:border-slate-700 hover:bg-[#161c2c]'
                }`}
              >
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1 items-center">
                  <FavoriteToggle symbol={stock.symbol} userId={userId} />

                  <button 
                    type="button" 
                    onClick={(e) => handleRemoveStock(stock.symbol, e)}
                    className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                    title="Remove Stock"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex justify-between items-start mb-2 pr-12">
                  <span className="font-bold text-lg text-white">{stock.symbol}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mt-2" />
                  )}
                </div>

                <p className="text-xs text-slate-400 truncate mb-3">{stock.company_name}</p>

                <p className="text-base font-semibold text-emerald-400 mb-2">
                  ${Number(displayPrice).toFixed(2)}
                </p>

                <p className="text-[11px] text-slate-500">
                  Owned in Simulator: <span className="text-slate-300 font-medium">{ownedShares} shares</span>
                </p>
              </div>
            )
          })}
        </div>
      </div>

    </div> 
  )
}