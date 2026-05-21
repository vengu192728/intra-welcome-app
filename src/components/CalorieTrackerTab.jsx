import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createMealLog,
  deleteMealLog,
  fetchMealSummary,
  listFoods,
  listMealLogs,
} from '../api/calories'

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER']

function today() {
  return new Date().toISOString().slice(0, 10)
}

function mealLabel(value) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function formatNumber(value) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })
}

export default function CalorieTrackerTab() {
  const [date, setDate] = useState(today)
  const [foods, setFoods] = useState([])
  const [foodSearch, setFoodSearch] = useState('')
  const [selectedFoodId, setSelectedFoodId] = useState('')
  const [mealType, setMealType] = useState('BREAKFAST')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  const [logs, setLogs] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedFood = useMemo(
    () => foods.find((food) => food.id === selectedFoodId) ?? null,
    [foods, selectedFoodId],
  )

  const estimatedCalories = selectedFood
    ? Math.round(selectedFood.caloriesPerServing * Number(quantity || 0))
    : 0

  const loadFoods = useCallback(async () => {
    const foodList = await listFoods(foodSearch)
    setFoods(foodList)
    setSelectedFoodId((current) => {
      if (current && foodList.some((food) => food.id === current)) return current
      return foodList[0]?.id ?? ''
    })
  }, [foodSearch])

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [mealLogs, mealSummary] = await Promise.all([listMealLogs(date), fetchMealSummary(date)])
      setLogs(mealLogs)
      setSummary(mealSummary)
    } catch (err) {
      setError(err.message || 'Could not load calories')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    loadFoods().catch((err) => setError(err.message || 'Could not load foods'))
  }, [loadFoods])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!selectedFoodId) {
      setError('Choose a food item')
      return
    }
    if (Number(quantity) <= 0) {
      setError('Quantity must be greater than zero')
      return
    }

    setSaving(true)
    try {
      await createMealLog({
        logDate: date,
        mealType,
        foodId: selectedFoodId,
        quantity: Number(quantity),
        notes,
      })
      setQuantity('1')
      setNotes('')
      await loadDashboard()
    } catch (err) {
      setError(err.message || 'Could not add meal')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    setError('')
    try {
      await deleteMealLog(id)
      await loadDashboard()
    } catch (err) {
      setError(err.message || 'Could not delete meal')
    }
  }

  return (
    <div className="calorie-tab">
      <h2 className="calorie-tab__heading">Calorie tracker</h2>
      <p className="calorie-tab__hint">Shared meal log for Indian food estimates.</p>

      <section className="calorie-tab__summary" aria-label="Daily calorie summary">
        <label className="calorie-tab__date">
          <span>Date</span>
          <input
            type="date"
            className="welcome__input"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <div className="calorie-tab__total">
          <span>Total</span>
          <strong>{summary?.totalCalories ?? 0}</strong>
          <span>kcal</span>
        </div>
      </section>

      <div className="calorie-tab__meal-grid" aria-label="Calories by meal">
        {MEAL_TYPES.map((type) => (
          <div key={type} className="calorie-tab__meal-stat">
            <span>{mealLabel(type)}</span>
            <strong>{summary?.caloriesByMeal?.[type] ?? 0}</strong>
          </div>
        ))}
      </div>

      <form className="calorie-tab__form" onSubmit={handleSubmit}>
        <div className="welcome__field">
          <label className="welcome__label" htmlFor="food-search">
            Find food
          </label>
          <input
            id="food-search"
            type="search"
            className="welcome__input"
            value={foodSearch}
            onChange={(event) => setFoodSearch(event.target.value)}
            placeholder="Dosa, dal, chai..."
          />
        </div>

        <div className="welcome__field">
          <label className="welcome__label" htmlFor="food">
            Food
          </label>
          <select
            id="food"
            className="welcome__input"
            value={selectedFoodId}
            onChange={(event) => setSelectedFoodId(event.target.value)}
          >
            {foods.map((food) => (
              <option key={food.id} value={food.id}>
                {food.name} - {food.caloriesPerServing} kcal / {food.servingLabel}
              </option>
            ))}
          </select>
        </div>

        <div className="calorie-tab__row">
          <div className="welcome__field">
            <label className="welcome__label" htmlFor="meal-type">
              Meal
            </label>
            <select
              id="meal-type"
              className="welcome__input"
              value={mealType}
              onChange={(event) => setMealType(event.target.value)}
            >
              {MEAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {mealLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="welcome__field">
            <label className="welcome__label" htmlFor="quantity">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              min="0.1"
              step="0.1"
              className="welcome__input"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>
        </div>

        {selectedFood ? (
          <p className="calorie-tab__estimate">
            {formatNumber(quantity || 0)} x {selectedFood.servingLabel} = {estimatedCalories} kcal
          </p>
        ) : null}

        <div className="welcome__field">
          <label className="welcome__label" htmlFor="notes">
            Notes
          </label>
          <input
            id="notes"
            type="text"
            className="welcome__input"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional"
          />
        </div>

        {error ? (
          <p className="welcome__error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="welcome__button" disabled={saving || loading}>
          {saving ? 'Adding…' : 'Add meal'}
        </button>
      </form>

      <section className="calorie-tab__logs" aria-labelledby="meal-log-heading">
        <div className="upload-tab__list-header">
          <h3 id="meal-log-heading">Shared food log</h3>
          <button
            type="button"
            className="welcome__button welcome__button--secondary upload-tab__refresh"
            onClick={loadDashboard}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="upload-tab__empty">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="upload-tab__empty">No food logged for this date.</p>
        ) : (
          <ul className="calorie-tab__log-list">
            {logs.map((log) => (
              <li key={log.id} className="calorie-tab__log">
                <div className="calorie-tab__log-main">
                  <span className="calorie-tab__log-name">{log.food.name}</span>
                  <span className="calorie-tab__log-meta">
                    {mealLabel(log.mealType)} · {formatNumber(log.quantity)} x {log.food.servingLabel} ·{' '}
                    {log.loggedBy}
                  </span>
                  {log.notes ? <span className="calorie-tab__log-notes">{log.notes}</span> : null}
                </div>
                <div className="calorie-tab__log-actions">
                  <strong>{log.calories} kcal</strong>
                  <button
                    type="button"
                    className="welcome__button welcome__button--secondary calorie-tab__delete"
                    onClick={() => handleDelete(log.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
