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
  X 
} from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState('')
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
      setUsername(
        user.user_metadata?.username || 
        user.user_metadata?.full_name || 
        user.email?.split('@')[0] || 
        ''
      )
      setLoading(false)
    }
    loadUserData()
  }, [router, supabase])

  // 1. Update Username (Now updates Auth AND Profiles table)
  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingUsername(true)
    setMessage(null)

    if (!user) return

    // Step A: Update Supabase Auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { username, full_name: username },
    })

    if (authError) {
      setMessage({ type: 'error', text: authError.message })
      setSavingUsername(false)
      return
    }

    // Step B: Update public profiles table for rankings
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ username: username })
      .eq('id', user.id)

    if (dbError) {
      setMessage({ type: 'error', text: `Auth updated, but database sync failed: ${dbError.message}` })
    } else {
      setMessage({ type: 'success', text: 'Public username updated successfully !' })
      // Refresh the Next.js router to instantly update the UI/Rankings globally
      router.refresh()
    }
    
    setSavingUsername(false)
  }

  // 2. Change Password (Email Verification)
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
        text: 'Password reset link sent! Check your email to complete verification.',
      })
    }
    setSendingReset(false)
  }

  // 3. Log Out
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // 4. Delete Account Permanently
  const handleDeleteAccount = async () => {
    setDeleting(true)
    setMessage(null)

    // Attempt RPC delete or session cleanup
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
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Account Profile</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your account information, security credentials, and preferences.
        </p>
      </div>

      {/* Alert Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Profile Info & Username Update */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <form onSubmit={handleUpdateUsername} className="space-y-6">
          <div className="flex items-center gap-5 pb-6 border-b border-slate-800">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg">
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Username
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 w-full max-w-sm focus:outline-none focus:border-amber-400 transition-colors"
                  placeholder="Enter your username"
                  required
                />
                <button
                  type="submit"
                  disabled={savingUsername}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingUsername ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Read-Only Email Display */}
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-800 flex items-center gap-4">
          <Mail className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Email Address
            </p>
            <p className="text-white font-medium break-all mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Security & Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Password Reset */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 text-white font-semibold text-lg mb-2">
              <Key className="w-5 h-5 text-amber-400" />
              <h3>Password & Security</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              Send a password reset link to your email address to change your password safely.
            </p>
          </div>
          <button
            onClick={handlePasswordReset}
            disabled={sendingReset}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Mail className="w-4 h-4 text-amber-400" />
            <span>{sendingReset ? 'Sending Email...' : 'Send Password Reset Email'}</span>
          </button>
        </div>

        {/* Logout */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 text-white font-semibold text-lg mb-2">
              <LogOut className="w-5 h-5 text-slate-300" />
              <h3>Session</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              Sign out of your account on this device.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Permanent Account Deletion */}
      <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Permanently remove your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-xl font-bold">Delete Account Permanently?</h3>
            </div>
            <p className="text-slate-300 text-sm">
              Are you sure you want to delete your account? You will immediately lose access and all your stored data will be erased.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}