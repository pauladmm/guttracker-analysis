import { useEffect, useMemo, useState } from 'react'
import { IconChartHistogram, IconAlertTriangle } from '@tabler/icons-react'
import db from '../lib/db'
import { COLORS, STRESS_LEVELS } from '../utils/symptomHelpers'
import {
  flattenMeals,
  coverage,
  ingredientSuspicion,
  ingredientIntensity,
  symptomTimeDistribution,
  ingredientPairs,
  stressVsBad,
  byMealType,
  timeline,
} from '../utils/stats'
import { BarList, Timeline, StatCard, SymptomTimeBars } from '../components/Stats/StatViz'
import { seedSampleData, clearAllData } from '../dev/seedData'

const pct0 = (x) => `${Math.round(x * 100)}%`
const fmtRR = (rr) => (rr === Infinity ? '∞' : `${rr.toFixed(1)}×`)

export default function StatsPage() {
  const [entries, setEntries] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    db.getAll().then((data) => {
      if (active) setEntries(data)
    })
    return () => {
      active = false
    }
  }, [refresh])

  const stats = useMemo(() => {
    if (!entries) return null
    const meals = flattenMeals(entries)
    return {
      cov: coverage(entries),
      suspicion: ingredientSuspicion(meals),
      intensity: ingredientIntensity(meals),
      timing: symptomTimeDistribution(meals),
      pairs: ingredientPairs(meals),
      stress: stressVsBad(meals),
      mealType: byMealType(meals),
      timeline: timeline(entries),
    }
  }, [entries])

  const runSeed = async () => {
    setBusy(true)
    try {
      await seedSampleData()
      setRefresh((r) => r + 1)
    } finally {
      setBusy(false)
    }
  }

  const runClear = async () => {
    setBusy(true)
    try {
      await clearAllData()
      setRefresh((r) => r + 1)
    } finally {
      setBusy(false)
    }
  }

  const devTools = import.meta.env.DEV && (
    <div className="dev-tools">
      <button type="button" onClick={runSeed} disabled={busy}>
        {busy ? 'Trabajando…' : 'Cargar muestra de prueba'}
      </button>
      <button type="button" onClick={runClear} disabled={busy}>
        Borrar todos los datos
      </button>
    </div>
  )

  if (!stats) {
    return <div className="stats-page"><p className="stat-empty">Cargando…</p></div>
  }

  if (stats.cov.meals === 0) {
    return (
      <div className="stats-page">
        <div className="placeholder">
          <IconChartHistogram size={48} stroke={1.5} />
          <h2>Sin datos todavía</h2>
          <p>Registra comidas en el calendario para ver el análisis.</p>
        </div>
        {devTools}
      </div>
    )
  }

  const { cov } = stats

  return (
    <div className="stats-page">
      <h2 className="stats-title">Análisis</h2>

      {/* Cobertura */}
      <section className="stat-section">
        <div className="stat-cards">
          <StatCard value={cov.meals} label="comidas" />
          <StatCard value={pct0(cov.ratedPct)} label="valoradas" />
          <StatCard value={cov.bad} label="sentaron mal" accent={COLORS.bad} />
          <StatCard value={cov.ingredients} label="ingredientes" accent={COLORS.primary} />
        </div>
        {!cov.enough && (
          <p className="stat-warning">
            <IconAlertTriangle size={16} stroke={1.75} /> Pocos datos valorados ({cov.rated}).
            Las conclusiones aún no son fiables; sigue registrando.
          </p>
        )}
      </section>

      {/* Ingredientes sospechosos */}
      <section className="stat-section">
        <h3>Ingredientes más sospechosos</h3>
        <p className="stat-hint">% de comidas que sentaron mal cuando el ingrediente está presente, y riesgo relativo frente a cuando no.</p>
        <BarList
          items={stats.suspicion.slice(0, 10).map((s) => ({
            label: s.name,
            value: s.rateWith,
            max: 1,
            display: pct0(s.rateWith),
            sub: `${s.withBad}/${s.withRated} comidas · RR ${fmtRR(s.relativeRisk)}`,
            color: COLORS.bad,
          }))}
        />
      </section>

      {/* Intensidad */}
      <section className="stat-section">
        <h3>Mayor intensidad de síntomas</h3>
        <p className="stat-hint">Dolor de estómago medio (0–5) en comidas con ese ingrediente.</p>
        <BarList
          items={stats.intensity.slice(0, 8).map((s) => ({
            label: s.name,
            value: s.avgStomach,
            max: 5,
            display: `${s.avgStomach.toFixed(1)}/5`,
            sub: `${s.withRated} comidas`,
            color: COLORS.intensity,
          }))}
        />
      </section>

      {/* Tiempo de aparición */}
      <section className="stat-section">
        <h3>¿Cuándo aparecen los síntomas?</h3>
        <p className="stat-hint">Reparto del momento de aparición en las comidas que sentaron mal.</p>
        <SymptomTimeBars dist={stats.timing} />
      </section>

      {/* Combinaciones */}
      <section className="stat-section">
        <h3>Combinaciones (efecto acumulativo)</h3>
        <p className="stat-hint">Pares de ingredientes con más malestar cuando aparecen juntos.</p>
        <BarList
          items={stats.pairs.map((p) => ({
            label: p.pair,
            value: p.rate,
            max: 1,
            display: pct0(p.rate),
            sub: `${p.bad}/${p.rated} comidas`,
            color: COLORS.primary,
          }))}
          emptyText="Aún no hay suficientes combinaciones repetidas."
        />
      </section>

      {/* Estrés */}
      <section className="stat-section">
        <h3>Estrés vs. malestar</h3>
        <p className="stat-hint">Tasa de comidas que sientan mal según el estrés del día (confusor del eje intestino-cerebro).</p>
        <BarList
          items={stats.stress.map((b) => ({
            label: `${STRESS_LEVELS[b.stress - 1].emoji} Nivel ${b.stress}`,
            value: b.rate,
            max: 1,
            display: pct0(b.rate),
            sub: `${b.bad}/${b.rated} comidas`,
            color: COLORS.intensity,
          }))}
        />
      </section>

      {/* Tipo de comida */}
      <section className="stat-section">
        <h3>Por tipo de comida</h3>
        <BarList
          items={stats.mealType.map((t) => ({
            label: t.label,
            value: t.rate,
            max: 1,
            display: pct0(t.rate),
            sub: `${t.bad}/${t.rated} comidas`,
            color: COLORS.bad,
          }))}
        />
      </section>

      {/* Línea temporal */}
      <section className="stat-section">
        <h3>Línea temporal</h3>
        <p className="stat-hint">Cada columna es un día: rojo = sentó mal, verde = bien, gris = sin valorar. El punto superior indica el estrés.</p>
        <Timeline data={stats.timeline.slice(-45)} />
      </section>

      {devTools}
    </div>
  )
}
