// Motor de análisis estadístico (Fase 3).
//
// Trabaja sobre el array que devuelve db.getAll(): [{ date, day, meals }].
// Todas las funciones son puras y se calculan en cliente (el dataset de una
// sola persona es pequeño). Para asociaciones usamos medidas descriptivas
// robustas con muestras pequeñas: tasa de "sentó mal", riesgo relativo y
// recuentos — evitando modelos que sobreajustarían con pocos datos.

import { MEAL_TYPES, SYMPTOM_TIMES } from './symptomHelpers'
import { normalizeKey } from './ingredients'

/** Aplana los días en una lista de comidas, arrastrando estrés y fecha. */
export function flattenMeals(entries = []) {
  const meals = []
  for (const e of entries) {
    const stress = e.day?.stress ?? null
    for (const m of e.meals ?? []) {
      const names = (m.ingredients ?? [])
        .map((i) => (typeof i === 'string' ? i : i.name))
        .filter(Boolean)
        .map((n) => normalizeKey(n))
        .filter(Boolean)
      meals.push({ ...m, date: e.date, stress, names: [...new Set(names)] })
    }
  }
  return meals
}

const isRated = (m) => m.feel === 'bien' || m.feel === 'mal'
const isBad = (m) => m.feel === 'mal'
const pct = (n, d) => (d > 0 ? n / d : 0)

/** Resumen de cobertura de datos (para avisar si hay pocos). */
export function coverage(entries) {
  const meals = flattenMeals(entries)
  const rated = meals.filter(isRated)
  const ingredients = new Set()
  meals.forEach((m) => m.names.forEach((n) => ingredients.add(n)))
  return {
    days: entries.length,
    meals: meals.length,
    rated: rated.length,
    ratedPct: pct(rated.length, meals.length),
    bad: rated.filter(isBad).length,
    ingredients: ingredients.size,
    from: entries[0]?.date ?? null,
    to: entries[entries.length - 1]?.date ?? null,
    enough: rated.length >= 20,
  }
}

/**
 * Ranking de sospecha por ingrediente.
 * Para cada ingrediente: tasa de "sentó mal" cuando está presente, riesgo
 * relativo frente a cuando NO está, intensidad media y recuentos.
 * Solo se rankean ingredientes con al menos `minOccur` comidas valoradas.
 */
export function ingredientSuspicion(meals, { minOccur = 3 } = {}) {
  const rated = meals.filter(isRated)
  const totalRated = rated.length
  const totalBad = rated.filter(isBad).length

  const map = new Map()
  for (const m of rated) {
    for (const name of m.names) {
      const e =
        map.get(name) ??
        { name, withRated: 0, withBad: 0, stomachSum: 0, tasteSum: 0 }
      e.withRated += 1
      if (isBad(m)) e.withBad += 1
      e.stomachSum += m.stomach_intensity ?? 0
      e.tasteSum += m.taste_intensity ?? 0
      map.set(name, e)
    }
  }

  const out = []
  for (const e of map.values()) {
    if (e.withRated < minOccur) continue
    const rateWith = pct(e.withBad, e.withRated)
    const withoutRated = totalRated - e.withRated
    const withoutBad = totalBad - e.withBad
    const rateWithout = pct(withoutBad, withoutRated)
    const relativeRisk =
      rateWithout > 0 ? rateWith / rateWithout : rateWith > 0 ? Infinity : 0
    out.push({
      name: e.name,
      withRated: e.withRated,
      withBad: e.withBad,
      rateWith,
      rateWithout,
      relativeRisk,
      avgStomach: e.stomachSum / e.withRated,
      avgTaste: e.tasteSum / e.withRated,
    })
  }
  // Orden: primero por tasa de malestar, desempate por nº de ocurrencias.
  return out.sort((a, b) => b.rateWith - a.rateWith || b.withRated - a.withRated)
}

/** Ranking por intensidad media de dolor de estómago (ingredientes presentes). */
export function ingredientIntensity(meals, { minOccur = 3 } = {}) {
  return ingredientSuspicion(meals, { minOccur })
    .slice()
    .sort((a, b) => b.avgStomach - a.avgStomach)
}

/** Distribución de tiempo de aparición de síntomas entre las comidas "mal". */
export function symptomTimeDistribution(meals, ingredient = null) {
  const bad = meals.filter(
    (m) => isBad(m) && (!ingredient || m.names.includes(ingredient))
  )
  const counts = Object.fromEntries(SYMPTOM_TIMES.map((t) => [t, 0]))
  let sinDato = 0
  for (const m of bad) {
    if (m.symptom_time && counts[m.symptom_time] !== undefined) counts[m.symptom_time] += 1
    else sinDato += 1
  }
  return { counts, sinDato, total: bad.length }
}

/**
 * Efecto acumulativo: pares de ingredientes y su tasa de malestar cuando
 * aparecen juntos. Útil para detectar combinaciones que superan el umbral.
 */
export function ingredientPairs(meals, { minOccur = 3, limit = 8 } = {}) {
  const rated = meals.filter(isRated)
  const map = new Map()
  for (const m of rated) {
    const names = [...m.names].sort()
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const key = `${names[i]} + ${names[j]}`
        const e = map.get(key) ?? { pair: key, rated: 0, bad: 0 }
        e.rated += 1
        if (isBad(m)) e.bad += 1
        map.set(key, e)
      }
    }
  }
  return [...map.values()]
    .filter((e) => e.rated >= minOccur)
    .map((e) => ({ ...e, rate: pct(e.bad, e.rated) }))
    .sort((a, b) => b.rate - a.rate || b.rated - a.rated)
    .slice(0, limit)
}

/** Confusor estrés: tasa de "sentó mal" por nivel de estrés del día. */
export function stressVsBad(meals) {
  const buckets = [1, 2, 3, 4, 5].map((stress) => ({ stress, rated: 0, bad: 0 }))
  for (const m of meals) {
    if (!isRated(m) || !m.stress) continue
    const b = buckets[m.stress - 1]
    b.rated += 1
    if (isBad(m)) b.bad += 1
  }
  return buckets.map((b) => ({ ...b, rate: pct(b.bad, b.rated) }))
}

/** Tasa de "sentó mal" por tipo de comida. */
export function byMealType(meals) {
  return MEAL_TYPES.map((t) => {
    const rated = meals.filter((m) => m.meal_type === t.key && isRated(m))
    const bad = rated.filter(isBad).length
    return { key: t.key, label: t.label, rated: rated.length, bad, rate: pct(bad, rated.length) }
  })
}

/** Serie temporal por día: comidas buenas / malas / sin valorar + estrés. */
export function timeline(entries) {
  return entries.map((e) => {
    let good = 0
    let bad = 0
    let unrated = 0
    for (const m of e.meals ?? []) {
      if (m.feel === 'bien') good += 1
      else if (m.feel === 'mal') bad += 1
      else unrated += 1
    }
    return { date: e.date, good, bad, unrated, stress: e.day?.stress ?? null }
  })
}
