import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { IconCalendar, IconChartHistogram, IconLogout } from '@tabler/icons-react'
import TrackerPage from './pages/TrackerPage'
import StatsPage from './pages/StatsPage'
import LoginPage from './pages/LoginPage'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const { user, loading, needsAuth, signOut } = useAuth()

  if (loading) {
    return <div className="app-loading">Cargando…</div>
  }

  // Con Supabase configurado, exige login antes de mostrar la app.
  if (needsAuth && !user) {
    return <LoginPage />
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <h1 className="app-title">JaviTracker</h1>
          {!needsAuth && <span className="app-badge">local</span>}
          {needsAuth && user && (
            <button
              type="button"
              className="app-signout"
              onClick={signOut}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <IconLogout size={20} stroke={1.75} />
            </button>
          )}
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/tracker" replace />} />
            <Route path="/tracker" element={<TrackerPage />} />
            <Route path="/stats" element={<StatsPage />} />
          </Routes>
        </main>

        <nav className="tab-bar">
          <NavLink to="/tracker" className="tab-bar__item">
            <IconCalendar size={22} stroke={1.75} />
            <span>Calendario</span>
          </NavLink>
          <NavLink to="/stats" className="tab-bar__item">
            <IconChartHistogram size={22} stroke={1.75} />
            <span>Análisis</span>
          </NavLink>
        </nav>
      </div>
    </BrowserRouter>
  )
}
