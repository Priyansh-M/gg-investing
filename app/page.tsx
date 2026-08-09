import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MarketNews } from '@/components/market-news'
import { FavoritesList } from '@/components/favorites-list'
import PortfolioChart from '@/components/portfolio-chart'
import { TransactionHistory } from '@/components/transaction-history'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user transactions from Supabase
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      
      {/* Top Value Banner */}
      <div className="bg-[#121724] border border-slate-800 p-6 rounded-xl">
        <h2 className="text-xs font-semibold tracking-wider text-slate-500 mb-2 uppercase">Total Portfolio Value</h2>
        <div className="text-4xl font-bold text-yellow-500 mb-2">$1029.25</div>
        <div className="flex gap-4 text-sm text-slate-400">
          <p>Cash: <span className="text-white font-semibold">$809.25</span></p>
          <p>Invested: <span className="text-white font-semibold">$220.00</span></p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Chart & Favorites */}
        <div className="lg:col-span-2 space-y-6">
          <PortfolioChart userId={user.id} />
          <FavoritesList userId={user.id} />
        </div>

        {/* RIGHT COLUMN: Audit Log & News */}
        <div className="space-y-6">
          <TransactionHistory transactions={transactions || []} />
          <MarketNews />
        </div>
        
      </div>
    </div>
  )
}