import { IconChartHistogram } from '@tabler/icons-react'

export default function StatsPage() {
  return (
    <div className="stats-page">
      <div className="placeholder">
        <IconChartHistogram size={48} stroke={1.5} />
        <h2>Análisis estadístico</h2>
        <p>
          La correlación ingrediente ↔ síntoma, los scores de sospecha y las
          visualizaciones llegarán en la <strong>Fase 3</strong>.
        </p>
        <p className="placeholder__hint">
          Sigue registrando comidas para acumular datos.
        </p>
      </div>
    </div>
  )
}
