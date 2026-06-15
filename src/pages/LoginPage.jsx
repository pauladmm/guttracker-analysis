import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

/**
 * Pantalla de login / registro con email + contraseña (Supabase Auth).
 */
export default function LoginPage() {
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      if (mode === 'signup') {
        const { data, error: err } = await signUpWithEmail(email, password)
        if (err) throw err
        // Si el proyecto exige confirmación por email, no habrá sesión todavía.
        if (!data.session) {
          setInfo('Cuenta creada. Revisa tu email para confirmar la cuenta y luego inicia sesión.')
          setMode('signin')
        }
      } else {
        const { error: err } = await signInWithEmail(email, password)
        if (err) throw err
        // Al iniciar sesión, onAuthStateChange actualiza el estado y App
        // muestra la app automáticamente.
      }
    } catch (err) {
      setError(err.message ?? 'No se pudo completar la operación.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="app-title login-title">GutTracker</h1>
        <p className="login-sub">
          {mode === 'signin' ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          </label>

          {error && <p className="login-error">{error}</p>}
          {info && <p className="login-info">{info}</p>}

          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? 'Un momento…' : mode === 'signin' ? 'Entrar' : 'Registrarme'}
          </button>
        </form>

        <button
          type="button"
          className="login-switch"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
            setInfo(null)
          }}
        >
          {mode === 'signin'
            ? '¿No tienes cuenta? Regístrate'
            : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  )
}
