import { useSearch } from '@tanstack/react-router'
import { dailyMealReport, weekMealReports } from '../../../shared/meals/analysis'
import { mealDaySchema } from '../../../shared/meals/schemas'
import { shiftDay } from '../../../shared/game/game'
import { useGameSession } from '../../app/game/useGameSession'
import { useGameUi } from '../../app/gameUi'

/** Both reading screens share their selected date through ordinary browser history. */
export function useMealHistory(page: 'album' | 'reports') {
  const { state } = useGameSession()
  const { navigate } = useGameUi()
  const search = useSearch({ strict: false }) as { day?: string; end?: string }
  const clampDay = (value: string | undefined) =>
    value && mealDaySchema.safeParse(value).success && value <= state.today ? value : state.today
  const selectedDay = clampDay(search.day ?? search.end)
  const requestedEnd = clampDay(search.end)
  const weekEnd =
    selectedDay > requestedEnd || selectedDay < shiftDay(requestedEnd, -6)
      ? selectedDay
      : requestedEnd
  const records = state.mealRecords ?? []
  const recordIds = new Set(records.map((record) => record.id))
  const legacyMeals = state.meals.filter(
    (meal) => !meal.mealRecordId || !recordIds.has(meal.mealRecordId),
  )
  const reports = weekMealReports(records, weekEnd)

  function selectDate(value: string) {
    if (!mealDaySchema.safeParse(value).success) return
    const day = clampDay(value)
    const end = day < reports[0].day || day > weekEnd ? day : weekEnd
    navigate(page, { day, end })
  }
  function moveWeek(amount: number) {
    const end = clampDay(shiftDay(weekEnd, amount))
    navigate(page, { day: end, end })
  }
  function showToday() {
    navigate(page, { day: state.today, end: state.today })
  }

  return {
    state,
    records,
    legacyMeals,
    selectedDay,
    weekEnd,
    reports,
    report: dailyMealReport(records, selectedDay),
    dayRecords: records.filter((record) => record.day === selectedDay),
    dayLegacyMeals: legacyMeals.filter((meal) => meal.day === selectedDay),
    selectDate,
    moveWeek,
    showToday,
  }
}
