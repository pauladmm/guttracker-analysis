// Llamadas a Claude vía Edge Functions de Supabase.
//
// IMPORTANTE: la API key de Anthropic vive en el servidor (secreto de la Edge
// Function), nunca en el frontend. Aquí solo invocamos la función; Supabase
// añade automáticamente el JWT del usuario para autenticar la petición.

import { supabase, isSupabaseConfigured } from './supabase'

/**
 * Extrae los ingredientes de una foto ya subida al bucket meal-photos.
 * @param {string} path - ruta del objeto (lo que se guarda en meal.photo_url).
 * @returns {Promise<string[]>} lista de ingredientes detectados.
 */
export async function extractIngredientsFromPhoto(path) {
  if (!isSupabaseConfigured) {
    throw new Error('El análisis de fotos requiere Supabase configurado.')
  }
  if (!path) throw new Error('No hay foto que analizar.')

  const { data, error } = await supabase.functions.invoke('extract-ingredients', {
    body: { path },
  })

  if (error) {
    throw new Error(error.message ?? 'No se pudo analizar la foto.')
  }
  if (data?.error) {
    throw new Error(data.error)
  }
  return Array.isArray(data?.ingredients) ? data.ingredients : []
}
