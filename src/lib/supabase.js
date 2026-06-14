import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * ¿Están las credenciales de Supabase configuradas?
 * Si no, la app funciona en modo local (localStorage) — ver lib/db.js.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.info(
    '[GutTracker] Supabase no configurado: usando almacenamiento local (localStorage). ' +
      'Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local para sincronizar.'
  )
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
