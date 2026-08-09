import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy } from 'lucide-react'
import type { JSX } from 'react'

export const dynamic = 'force-dynamic'

export default async function RankingsPage(): Promise<JSX.Element> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('cash_balance', { ascending: false })
    .limit(10)

  return (
    <div className="p-8 max-w-4xl mx-auto text-slate-100">
      <div className="mb-8 flex items-center gap-3">
        <Trophy className="w-8 h-8 text-amber-400" />
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-sm text-slate-400 mt-1">Top portfolios across the platform.</p>
        </div>
      </div>

      <div className="border border-slate-800 rounded-2xl bg-[#121724] overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#1a2030] text-xs font-semibold text-slate-400 uppercase border-b border-slate-800">
            <tr>
              <th className="p-4">Rank</th>
              <th className="p-4">User</th>
              <th className="p-4 text-right">Cash Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {profiles?.map((profile, idx) => (
              <tr key={profile.id} className="hover:bg-slate-800/40">
                <td className="p-4 font-bold text-slate-300">
                  {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                </td>
                <td className="p-4 text-slate-200 font-medium">
                  {profile.username || 'Anonymous Trader'}
                </td>
                <td className="p-4 text-right font-bold text-amber-400">
                  ${Number(profile.cash_balance).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}