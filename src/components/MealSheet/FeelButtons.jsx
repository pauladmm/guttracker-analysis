import { IconMoodSmile, IconMoodSad } from '@tabler/icons-react'
import { FEEL_OPTIONS } from '../../utils/symptomHelpers'

const ICONS = { bien: IconMoodSmile, mal: IconMoodSad }

/**
 * Toggle "¿sentó bien / mal?".
 * @param {'bien'|'mal'|null} value
 * @param {(feel: string) => void} onChange
 */
export default function FeelButtons({ value, onChange }) {
  return (
    <div className="feel-buttons">
      <span className="field-label">¿Cómo sentó?</span>
      <div className="feel-buttons__row">
        {FEEL_OPTIONS.map((opt) => {
          const Icon = ICONS[opt.key]
          const active = value === opt.key
          return (
            <button
              key={opt.key}
              type="button"
              className={`feel-buttons__btn${active ? ' is-active' : ''}`}
              onClick={() => onChange?.(opt.key)}
              style={
                active
                  ? { background: opt.color, borderColor: opt.color, color: '#fff' }
                  : { color: opt.color, borderColor: opt.color }
              }
              aria-pressed={active}
            >
              <Icon size={18} stroke={1.75} />
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
