import { useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import MealCard from './MealCard'
import { formatFullDate } from '../../utils/dateHelpers'
import { MEAL_TYPES, STRESS_LEVELS } from '../../utils/symptomHelpers'

/**
 * Panel del día seleccionado: estrés, notas y comidas.
 * @param {Date} date
 * @param {object} day - { stress, notes }
 * @param {Array} meals
 * @param {(patch: object) => void} onSaveDay
 * @param {(type: string) => void} onAddMeal
 * @param {(meal: object) => void} onEditMeal
 */
export default function DayPanel({ date, day, meals = [], onSaveDay, onAddMeal, onEditMeal }) {
  const [notes, setNotes] = useState(day?.notes ?? '')
  const [syncedNotes, setSyncedNotes] = useState(day?.notes ?? '')

  // Sincroniza el borrador cuando las notas externas cambian (cambio de día
  // o carga async). No clobbera lo que el usuario está escribiendo, porque
  // durante la edición `day.notes` no cambia. Patrón de ajuste en render
  // recomendado por React, sin efecto.
  const externalNotes = day?.notes ?? ''
  if (externalNotes !== syncedNotes) {
    setSyncedNotes(externalNotes)
    setNotes(externalNotes)
  }

  const setStress = (value) => {
    onSaveDay?.({ stress: day?.stress === value ? null : value })
  }

  const saveNotes = () => {
    if (notes !== (day?.notes ?? '')) onSaveDay?.({ notes })
  }

  return (
    <section className="day-panel">
      <header className="day-panel__header">
        <h2 className="day-panel__date">{formatFullDate(date)}</h2>
      </header>

      {/* Estrés del día */}
      <div className="day-panel__block">
        <span className="field-label">Estrés del día</span>
        <div className="stress-scale">
          {STRESS_LEVELS.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`stress-scale__btn${day?.stress === s.value ? ' is-active' : ''}`}
              onClick={() => setStress(s.value)}
              title={s.label}
              aria-label={s.label}
              aria-pressed={day?.stress === s.value}
            >
              {s.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Comidas */}
      <div className="day-panel__block">
        <span className="field-label">Comidas</span>
        {meals.length === 0 ? (
          <p className="day-panel__empty">Aún no hay comidas registradas.</p>
        ) : (
          <div className="meal-list">
            {meals.map((m) => (
              <MealCard key={m.id} meal={m} onEdit={onEditMeal} />
            ))}
          </div>
        )}

        <div className="day-panel__add-row">
          {MEAL_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              className="add-meal-btn"
              onClick={() => onAddMeal?.(t.key)}
              style={{ background: t.tint, color: t.accent }}
            >
              <IconPlus size={16} stroke={2} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notas generales */}
      <div className="day-panel__block">
        <span className="field-label">Notas del día</span>
        <textarea
          className="day-panel__notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Medicación, suplementos, hidratación, actividad física…"
          rows={3}
        />
      </div>
    </section>
  )
}
