'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addStock(input: FormData | string | { symbol: string }) {
  let symbol: string | undefined

  if (typeof input === 'string') {
    symbol = input
  } else if (input instanceof FormData) {
    symbol = input.get('symbol')?.toString()
  } else if (input && typeof input === 'object' && 'symbol' in input) {
    symbol = input.symbol
  }

  if (!symbol) return { success: false, error: 'No ticker symbol provided.' }
  symbol = symbol.toUpperCase().trim()

  const apiKey = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY
  if (!apiKey) {
    return { success: false, error: 'Missing Finnhub API Key in environment variables.' }
  }

  try {
    const [profileRes, quoteRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`),
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`)
    ])

    const profileData = await profileRes.json()
    const quoteData = await quoteRes.json()

    if (!quoteData || typeof quoteData.c !== 'number' || quoteData.c === 0) {
      return { success: false, error: `Invalid stock ticker '${symbol}' or quote unavailable.` }
    }

    const supabase = await createClient()

    // 1. Fetch current authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized: User session not found.' }
    }

    // 2. Attach user_id to scope the stock insertion to this specific account
    const stockPayload = {
      symbol: symbol,
      company_name: profileData.name || symbol,
      current_price: Number(quoteData.c.toFixed(2)),
      user_id: user.id,
    }

    // 3. Upsert based on composite key (user_id + symbol)
    const { error } = await supabase
      .from('stocks')
      .upsert(stockPayload, { onConflict: 'user_id, symbol' })

    if (error) {
      console.error('Supabase Add Stock Error:', error.message)
      return { success: false, error: error.message }
    }

    revalidatePath('/markets')
    revalidatePath('/sandbox')
    revalidatePath('/', 'layout')

    return { success: true, symbol }
  } catch (err: any) {
    console.error('addStock Action Error:', err)
    return { success: false, error: err?.message || 'Failed to add stock.' }
  }
}

export async function removeStock(input: FormData | string | { symbol: string }) {
  let symbol: string | undefined

  if (typeof input === 'string') {
    symbol = input
  } else if (input instanceof FormData) {
    symbol = input.get('symbol')?.toString()
  } else if (input && typeof input === 'object' && 'symbol' in input) {
    symbol = input.symbol
  }

  if (!symbol) return { success: false, error: 'No ticker symbol provided.' }
  symbol = symbol.toUpperCase().trim()

  const supabase = await createClient()

  // 1. Fetch current authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized: User session not found.' }
  }

  // 2. Delete rows matching both symbol AND user_id
  const [res1, res2] = await Promise.all([
    supabase
      .from('stocks')
      .delete({ count: 'exact' })
      .eq('symbol', symbol)
      .eq('user_id', user.id),
    supabase
      .from('simulated_stocks')
      .delete({ count: 'exact' })
      .eq('symbol', symbol)
      .eq('user_id', user.id)
  ])

  if (res1.error) console.error('Supabase stocks DELETE Error:', res1.error.message)
  if (res2.error) console.error('Supabase simulated_stocks DELETE Error:', res2.error.message)

  revalidatePath('/markets')
  revalidatePath('/sandbox')
  revalidatePath('/', 'layout')

  return { success: true }
}