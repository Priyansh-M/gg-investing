'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star } from 'lucide-react'

interface FavoriteToggleProps {
  symbol: string
  userId: string
  className?: string
}

export function FavoriteToggle({ symbol, userId, className = '' }: FavoriteToggleProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const storageKey = `favorites_${userId}`

  const checkFavoriteStatus = useCallback(() => {
    if (!userId) return
    try {
      const saved: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const upperSymbol = symbol.toUpperCase()
      setIsFavorite(saved.map((s) => s.toUpperCase()).includes(upperSymbol))
    } catch (error) {
      console.error('Error reading favorites from localStorage:', error)
      setIsFavorite(false)
    }
  }, [symbol, userId, storageKey])

  useEffect(() => {
    checkFavoriteStatus()

    window.addEventListener('favoritesUpdated', checkFavoriteStatus)
    window.addEventListener('storage', checkFavoriteStatus)

    return () => {
      window.removeEventListener('favoritesUpdated', checkFavoriteStatus)
      window.removeEventListener('storage', checkFavoriteStatus)
    }
  }, [checkFavoriteStatus])

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!userId) return

    try {
      const saved: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const upperSymbol = symbol.toUpperCase()
      let updated: string[]

      if (saved.map((s) => s.toUpperCase()).includes(upperSymbol)) {
        updated = saved.filter((s) => s.toUpperCase() !== upperSymbol)
      } else {
        updated = [...saved, upperSymbol]
      }

      localStorage.setItem(storageKey, JSON.stringify(updated))
      setIsFavorite(updated.includes(upperSymbol))

      // Dispatch event for other active components across the page
      window.dispatchEvent(new Event('favoritesUpdated'))
    } catch (error) {
      console.error('Error updating favorites in localStorage:', error)
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      type="button"
      className={`p-1.5 rounded-md border transition-all ${
        isFavorite
          ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
      } ${className}`}
      title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
      aria-label={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
    >
      <Star size={14} className={isFavorite ? 'fill-yellow-400 text-yellow-400' : ''} />
    </button>
  )
}