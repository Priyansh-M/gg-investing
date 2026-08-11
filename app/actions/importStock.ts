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

  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    console.error('FINNHUB_API_KEY environment variable is missing.')
    return { success: false, error: 'Server configuration error: FINNHUB_API_KEY missing.' }
  }

  try {
    // Calculate 1-month timestamp range for Finnhub candle history
    const to = Math.floor(Date.now() / 1000)
    const from = to - (30 * 24 * 60 * 60)

    // 2. Fetch Quote, Company Profile, and 1-month Candles in parallel from Finnhub
    const [quoteRes, profileRes, candleRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`, { cache: 'no-store' }),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`, { cache: 'no-store' }),
      fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}&token=${apiKey}`, { cache: 'no-store' })
    ])

    if (quoteRes.status === 401 || profileRes.status === 401) {
      throw new Error('Finnhub API returned status 401. Check your FINNHUB_API_KEY in Vercel.')
    }

    if (!quoteRes.ok) {
      throw new Error(`Market API returned status ${quoteRes.status}`)
    }

    const quoteData = await quoteRes.json()
    const profileData = await profileRes.json()
    const candleData = candleRes.ok ? await candleRes.json() : null

    // Check if a valid quote was returned (quote.c is current price)
    if (!quoteData || typeof quoteData.c !== 'number' || quoteData.c === 0) {
      console.error(`Stock ticker ${symbol} not found on Finnhub.`)
      return { success: false, error: `Stock ${symbol} not found` }
    }

    // Extract Finnhub parameters
    const realPrice = Number(quoteData.c)
    const companyName = profileData?.name || symbol
    const marketCap = profileData?.marketCapitalization ? profileData.marketCapitalization * 1000000 : null
    const sector = profileData?.finnhubIndustry || 'General'
    const dayHigh = Number(quoteData.h) || realPrice
    const dayLow = Number(quoteData.l) || realPrice
    const openPrice = Number(quoteData.o) || realPrice
    const previousClose = Number(quoteData.pc) || realPrice

    // Parse historical price array from candles (or fallback to two points)
    let priceHistory: number[] = []
    if (candleData && candleData.s === 'ok' && Array.isArray(candleData.c) && candleData.c.length > 0) {
      priceHistory = candleData.c.map((p: number) => Number(p.toFixed(2)))
    } else {
      priceHistory = [realPrice, realPrice]
    }

    const supabase = await createClient()

    // 3. Upsert to MAIN 'stocks' table (Preserves real market integrity)
    const { error: mainStocksError } = await supabase.from('stocks').upsert({
      symbol: symbol,
      company_name: companyName,
      current_price: realPrice,
      market_cap: marketCap,
      volume: null,
      day_high: dayHigh,
      day_low: dayLow,
      open_price: openPrice,
      previous_close: previousClose
    }, { onConflict: 'symbol' })

    if (mainStocksError) {
      console.error('Failed to update main stocks table:', mainStocksError)
    }

    // 4. Upsert to SANDBOX 'simulated_stocks' table
    const { error: sandboxError } = await supabase.from('simulated_stocks').upsert({
      symbol: symbol,
      company_name: `${companyName} (Imported)`,
      current_price: realPrice,
      base_price: realPrice,
      liquidity_pool: 10000000, // Standard market maker pool balance
      sector: sector,
      price_history: priceHistory
    }, { onConflict: 'symbol' })

    if (sandboxError) {
      console.error('Failed to update simulated stocks table:', sandboxError)
      return { success: false, error: sandboxError.message }
    }

    // 5. Instant UI revalidation across app layouts
    revalidatePath('/', 'layout')

    return { success: true, symbol }
  } catch (error: any) {
    console.error("Failed to fetch real stock from Finnhub API:", error)
    return { success: false, error: error.message || 'Failed to import stock.' }
  }
}