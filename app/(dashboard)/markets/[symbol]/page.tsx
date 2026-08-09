import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buyStock, sellStock } from '@/app/actions/trade'
import { Button } from '@/components/ui/button'
import { StockChart } from '@/components/stock-chart'
import { ArrowLeft } from 'lucide-react'
import type { JSX } from 'react'

interface PageProps {
  params: Promise<{ symbol: string }>
}

export default async function StockDetailPage({ params }: PageProps): Promise<JSX.Element> {
  const resolvedParams = await params
  const symbolUpper = resolvedParams.symbol.toUpperCase()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: stock } = await supabase.from('stocks').select('*').eq('symbol', symbolUpper).single()
  if (!stock) return <div className="p-8 text-white">Stock not found.</div>

  const { data: history } = await supabase
    .from('stock_history')
    .select('*')
    .eq('symbol', symbolUpper)
    .order('created_at', { ascending: true })

  const chartData = history && history.length > 0
    ? history.map((item) => ({
        date: new Date(item.created_at).toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric' 
        }),
        price: Number(item.price),
      }))
    : [{ date: 'Today', price: Number(stock.current_price) }]

  const { data: profile } = await supabase.from('profiles').select('cash_balance').eq('id', user.id).single()
  const { data: holding } = await supabase.from('holdings').select('quantity').eq('user_id', user.id).eq('symbol', symbolUpper).single()

  const ownedQty = holding ? Number(holding.quantity) : 0
  const cash = Number(profile?.cash_balance || 0)

  return (
    <div className="p-8 max-w-4xl mx-auto text-slate-100 space-y-8">
      <div>
        <Link href="/markets" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-amber-400 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Markets
        </Link>
        <div className="flex justify-between items-end border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white">{stock.symbol}</h1>
            <p className="text-sm text-slate-400">{stock.company_name} • {stock.sector}</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-amber-400">${Number(stock.current_price).toFixed(2)}</span>
            <p className="text-xs text-slate-400 mt-1">Live Price</p>
          </div>
        </div>
      </div>

      <div className="border border-slate-800 rounded-2xl bg-[#121724] p-6 shadow-xl">
        <h2 className="text-lg font-bold mb-4">Price History</h2>
        <StockChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-slate-800 rounded-2xl bg-[#121724] p-6 space-y-4">
          <h3 className="font-bold text-amber-400 text-lg">Buy {stock.symbol}</h3>
          <p className="text-xs text-slate-400">Available Cash: ${cash.toFixed(2)}</p>

          <form action={buyStock} className="space-y-4">
            <input type="hidden" name="symbol" value={stock.symbol} />
            <input
              type="number"
              name="quantity"
              defaultValue="1"
              min="1"
              required
              className="w-full px-3 py-2 bg-[#1a2030] border border-slate-700 rounded-xl text-white"
            />
            <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 rounded-xl">
              Execute Buy
            </Button>
          </form>
        </div>

        <div className="border border-slate-800 rounded-2xl bg-[#121724] p-6 space-y-4">
          <h3 className="font-bold text-red-400 text-lg">Sell {stock.symbol}</h3>
          <p className="text-xs text-slate-400">Shares Owned: {ownedQty}</p>

          {ownedQty > 0 ? (
            <form action={sellStock} className="space-y-4">
              <input type="hidden" name="symbol" value={stock.symbol} />
              <input
                type="number"
                name="quantity"
                defaultValue="1"
                min="1"
                max={ownedQty}
                required
                className="w-full px-3 py-2 bg-[#1a2030] border border-slate-700 rounded-xl text-white"
              />
              <Button type="submit" className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold py-2.5 rounded-xl">
                Execute Sell
              </Button>
            </form>
          ) : (
            <div className="text-xs text-slate-500 border border-dashed border-slate-800 p-6 rounded-xl text-center">
              You do not own any shares to sell.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}