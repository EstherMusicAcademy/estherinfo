'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type UserRole = 'admin' | 'teacher' | 'student'

type AuthState = {
  isLoading: boolean
  isAuthenticated: boolean
  user: User | null
  profile?: {
    id: string
    email: string
    name: string
    role: UserRole
  }
  refresh: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  async function loadSession() {
    setIsLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
    setIsLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  useEffect(() => {
    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const profile = useMemo(() => {
    if (!user) return undefined
    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email!,
      role: (user.user_metadata?.role as UserRole) || 'student',
    }
  }, [user])

  const value = useMemo<AuthState>(
    () => ({
      isLoading,
      isAuthenticated: !!user,
      user,
      profile,
      refresh: loadSession,
      signOut,
    }),
    [isLoading, user, profile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useSupabaseAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider')
  return ctx
}
