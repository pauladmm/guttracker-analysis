import { useRef, useState } from 'react'
import { IconX, IconPlus } from '@tabler/icons-react'
import { searchCatalog, cleanName, normalizeKey } from '../../utils/ingredients'

/**
 * Entrada de ingredientes con autocompletado sobre el catálogo.
 * @param {string[]} value - ingredientes seleccionados (nombres).
 * @param {(names: string[]) => void} onChange
 * @param {Array<{key,name,count}>} catalog
 */
export default function IngredientInput({ value = [], onChange, catalog = [] }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const blurTimer = useRef(null)

  const selectedKeys = value.map(normalizeKey)
  const qKey = normalizeKey(query)
  const suggestions = searchCatalog(catalog, query, { exclude: value })
  // Opción de "crear" si lo tecleado no existe ya como sugerencia ni seleccionado.
  const canCreate =
    qKey.length > 0 &&
    !selectedKeys.includes(qKey) &&
    !suggestions.some((s) => s.key === qKey)

  const options = canCreate ? [...suggestions, { create: true, name: query }] : suggestions

  const add = (name) => {
    const clean = cleanName(name)
    const key = normalizeKey(clean)
    if (!clean || selectedKeys.includes(key)) {
      setQuery('')
      setHighlight(0)
      return
    }
    onChange([...value, clean])
    setQuery('')
    setHighlight(0)
  }

  const remove = (idx) => onChange(value.filter((_, i) => i !== idx))

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.min(h + 1, Math.max(options.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = options[highlight]
      if (opt) add(opt.name)
      else if (query.trim()) add(query)
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Backspace' && !query && value.length) {
      remove(value.length - 1)
    }
  }

  return (
    <div className="ing-combo">
      <div className="ing-combo__field">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setHighlight(0)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Retardo para permitir el click en una sugerencia antes de cerrar.
            blurTimer.current = setTimeout(() => setOpen(false), 150)
          }}
          onKeyDown={onKeyDown}
          placeholder="Busca o añade un ingrediente"
        />
        {query.trim() && (
          <button
            type="button"
            className="icon-button icon-button--primary"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => add(query)}
            aria-label="Añadir ingrediente"
          >
            <IconPlus size={18} stroke={2} />
          </button>
        )}

        {open && options.length > 0 && (
          <ul className="ing-combo__menu">
            {options.map((opt, i) => (
              <li
                key={opt.create ? '__create' : opt.key}
                className={`ing-combo__option${i === highlight ? ' is-active' : ''}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  // Evita que el blur cierre el menú antes del click.
                  e.preventDefault()
                  clearTimeout(blurTimer.current)
                  add(opt.name)
                }}
              >
                {opt.create ? (
                  <span className="ing-combo__create">
                    <IconPlus size={14} stroke={2} /> Crear “{opt.name.trim().toLowerCase()}”
                  </span>
                ) : (
                  <>
                    <span>{opt.name}</span>
                    {opt.count > 0 && <span className="ing-combo__count">×{opt.count}</span>}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {value.length > 0 && (
        <ul className="ingredient-tags">
          {value.map((name, idx) => (
            <li key={idx} className="ingredient-tag">
              {name}
              <button type="button" onClick={() => remove(idx)} aria-label={`Quitar ${name}`}>
                <IconX size={14} stroke={2} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
