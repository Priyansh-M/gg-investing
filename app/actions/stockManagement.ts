'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addStock(formData: FormData) {
  const symbol = formData.get('symbol')?.toString().toUpperCase().trim()
  if (!symbol) return

  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    console.error('Missing Finnhub API Key')
    return
  }

  try {
    // 1. Fetch Company Profile (Name, Sector) from Finnhub
    const profileRes = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`
    )
    const profileData = await profileRes.json()

    // 2. Fetch Live Quote (Price) from Finnhub
    const quoteRes = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
    )
    const quoteData = await quoteRes.json()

    // If 'c' (current price) is 0, the stock doesn't exist or isn't trading
    if (!quoteData.c || quoteData.c === 0) {
      console.error('Invalid stock ticker')
      return
    }

    const companyName = profileData.name || symbol
    const sector = profileData.finnhubIndustry || 'General'

    const supabase = await createClient()

    // 3. Insert into Supabase (Ignore if it already exists)
    await supabase.from('stocks').upsert({
      symbol: symbol,
      company_name: companyName,
      current_price: Number(quoteData.c.toFixed(2)),
      sector: sector
    })

    // Revalidate the entire layout so all tabs (Markets, Sandbox, Watchlist) see the new stock
    revalidatePath('/', 'layout')
  } catch (error) {
    console.error('Error adding stock:', error)
  }
}

export async function removeStock(formData: FormData) {
  const symbol = formData.get('symbol')?.toString()
  if (!symbol) return

  const supabase = await createClient()
  
  // 1. Delete from Real Markets table ('stocks')
  // Note: Due to your CASCADE setup, this will also safely delete the holdings associated with this stock.
  await supabase.from('stocks').delete().eq('symbol', symbol)
  
  // 2. Delete from Sandbox table ('simulated_stocks')
  // This ensures that if you hit "Delete" on the Sandbox page, it actually removes it there too!
  await supabase.from('simulated_stocks').delete().eq('symbol', symbol)
  
  // 3. Purge cache for the whole app to update the UI instantly
  revalidatePath('/', 'layout')
}