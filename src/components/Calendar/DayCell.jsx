import { isSameDay } from '../../utils/dateHelpers'
import { getDayDots } from '../../utils/symptomHelpers'

/**
 * Celda de un día del calendario, con puntos de color que resumen
 * cómo sentaron las comidas (verde=bien, coral=mal, gris=sin valorar).
 * @param {Date|null} date
 * @param {Array} meals - comidas de ese día.
 * @param {Date} selectedDate
 * @param {Date} today
 * @param {(date: Date) => void} onSelect
 */
export default function DayCell({ date, meals = [], selectedDate, today, onSelect }) {
  if (!date) return <div className="day-cell day-cell--empty" />

  const selected = selectedDate && isSameDay(date, selectedDate)
  const isToday = today && isSameDay(date, today)
  const dots = getDayDots(meals)

  const classes = ['day-cell']
  if (selected) classes.push('day-cell--selected')
  if (isToday) classes.push('day-cell--today')

  return (
    <button type="button" className={classes.join(' ')} onClick={() => onSelect?.(date)}>
      <span className="day-cell__number">{date.getDate()}</span>
      <span className="day-cell__dots">
        {dots.map((color, i) => (
          <span key={i} className="day-cell__dot" style={{ background: color }} />
        ))}
      </span>
    </button>
  )
}
