import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SandboxClient } from '@/components/sandbox-client'

// Force dynamic rendering so real-time sandbox trades and balances don't get cached
export const dynamic = 'force-dynamic'

export default async function SandboxPage() {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile, simulated stocks, and sandbox holdings concurrently
  const [
    { data: profile },
    { data: simulatedStocks },
    { data: sandboxHoldings }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('cash_balance')
      .eq('id', user.id)
      .single(),
    supabase
      .from('simulated_stocks')
      .select('*')
      .order('symbol'),
    supabase
      .from('sandbox_holdings')
      .select('*')
      .eq('user_id', user.id)
  ])

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