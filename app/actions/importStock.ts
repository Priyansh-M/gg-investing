'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function importRealStockToSandbox(formData: FormData) {
  const symbol = formData.get('symbol')?.toString().toUpperCase()
  if (!symbol) return

  try {
    // 1. Fetch real-time data from Yahoo Finance's Quote API (Gets Price, Name, AND Market Cap!)
    const res = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`, { cache: 'no-store' })
    const data = await res.json()
    
    // Extract the stock data safely
    const quote = data.quoteResponse?.result?.[0]
    if (!quote) {
      console.error(`Stock ${symbol} not found on Yahoo Finance.`)
      return
    }

    const realPrice = quote.regularMarketPrice || 150.00
    const companyName = quote.shortName || quote.longName || symbol
    const marketCap = quote.marketCap || null // Extracted right from Yahoo!

    const supabase = await createClient()

    // 2. Add to your MAIN 'stocks' table 
    // (This ensures your Favorites Page has the real Market Cap and Company Name)
    await supabase.from('stocks').upsert({
      symbol: symbol,
      company_name: companyName,
      current_price: realPrice,
      market_cap: marketCap
    }, { onConflict: 'symbol' }).select()

    // 3. Inject it into your Sandbox Database ('simulated_stocks')
    await supabase.from('simulated_stocks').upsert({
      symbol: symbol,
      company_name: `${companyName} (Imported)`,
      current_price: realPrice,
      base_price: realPrice,
      liquidity_pool: 10000000, // Default liquidity for imported stocks
      sector: 'Imported',
      price_history: [realPrice, realPrice] // 2 points so Recharts draws a clean flat line!
    }, { onConflict: 'symbol' })

    // 4. Force a hard refresh of the entire app so all pages update instantly
    revalidatePath('/', 'layout')
  } catch (error) {
    console.error("Failed to fetch real stock. It might not exist or the API blocked it.", error)
  }
}