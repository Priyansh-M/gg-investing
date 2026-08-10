'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { executeSandboxTrade, applyMacroCatalyst } from '@/app/actions/sandboxTrade'
import { addFunds } from '@/app/actions/addFunds'
import { importRealStockToSandbox } from '@/app/actions/importStock'
import { removeStock } from '@/app/actions/stockManagement'
import { resetSandboxStockToReal } from '@/app/actions/marketSync'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { 
  Zap, 
  Plus, 
  ShieldAlert, 
  DollarSign, 
  BarChart2, 
  Layers,
  Search,
  Loader2,
  Trash2,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface Stock {
  symbol: string
  company_name: string
  current_price: number
  sector?: string
  liquidity_pool?: number
  price_history?: number[]
}

interface Holding {
  symbol: string
  quantity: number
}

interface SearchResult {
  symbol: string
  name: string
}

interface SandboxClientProps {
  stocks: Stock[]
  holdings: Holding[]
  cashBalance: number
}

export function SandboxClient({ stocks = [], holdings = [], cashBalance = 0 }: SandboxClientProps) {
  const router = useRouter()

  const [selectedSymbol, setSelectedSymbol] = useState<string>(stocks[0]?.symbol || 'AAPL')
  const [quantity, setQuantity] = useState<number>(1)
  const [leverage, setLeverage] = useState<number>(1)
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')

  // Macro Catalyst State
  const [macroImpact, setMacroImpact] = useState<number>(-15)
  const [isApplyingMacro, setIsApplyingMacro] = useState<boolean>(false)

  // Search & Import States
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Keep selectedStock tied to prop changes
  const selectedStock = stocks.find((s) => s.symbol === selectedSymbol) || stocks[0]
  const userHolding = holdings.find((h) => h.symbol === selectedSymbol)
  const ownedShares = userHolding ? Number(userHolding.quantity) : 0

  const liquidityPool = selectedStock?.liquidity_pool || 100000
  const impactRatio = (quantity * leverage) / liquidityPool
  const impactPercent = impactRatio * 100

  // Autocomplete search
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
        if (!res.ok) res = await fetch(`/api/stocks?q=${encodeURIComponent(searchQuery)}`)

        if (res.ok) {
          const data = await res.json()
          setSearchResults(Array.isArray(data) ? data : [])
          setShowDropdown(true)
        }
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Core Import & Switch Logic
  const handleImportTicker = async (symbolToImport: string) => {
    if (!symbolToImport || isImporting) return

    const cleanSymbol = symbolToImport.trim().toUpperCase()
    setIsImporting(true)
    setShowDropdown(false)

    try {
      const formData = new FormData()
      formData.append('symbol', cleanSymbol)

      const res = await importRealStockToSandbox(formData)

      if (res?.success) {
        // Force Next.js to fetch the newly imported stock into the `stocks` prop
        router.refresh()
        setSelectedSymbol(cleanSymbol)
      }
      setSearchQuery('')
    } catch (err) {
      console.error('Failed to import stock:', err)
    } finally {
      setIsImporting(false)
    }
  }

  // Handle Macro Catalyst Submission
  const handleApplyMacro = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSymbol) return

    setIsApplyingMacro(true)
    await applyMacroCatalyst(selectedSymbol, macroImpact)
    setIsApplyingMacro(false)
  }

  // SAFE CHART DATA FIX: Duplicate single-point history so Recharts draws a line!
  const rawHistory: number[] = selectedStock?.price_history && selectedStock.price_history.length > 0 
    ? selectedStock.price_history 
    : [selectedStock?.current_price || 0]

  const displayHistory = rawHistory.length === 1 
    ? [rawHistory[0], rawHistory[0]] 
    : rawHistory

  const chartData = displayHistory.map((price: number, index: number) => ({
    time: displayHistory.length === 2 && rawHistory.length === 1
      ? (index === 0 ? 'Start' : 'Current Price')
      : `Point ${index + 1}`,
    price: Number(price)
  }))

  const previousPrice = rawHistory.length > 1 ? rawHistory[rawHistory.length - 2] : rawHistory[0]
  const isPriceUp = (selectedStock?.current_price || 0) >= previousPrice

  return (
    <div className="space-y-8">
      {/* Top Header & Macro Control Bar */}
      <div className="bg-[#121724] border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between gap-6 shadow-xl">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-400 fill-blue-400/20" />
              Simulated Market Environment
            </h1>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
              Available Capital: 
              <span className="text-emerald-400 font-bold flex items-center">
                <DollarSign className="w-4 h-4 -mr-0.5" />
                {Number(cashBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-800/80">
            {/* Search Input */}
            <div ref={searchContainerRef} className="relative w-full sm:w-72">
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  handleImportTicker(searchQuery)
                }} 
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    name="symbol" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.trim().length > 0 && setShowDropdown(true)}
                    placeholder="Search or import ticker..." 
                    className="w-full bg-[#0b0e14] border border-slate-700 text-white text-xs rounded-lg pl-8 pr-8 py-1.5 outline-none uppercase placeholder:normal-case focus:border-blue-500 transition-colors"
                    required
                    autoComplete="off"
                  />
                  {isSearching && (
                    <Loader2 className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={isImporting}
                  variant="outline" 
                  className="h-8 text-xs bg-blue-950/40 border-blue-800/60 text-blue-300 hover:bg-blue-900/60 flex items-center gap-1 min-w-[75px]"
                >
                  {isImporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Plus className="w-3 h-3" /> Import</>}
                </Button>
              </form>

              {/* Autocomplete Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#121724] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-52 overflow-y-auto custom-scrollbar">
                  {searchResults.map((item, idx) => (
                    <button
                      key={`${item.symbol}-${idx}`}
                      type="button"
                      onClick={() => handleImportTicker(item.symbol)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800/80 border-b border-slate-800/50 last:border-0 flex justify-between items-center transition-colors"
                    >
                      <div>
                        <span className="font-bold text-white text-xs block">{item.symbol}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[150px] block">{item.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Capital Allocator */}
            <form action={async (formData) => { await addFunds(formData) }} className="flex gap-2">
              <select name="amount" className="bg-[#0b0e14] border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500 transition-colors">
                <option value="10000">+$10,000</option>
                <option value="100000">+$100,000</option>
                <option value="1000000">+$1,000,000</option>
              </select>
              <Button type="submit" variant="outline" className="h-8 text-xs bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Inject Liquidity
              </Button>
            </form>
          </div>
        </div>

        {/* Macro Catalysts */}
        <div className="bg-[#0b0e14] border border-slate-800 p-4 rounded-xl flex-1 md:max-w-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              Macroeconomic Catalysts
            </h3>
            <span className="text-[10px] font-medium text-slate-400 bg-purple-950/50 border border-purple-800/50 px-2 py-0.5 rounded">
              System Shock
            </span>
          </div>

          <form onSubmit={handleApplyMacro} className="flex gap-2">
            <select 
              value={macroImpact}
              onChange={(e) => setMacroImpact(Number(e.target.value))}
              className="bg-[#121724] border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none flex-1 focus:border-blue-500 transition-colors"
            >
              <option value={-15}>Hawkish Fed Rate Hike (-15%)</option>
              <option value={12}>Dovish Fed Rate Cut (+12%)</option>
              <option value={-10}>Hot CPI / Inflation Spike (-10%)</option>
              <option value={25}>Sector-Wide Tech Rally (+25%)</option>
              <option value={-30}>Geopolitical Black Swan (-30%)</option>
            </select>
            <Button 
              type="submit" 
              disabled={isApplyingMacro}
              variant="outline" 
              className="text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 h-auto py-2 font-medium min-w-[70px] flex justify-center items-center"
            >
              {isApplyingMacro ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
            </Button>
          </form>
        </div>
      </div>

      {/* Main Graph & Trade Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Synthetic Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-5 h-[420px] flex flex-col justify-between shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start mb-2 z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-lg">{selectedStock?.company_name || selectedSymbol}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedStock?.symbol || selectedSymbol}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live Current Price Initialized
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Reset Form */}
                <form action={resetSandboxStockToReal}>
                  <input type="hidden" name="symbol" value={selectedSymbol} />
                  <Button 
                    type="submit" 
                    variant="outline" 
                    size="sm"
                    className="h-8 text-xs bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                    Reset Graph
                  </Button>
                </form>

                <select 
                  value={selectedSymbol} 
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="bg-[#121724] border border-slate-700 text-blue-400 font-bold text-xs rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 transition-colors"
                >
                  {stocks.map((s) => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.symbol} - ${Number(s.current_price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full h-[310px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} axisLine={{ stroke: '#1e293b' }} />
                  
                  <YAxis 
                    domain={['dataMin - 1', 'dataMax + 1']} 
                    stroke="#475569" 
                    fontSize={11} 
                    tickFormatter={(val) => `$${Number(val).toFixed(2)}`} 
                    tickLine={false} 
                    axisLine={{ stroke: '#1e293b' }} 
                  />
                  
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121724', borderColor: '#334155', borderRadius: '10px' }} 
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Price']}
                    itemStyle={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '12px' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke={isPriceUp ? '#10b981' : '#3b82f6'} 
                    strokeWidth={2.5} 
                    dot={{ r: 4, fill: isPriceUp ? '#10b981' : '#3b82f6' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* MARKET MAKER DESK */}
        <div className="bg-[#121724] border border-slate-800 rounded-2xl p-6 h-fit space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Market Maker Desk
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Order flow & leverage execution</p>
            </div>
          </div>
          
          <form action={async (formData) => { await executeSandboxTrade(formData) }} className="space-y-4">
            <input type="hidden" name="symbol" value={selectedSymbol} />
            <input type="hidden" name="multiplier" value={leverage} />
            <input type="hidden" name="action" value={tradeType} />

            {/* BUY / SELL SEGMENTED TOGGLE */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0b0e14] rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTradeType('buy')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  tradeType === 'buy'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" /> Buy
              </button>
              <button
                type="button"
                onClick={() => setTradeType('sell')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  tradeType === 'sell'
                    ? 'bg-red-600 text-white shadow-md shadow-red-900/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" /> Sell
              </button>
            </div>
            
            {/* Quantity */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-300">Order Quantity</label>
                <span className="text-[11px] text-slate-400 font-medium">Owned: <strong className="text-slate-200">{ownedShares} shares</strong></span>
              </div>
              <input 
                type="number" 
                name="quantity" 
                value={quantity} 
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 0))} 
                min="1" 
                className="w-full px-3 py-2 bg-[#0b0e14] border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 text-sm font-semibold transition-colors" 
                required
              />
            </div>

            {/* Order Multiplier */}
            <div className="bg-[#0b0e14] border border-slate-800/80 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-purple-300">Order Multiplier</label>
                <span className="font-extrabold text-sm text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">{leverage}x</span>
              </div>
              
              <input 
                type="range" 
                min="1" 
                max="5000" 
                step="10"
                value={leverage} 
                onChange={(e) => setLeverage(Number(e.target.value))} 
                className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg" 
              />
            </div>

            {/* Dynamic Impact Display */}
            {quantity > 0 && (
              <div className="bg-blue-950/20 border border-blue-900/40 p-3.5 rounded-xl text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Execution Value:</span>
                  <span className="text-white font-bold">${(quantity * leverage * (selectedStock?.current_price || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center border-t border-blue-900/30 pt-2">
                  <span className="text-slate-400">Est. Price Impact:</span>
                  <span className={`font-extrabold ${tradeType === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tradeType === 'buy' ? '+' : '-'}{impactPercent.toFixed(4)}%
                  </span>
                </div>
              </div>
            )}

            {/* SINGLE EXECUTION BUTTON AT THE BOTTOM */}
            <Button 
              type="submit" 
              className={`w-full font-bold py-3 text-sm transition-all shadow-lg ${
                tradeType === 'buy'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20'
              }`}
            >
              {tradeType === 'buy' ? `Execute Buy Order (${quantity} Shares)` : `Execute Sell Order (${quantity} Shares)`}
            </Button>
          </form>
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="pt-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
          Select Sandbox Asset:
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stocks.map((stock) => {
            const isSelected = selectedSymbol === stock.symbol
            const userHolding = holdings.find((h) => h.symbol === stock.symbol)
            const ownedShares = userHolding ? Number(userHolding.quantity) : 0

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
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <form action={removeStock}>
                    <input type="hidden" name="symbol" value={stock.symbol} />
                    <button 
                      type="submit" 
                      className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                      onClick={(e) => e.stopPropagation()} 
                      title="Remove Stock"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                <div className="flex justify-between items-start mb-2 pr-8">
                  <span className="font-bold text-lg text-white">{stock.symbol}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mt-2" />
                  )}
                </div>

                <p className="text-xs text-slate-400 truncate mb-3">{stock.company_name}</p>
                <p className="text-base font-semibold text-emerald-400 mb-2">
                  ${Number(stock.current_price).toFixed(2)}
                </p>
                <p className="text-[11px] text-slate-500">
                  Owned: <span className="text-slate-300 font-medium">{ownedShares} shares</span>
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}