// Capa de datos unificada.
//
// Expone una única interfaz (getDay, upsertDay, addMeal, updateMeal,
// deleteMeal, getRange) y enruta a localStorage o a Supabase según haya
// credenciales configuradas (ver lib/supabase.js).
//
// Las comidas del frontend llevan los ingredientes embebidos como
// `meal.ingredients = [{ name, source }]`. En Supabase se persisten en la
// tabla `ingredients`; en localStorage van dentro de la propia comida.

import { supabase, isSupabaseConfigured } from './supabase'
import * as local from './localStore'

// ─────────────────────────── Modo local ───────────────────────────

const localBackend = {
  getDay: async (date) => local.getDay(date),
  upsertDay: async (date, patch) => local.upsertDay(date, patch),
  addMeal: async (date, meal) => local.addMeal(date, meal),
  updateMeal: async (id, patch) => local.updateMeal(id, patch),
  deleteMeal: async (id) => local.deleteMeal(id),
  getRange: async (from, to) => local.getRange(from, to),
}

// ────────────────────────── Modo Supabase ─────────────────────────

async function currentUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sesión no iniciada')
  return user.id
}

/** Obtiene (o crea) la fila `days` de una fecha y devuelve su id. */
async function ensureDayRow(date) {
  const userId = await currentUserId()
  const { data: existing } = await supabase
    .from('days')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()

  if (existing) return existing

  const { data, error } = await supabase
    .from('days')
    .insert({ user_id: userId, date })
    .select()
    .single()
  if (error) throw error
  return data
}

const supabaseBackend = {
  async getDay(date) {
    const dayRow = await ensureDayRow(date)
    const { data: meals, error } = await supabase
      .from('meals')
      .select('*, ingredients(*)')
      .eq('day_id', dayRow.id)
      .order('created_at', { ascending: true })
    if (error) throw error
    return { day: dayRow, meals: meals ?? [] }
  },

  async upsertDay(date, patch) {
    const dayRow = await ensureDayRow(date)
    const { data, error } = await supabase
      .from('days')
      .update(patch)
      .eq('id', dayRow.id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async addMeal(date, meal) {
    const dayRow = await ensureDayRow(date)
    const { ingredients = [], ...mealFields } = meal
    const { data: created, error } = await supabase
      .from('meals')
      .insert({ ...mealFields, day_id: dayRow.id })
      .select()
      .single()
    if (error) throw error

    if (ingredients.length) {
      const rows = ingredients.map((ing) => ({
        meal_id: created.id,
        name: typeof ing === 'string' ? ing : ing.name,
        source: typeof ing === 'string' ? 'manual' : ing.source ?? 'manual',
      }))
      await supabase.from('ingredients').insert(rows)
    }
    return { ...created, ingredients }
  },

  async updateMeal(id, patch) {
    const { ingredients, ...mealFields } = patch
    const { data, error } = await supabase
      .from('meals')
      .update(mealFields)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    if (ingredients) {
      await supabase.from('ingredients').delete().eq('meal_id', id)
      if (ingredients.length) {
        const rows = ingredients.map((ing) => ({
          meal_id: id,
          name: typeof ing === 'string' ? ing : ing.name,
          source: typeof ing === 'string' ? 'manual' : ing.source ?? 'manual',
        }))
        await supabase.from('ingredients').insert(rows)
      }
    }
    return { ...data, ingredients }
  },

  async deleteMeal(id) {
    const { error } = await supabase.from('meals').delete().eq('id', id)
    if (error) throw error
  },

  async getRange(from, to) {
    const userId = await currentUserId()
    const { data: days, error } = await supabase
      .from('days')
      .select('*, meals(*, ingredients(*))')
      .eq('user_id', userId)
      .gte('date', from)
      .lte('date', to)
    if (error) throw error

    const result = {}
    for (const day of days ?? []) {
      result[day.date] = { day, meals: day.meals ?? [] }
    }
    return result
  },
}

const db = isSupabaseConfigured ? supabaseBackend : localBackend

/**
 * Devuelve TODOS los datos del usuario como array de días ordenados por fecha,
 * para el análisis estadístico. Cada entrada: { date, day, meals }.
 */
db.getAll = async () => {
  const map = await db.getRange('0001-01-01', '9999-12-31')
  return Object.entries(map)
    .map(([date, v]) => ({ date, day: v.day, meals: v.meals }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
}

export default db
export { isSupabaseConfigured }
