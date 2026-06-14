import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { IconCalendar, IconChartHistogram } from '@tabler/icons-react'
import TrackerPage from './pages/TrackerPage'
import StatsPage from './pages/StatsPage'
import { isSupabaseConfigured } from './lib/supabase'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <h1 className="app-title">GutTracker</h1>
          {!isSupabaseConfigured && <span className="app-badge">local</span>}
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
