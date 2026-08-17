'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { login, signup } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = isSignUp ? await signup(formData) : await login(formData)

    if (result?.error) {
      toast.error(isSignUp ? 'Sign Up Failed' : 'Login Failed', {
        description: result.error,
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e14] text-slate-100 p-4 w-full">
      <div className="w-full max-w-md bg-[#0f141c] border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Investment <span className="text-[#F97316]">Simulator</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {isSignUp ? 'Create your paper trading account' : 'Welcome back, trader'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                name="username"
                type="text"
                required={isSignUp}
                placeholder="CoolTrader99"
                className="w-full px-4 py-2.5 rounded-lg bg-[#05070a] border border-slate-800 text-sm text-white placeholder-slate-500 outline-none focus:border-[#F97316] transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-lg bg-[#05070a] border border-slate-800 text-sm text-white placeholder-slate-500 outline-none focus:border-[#F97316] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg bg-[#05070a] border border-slate-800 text-sm text-white placeholder-slate-500 outline-none focus:border-[#F97316] transition-colors"
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#F97316] font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  )
}