// Cliente para análisis con Claude.
//
// IMPORTANTE: nunca expongas una API key de Anthropic en el frontend.
// Estas funciones deben apuntar a un backend propio (p. ej. una Edge
// Function de Supabase) que guarde la clave de forma segura y reenvíe
// la petición a la API de Claude.

const ANALYSIS_ENDPOINT =
  import.meta.env.VITE_CLAUDE_ENDPOINT || '/api/analyze'

/**
 * Pide a Claude un análisis de la relación entre comidas y síntomas.
 * @param {Object} payload - datos a analizar (comidas, síntomas, rango de fechas).
 * @returns {Promise<Object>} respuesta del análisis.
 */
export async function analyzeMeals(payload) {
  const res = await fetch(ANALYSIS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`Error en el análisis de Claude: ${res.status}`)
  }

  return res.json()
}
