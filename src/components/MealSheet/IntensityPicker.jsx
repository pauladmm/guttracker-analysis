import { COLORS } from '../../utils/symptomHelpers'

/**
 * Selector de intensidad 0–5 (botones). 0 = nada, 5 = máximo.
 * @param {string} label
 * @param {number} value
 * @param {(value: number) => void} onChange
 */
export default function IntensityPicker({ label, value = 0, onChange }) {
  return (
    <div className="intensity-picker">
      <span className="field-label">{label}</span>
      <div className="intensity-picker__scale">
        {[0, 1, 2, 3, 4, 5].map((n) => {
          const active = n === value
          return (
            <button
              key={n}
              type="button"
              className={`intensity-picker__dot${active ? ' is-active' : ''}`}
              onClick={() => onChange?.(n)}
              style={active ? { background: COLORS.intensity, borderColor: COLORS.intensity } : undefined}
              aria-label={`${label}: ${n}`}
              aria-pressed={active}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}
