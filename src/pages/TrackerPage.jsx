import { useEffect, useState } from 'react'
import Calendar from '../components/Calendar/Calendar'
import DayPanel from '../components/DayPanel/DayPanel'
import MealSheet from '../components/MealSheet/MealSheet'
import { useMeals, useMonthEntries } from '../hooks/useMeals'
import db from '../lib/db'
import { buildCatalog } from '../utils/ingredients'

const TODAY = new Date()

export default function TrackerPage() {
  const [monthDate, setMonthDate] = useState(TODAY)
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [refreshKey, setRefreshKey] = useState(0)

  // Comidas / día seleccionado.
  const { day, meals, saveDay, addMeal, updateMeal, deleteMeal } = useMeals(selectedDate)

  // Entradas del mes para los indicadores del calendario.
  const entriesByDate = useMonthEntries(monthDate, refreshKey)

  // Catálogo de ingredientes (historial + semilla) para el autocompletado.
  const [catalog, setCatalog] = useState([])
  useEffect(() => {
    let active = true
    db.getAll().then((all) => {
      if (active) setCatalog(buildCatalog(all))
    })
    return () => {
      active = false
    }
  }, [refreshKey])

  // Estado del bottom sheet.
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState(null)
  const [defaultType, setDefaultType] = useState('breakfast')

  const bump = () => setRefreshKey((k) => k + 1)

  const openNewMeal = (type) => {
    setEditingMeal(null)
    setDefaultType(type)
    setSheetOpen(true)
  }

  const openEditMeal = (meal) => {
    setEditingMeal(meal)
    setSheetOpen(true)
  }

  const handleSaveMeal = async (mealData) => {
    if (editingMeal) {
      await updateMeal(editingMeal.id, mealData)
    } else {
      await addMeal(mealData)
    }
    bump()
  }

  const handleDeleteMeal = async (id) => {
    await deleteMeal(id)
    bump()
  }

  const handleSaveDay = async (patch) => {
    await saveDay(patch)
    bump()
  }

  return (
    <div className="tracker-page">
      <Calendar
        monthDate={monthDate}
        onMonthChange={setMonthDate}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        entriesByDate={entriesByDate}
        today={TODAY}
      />

      <DayPanel
        date={selectedDate}
        day={day}
        meals={meals}
        onSaveDay={handleSaveDay}
        onAddMeal={openNewMeal}
        onEditMeal={openEditMeal}
      />

      {sheetOpen && (
        <MealSheet
          key={editingMeal ? `edit-${editingMeal.id}` : `new-${defaultType}`}
          open
          onClose={() => setSheetOpen(false)}
          onSave={handleSaveMeal}
          onDelete={handleDeleteMeal}
          initialMeal={editingMeal}
          defaultType={defaultType}
          catalog={catalog}
        />
      )}
    </div>
  )
}
