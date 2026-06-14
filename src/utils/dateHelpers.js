// Helpers de fechas para el calendario y los registros.

/** Devuelve una fecha en formato YYYY-MM-DD (local). */
export function toISODate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** ¿Son el mismo día (ignorando la hora)? */
export function isSameDay(a, b) {
  return toISODate(a) === toISODate(b)
}

/** Primer día del mes. */
export function startOfMonth(date) {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** Último día del mes. */
export function endOfMonth(date) {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

/**
 * Genera la matriz de días para pintar un mes en el calendario,
 * empezando en lunes y rellenando los huecos de semanas con null.
 */
export function getMonthGrid(date) {
  const first = startOfMonth(date)
  const last = endOfMonth(date)
  const days = []

  // getDay(): 0=domingo … 6=sábado. Convertimos a semana que empieza en lunes.
  const leading = (first.getDay() + 6) % 7
  for (let i = 0; i < leading; i++) days.push(null)

  for (let day = 1; day <= last.getDate(); day++) {
    days.push(new Date(date.getFullYear(), date.getMonth(), day))
  }

  while (days.length % 7 !== 0) days.push(null)

  return days
}

/** Nombre del mes y año, p. ej. "junio 2026". */
export function formatMonthLabel(date, locale = 'es-ES') {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/** Fecha completa legible, p. ej. "sábado, 14 de junio". */
export function formatFullDate(date, locale = 'es-ES') {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

/** Suma (o resta) meses a una fecha. */
export function addMonths(date, amount) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + amount)
  return d
}
