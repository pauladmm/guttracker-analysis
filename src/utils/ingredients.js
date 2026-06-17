// Catálogo de ingredientes con normalización y búsqueda.
//
// El catálogo se deriva del propio historial del usuario (lo más usado primero)
// más una lista base de ingredientes comunes. No requiere tabla nueva: se
// reconstruye a partir de las comidas ya guardadas.

/** Lista base para tener sugerencias desde el primer día. */
export const SEED_INGREDIENTS = [
  // Proteínas
  'pollo', 'pavo', 'ternera', 'cerdo', 'huevo', 'salmón', 'atún', 'gambas',
  'tofu', 'lentejas', 'garbanzos', 'alubias',
  // Lácteos
  'leche', 'queso', 'queso curado', 'yogur', 'mantequilla', 'nata',
  // Cereales y derivados
  'arroz', 'arroz integral', 'pan', 'pasta', 'trigo', 'avena', 'maíz', 'quinoa',
  // Verduras
  'cebolla', 'ajo', 'tomate', 'lechuga', 'zanahoria', 'calabacín', 'pimiento',
  'brócoli', 'espinacas', 'patata', 'champiñones', 'pepino', 'berenjena',
  // Frutas
  'manzana', 'plátano', 'naranja', 'fresa', 'pera', 'uva', 'sandía', 'melón', 'kiwi',
  // Grasas y otros
  'aceite de oliva', 'aguacate', 'frutos secos',
  // Fermentados / histamina / comunes
  'vino tinto', 'cerveza', 'embutido', 'jamón', 'chocolate', 'vinagre',
  'café', 'azúcar', 'miel',
]

/** Clave de comparación: minúsculas, sin acentos, espacios colapsados. */
export function normalizeKey(name) {
  return (name ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
}

/** Forma para guardar/mostrar: minúsculas, espacios colapsados (conserva acentos). */
export function cleanName(name) {
  return (name ?? '').toString().trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Construye el catálogo a partir de db.getAll() + la semilla.
 * @returns {Array<{key, name, count}>} ordenado por frecuencia de uso.
 */
export function buildCatalog(entries = []) {
  const counts = new Map()
  for (const e of entries) {
    for (const m of e.meals ?? []) {
      for (const ing of m.ingredients ?? []) {
        const name = cleanName(typeof ing === 'string' ? ing : ing?.name)
        if (!name) continue
        const key = normalizeKey(name)
        const cur = counts.get(key)
        if (cur) cur.count += 1
        else counts.set(key, { key, name, count: 1 })
      }
    }
  }
  // Añade la semilla (count 0) si no está ya.
  for (const s of SEED_INGREDIENTS) {
    const key = normalizeKey(s)
    if (!counts.has(key)) counts.set(key, { key, name: s, count: 0 })
  }
  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  )
}

/**
 * Filtra el catálogo por la búsqueda; prioriza coincidencias por el principio
 * y por uso. `exclude` evita sugerir lo ya seleccionado.
 */
export function searchCatalog(catalog, query, { limit = 8, exclude = [] } = {}) {
  const q = normalizeKey(query)
  const ex = new Set(exclude.map(normalizeKey))
  let items = catalog.filter((c) => !ex.has(c.key))
  if (q) {
    items = items
      .filter((c) => c.key.includes(q))
      .sort((a, b) => {
        const aStarts = a.key.startsWith(q) ? 0 : 1
        const bStarts = b.key.startsWith(q) ? 0 : 1
        return aStarts - bStarts || b.count - a.count || a.name.localeCompare(b.name)
      })
  }
  return items.slice(0, limit)
}
