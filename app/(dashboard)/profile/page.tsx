'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Mail, 
  Key, 
  LogOut, 
  Trash2, 
  Save, 
  CheckCircle, 
  AlertTriangle,
  X,
  Trophy,
  ShieldCheck,
  Wallet
} from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [userRank, setUserRank] = useState<number | string>('Unranked')
  const [cashBalance, setCashBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [savingUsername, setSavingUsername] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const initialUsername = 
        user.user_metadata?.username || 
        user.user_metadata?.full_name || 
        user.email?.split('@')[0] || 
        ''
      setUsername(initialUsername)

      const { data: profile } = await supabase
        .from('profiles')
        .select('cash_balance, username')
        .eq('id', user.id)
        .single()

      if (profile) {
        setCashBalance(Number(profile.cash_balance || 0))
        
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gt('cash_balance', profile.cash_balance)

        setUserRank((count !== null ? count + 1 : 1))
      }

      setLoading(false)
    }
    loadUserData()
  }, [router, supabase])

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingUsername(true)
    setMessage(null)

    if (!user) return

    const { error: authError } = await supabase.auth.updateUser({
      data: { username, full_name: username },
    })

    if (authError) {
      setMessage({ type: 'error', text: authError.message })
      setSavingUsername(false)
      return
    }

    const { error: dbError } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', user.id)

    if (dbError) {
      setMessage({ type: 'error', text: `Auth updated, but database sync failed: ${dbError.message}` })
    } else {
      setMessage({ type: 'success', text: 'Public profile handle updated successfully.' })
      router.refresh()
    }
    
    setSavingUsername(false)
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    setSendingReset(true)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/login`,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({
        type: 'success',
        text: 'Password reset link sent! Check your email to proceed.',
      })
    }
    setSendingReset(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setMessage(null)

    const { error } = await supabase.rpc('delete_user')

    if (error) {
      setMessage({
        type: 'error',
        text: 'Account deletion RPC not configured. Please run the SQL snippet in Supabase.',
      })
      setDeleting(false)
      setShowDeleteModal(false)
    } else {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header - Shifted right via pl-2 sm:pl-4 */}
      <div className="pl-2 sm:pl-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Account Profile
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Manage your trading identity, credentials, and security preferences.
        </p>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm transition-all shadow-lg ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="hover:opacity-75 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Full-Width Profile Identity Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#161c2e] to-[#0d111a] border border-slate-800 rounded-2xl p-5 sm:p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 flex items-center justify-center text-slate-950 font-black text-2xl sm:text-3xl shadow-xl shadow-amber-500/10 border border-amber-300/30">
                {username ? username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-slate-900 border border-slate-700 p-1.5 rounded-lg text-amber-400 shadow-md">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
                  {username || 'Trader'}
                </h2>
                {/* Dynamic Rank Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Rank #{userRank}</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2 break-all">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                {user?.email}
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto flex items-center justify-between sm:justify-end gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
            <div className="w-full sm:w-auto bg-[#090d16] border border-slate-800/80 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Available Capital</p>
                <p className="text-base sm:text-lg font-bold text-emerald-400">${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Public Profile Form */}
        <div className="lg:col-span-2 bg-[#0d111a] border border-slate-800 rounded-2xl p-5 sm:p-8 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="border-b border-slate-800/80 pb-4">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" /> Public Profile Settings
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Your username is public and reflected live across trader leaderboards.
              </p>
            </div>

            <form onSubmit={handleUpdateUsername} id="profile-form" className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Display Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    @
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#070a10] border border-slate-800 focus:border-amber-400 text-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/20 transition-all font-medium"
                    placeholder="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Account Email (Read-Only)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-[#070a10]/50 border border-slate-800/60 text-slate-400 rounded-xl pl-10 pr-4 py-3 text-sm cursor-not-allowed select-none"
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex justify-end">
            <button
              type="submit"
              form="profile-form"
              disabled={savingUsername}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>{savingUsername ? 'Saving Changes...' : 'Save Profile'}</span>
            </button>
          </div>
        </div>

        {/* Right Stack: Security & Active Sessions */}
        <div className="space-y-6 flex flex-col justify-between">
          
          {/* Security Card */}
          <div className="bg-[#0d111a] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Security</h3>
                  <p className="text-xs text-slate-400">Password management</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Receive an authenticated password update link sent straight to your email inbox.
              </p>
            </div>

            <button
              onClick={handlePasswordReset}
              disabled={sendingReset}
              className="w-full bg-[#121724] hover:bg-[#182030] text-white font-semibold py-3 px-4 rounded-xl border border-slate-700/80 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              <Mail className="w-4 h-4 text-amber-400" />
              <span>{sendingReset ? 'Sending Email...' : 'Send Reset Link'}</span>
            </button>
          </div>

          {/* Session Card */}
          <div className="bg-[#0d111a] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800 text-slate-300 rounded-xl">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Active Session</h3>
                  <p className="text-xs text-slate-400">Sign out safely</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Terminate active session tokens on this device.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold py-3 px-4 rounded-xl border border-slate-700/60 transition-all text-sm flex items-center justify-center gap-2 mt-4"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>

        </div>

      </div>

      {/* Danger Zone */}
      <div className="bg-rose-950/10 border border-rose-900/30 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h3>
            <p className="text-xs text-slate-400">
              Permanently remove your account and erase all logged trades. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full sm:w-auto bg-rose-600/90 hover:bg-rose-500 text-white font-bold px-5 py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d111a] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Account?</h3>
                <p className="text-xs text-slate-400">Permanent Action</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              Are you sure you want to proceed? You will immediately lose access and all historical trade records will be erased.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full sm:w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full sm:w-1/2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-rose-600/20"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}