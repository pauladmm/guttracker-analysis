// Datos de muestra para validar el análisis (solo desarrollo).
//
// Genera ~70 días de comidas con ingredientes, sensaciones, intensidades,
// estrés y tiempos de aparición DISEÑADOS para que las métricas tengan señal:
// - ingredientes "problemáticos" (cebolla, ajo, trigo, leche…) con alta tasa
//   de malestar; ingredientes neutros (arroz, pollo, zanahoria…) con baja.
// - efecto acumulativo: 2+ ingredientes problemáticos juntos suben el riesgo.
// - confusor estrés: los días de mucho estrés empeoran independientemente.
// - tiempos de aparición coherentes (FODMAP → tardío, histamina → inmediato).
//
// Uso: botones en la pestaña Análisis (en dev), o desde la consola:
//   await window.gutTracker.seed()   /   await window.gutTracker.clear()

import db, { isSupabaseConfigured } from '../lib/db'
import { supabase } from '../lib/supabase'
import { toISODate } from '../utils/dateHelpers'
import { SYMPTOM_TIMES } from '../utils/symptomHelpers'

// [nombre, probabilidad base de sentar mal, retardo de síntomas]
const INGREDIENTS = [
  ['cebolla', 0.8, 'slow'],
  ['ajo', 0.75, 'slow'],
  ['trigo', 0.7, 'slow'],
  ['leche', 0.65, 'mid'],
  ['queso curado', 0.6, 'fast'],
  ['vino tinto', 0.6, 'fast'],
  ['embutido', 0.55, 'fast'],
  ['tomate', 0.5, 'fast'],
  ['manzana', 0.45, 'slow'],
  ['legumbres', 0.4, 'slow'],
  ['arroz', 0.08, 'fast'],
  ['pollo', 0.1, 'fast'],
  ['zanahoria', 0.08, 'fast'],
  ['aceite de oliva', 0.05, 'fast'],
  ['huevo', 0.15, 'mid'],
  ['patata', 0.1, 'slow'],
  ['lechuga', 0.07, 'fast'],
  ['plátano', 0.1, 'mid'],
  ['salmón', 0.12, 'fast'],
  ['calabacín', 0.08, 'slow'],
]

// Retardo → posibles tiempos de aparición (índices de SYMPTOM_TIMES).
const LAG = { fast: [0, 1], mid: [1, 2], slow: [2, 3] }

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'extra']
const rnd = () => Math.random()
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x))

function chooseIngredients() {
  const n = 2 + Math.floor(rnd() * 4) // 2–5
  const chosen = new Set()
  while (chosen.size < n) chosen.add(pick(INGREDIENTS))
  return [...chosen]
}

function buildMeal(mealType, stress) {
  const ings = chooseIngredients()
  const dominant = ings.reduce((a, b) => (b[1] > a[1] ? b : a))
  let p = dominant[1]
  const highCount = ings.filter((i) => i[1] >= 0.5).length
  if (highCount >= 2) p = Math.min(0.95, p + 0.2) // efecto acumulativo
  p += (stress - 3) * 0.05 // confusor estrés
  p = clamp(p, 0.03, 0.95)

  const meal = {
    meal_type: mealType,
    name: ings.slice(0, 2).map((i) => i[0]).join(' con '),
    feel: null,
    stomach_intensity: 0,
    taste_intensity: 0,
    symptom_time: null,
    ingredients: ings.map(([name]) => ({ name, source: 'manual' })),
  }

  if (rnd() < 0.85) {
    // 85% valoradas; el resto quedan sin valorar (para la cobertura)
    const bad = rnd() < p
    meal.feel = bad ? 'mal' : 'bien'
    if (bad) {
      meal.stomach_intensity = clamp(Math.round(2 + rnd() * 3 * (0.5 + p / 2)), 1, 5)
      meal.taste_intensity = clamp(Math.round(rnd() * 4 * p), 0, 5)
      meal.symptom_time = SYMPTOM_TIMES[pick(LAG[dominant[2]])]
    }
  }
  return meal
}

export async function seedSampleData({ days = 70 } = {}) {
  const today = new Date()
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(today)
    date.setDate(today.getDate() - d)
    const iso = toISODate(date)

    // Estrés sesgado hacia el centro, con picos.
    const stress = clamp(Math.round(2 + rnd() * 2 + (rnd() < 0.15 ? 2 : 0)), 1, 5)
    await db.upsertDay(iso, { stress, notes: '' })

    const nMeals = 2 + Math.floor(rnd() * 3) // 2–4 comidas
    const types = MEAL_TYPES.slice(0, nMeals)
    for (const t of types) {
      await db.addMeal(iso, buildMeal(t, stress))
    }
  }
  return { days }
}

export async function clearAllData() {
  if (isSupabaseConfigured) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) await supabase.from('days').delete().eq('user_id', user.id)
  } else {
    localStorage.removeItem('guttracker:data:v1')
  }
}

// Atajo desde la consola del navegador (solo en desarrollo).
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.gutTracker = { seed: seedSampleData, clear: clearAllData }
}
