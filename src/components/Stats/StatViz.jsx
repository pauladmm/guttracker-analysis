import { COLORS } from '../../utils/symptomHelpers'

/**
 * Lista de barras horizontales para rankings.
 * @param {Array<{label, value, max, display, sub, color}>} items
 * value/max definen el ancho; display es el texto del valor.
 */
export function BarList({ items, emptyText = 'Sin datos suficientes.' }) {
  if (!items?.length) return <p className="stat-empty">{emptyText}</p>
  return (
    <ul className="bar-list">
      {items.map((it, i) => {
        const max = it.max ?? Math.max(...items.map((x) => x.value), 1)
        const width = Math.max(2, (it.value / max) * 100)
        return (
          <li key={i} className="bar-row">
            <div className="bar-row__head">
              <span className="bar-row__label">{it.label}</span>
              <span className="bar-row__value">{it.display}</span>
            </div>
            <div className="bar-row__track">
              <div
                className="bar-row__fill"
                style={{ width: `${width}%`, background: it.color ?? COLORS.primary }}
              />
            </div>
            {it.sub && <span className="bar-row__sub">{it.sub}</span>}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Línea temporal: una columna por día con barras apiladas (mal/bien/sin valorar)
 * y un punto de color con el estrés del día.
 */
export function Timeline({ data }) {
  if (!data?.length) return <p className="stat-empty">Sin datos.</p>
  const maxMeals = Math.max(...data.map((d) => d.good + d.bad + d.unrated), 1)
  const stressColor = (s) =>
    s == null ? 'transparent' : ['#1D9E75', '#8BC34A', '#EF9F27', '#FB8C00', '#D85A30'][s - 1]

  return (
    <div className="timeline">
      {data.map((d) => {
        const total = d.good + d.bad + d.unrated
        return (
          <div
            key={d.date}
            className="timeline__col"
            title={`${d.date} · ${d.bad} mal / ${d.good} bien${
              d.stress ? ` · estrés ${d.stress}` : ''
            }`}
          >
            <span
              className="timeline__stress"
              style={{ background: stressColor(d.stress) }}
            />
            <div className="timeline__bar" style={{ height: `${(total / maxMeals) * 100}%` }}>
              {d.bad > 0 && (
                <span style={{ flex: d.bad, background: COLORS.bad }} />
              )}
              {d.good > 0 && (
                <span style={{ flex: d.good, background: COLORS.good }} />
              )}
              {d.unrated > 0 && (
                <span style={{ flex: d.unrated, background: COLORS.unrated }} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Tarjeta compacta de una métrica. */
export function StatCard({ value, label, accent }) {
  return (
    <div className="stat-card">
      <span className="stat-card__value" style={accent ? { color: accent } : undefined}>
        {value}
      </span>
      <span className="stat-card__label">{label}</span>
    </div>
  )
}

/** Distribución de tiempos de aparición de síntomas (barras verticales). */
export function SymptomTimeBars({ dist }) {
  const entries = Object.entries(dist.counts)
  const max = Math.max(...entries.map(([, v]) => v), 1)
  if (dist.total === 0) return <p className="stat-empty">Aún no hay síntomas registrados.</p>
  return (
    <div className="symptom-time">
      {entries.map(([label, value]) => (
        <div key={label} className="symptom-time__col">
          <span className="symptom-time__count">{value}</span>
          <div className="symptom-time__track">
            <div
              className="symptom-time__fill"
              style={{ height: `${(value / max) * 100}%` }}
            />
          </div>
          <span className="symptom-time__label">{label}</span>
        </div>
      ))}
    </div>
  )
}
