// Constantes y helpers de dominio: tipos de comida, sensación, estrés,
// tiempos de aparición de síntomas y colores para el calendario.

// Paleta (espejo de las variables CSS, para usar en JS).
export const COLORS = {
  primary: '#7F77DD',
  good: '#1D9E75',
  bad: '#D85A30',
  intensity: '#EF9F27',
  unrated: '#C9CBD3',
}

/** Tipos de comida con su icono Tabler y color de acento. */
export const MEAL_TYPES = [
  { key: 'breakfast', label: 'Desayuno', icon: 'coffee', tint: '#FCEFD3', accent: '#EF9F27' },
  { key: 'lunch', label: 'Almuerzo', icon: 'salad', tint: '#D7F0E5', accent: '#1D9E75' },
  { key: 'dinner', label: 'Cena', icon: 'moon', tint: '#E5E3F8', accent: '#7F77DD' },
  { key: 'extra', label: 'Extra', icon: 'apple', tint: '#F8DDD2', accent: '#D85A30' },
]

export function getMealType(key) {
  return MEAL_TYPES.find((t) => t.key === key) ?? null
}

/** Sensación tras la comida. */
export const FEEL_OPTIONS = [
  { key: 'bien', label: 'Sentó bien', color: COLORS.good },
  { key: 'mal', label: 'Sentó mal', color: COLORS.bad },
]

export function getFeelColor(feel) {
  if (feel === 'bien') return COLORS.good
  if (feel === 'mal') return COLORS.bad
  return COLORS.unrated
}

/** Cuándo aparecieron los síntomas (orden cronológico). */
export const SYMPTOM_TIMES = ['Inmediato', '1–2 h', '3–6 h', 'Día siguiente']

/** Escala de estrés diario 1–5 con emoji. */
export const STRESS_LEVELS = [
  { value: 1, emoji: '😌', label: 'Muy tranquilo' },
  { value: 2, emoji: '🙂', label: 'Tranquilo' },
  { value: 3, emoji: '😐', label: 'Normal' },
  { value: 4, emoji: '😰', label: 'Estresado' },
  { value: 5, emoji: '😫', label: 'Muy estresado' },
]

export function getStressLevel(value) {
  return STRESS_LEVELS.find((s) => s.value === value) ?? null
}

/**
 * Resumen visual de un día para el calendario: un punto por comida,
 * coloreado según cómo sentó (verde/coral/gris).
 * @param {Array} meals
 * @returns {string[]} lista de colores (máx 4).
 */
export function getDayDots(meals = []) {
  return meals.slice(0, 4).map((m) => getFeelColor(m.feel))
}
