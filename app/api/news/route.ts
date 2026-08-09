import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetches live Yahoo Finance news data in JSON format
    const response = await fetch('https://query2.finance.yahoo.com/v1/finance/search?q=finance&newsCount=15', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      cache: 'no-store'
    })
    
    if (!response.ok) throw new Error("News fetch failed")

    const data = await response.json()
    
    // Format it perfectly for your frontend component
    const news = (data.news || []).map((item: any) => ({
      id: item.uuid,
      title: item.title,
      link: item.link,
      source: item.publisher,
      pubDate: new Date(item.providerPublishTime * 1000).toISOString()
    }))

    return NextResponse.json(news)
  } catch (error) {
    console.error('API news fetch error:', error)
    return NextResponse.json([]) // Return empty array on fail so the UI doesn't crash
  }
}