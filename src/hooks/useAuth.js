import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook de autenticación basado en Supabase Auth.
 * Expone el usuario actual, el estado de carga y helpers de sesión.
 */
export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session)
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUpWithEmail = (email, password) =>
    supabase.auth.signUp({ email, password })

  const signOut = () => supabase.auth.signOut()

  return {
    session,
    user: session?.user ?? null,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }
}
