'use client'

export function QuantRiskPanel({ portfolioData }: { portfolioData: any }) {
  // In a production app, these would be calculated dynamically based on historical volatility.
  // For the resume project, we can simulate the calculation based on the assets held.
  
  // Fake calculation logic for demonstration
  const simulatedBeta = 1.24 // A Beta > 1 means the portfolio is 24% more volatile than the S&P 500
  const simulatedSharpe = 1.8 // A Sharpe ratio > 1 is considered good. > 2 is excellent.
  const riskFreeRate = 4.2 // Current roughly 4.2% yield on T-bills

  return (
    <div className="bg-[#121724] border border-slate-800 rounded-2xl p-6 h-fit">
      <h2 className="text-xl font-bold text-white mb-4">Risk Analytics</h2>
      
      <div className="space-y-6">
        {/* Beta Score */}
        <div className="bg-[#0b0e14] p-4 rounded-xl border border-slate-800/80">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Portfolio Beta (β)</p>
              <h3 className="text-2xl font-bold text-amber-400">{simulatedBeta}</h3>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Your portfolio is currently <span className="text-amber-400 font-bold">24% more volatile</span> than the broader market (S&P 500).
          </p>
        </div>

        {/* Sharpe Ratio */}
        <div className="bg-[#0b0e14] p-4 rounded-xl border border-slate-800/80">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Sharpe Ratio</p>
              <h3 className="text-2xl font-bold text-emerald-400">{simulatedSharpe}</h3>
            </div>
            <div className="text-xs text-slate-500 text-right">
              Risk-Free Rate: {riskFreeRate}%
            </div>
          </div>
          <p className="text-xs text-slate-500">
            A score of 1.8 indicates <span className="text-emerald-400 font-bold">excellent risk-adjusted returns</span> relative to market volatility.
          </p>
        </div>
      </div>
    </div>
  )
}