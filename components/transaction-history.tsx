'use client'

import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'

export interface Transaction {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  quantity: number
  price: number
  created_at: string
}

interface TransactionHistoryProps {
  transactions?: Transaction[]
}

export function TransactionHistory({ transactions = [] }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-[#121724] border border-slate-800 rounded-xl p-6">
        <h3 className="font-bold text-white text-lg mb-4">Transaction History</h3>
        <div className="text-center py-8 text-slate-500 text-sm flex flex-col items-center gap-2">
          <Clock className="w-6 h-6 text-slate-600" />
          <p>No transactions logged yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#121724] border border-slate-800 rounded-xl p-6">
      <div className="mb-4">
        <h3 className="font-bold text-white text-lg">Transaction History</h3>
        <p className="text-xs text-slate-400">Audit log of executed paper trades</p>
      </div>

      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
        {transactions.map((tx) => {
          const isBuy = tx.type === 'BUY'
          const totalCost = tx.quantity * tx.price

          return (
            <div
              key={tx.id}
              className="bg-[#0b0e14] border border-slate-800/80 rounded-lg p-3.5 flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isBuy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {isBuy ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{tx.symbol}</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        isBuy ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500" suppressHydrationWarning>
                    {new Date(tx.created_at).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-semibold text-white">
                  {tx.quantity} {tx.quantity === 1 ? 'share' : 'shares'} @ ${tx.price.toFixed(2)}
                </div>
                <div className="text-xs text-slate-400">
                  Total: <span className="font-medium text-slate-200">${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}