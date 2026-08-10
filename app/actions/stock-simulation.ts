'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 1. REFRESH: Resets stock price to current real Finnhub market price 
 * and inserts a baseline entry into history.
 */
export async function refreshStockFromFinnhub(stockId: string, symbol: string) {
  const supabase = await createClient()
  const FINNHUB_KEY = process.env.FINNHUB_API_KEY

  if (!FINNHUB_KEY) {
    return { error: 'Finnhub API key missing in environment variables' }
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`,
      { cache: 'no-store' }
    )

    if (!res.ok) {
      throw new Error(`Finnhub API request failed with status ${res.status}`)
    }

    const quote = await res.json()

    // Validate that quote exists and 'c' (current price) is a valid positive number
    if (!quote || typeof quote.c !== 'number' || quote.c <= 0) {
      return { error: `Failed to fetch valid price for ticker ${symbol}` }
    }

    const realPrice = Number(quote.c.toFixed(2))

    // 1. Update current_price in 'stocks' (or 'simulated_stocks') table
    const { error: updateError } = await supabase
      .from('stocks')
      .update({ 
        current_price: realPrice, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', stockId)

    if (updateError) {
      return { error: updateError.message }
    }

    // 2. Add new point to stock_price_history so the graph updates
    await supabase.from('stock_price_history').insert({
      stock_id: stockId,
      price: realPrice,
    })

    revalidatePath('/dashboard')
    return { success: true, newPrice: realPrice }
  } catch (error: any) {
    return { error: error.message || 'Failed to refresh stock price' }
  }
}

/**
 * 2. SIMULATION IMPACT: Shifts price up/down on user trades 
 * and records the new point for the graph.
 */
export async function applyTradeImpact(stockId: string, tradeType: 'BUY' | 'SELL', quantity: number) {
  const supabase = await createClient()

  // Ensure trade quantity is valid
  const safeQuantity = Math.max(1, Math.floor(quantity))
  if (isNaN(safeQuantity)) {
    return { error: 'Invalid order quantity' }
  }

  const { data: stock, error } = await supabase
    .from('stocks')
    .select('current_price')
    .eq('id', stockId)
    .single()

  if (error || !stock) return { error: 'Stock not found' }

  // Price shifts by 0.05% per unit bought/sold
  // Max impact factor per single trade capped at 15% to prevent complete market collapse
  const rawImpact = 0.0005 * safeQuantity
  const cappedImpact = Math.min(rawImpact, 0.15)
  
  const priceMultiplier = tradeType === 'BUY' ? (1 + cappedImpact) : (1 - cappedImpact)
  
  // Calculate price and enforce a minimum floor price of $0.01 (Prevents $0 or negative prices)
  const calculatedPrice = stock.current_price * priceMultiplier
  const updatedPrice = Number(Math.max(0.01, calculatedPrice).toFixed(2))

  // Update current stock price
  const { error: updateStockError } = await supabase
    .from('stocks')
    .update({ 
      current_price: updatedPrice,
      updated_at: new Date().toISOString()
    })
    .eq('id', stockId)

  if (updateStockError) {
    return { error: updateStockError.message }
  }

  // Append new point to graph history
  const { error: historyError } = await supabase.from('stock_price_history').insert({
    stock_id: stockId,
    price: updatedPrice,
  })

  if (historyError) {
    return { error: historyError.message }
  }

  revalidatePath('/dashboard')
  return { success: true, updatedPrice }
}