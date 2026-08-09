'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  TrendingUp, 
  Trophy, 
  User, 
  ChevronDown, 
  FileText, 
  LogOut, 
  Info,
  Users 
} from 'lucide-react'
import { useState, useEffect, JSX } from 'react'
import { logout } from '@/app/actions/auth'

export function Sidebar(): JSX.Element {
  const pathname = usePathname()
  
  // State to manage the dropdown open/close
  const [isMarketsOpen, setIsMarketsOpen] = useState(false)

  // Automatically open the dropdown if the user is on /markets or /sandbox
  useEffect(() => {
    if (pathname.includes('/markets') || pathname.includes('/sandbox')) {
      setIsMarketsOpen(true)
    }
  }, [pathname])

  return (
    <aside className="w-64 bg-[#121724] border-r border-slate-800 min-h-screen p-4 flex flex-col">
      {/* Brand Logo */}
      <div className="mb-8 px-4 mt-4">
        <h2 className="text-2xl font-extrabold text-amber-400 tracking-tight">
          Investment <span className="text-white">Simulator</span>
        </h2>
      </div>

      <nav className="flex-1 space-y-2">
        {/* Dashboard Link */}
        <Link 
          href="/" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            pathname === '/' 
              ? 'bg-slate-800 text-white font-semibold' 
              : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-semibold">Dashboard</span>
        </Link>

        {/* Markets Dropdown Wrapper */}
        <div className="space-y-1">
          <button 
            onClick={() => setIsMarketsOpen(!isMarketsOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
              pathname.includes('/markets') || pathname.includes('/sandbox')
                ? 'bg-slate-800/50 text-white' 
                : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">Markets</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMarketsOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Sub-Items */}
          {isMarketsOpen && (
            <div className="pl-11 pr-2 py-2 space-y-1 animate-in slide-in-from-top-2 opacity-100 fade-in duration-200">
              <Link 
                href="/markets" 
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname === '/markets'
                    ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Real Markets Live
              </Link>
              <Link 
                href="/sandbox" 
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname === '/sandbox'
                    ? 'bg-blue-500/10 text-blue-400 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Simulated Markets
              </Link>
            </div>
          )}
        </div>

        {/* Rankings Link */}
        <Link 
          href="/rankings" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            pathname === '/rankings' 
              ? 'bg-slate-800 text-white font-semibold' 
              : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="font-semibold">Rankings</span>
        </Link>

        {/* Community Link */}
        <Link 
          href="/community" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            pathname === '/community' 
              ? 'bg-slate-800 text-white font-semibold' 
              : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="font-semibold">Community</span>
        </Link>

        {/* Logs Link */}
        <Link 
          href="/logs" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            pathname === '/logs' 
              ? 'bg-slate-800 text-white font-semibold' 
              : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="font-semibold">Logs</span>
        </Link>
      </nav>

      {/* Footer / Profile, About & Sign Out */}
      <div className="mt-auto border-t border-slate-800 pt-4 space-y-1">
        {/* Profile Link (Moved here, right above About) */}
        <Link 
          href="/profile" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            pathname === '/profile' || pathname === '/menu'
              ? 'bg-slate-800 text-white font-semibold' 
              : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
          }`}
        >
          <User className="w-5 h-5 text-amber-400" />
          <span className="font-semibold">Profile</span>
        </Link>

        {/* About Link */}
        <Link 
          href="/about" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            pathname === '/about'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Info className="w-5 h-5" />
          <span className="font-semibold text-sm">About</span>
        </Link>

        {/* Sign Out Button */}
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold text-sm">Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}