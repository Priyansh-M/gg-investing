import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MarketsClient } from '@/components/markets-client'
import { QuantRiskPanel } from '@/components/quant-risk-panel'

export default async function MarketsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Fetch User Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('cash_balance')
    .eq('id', user.id)
    .single()

  // 2. Fetch All Available Stocks
  const { data: stocks } = await supabase
    .from('stocks')
    .select('*')
    .order('symbol')

  // 3. Fetch User Holdings with all columns
  const { data: holdings } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* 4. Quant Risk Panel at the top */}
      <QuantRiskPanel holdings={holdings || []} />

      {/* 5. Trading client below */}
      <MarketsClient
        userId={user.id}
        stocks={stocks || []}
        holdings={holdings || []}
        cashBalance={Number(profile?.cash_balance || 0)}
      />
    </div>
  )
}