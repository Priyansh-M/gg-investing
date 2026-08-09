'use client'

import { calculatePortfolioRisk } from '@/lib/quantMath'

interface QuantRiskPanelProps {
  holdings?: any[]
}

export function QuantRiskPanel({ holdings = [] }: QuantRiskPanelProps) {
  // Pass the user's actual holdings into our math function
  const { beta, sharpe } = calculatePortfolioRisk(holdings)
  const riskFreeRate = 4.2

  return (
    <div className="bg-[#121724] border border-slate-800 rounded-2xl p-6 h-fit">
      <h2 className="text-xl font-bold text-white mb-4">Risk Analytics</h2>
      
      <div className="space-y-6">
        {/* Dynamic Beta Score */}
        <div className="bg-[#0b0e14] p-4 rounded-xl border border-slate-800/80">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                Portfolio Beta (β)
              </p>
              <h3 className={`text-2xl font-bold ${beta > 1.2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {beta}
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {beta > 1 
              ? `Your portfolio is highly aggressive, roughly ${((beta - 1) * 100).toFixed(0)}% more volatile than the S&P 500.`
              : `Your portfolio is defensive, roughly ${((1 - beta) * 100).toFixed(0)}% less volatile than the market.`}
          </p>
        </div>

        {/* Dynamic Sharpe Ratio */}
        <div className="bg-[#0b0e14] p-4 rounded-xl border border-slate-800/80">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                Sharpe Ratio
              </p>
              <h3 className={`text-2xl font-bold ${sharpe > 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                {sharpe}
              </h3>
            </div>
            <div className="text-xs text-slate-500 text-right">
              Risk-Free Rate: {riskFreeRate}%
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {sharpe > 1 
              ? "You are generating strong returns for the amount of risk taken." 
              : "You are taking on excess volatility without sufficient return compensation."}
          </p>
        </div>
      </div>
    </div>
  )
}