import DayCell from './DayCell'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import {
  addMonths,
  formatMonthLabel,
  getMonthGrid,
  toISODate,
} from '../../utils/dateHelpers'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

/**
 * Calendario mensual navegable.
 * @param {Date} monthDate - mes visible.
 * @param {(date: Date) => void} onMonthChange
 * @param {Date} selectedDate
 * @param {(date: Date) => void} onSelectDate
 * @param {Object} entriesByDate - mapa { 'YYYY-MM-DD': { day, meals } }.
 * @param {Date} today
 */
export default function Calendar({
  monthDate,
  onMonthChange,
  selectedDate,
  onSelectDate,
  entriesByDate = {},
  today,
}) {
  const days = getMonthGrid(monthDate)

  return (
    <div className="calendar">
      <header className="calendar__header">
        <button
          type="button"
          className="calendar__nav"
          onClick={() => onMonthChange?.(addMonths(monthDate, -1))}
          aria-label="Mes anterior"
        >
          <IconChevronLeft size={20} stroke={1.75} />
        </button>
        <span className="calendar__label">{formatMonthLabel(monthDate)}</span>
        <button
          type="button"
          className="calendar__nav"
          onClick={() => onMonthChange?.(addMonths(monthDate, 1))}
          aria-label="Mes siguiente"
        >
          <IconChevronRight size={20} stroke={1.75} />
        </button>
      </header>

      <div className="calendar__weekdays">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="calendar__grid">
        {days.map((date, i) => {
          const entry = date ? entriesByDate[toISODate(date)] : null
          return (
            <DayCell
              key={date ? toISODate(date) : `empty-${i}`}
              date={date}
              meals={entry?.meals ?? []}
              selectedDate={selectedDate}
              today={today}
              onSelect={onSelectDate}
            />
          )
        })}
      </div>
    </div>
  )
}
