import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SandboxClient } from '@/components/sandbox-client'

export default async function SandboxPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch real user cash balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('cash_balance')
    .eq('id', user.id)
    .single()

  // Fetch sandbox stocks instead of real Wall Street stocks
  const { data: simulatedStocks } = await supabase
    .from('simulated_stocks')
    .select('*')
    .order('symbol')

  // Fetch sandbox-specific holdings
  const { data: sandboxHoldings } = await supabase
    .from('sandbox_holdings')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <SandboxClient
        stocks={simulatedStocks || []}
        holdings={sandboxHoldings || []}
        cashBalance={Number(profile?.cash_balance || 0)}
      />
    </div>
  )
}