import { useEffect, useState } from 'react'
import { IconPlus, IconX, IconTrash, IconCamera } from '@tabler/icons-react'
import BottomSheet from '../UI/BottomSheet'
import IntensityPicker from './IntensityPicker'
import FeelButtons from './FeelButtons'
import { MEAL_TYPES, SYMPTOM_TIMES } from '../../utils/symptomHelpers'
import { useAuth } from '../../hooks/useAuth'
import { photosEnabled, uploadMealPhoto, getPhotoUrl } from '../../lib/storage'

function blankMeal(type) {
  return {
    meal_type: type ?? 'breakfast',
    name: '',
    feel: null,
    stomach_intensity: 0,
    taste_intensity: 0,
    symptom_time: null,
    extra_symptoms: '',
    ingredients: [],
    photo_url: null,
  }
}

/** Normaliza ingredientes a array de strings para el input de tags. */
function ingredientNames(ingredients = []) {
  return ingredients.map((i) => (typeof i === 'string' ? i : i.name))
}

/**
 * Bottom sheet para crear o editar una comida.
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {(meal: object) => Promise<void>} onSave
 * @param {(id: string) => Promise<void>} [onDelete]
 * @param {object} [initialMeal] - si se pasa, modo edición.
 * @param {string} [defaultType] - tipo preseleccionado al crear.
 */
export default function MealSheet({ open, onClose, onSave, onDelete, initialMeal, defaultType }) {
  const [meal, setMeal] = useState(() =>
    initialMeal
      ? { ...initialMeal, ingredients: ingredientNames(initialMeal.ingredients) }
      : blankMeal(defaultType)
  )
  const [ingredientInput, setIngredientInput] = useState('')
  const [saving, setSaving] = useState(false)

  const { user } = useAuth()
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState(null)

  // Si la comida ya tenía foto guardada, genera su URL firmada para el preview.
  useEffect(() => {
    let active = true
    if (meal.photo_url) {
      getPhotoUrl(meal.photo_url).then((url) => {
        if (active) setPhotoPreview(url)
      })
    }
    return () => {
      active = false
    }
    // Solo al montar: la foto inicial. Las nuevas se previsualizan al subir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (field) => (value) => setMeal((prev) => ({ ...prev, [field]: value }))

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoBusy(true)
    setPhotoError(null)
    // Preview inmediato con la imagen local mientras se sube.
    setPhotoPreview(URL.createObjectURL(file))
    try {
      const path = await uploadMealPhoto(file, user.id)
      setMeal((prev) => ({ ...prev, photo_url: path }))
    } catch (err) {
      setPhotoError(err.message ?? 'No se pudo subir la foto.')
      setPhotoPreview(null)
    } finally {
      setPhotoBusy(false)
    }
  }

  const removePhoto = () => {
    setMeal((prev) => ({ ...prev, photo_url: null }))
    setPhotoPreview(null)
    setPhotoError(null)
  }

  const addIngredient = () => {
    const name = ingredientInput.trim()
    if (!name) return
    setMeal((prev) => ({ ...prev, ingredients: [...prev.ingredients, name] }))
    setIngredientInput('')
  }

  const removeIngredient = (idx) =>
    setMeal((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave?.({
        ...meal,
        ingredients: meal.ingredients.map((name) => ({ name, source: 'manual' })),
      })
      onClose?.()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!initialMeal?.id) return
    setSaving(true)
    try {
      await onDelete?.(initialMeal.id)
      onClose?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={initialMeal ? 'Editar comida' : 'Nueva comida'}>
      <form className="meal-sheet" onSubmit={handleSubmit}>
        {/* Tipo de comida */}
        <div className="meal-sheet__types">
          {MEAL_TYPES.map((t) => {
            const active = meal.meal_type === t.key
            return (
              <button
                key={t.key}
                type="button"
                className={`meal-sheet__type${active ? ' is-active' : ''}`}
                onClick={() => set('meal_type')(t.key)}
                style={active ? { background: t.tint, borderColor: t.accent, color: t.accent } : undefined}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        <label className="field">
          <span className="field-label">¿Qué comiste?</span>
          <input
            type="text"
            value={meal.name}
            onChange={(e) => set('name')(e.target.value)}
            placeholder="Ej: ensalada de pollo"
            required
            autoFocus
          />
        </label>

        <FeelButtons value={meal.feel} onChange={set('feel')} />

        <IntensityPicker
          label="Dolor de estómago"
          value={meal.stomach_intensity}
          onChange={set('stomach_intensity')}
        />
        <IntensityPicker
          label="Mal sabor de boca"
          value={meal.taste_intensity}
          onChange={set('taste_intensity')}
        />

        <div className="field">
          <span className="field-label">¿Cuándo aparecieron los síntomas?</span>
          <div className="chips">
            {SYMPTOM_TIMES.map((t) => {
              const active = meal.symptom_time === t
              return (
                <button
                  key={t}
                  type="button"
                  className={`chip${active ? ' is-active' : ''}`}
                  onClick={() => set('symptom_time')(active ? null : t)}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>

        <label className="field">
          <span className="field-label">Síntomas extra</span>
          <textarea
            value={meal.extra_symptoms}
            onChange={(e) => set('extra_symptoms')(e.target.value)}
            placeholder="Describe cualquier otro síntoma…"
            rows={2}
          />
        </label>

        {/* Foto (etiqueta de producto, plato, ticket…) */}
        <div className="field">
          <span className="field-label">Foto</span>
          {photosEnabled ? (
            photoPreview ? (
              <div className="photo-preview">
                <img src={photoPreview} alt="Foto de la comida" />
                {photoBusy && <span className="photo-preview__status">Subiendo…</span>}
                <button
                  type="button"
                  className="photo-preview__remove"
                  onClick={removePhoto}
                  aria-label="Quitar foto"
                >
                  <IconX size={16} stroke={2} />
                </button>
              </div>
            ) : (
              <label className="photo-add">
                <IconCamera size={22} stroke={1.75} />
                <span>Añadir foto</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhoto}
                  hidden
                />
              </label>
            )
          ) : (
            <p className="field-hint">Disponible al conectar Supabase.</p>
          )}
          {photoError && <p className="login-error">{photoError}</p>}
        </div>

        <div className="field">
          <span className="field-label">Ingredientes</span>
          <div className="ingredient-input">
            <input
              type="text"
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addIngredient()
                }
              }}
              placeholder="Añade un ingrediente y pulsa Enter"
            />
            <button type="button" className="icon-button icon-button--primary" onClick={addIngredient} aria-label="Añadir ingrediente">
              <IconPlus size={18} stroke={2} />
            </button>
          </div>
          {meal.ingredients.length > 0 && (
            <ul className="ingredient-tags">
              {meal.ingredients.map((name, idx) => (
                <li key={idx} className="ingredient-tag">
                  {name}
                  <button type="button" onClick={() => removeIngredient(idx)} aria-label={`Quitar ${name}`}>
                    <IconX size={14} stroke={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="meal-sheet__actions">
          {initialMeal && (
            <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={saving}>
              <IconTrash size={18} stroke={1.75} /> Eliminar
            </button>
          )}
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </BottomSheet>
  )
}
