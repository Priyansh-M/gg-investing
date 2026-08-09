'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateStockPrice(formData: FormData): Promise<void> {
  const symbol = formData.get('symbol') as string
  const newPrice = Number(formData.get('price'))

  if (!symbol || isNaN(newPrice)) return

  const supabase = await createClient()

  await supabase
    .from('stocks')
    .update({ current_price: newPrice })
    .eq('symbol', symbol.toUpperCase())

  await supabase
    .from('stock_history')
    .insert({ symbol: symbol.toUpperCase(), price: newPrice })

  revalidatePath('/')
  revalidatePath('/markets')
  revalidatePath(`/markets/${symbol.toLowerCase()}`)
}

export async function triggerMarketFluctuation(): Promise<void> {
  const supabase = await createClient()
  const { data: stocks } = await supabase.from('stocks').select('*')
  
  if (!stocks) return

  for (const stock of stocks) {
    const changePercent = (Math.random() * 10 - 5) / 100
    const newPrice = Number((Number(stock.current_price) * (1 + changePercent)).toFixed(2))
    const validPrice = Math.max(1.00, newPrice)

    await supabase
      .from('stocks')
      .update({ current_price: validPrice })
      .eq('symbol', stock.symbol)

    await supabase
      .from('stock_history')
      .insert({ symbol: stock.symbol, price: validPrice })
  }

  revalidatePath('/')
  revalidatePath('/markets')
}