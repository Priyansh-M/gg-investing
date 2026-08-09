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

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`,
      { cache: 'no-store' }
    )
    const quote = await res.json()

    if (!quote || !quote.c) {
      return { error: 'Failed to fetch price from Finnhub' }
    }

    const realPrice = quote.c

    // 1. Update current_price in 'stocks' table
    await supabase
      .from('stocks')
      .update({ current_price: realPrice, updated_at: new Date().toISOString() })
      .eq('id', stockId)

    // 2. Add new point to stock_price_history so the graph updates
    await supabase.from('stock_price_history').insert({
      stock_id: stockId,
      price: realPrice,
    })

    revalidatePath('/dashboard')
    return { success: true, newPrice: realPrice }
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * 2. SIMULATION IMPACT: Shifts price up/down on user trades 
 * and records the new point for the graph.
 */
export async function applyTradeImpact(stockId: string, tradeType: 'BUY' | 'SELL', quantity: number) {
  const supabase = await createClient()

  const { data: stock, error } = await supabase
    .from('stocks')
    .select('current_price')
    .eq('id', stockId)
    .single()

  if (error || !stock) return { error: 'Stock not found' }

  // Price shifts by 0.05% per unit bought/sold
  const impactFactor = 0.0005 * quantity
  const priceMultiplier = tradeType === 'BUY' ? (1 + impactFactor) : (1 - impactFactor)
  
  const updatedPrice = Number((stock.current_price * priceMultiplier).toFixed(2))

  // Update current stock price
  await supabase
    .from('stocks')
    .update({ current_price: updatedPrice })
    .eq('id', stockId)

  // Append new point to graph history
  await supabase.from('stock_price_history').insert({
    stock_id: stockId,
    price: updatedPrice,
  })

  revalidatePath('/dashboard')
  return { success: true, updatedPrice }
}