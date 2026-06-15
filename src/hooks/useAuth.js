import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Usuario ficticio para el modo local (sin Supabase): la app funciona sin
// login, guardando en localStorage de este dispositivo.
const LOCAL_USER = { id: 'local', email: 'local@dispositivo' }

/**
 * Hook de autenticación.
 * - Con Supabase configurado: usa Supabase Auth (email + contraseña).
 * - Sin Supabase: modo local, siempre "logueado" como usuario del dispositivo.
 */
export function useAuth() {
  const [session, setSession] = useState(null)
  // En modo local no hay carga asíncrona.
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
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

  const user = isSupabaseConfigured ? session?.user ?? null : LOCAL_USER

  const signInWithEmail = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUpWithEmail = (email, password) =>
    supabase.auth.signUp({ email, password })

  const signOut = () =>
    isSupabaseConfigured ? supabase.auth.signOut() : Promise.resolve()

  return {
    session,
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    // ¿La app requiere login? Solo cuando Supabase está configurado.
    needsAuth: isSupabaseConfigured,
  }
}
