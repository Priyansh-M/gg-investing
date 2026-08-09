'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'

// Adjust these types to match exactly what your API returns
interface NewsItem {
  id?: string
  title: string
  link: string
  source?: string
  pubDate: string
}

export function MarketNews() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Helper to fix weird text formatting like "S&amp;P 500" -> "S&P 500"
  const decodeHTMLEntities = (text: string) => {
    const textArea = document.createElement('textarea')
    textArea.innerHTML = text
    return textArea.value
  }

  const fetchNews = useCallback(async (isManualRefresh = false) => {
    setIsRefreshing(true)
    try {
      // ⚠️ Replace this URL with your actual news endpoint if it's different!
      const response = await fetch('/api/news') 
      const newData: NewsItem[] = await response.json()

      setNews(prevNews => {
        if (!isManualRefresh) {
          // Initial load: Just take the top 12 directly
          return newData.slice(0, 12)
        }

        // On Refresh: Put new items at the top, append older ones below
        const combined = [...newData, ...prevNews]
        
        // Filter out any duplicates based on the link or title so we don't get repeating rows
        const uniqueNews = Array.from(
          new Map(combined.map(item => [item.link || item.title, item])).values()
        )

        // Slice to keep EXACTLY 12 items maximum. 
        // Anything older than the 12th item gets deleted from the bottom.
        return uniqueNews.slice(0, 12)
      })
    } catch (error) {
      console.error('Error fetching market news:', error)
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }, [])

  // Initial fetch on mount
  useEffect(() => {
    fetchNews(false)
  }, [fetchNews])

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateString // Fallback if the API returns a pre-formatted string
    }
  }

  return (
    <div className="bg-[#0b0e14] border border-slate-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800/60 pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">Market News</h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-500 tracking-wider">
            LIVE
          </span>
        </div>
        
        <button 
          onClick={() => fetchNews(true)} // Passes true to trigger the top-down sliding logic
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg transition-colors text-xs font-semibold disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-5">
        {news.map((item, index) => (
          <div key={item.id || index} className="group">
            <div className="text-[11px] font-medium text-slate-500 mb-1">
              {item.source || 'Yahoo Finance'} • {formatTime(item.pubDate)}
            </div>
            <a 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors leading-relaxed"
            >
              {decodeHTMLEntities(item.title)}
            </a>
          </div>
        ))}
        
        {news.length === 0 && !isRefreshing && (
          <div className="text-slate-500 text-sm text-center py-4">
            No news articles available.
          </div>
        )}
      </div>
    </div>
  )
}