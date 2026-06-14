import { useCallback, useEffect, useState } from 'react'
import db from '../lib/db'
import { toISODate, startOfMonth, endOfMonth } from '../utils/dateHelpers'

/**
 * Hook con scope de un día: datos generales (estrés, notas) + comidas + CRUD.
 * @param {Date|string} date
 */
export function useMeals(date) {
  const iso = typeof date === 'string' ? date : toISODate(date)
  const [day, setDay] = useState({ date: iso, stress: null, notes: '' })
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    // Todos los setState ocurren en el callback async (no de forma
    // síncrona en el cuerpo del efecto).
    return db
      .getDay(iso)
      .then(({ day: d, meals: m }) => {
        setDay(d)
        setMeals(m)
        setError(null)
      })
      .catch(setError)
  }, [iso])

  useEffect(() => {
    let cancelled = false
    refetch().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [refetch])

  const saveDay = useCallback(
    async (patch) => {
      const updated = await db.upsertDay(iso, patch)
      setDay(updated)
      return updated
    },
    [iso]
  )

  const addMeal = useCallback(
    async (meal) => {
      const created = await db.addMeal(iso, meal)
      setMeals((prev) => [...prev, created])
      return created
    },
    [iso]
  )

  const updateMeal = useCallback(async (id, patch) => {
    const updated = await db.updateMeal(id, patch)
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)))
    return updated
  }, [])

  const deleteMeal = useCallback(async (id) => {
    await db.deleteMeal(id)
    setMeals((prev) => prev.filter((m) => m.id !== id))
  }, [])

  return {
    day,
    meals,
    loading,
    error,
    refetch,
    saveDay,
    addMeal,
    updateMeal,
    deleteMeal,
  }
}

/**
 * Hook para cargar las entradas de un mes completo (para los indicadores
 * del calendario). `refreshKey` permite forzar la recarga tras una mutación.
 * @param {Date} monthDate - cualquier fecha del mes a cargar.
 * @param {number} [refreshKey]
 */
export function useMonthEntries(monthDate, refreshKey = 0) {
  const from = toISODate(startOfMonth(monthDate))
  const to = toISODate(endOfMonth(monthDate))
  const [entries, setEntries] = useState({})

  useEffect(() => {
    let active = true
    db.getRange(from, to)
      .then((data) => {
        if (active) setEntries(data)
      })
      .catch(() => {
        if (active) setEntries({})
      })
    return () => {
      active = false
    }
  }, [from, to, refreshKey])

  return entries
}
