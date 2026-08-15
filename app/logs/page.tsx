import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowDownLeft, ArrowUpRight, Clock, FileText, TrendingUp, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch all transactions from Supabase for logged-in user
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching transactions from Supabase:', error)
  }

  const allLogs = transactions || []

  // Calculations with safe numerical parsing to avoid NaN errors
  const totalTrades = allLogs.length
  const totalBuyVolume = allLogs
    .filter((tx) => tx.type === 'BUY')
    .reduce((acc, tx) => acc + (Number(tx.quantity || 0) * Number(tx.price || 0)), 0)
  const totalSellVolume = allLogs
    .filter((tx) => tx.type === 'SELL')
    .reduce((acc, tx) => acc + (Number(tx.quantity || 0) * Number(tx.price || 0)), 0)

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="flex justify-between items-center bg-[#121724] p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-500" /> Trade Audit Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete historical record of all executed paper trades and account activity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121724] border border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Total Executed Trades</p>
            <p className="text-2xl font-bold text-white">{totalTrades}</p>
          </div>
        </div>

        <div className="bg-[#121724] border border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Total Buy Volume</p>
            <p className="text-2xl font-bold text-emerald-400">${totalBuyVolume.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-[#121724] border border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Total Sell Volume</p>
            <p className="text-2xl font-bold text-purple-400">${totalSellVolume.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#121724] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">All Activity Logs</h2>
        </div>

        {allLogs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-3">
            <Clock className="w-8 h-8 text-slate-600" />
            <p className="text-base font-medium">No activity logged yet.</p>
            <p className="text-xs text-slate-600">Execute trades in the Markets section to generate logs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0b0e14] text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Action</th>
                  <th className="py-4 px-6">Ticker</th>
                  <th className="py-4 px-6">Quantity</th>
                  <th className="py-4 px-6">Execution Price</th>
                  <th className="py-4 px-6 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {allLogs.map((tx) => {
                  const isBuy = tx.type === 'BUY'
                  const quantity = Number(tx.quantity || 0)
                  const price = Number(tx.price || 0)
                  const totalCost = quantity * price

                  return (
                    <tr key={tx.id} className="hover:bg-[#161c2c] transition-colors">
                      <td className="py-4 px-6 text-slate-400 text-xs">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'medium'
                        }) : 'N/A'}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                            isBuy
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {isBuy ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                          {tx.type}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-bold text-white">{tx.symbol}</td>
                      <td className="py-4 px-6 text-slate-300">{quantity} {quantity === 1 ? 'share' : 'shares'}</td>
                      <td className="py-4 px-6 text-slate-300">${price.toFixed(2)}</td>
                      <td className="py-4 px-6 text-right font-semibold text-white">
                        ${totalCost.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}