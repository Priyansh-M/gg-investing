'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { applyTradeImpact } from '@/app/actions/stock-simulation'

// 1. BUY STOCK ACTION
export async function buyStock(formData: FormData) {
  const symbol = formData.get('symbol') as string
  const quantity = Number(formData.get('quantity'))

  if (!symbol || quantity <= 0) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Fetch current stock price & ID
  const { data: stock } = await supabase
    .from('stocks')
    .select('*')
    .eq('symbol', symbol)
    .single()

  if (!stock) return

  const totalCost = Number(stock.current_price) * quantity

  // Fetch user cash balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('cash_balance')
    .eq('id', user.id)
    .single()

  if (!profile || Number(profile.cash_balance) < totalCost) {
    return // Insufficient funds
  }

  // Deduct cash balance
  const newCash = Number(profile.cash_balance) - totalCost
  await supabase
    .from('profiles')
    .update({ cash_balance: newCash })
    .eq('id', user.id)

  // Check if user already owns shares of this stock
  const { data: existingHolding } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', user.id)
    .eq('symbol', symbol)
    .single()

  if (existingHolding) {
    const totalQuantity = Number(existingHolding.quantity) + quantity
    const oldTotalCost = Number(existingHolding.quantity) * Number(existingHolding.average_cost)
    const newAvgCost = (oldTotalCost + totalCost) / totalQuantity

    await supabase
      .from('holdings')
      .update({
        quantity: totalQuantity,
        average_cost: newAvgCost,
      })
      .eq('id', existingHolding.id)
  } else {
    await supabase
      .from('holdings')
      .insert({
        user_id: user.id,
        symbol: symbol,
        quantity: quantity,
        average_cost: stock.current_price,
      })
  }

  // Log the BUY transaction
  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      symbol: symbol,
      type: 'BUY',
      quantity: quantity,
      price: stock.current_price
    })

  if (txError) {
    console.error("Failed to log buy transaction:", txError)
  }

  // 🌟 Trigger simulated price impact & insert point into stock_price_history
  await applyTradeImpact(stock.id, 'BUY', quantity)

  revalidatePath('/')
  revalidatePath('/markets')
  revalidatePath('/dashboard')
}

// 2. SELL STOCK ACTION
export async function sellStock(formData: FormData) {
  const symbol = formData.get('symbol') as string
  const quantity = Number(formData.get('quantity'))

  if (!symbol || quantity <= 0) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Fetch user holding
  const { data: holding } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', user.id)
    .eq('symbol', symbol)
    .single()

  if (!holding || Number(holding.quantity) < quantity) {
    return // User doesn't own enough shares
  }

  // Fetch current stock price & ID
  const { data: stock } = await supabase
    .from('stocks')
    .select('id, current_price')
    .eq('symbol', symbol)
    .single()

  if (!stock) return

  const totalGain = Number(stock.current_price) * quantity

  // Fetch user cash
  const { data: profile } = await supabase
    .from('profiles')
    .select('cash_balance')
    .eq('id', user.id)
    .single()

  if (!profile) return

  // Add cash gain to user balance
  const newCash = Number(profile.cash_balance) + totalGain
  await supabase
    .from('profiles')
    .update({ cash_balance: newCash })
    .eq('id', user.id)

  // Deduct shares from holdings
  const remainingQty = Number(holding.quantity) - quantity
  if (remainingQty > 0) {
    await supabase
      .from('holdings')
      .update({ quantity: remainingQty })
      .eq('id', holding.id)
  } else {
    await supabase
      .from('holdings')
      .delete()
      .eq('id', holding.id)
  }

  // Log the SELL transaction
  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      symbol: symbol,
      type: 'SELL',
      quantity: quantity,
      price: stock.current_price
    })

  if (txError) {
    console.error("Failed to log sell transaction:", txError)
  }

  // 🌟 Trigger simulated price impact & insert point into stock_price_history
  await applyTradeImpact(stock.id, 'SELL', quantity)

  revalidatePath('/')
  revalidatePath('/markets')
  revalidatePath('/dashboard')
}