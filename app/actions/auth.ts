'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Refresh Next.js layout cache and redirect to the root dashboard route
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  // 1. Create user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // 2. Create matching profile entry in database
  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: data.user.email,
      cash_balance: 0.00,
      username: username || email.split('@')[0], // Fallback to email prefix if username is empty
    })

    if (profileError) {
      return { error: profileError.message }
    }
  }

  // Refresh Next.js layout cache and redirect to the root dashboard route
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Refresh Next.js layout cache and redirect to login page
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