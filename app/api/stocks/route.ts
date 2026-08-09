import { NextResponse } from 'next/server'

// Helper function to introduce a small delay between requests
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolsParam = searchParams.get('symbols')
  const query = searchParams.get('q') || searchParams.get('query')

  // -------------------------------------------------------------
  // 1. YAHOO FINANCE SEARCH (Uses 0 Finnhub API Calls!)
  // -------------------------------------------------------------
  if (query) {
    try {
      const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`
      
      const res = await fetch(yahooUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        next: { revalidate: 60 }, // Cache search queries for 60 seconds
      })

      if (!res.ok) {
        return NextResponse.json([])
      }

      const data = await res.json()

      const matches = (data.quotes || [])
        .filter((item: any) => item.symbol && !item.symbol.includes('.'))
        .map((item: any) => ({
          symbol: item.symbol,
          name: item.shortname || item.longname || item.symbol,
          shortName: item.shortname || item.symbol,
          type: item.quoteType || 'EQUITY',
        }))

      return NextResponse.json(matches)
    } catch (err) {
      console.error('Yahoo search route error:', err)
      return NextResponse.json([])
    }
  }

  // -------------------------------------------------------------
  // 2. FINNHUB BATCH QUOTES WITH CACHING & STAGGERING
  // -------------------------------------------------------------
  if (symbolsParam) {
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || process.env.FINNHUB_API_KEY

    if (!apiKey) {
      return NextResponse.json([])
    }

    const symbols = symbolsParam.split(',').map((s) => s.trim().toUpperCase())

    try {
      const results = []

      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i]

        // Stagger requests slightly (50ms gap) to avoid hitting rate limits
        if (i > 0) await delay(50)

        try {
          const res = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
            { next: { revalidate: 30 } } // Cache each quote on server for 30s
          )

          if (res.ok) {
            const data = await res.json()
            if (data && typeof data.c === 'number' && data.c > 0) {
              results.push({
                symbol,
                shortName: symbol,
                regularMarketPrice: data.c,
                regularMarketChangePercent: data.dp ?? 0,
                regularMarketChange: data.d ?? 0,
              })
              continue
            }
          }
        } catch (e) {
          console.error(`Error fetching quote for ${symbol}:`, e)
        }

        // Fallback placeholder if Finnhub fails or rate limits
        results.push({
          symbol,
          shortName: symbol,
          regularMarketPrice: 0,
          regularMarketChangePercent: 0,
          regularMarketChange: 0,
        })
      }

      return NextResponse.json(results)
    } catch (err) {
      console.error('Error fetching symbol quotes:', err)
      return NextResponse.json([])
    }
  }

  return NextResponse.json([])
}