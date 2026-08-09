import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || searchParams.get('query')

  if (!query) {
    return NextResponse.json([])
  }

  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`
    
    const res = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      next: { revalidate: 60 },
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
    console.error('Yahoo search error:', err)
    return NextResponse.json([])
  }
}