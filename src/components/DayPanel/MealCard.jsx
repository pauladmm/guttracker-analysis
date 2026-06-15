import { useEffect, useState } from 'react'
import {
  IconCoffee,
  IconSalad,
  IconMoon,
  IconApple,
} from '@tabler/icons-react'
import Badge from '../UI/Badge'
import { getMealType, getFeelColor, COLORS } from '../../utils/symptomHelpers'
import { getPhotoUrl } from '../../lib/storage'

const ICONS = {
  coffee: IconCoffee,
  salad: IconSalad,
  moon: IconMoon,
  apple: IconApple,
}

/**
 * Tarjeta de una comida con borde izquierdo de color según cómo sentó.
 * @param {object} meal
 * @param {(meal: object) => void} onEdit
 */
export default function MealCard({ meal, onEdit }) {
  const type = getMealType(meal.meal_type)
  const Icon = type ? ICONS[type.icon] : IconCoffee
  const feelColor = getFeelColor(meal.feel)
  const ingredients = (meal.ingredients ?? []).map((i) =>
    typeof i === 'string' ? i : i.name
  )

  const [photoUrl, setPhotoUrl] = useState(null)
  useEffect(() => {
    let active = true
    // getPhotoUrl devuelve null si no hay foto; el setState va en el .then
    // (async), no de forma síncrona en el cuerpo del efecto.
    getPhotoUrl(meal.photo_url).then((url) => {
      if (active) setPhotoUrl(url)
    })
    return () => {
      active = false
    }
  }, [meal.photo_url])

  return (
    <button
      type="button"
      className="meal-card"
      style={{ borderLeftColor: feelColor }}
      onClick={() => onEdit?.(meal)}
    >
      {photoUrl ? (
        <div
          className="meal-card__icon meal-card__icon--photo"
          style={{ backgroundImage: `url(${photoUrl})` }}
        />
      ) : (
        <div className="meal-card__icon" style={{ background: type?.tint, color: type?.accent }}>
          <Icon size={20} stroke={1.75} />
        </div>
      )}

      <div className="meal-card__body">
        <div className="meal-card__top">
          <span className="meal-card__name">{meal.name || type?.label}</span>
          {meal.feel && (
            <Badge color={feelColor}>{meal.feel === 'bien' ? 'Bien' : 'Mal'}</Badge>
          )}
        </div>

        <div className="meal-card__meta">
          {meal.stomach_intensity > 0 && (
            <Badge color={COLORS.intensity}>Estómago {meal.stomach_intensity}/5</Badge>
          )}
          {meal.taste_intensity > 0 && (
            <Badge color={COLORS.intensity}>Sabor {meal.taste_intensity}/5</Badge>
          )}
          {meal.symptom_time && <Badge color={COLORS.primary}>{meal.symptom_time}</Badge>}
        </div>

        {ingredients.length > 0 && (
          <p className="meal-card__ingredients">{ingredients.join(' · ')}</p>
        )}
        {meal.extra_symptoms && (
          <p className="meal-card__symptoms">{meal.extra_symptoms}</p>
        )}
      </div>
    </button>
  )
}
