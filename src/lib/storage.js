// Subida y acceso a fotos de comidas en Supabase Storage.
//
// Bucket privado 'meal-photos'. Las fotos se guardan en una carpeta por
// usuario: meal-photos/<user_id>/<uuid>.<ext>. En `meals.photo_url` se
// guarda esa ruta (no la URL), y se generan URLs firmadas para mostrarlas.

import { supabase, isSupabaseConfigured } from './supabase'

const BUCKET = 'meal-photos'

export const photosEnabled = isSupabaseConfigured

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/**
 * Sube una foto y devuelve la ruta del objeto (para guardar en photo_url).
 * @param {File} file
 * @param {string} userId
 * @returns {Promise<string>} ruta del objeto en el bucket.
 */
export async function uploadMealPhoto(file, userId) {
  if (!isSupabaseConfigured) {
    throw new Error('La subida de fotos requiere Supabase configurado.')
  }
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
  const path = `${userId}/${uid()}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  return path
}

/**
 * Genera una URL firmada temporal para mostrar una foto.
 * @param {string} path - ruta guardada en photo_url.
 * @param {number} [expiresIn] - segundos de validez.
 * @returns {Promise<string|null>}
 */
export async function getPhotoUrl(path, expiresIn = 3600) {
  if (!path || !isSupabaseConfigured) return null
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn)
  if (error) return null
  return data.signedUrl
}

/** Borra una foto del bucket (al eliminar/reemplazar una comida). */
export async function deleteMealPhoto(path) {
  if (!path || !isSupabaseConfigured) return
  await supabase.storage.from(BUCKET).remove([path])
}
