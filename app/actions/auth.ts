'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/markets')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const targetUsername = username || email.split('@')[0]

  // 1. Create user in Supabase Auth and pass metadata to SQL triggers
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: targetUsername,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // 2. Safely create or update profile row without primary key conflicts
  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: data.user.id,
        email: data.user.email,
        cash_balance: 100000.00,
        username: targetUsername,
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      console.error('Profile Upsert Error:', profileError.message)
    }
  }

  // Handle case where email verification is enabled in Supabase
  if (data.user && !data.session) {
    return { error: 'Account created! Please check your email inbox to confirm your account before logging in.' }
  }

  revalidatePath('/', 'layout')
  redirect('/markets')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPassword(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updateUsername(newUsername: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username: newUsername })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteAccount() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // 1. Remove profile row from the database
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  // 2. Delete user from auth table if SUPABASE_SERVICE_ROLE_KEY is available
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const adminSupabase = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await adminSupabase.auth.admin.deleteUser(user.id)
  }

  // 3. Clear session and redirect to login page
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}