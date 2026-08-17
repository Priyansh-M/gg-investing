'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email')?.toString()
  const password = formData.get('password')?.toString()

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

  const email = formData.get('email')?.toString()
  const password = formData.get('password')?.toString()
  const username = formData.get('username')?.toString()

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        // This metadata field gets passed directly to the SQL trigger
        username: username || email.split('@')[0],
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Handle case where Supabase requires email verification before creating a session
  if (data.user && !data.session) {
    return { error: 'Account created! Please check your email inbox to confirm your address before logging in.' }
  }

  revalidatePath('/', 'layout')
  redirect('/markets')
}