'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function injectNewsEvent(formData: FormData) {
  const eventType = formData.get('eventType')?.toString()
  if (!eventType) return

  const supabase = await createClient()
  const { data: stocks } = await supabase.from('simulated_stocks').select('*')
  if (!stocks) return

  for (const stock of stocks) {
    let multiplier = 1
    
    // Define the news impacts
    if (eventType === 'fed_hike') multiplier = 0.85; // Market drops 15%
    if (eventType === 'tech_boom' && stock.sector === 'Technology') multiplier = 1.25; // Tech jumps 25%
    if (eventType === 'auto_crash' && stock.sector === 'Automotive') multiplier = 0.70; // Auto drops 30%

    if (multiplier !== 1) {
      const newPrice = Number((stock.current_price * multiplier).toFixed(2))
      
      // Append new price to history for the chart
      const currentHistory = stock.price_history || [stock.current_price]
      const newHistory = [...currentHistory, newPrice]

      await supabase.from('simulated_stocks').update({
        current_price: newPrice,
        price_history: newHistory
      }).eq('symbol', stock.symbol)
    }
  }

  revalidatePath('/sandbox')
}