'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addFunds(formData: FormData) {
  const amount = Number(formData.get('amount'))
  if (!amount || amount <= 0) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Get current balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('cash_balance')
    .eq('id', user.id)
    .single()

  const currentCash = Number(profile?.cash_balance || 0)

  // Add the fake funds
  await supabase
    .from('profiles')
    .update({ cash_balance: currentCash + amount })
    .eq('id', user.id)

  revalidatePath('/sandbox')
}