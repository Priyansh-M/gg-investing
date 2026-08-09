'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logout, resetPassword, updateUsername, deleteAccount } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import { 
  User, 
  Mail, 
  Lock, 
  Trophy, 
  TrendingUp, 
  LogOut, 
  LogIn, 
  KeyRound,
  ShieldCheck,
  Edit2,
  Check,
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react'

interface UserProfile {
  id: string
  username: string
  email: string
  avatar_url?: string | null
  cash_balance: number
  total_gained?: number
  ranking?: number | string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  // Username editing state
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [savingUsername, setSavingUsername] = useState(false)

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Fetch user profile from Supabase database
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const currentUsername = data?.username || user.email?.split('@')[0] || 'Trader'

      setProfile({
        id: user.id,
        email: user.email || '',
        username: currentUsername,
        avatar_url: data?.avatar_url || null,
        cash_balance: Number(data?.cash_balance || 0),
        total_gained: Number(data?.total_gained || 0),
        ranking: data?.ranking || 'Unranked',
      })

      setNewUsername(currentUsername)
      setLoading(false)
    }

    loadUserData()
  }, [])

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      toast.error('Username cannot be empty')
      return
    }

    setSavingUsername(true)
    const res = await updateUsername(newUsername.trim())

    if (res?.error) {
      toast.error('Failed to update username', { description: res.error })
    } else {
      toast.success('Username updated successfully!')
      setProfile((prev) => prev ? { ...prev, username: newUsername.trim() } : null)
      setIsEditingUsername(false)
    }
    setSavingUsername(false)
  }

  const handlePasswordReset = async () => {
    if (!profile?.email) return
    setResetting(true)

    const res = await resetPassword(profile.email)

    if (res?.error) {
      toast.error('Failed to send reset email', { description: res.error })
    } else {
      toast.success('Reset email sent!', {
        description: `Check ${profile.email} for password reset instructions.`,
      })
    }
    setResetting(false)
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    toast.loading('Deleting account permanently...')
    await deleteAccount()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center text-slate-400">
        Loading profile...
      </div>
    )
  }

  // Fallback UI if not logged in
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck className="w-16 h-16 text-slate-600 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Not Logged In</h1>
        <p className="text-slate-400 text-sm mb-6 max-w-sm">
          You need an active session to view your profile and account details.
        </p>
        <Link href="/login">
          <Button className="bg-[#F97316] hover:bg-[#EA580C] text-white flex items-center gap-2">
            <LogIn className="w-4 h-4" /> Go to Login
          </Button>
        </Link>
      </div>
    )
  }

  const isProfitPositive = (profile.total_gained || 0) >= 0

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">User Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account information, security, and preferences</p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-[#0f141c] border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-xl">
        {/* Profile Picture / Avatar */}
        <div className="relative">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-24 h-24 rounded-full object-cover border-2 border-[#F97316]"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-[#F97316] flex items-center justify-center text-3xl font-bold text-[#F97316] uppercase">
              {profile.username.substring(0, 2)}
            </div>
          )}
        </div>

        {/* User Details & Username Editor */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          {!isEditingUsername ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="text-2xl font-bold text-white">{profile.username}</h2>
              <button
                onClick={() => setIsEditingUsername(true)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 w-fit mx-auto sm:mx-0 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-[#F97316]" /> Edit Username
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 max-w-sm mx-auto sm:mx-0">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#F97316] w-full"
                placeholder="New username"
              />
              <Button
                onClick={handleUpdateUsername}
                disabled={savingUsername}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => {
                  setIsEditingUsername(false)
                  setNewUsername(profile.username)
                }}
                size="sm"
                variant="outline"
                className="border-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <p className="text-sm text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-4 h-4 text-slate-500" /> {profile.email}
          </p>
        </div>
      </div>

      {/* Performance & Ranking Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Money Gained */}
        <div className="bg-[#0f141c] border border-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className={`p-3 rounded-lg ${isProfitPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase">Total Money Gained</p>
            <p className={`text-xl font-bold mt-0.5 ${isProfitPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isProfitPositive ? '+' : ''}
              ${(profile.total_gained || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Leaderboard Ranking */}
        <div className="bg-[#0f141c] border border-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase">Global Leaderboard Rank</p>
            <p className="text-xl font-bold text-white mt-0.5">
              {typeof profile.ranking === 'number' ? `#${profile.ranking}` : profile.ranking}
            </p>
          </div>
        </div>
      </div>

      {/* Security & Credentials Area */}
      <div className="bg-[#0f141c] border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#F97316]" /> Security Details
        </h3>

        <div className="divide-y divide-slate-800">
          {/* Email Row */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs text-slate-400">Account Email</p>
              <p className="text-sm font-medium text-slate-200">{profile.email}</p>
            </div>
            <span className="text-xs text-slate-500 bg-slate-900 px-3 py-1 rounded-md border border-slate-800 w-fit">
              Verified
            </span>
          </div>

          {/* Password Row */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400">Password</p>
              <p className="text-sm font-medium text-slate-200 tracking-widest">••••••••••••</p>
            </div>
            <Button
              onClick={handlePasswordReset}
              disabled={resetting}
              variant="outline"
              className="border-slate-800 bg-[#05070a] hover:bg-slate-800 text-slate-200 text-xs flex items-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#F97316]" />
              {resetting ? 'Sending Email...' : 'Reset Password via Email'}
            </Button>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-[#0f141c] border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">Session Actions</p>
          <p className="text-xs text-slate-400">Sign out of your active session or switch accounts</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full border-slate-800 bg-[#05070a] text-slate-300 hover:bg-slate-800">
              <LogIn className="w-4 h-4 mr-2" /> Log In Page
            </Button>
          </Link>

          <form action={logout} className="w-full sm:w-auto">
            <Button type="submit" variant="destructive" className="w-full bg-rose-600 hover:bg-rose-700 text-white cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </form>
        </div>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="bg-[#0f141c] border border-rose-900/40 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-rose-500">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Danger Zone</h3>
        </div>

        <p className="text-xs text-slate-400">
          Permanently remove your account and email address from the database. This action cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="destructive"
            className="bg-rose-900/30 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete Account Forever
          </Button>
        ) : (
          <div className="p-4 bg-rose-950/40 border border-rose-900 rounded-xl space-y-3">
            <p className="text-xs text-rose-300 font-medium">
              Are you sure? This will erase all your portfolio data and remove your account from our system.
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="border-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}