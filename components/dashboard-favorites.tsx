'use client'

import { Button } from '@/components/ui/button'

export function DashboardFavorites({ favorites }: { favorites: any[] }) {
  if (!favorites || favorites.length === 0) {
    return (
      <div className="bg-[#121724] border border-slate-800 rounded-xl p-6 text-center text-slate-500 text-sm">
        No favorites added. Star assets in the Markets tab to watch them here.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white mb-4">Watchlist</h2>
      
      {favorites.map((fav) => (
        <div key={fav.symbol} className="bg-[#121724] border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          {/* Header row akin to the "Prudential FMCG" layout */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-3">
            <div>
              <div className="text-xs text-emerald-400 font-semibold mb-1">Equity | Market</div>
              <h3 className="text-md font-bold text-slate-200">{fav.symbol} - Growth</h3>
            </div>
            <Button variant="outline" className="h-8 text-xs bg-emerald-950/20 border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/40">
              Trade Now
            </Button>
          </div>
          
          {/* Stats row mimicking the reference image */}
          <div className="grid grid-cols-3 gap-4 pt-1">
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Current Price</p>
              <p className="text-sm font-semibold text-slate-300">${fav.current_price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Return (YTD)</p>
              <p className="text-sm font-semibold text-emerald-400">+{fav.simulated_return || '3.29'}%</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Risk Profile</p>
              <p className="text-sm font-semibold text-slate-300">{fav.volatility > 1.2 ? 'High' : 'Moderate'}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}