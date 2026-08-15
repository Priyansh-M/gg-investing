import { NextResponse } from 'next/server'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolsParam = searchParams.get('symbols')
  const query = searchParams.get('q') || searchParams.get('query')

  // -------------------------------------------------------------
  // 1. SEARCH ENDPOINT HANDLER (Finnhub First + Yahoo Fallback)
  // -------------------------------------------------------------
  if (query && query.trim().length > 0) {
    const cleanQuery = query.trim()
    const finnhubKey = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY

    if (finnhubKey) {
      try {
        const fhUrl = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(cleanQuery)}&token=${finnhubKey}`
        const fhRes = await fetch(fhUrl, { cache: 'no-store' })

        if (fhRes.ok) {
          const fhData = await fhRes.json()
          if (Array.isArray(fhData.result) && fhData.result.length > 0) {
            const matches = fhData.result
              .filter((item: any) => item.symbol && !item.symbol.includes('.'))
              .slice(0, 8)
              .map((item: any) => {
                const sym = String(item.symbol).toUpperCase()
                const companyName = item.description || sym
                return {
                  symbol: sym,
                  displaySymbol: item.displaySymbol || sym,
                  name: companyName,
                  description: companyName,
                  shortName: companyName,
                  type: item.type || 'EQUITY',
                }
              })

            if (matches.length > 0) {
              return NextResponse.json(matches)
            }
          }
        }
      } catch (fhErr) {
        console.error('Finnhub search failed in stocks route:', fhErr)
      }
    }

    // Secondary Yahoo fallback if Finnhub yields no results
    try {
      const yahooUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleanQuery)}&quotesCount=8&newsCount=0`
      const res = await fetch(yahooUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
        },
        next: { revalidate: 60 },
      })

      if (res.ok) {
        const data = await res.json()
        const matches = (data.quotes || [])
          .filter((item: any) => item.symbol && !item.symbol.includes('.'))
          .slice(0, 8)
          .map((item: any) => ({
            symbol: item.symbol.toUpperCase(),
            displaySymbol: item.symbol.toUpperCase(),
            name: item.shortname || item.longname || item.symbol,
            shortName: item.shortname || item.symbol,
            type: item.quoteType || 'EQUITY',
          }))

        return NextResponse.json(matches)
      }
    } catch (err) {
      console.error('Yahoo search error in stocks route:', err)
    }

    return NextResponse.json([])
  }

  // -------------------------------------------------------------
  // 2. FINNHUB BATCH QUOTES WITH STAGGERING
  // -------------------------------------------------------------
  if (symbolsParam) {
    const apiKey = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY

    if (!apiKey) {
      return NextResponse.json([])
    }

    const symbols = symbolsParam.split(',').map((s) => s.trim().toUpperCase())

    try {
      const results = []

      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i]

        if (i > 0) await delay(50)

        try {
          const res = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
            { next: { revalidate: 30 } }
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