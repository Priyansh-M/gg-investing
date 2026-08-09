'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function claimHourlyReward(formData?: FormData) {
  const supabase = await createClient()

  // 1. Get current user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // 2. Fetch profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('cash_balance, last_reward_claimed_at')
    .eq('id', user.id)
    .single()

  if (!profile) return

  // 3. Verify if 1 hour (3,600,000 milliseconds) has passed
  const lastClaim = new Date(profile.last_reward_claimed_at).getTime()
  const now = new Date().getTime()
  const timePassed = now - lastClaim

  if (timePassed < 3600000) {
    return
  }

  // 4. Update cash balance (+ $100) and update timestamp
  const newBalance = Number(profile.cash_balance) + 100.00

  await supabase
    .from('profiles')
    .update({
      cash_balance: newBalance,
      last_reward_claimed_at: new Date().toISOString()
    })
    .eq('id', user.id)

  // 5. Refresh page data so balance updates immediately on screen
  revalidatePath('/')
}