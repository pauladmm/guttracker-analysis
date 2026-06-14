import { IconLock } from '@tabler/icons-react'

/**
 * Placeholder de login. En modo local (sin Supabase) no se requiere
 * autenticación; esta pantalla se activará al conectar Supabase Auth.
 */
export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="placeholder">
        <IconLock size={48} stroke={1.5} />
        <h2>Iniciar sesión</h2>
        <p>
          La autenticación se habilitará al configurar Supabase. Por ahora la
          app funciona en modo local en este dispositivo.
        </p>
      </div>
    </div>
  )
}
