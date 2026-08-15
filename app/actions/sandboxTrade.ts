'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. EXECUTE SANDBOX TRADE ACTION
export async function executeSandboxTrade(formData: FormData) {
  const symbol = formData.get('symbol')?.toString()
  const quantity = Number(formData.get('quantity'))
  const action = formData.get('action')?.toString() // 'buy' or 'sell'
  const leverageMultiplier = Number(formData.get('multiplier')) || 1

  if (!symbol || quantity <= 0 || !action) return { error: 'Invalid input' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Fetch current stock data
  const { data: stock } = await supabase
    .from('simulated_stocks')
    .select('*')
    .eq('symbol', symbol)
    .single()

  if (!stock) return { error: 'Stock not found' }

  // Fetch user profile (cash balance)
  const { data: profile } = await supabase
    .from('profiles')
    .select('cash_balance')
    .eq('id', user.id)
    .single()

  const currentCash = Number(profile?.cash_balance || 0)
  
  // Account for leverage in actual cash required
  const positionValue = stock.current_price * quantity
  const tradeCost = positionValue / leverageMultiplier

  // Fetch current holding
  const { data: holding } = await supabase
    .from('sandbox_holdings')
    .select('*')
    .eq('user_id', user.id)
    .eq('symbol', symbol)
    .single()

  const currentShares = holding ? Number(holding.quantity) : 0

  // Calculate Price Impact using effective leveraged position size
  const liquidity = stock.liquidity_pool || 10000
  const effectiveShares = quantity * leverageMultiplier
  const impactRatio = effectiveShares / liquidity
  let newPrice = stock.current_price

  if (action === 'buy') {
    if (currentCash < tradeCost) return { error: 'Insufficient funds' }
    
    // Deduct cash, add/update holding
    await supabase
      .from('profiles')
      .update({ cash_balance: currentCash - tradeCost })
      .eq('id', user.id)
    
    if (holding) {
      const newTotalCost = (Number(holding.average_cost) * currentShares) + tradeCost
      const newQuantity = currentShares + quantity
      await supabase
        .from('sandbox_holdings')
        .update({
          quantity: newQuantity,
          average_cost: newTotalCost / newQuantity
        })
        .eq('id', holding.id)
    } else {
      await supabase
        .from('sandbox_holdings')
        .insert({
          user_id: user.id,
          symbol: symbol,
          quantity: quantity,
          average_cost: stock.current_price
        })
    }

    // Increase price due to buying pressure (factoring leverage)
    newPrice = stock.current_price * (1 + impactRatio)

  } else if (action === 'sell') {
    if (currentShares < quantity) return { error: 'Insufficient shares' }

    // Add cash, reduce/delete holding
    await supabase
      .from('profiles')
      .update({ cash_balance: currentCash + tradeCost })
      .eq('id', user.id)
    
    if (currentShares === quantity) {
      await supabase
        .from('sandbox_holdings')
        .delete()
        .eq('id', holding.id)
    } else {
      await supabase
        .from('sandbox_holdings')
        .update({
          quantity: currentShares - quantity
        })
        .eq('id', holding.id)
    }

    // Decrease price due to selling pressure (factoring leverage)
    newPrice = stock.current_price * (1 - impactRatio)
  }

  const finalPrice = Number(Math.max(0.01, newPrice).toFixed(2))

  // Update global price & price_history array on simulated_stocks
  const currentHistory = stock.price_history || [stock.current_price]
  const updatedHistory = [...currentHistory, finalPrice]

  await supabase
    .from('simulated_stocks')
    .update({ 
      current_price: finalPrice,
      price_history: updatedHistory
    })
    .eq('symbol', symbol)

  // Log transaction to transactions table so it appears in Logs Page
  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      symbol: symbol,
      type: action.toUpperCase(), // Saves as 'BUY' or 'SELL'
      quantity: quantity,
      price: stock.current_price
    })

  if (txError) {
    console.error("Failed to log sandbox transaction:", txError)
  }

  // Log to relational history table as well
  try {
    await supabase
      .from('stock_price_history')
      .insert({
        stock_id: stock.id,
        price: finalPrice
      })
  } catch {
    // Fail silently if stock_price_history table isn't used
  }

  revalidatePath('/sandbox')
  revalidatePath('/dashboard')
  revalidatePath('/logs')

  return { success: true, updatedPrice: finalPrice }
}

// 2. MACROECONOMIC CATALYST ACTION
export async function applyMacroCatalyst(symbol: string, percentageChange: number) {
  if (!symbol) return { error: 'No stock selected' }

  const supabase = await createClient()

  // Fetch current stock
  const { data: stock, error } = await supabase
    .from('simulated_stocks')
    .select('*')
    .eq('symbol', symbol)
    .single()

  if (error || !stock) return { error: 'Stock not found' }

  // Calculate percentage impact (e.g., -15 -> multiplier of 0.85)
  const multiplier = 1 + (percentageChange / 100)
  const newPrice = Number(Math.max(0.01, stock.current_price * multiplier).toFixed(2))

  // Append new price to history array
  const currentHistory = stock.price_history || [stock.current_price]
  const updatedHistory = [...currentHistory, newPrice]

  // Update stock in database
  const { error: updateError } = await supabase
    .from('simulated_stocks')
    .update({
      current_price: newPrice,
      price_history: updatedHistory,
    })
    .eq('symbol', symbol)

  if (updateError) return { error: updateError.message }

  // Log to relational stock_price_history table
  try {
    await supabase
      .from('stock_price_history')
      .insert({
        stock_id: stock.id,
        price: newPrice,
      })
  } catch {
    // Fail silently
  }

  revalidatePath('/sandbox')
  revalidatePath('/dashboard')
  revalidatePath('/logs')

  return { success: true, updatedPrice: newPrice }
}