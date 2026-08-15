import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || searchParams.get('query')

    if (!query || query.trim().length === 0) {
      return NextResponse.json([])
    }

    const cleanQuery = query.trim()
    const finnhubKey = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY

    // 1. Primary Attempt: Finnhub Search API
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
        console.error('Finnhub search error in search route:', fhErr)
      }
    }

    // 2. Secondary Attempt: Yahoo Finance Fallback
    const yahooHosts = [
      'https://query2.finance.yahoo.com',
      'https://query1.finance.yahoo.com',
    ]

    for (const host of yahooHosts) {
      try {
        const yahooUrl = `${host}/v1/finance/search?q=${encodeURIComponent(cleanQuery)}&quotesCount=8&newsCount=0&enableFuzzyQuery=true`

        const res = await fetch(yahooUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          next: { revalidate: 60 },
        })

        if (res.ok) {
          const data = await res.json()
          const quotes = data.quotes || []

          const matches = quotes
            .filter((item: any) => item.symbol && !item.symbol.includes('.'))
            .slice(0, 8)
            .map((item: any) => {
              const sym = String(item.symbol).toUpperCase()
              const companyName = item.shortname || item.longname || sym
              return {
                symbol: sym,
                displaySymbol: sym,
                name: companyName,
                description: companyName,
                shortName: item.shortname || sym,
                type: item.quoteType || 'EQUITY',
              }
            })

          if (matches.length > 0) {
            return NextResponse.json(matches)
          }
        }
      } catch (yErr) {
        console.error(`Yahoo search error on ${host}:`, yErr)
      }
    }

    return NextResponse.json([])
  } catch (err) {
    console.error('Search API route internal error:', err)
    return NextResponse.json([])
  }
}