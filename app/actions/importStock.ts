'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function importRealStockToSandbox(input: string | FormData) {
  // 1. Extract symbol cleanly whether passed as string or FormData
  const symbol = typeof input === 'string'
    ? input.trim().toUpperCase()
    : input.get('symbol')?.toString().trim().toUpperCase()

  if (!symbol) {
    return { success: false, error: 'Missing symbol' }
  }

  try {
    // 2. Fetch comprehensive live market data from Yahoo Finance API
    const res = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`, { 
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    if (!res.ok) {
      throw new Error(`Market API returned status ${res.status}`)
    }

    const data = await res.json()
    const quote = data.quoteResponse?.result?.[0]

    if (!quote) {
      console.error(`Stock ticker ${symbol} not found on Yahoo Finance.`)
      return { success: false, error: `Stock ${symbol} not found` }
    }

    // Extract genuine real-world stock parameters
    const realPrice = Number(quote.regularMarketPrice) || 150.00
    const companyName = quote.shortName || quote.longName || symbol
    const marketCap = quote.marketCap || null
    const volume = quote.regularMarketVolume || null
    const dayHigh = quote.regularMarketDayHigh || null
    const dayLow = quote.regularMarketDayLow || null
    const openPrice = quote.regularMarketOpen || realPrice
    const previousClose = quote.regularMarketPreviousClose || realPrice
    const sector = quote.sector || quote.category || 'General'

    const supabase = await createClient()

    // 3. Upsert to MAIN 'stocks' table (Preserves real market integrity)
    const { error: mainStocksError } = await supabase.from('stocks').upsert({
      symbol: symbol,
      company_name: companyName,
      current_price: realPrice,
      market_cap: marketCap,
      volume: volume,
      day_high: dayHigh,
      day_low: dayLow,
      open_price: openPrice,
      previous_close: previousClose
    }, { onConflict: 'symbol' })

    if (mainStocksError) {
      console.error('Failed to update main stocks table:', mainStocksError)
    }

    // 4. Upsert to SANDBOX 'simulated_stocks' table
    // price_history is initialized with ONLY [realPrice] for the sandbox chart
    const { error: sandboxError } = await supabase.from('simulated_stocks').upsert({
      symbol: symbol,
      company_name: `${companyName} (Imported)`,
      current_price: realPrice,
      base_price: realPrice,
      liquidity_pool: 10000000, // Standard market maker pool balance
      sector: sector,
      price_history: [realPrice] // Chart starts with ONLY the current live price point
    }, { onConflict: 'symbol' })

    if (sandboxError) {
      console.error('Failed to update simulated stocks table:', sandboxError)
      return { success: false, error: sandboxError.message }
    }

    // 5. Instant UI revalidation across app layouts
    revalidatePath('/', 'layout')

    return { success: true, symbol }
  } catch (error: any) {
    console.error("Failed to fetch real stock from API:", error)
    return { success: false, error: error.message || 'Failed to import stock.' }
  }
}