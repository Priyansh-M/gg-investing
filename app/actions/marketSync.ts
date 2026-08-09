'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function syncLiveMarketPrices(formData?: FormData) {
  const apiKey = process.env.FINNHUB_API_KEY

  if (!apiKey) {
    console.error('Missing FINNHUB_API_KEY in .env.local')
    return
  }

  const supabase = await createClient()

  // Fetch all stocks
  const { data: stocks } = await supabase.from('stocks').select('symbol')
  if (!stocks || stocks.length === 0) return

  for (const stock of stocks) {
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${apiKey}`,
        { cache: 'no-store' } 
      )

      if (!response.ok) continue

      const data = await response.json()
      const currentPrice = data.c

      if (currentPrice && currentPrice > 0) {
        await supabase
          .from('stocks')
          .update({ current_price: Number(currentPrice.toFixed(2)) })
          .eq('symbol', stock.symbol)
      }
    } catch (err) {
      console.error(`Failed to update ${stock.symbol}:`, err)
    }
  }

  revalidatePath('/', 'layout')
}

export async function resetSandboxStockToReal(formData: FormData) {
  const symbol = formData.get('symbol') as string
  if (!symbol) return

  try {
    const supabase = await createClient()

    // 1. Fetch real baseline price from 'stocks'
    const { data: realStock } = await supabase
      .from('stocks')
      .select('current_price')
      .eq('symbol', symbol)
      .maybeSingle()

    const realPrice = realStock?.current_price || 150.00

    // 2. Reset price & set history to 2 baseline points so Recharts draws a flat line
    // Updating the correct table: 'simulated_stocks'
    await supabase
      .from('simulated_stocks')
      .update({
        current_price: realPrice,
        price_history: [realPrice, realPrice]
      })
      .eq('symbol', symbol)

    // 3. Purge entire application layout cache
    revalidatePath('/', 'layout')
  } catch (error) {
    console.error('Failed to reset graph:', error)
  }
}

// Fetch live data directly from Yahoo Finance for the Watchlist
// Fetch live data directly from Yahoo Finance for the Watchlist
// Fetch live data directly from Finnhub for the Watchlist
export async function getLiveWatchlistQuotes(symbols: string[]) {
  if (!symbols || symbols.length === 0) return []
  
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    console.error("Missing Finnhub API Key")
    return []
  }

  const results = []

  for (const symbol of symbols) {
    try {
      // 1. Get Live Price and Daily Return
      const quoteRes = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
        { cache: 'no-store' }
      )
      const quoteData = await quoteRes.json()

      // 2. Get Market Cap and Company Name
      const profileRes = await fetch(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`,
        { cache: 'no-store' }
      )
      const profileData = await profileRes.json()

      // If we got a valid price back, build the stock object
      if (quoteData && quoteData.c) {
        results.push({
          symbol: symbol,
          company_name: profileData.name || symbol,
          current_price: quoteData.c,           // Finnhub 'c' is current price
          change_percent: quoteData.dp || 0,    // Finnhub 'dp' is daily percent change
          // Finnhub returns Market Cap in millions, so we multiply by 1,000,000 to format it correctly later
          market_cap: profileData.marketCapitalization ? profileData.marketCapitalization * 1000000 : null
        })
      }
    } catch (error) {
      console.error(`Failed to fetch Finnhub data for ${symbol}:`, error)
    }
  }

  return results
}