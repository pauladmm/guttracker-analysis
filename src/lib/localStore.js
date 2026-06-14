// Backend de almacenamiento local (localStorage).
// Modela days + meals (+ ingredientes embebidos) mientras Supabase no esté
// configurado. Las comidas se vinculan al día por su fecha ISO 'YYYY-MM-DD'.

const STORAGE_KEY = 'guttracker:data:v1'

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { days: {}, meals: [] }
    const parsed = JSON.parse(raw)
    return { days: parsed.days ?? {}, meals: parsed.meals ?? [] }
  } catch {
    return { days: {}, meals: [] }
  }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Devuelve { day, meals } de una fecha. */
export function getDay(date) {
  const data = loadAll()
  const day = data.days[date] ?? { date, stress: null, notes: '' }
  const meals = data.meals
    .filter((m) => m.date === date)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
  return { day, meals }
}

/** Crea o actualiza los datos generales del día (estrés, notas). */
export function upsertDay(date, patch) {
  const data = loadAll()
  const current = data.days[date] ?? { date, stress: null, notes: '' }
  const next = { ...current, ...patch, date }
  data.days[date] = next
  saveAll(data)
  return next
}

/** Añade una comida a un día. */
export function addMeal(date, meal) {
  const data = loadAll()
  const newMeal = {
    id: uid(),
    date,
    meal_type: meal.meal_type,
    name: meal.name ?? '',
    feel: meal.feel ?? null,
    stomach_intensity: meal.stomach_intensity ?? 0,
    taste_intensity: meal.taste_intensity ?? 0,
    symptom_time: meal.symptom_time ?? null,
    extra_symptoms: meal.extra_symptoms ?? '',
    ingredients: meal.ingredients ?? [],
    photo_url: meal.photo_url ?? null,
    created_at: new Date().toISOString(),
  }
  data.meals.push(newMeal)
  saveAll(data)
  return newMeal
}

/** Actualiza una comida por id. */
export function updateMeal(id, patch) {
  const data = loadAll()
  const idx = data.meals.findIndex((m) => m.id === id)
  if (idx === -1) throw new Error(`Comida no encontrada: ${id}`)
  data.meals[idx] = { ...data.meals[idx], ...patch }
  saveAll(data)
  return data.meals[idx]
}

/** Elimina una comida por id. */
export function deleteMeal(id) {
  const data = loadAll()
  data.meals = data.meals.filter((m) => m.id !== id)
  saveAll(data)
}

/**
 * Devuelve un mapa { 'YYYY-MM-DD': { day, meals } } para un rango de fechas,
 * usado para pintar los indicadores del calendario.
 */
export function getRange(fromDate, toDate) {
  const data = loadAll()
  const result = {}

  for (const meal of data.meals) {
    if (meal.date < fromDate || meal.date > toDate) continue
    result[meal.date] = result[meal.date] ?? {
      day: data.days[meal.date] ?? { date: meal.date, stress: null, notes: '' },
      meals: [],
    }
    result[meal.date].meals.push(meal)
  }

  // Incluye días con datos generales pero sin comidas.
  for (const date of Object.keys(data.days)) {
    if (date < fromDate || date > toDate) continue
    if (!result[date]) {
      result[date] = { day: data.days[date], meals: [] }
    }
  }

  return result
}
