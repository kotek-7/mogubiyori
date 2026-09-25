import type { GameState } from './types'

export type SubscriptionPlan = 'free' | 'premium'

export const DAILY_MEAL_LIMIT_MESSAGE =
  '無料プランのごはん記録は1日1回です。有料プランに切り替えると、今日も続けて記録できます。'

export function getSubscriptionPlan(state: GameState): SubscriptionPlan {
  return state.subscriptionPlan ?? 'free'
}

/** Sharing an existing record is separate from recording another human meal. */
export function canRecordMeal(state: GameState): boolean {
  return (
    getSubscriptionPlan(state) === 'premium' ||
    (!state.mealRecords?.some((record) => record.day === state.today) &&
      !state.meals.some((meal) => meal.day === state.today))
  )
}

export function earliestReportDay(state: GameState): string | undefined {
  if (getSubscriptionPlan(state) === 'premium') return undefined
  const date = new Date(`${state.today}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 2)
  return date.toISOString().slice(0, 10)
}

export function canViewReportDay(state: GameState, day: string): boolean {
  const earliest = earliestReportDay(state)
  return day <= state.today && (earliest === undefined || day >= earliest)
}
