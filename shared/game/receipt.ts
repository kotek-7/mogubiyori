import { species } from '../content/catalog'
import { streakOf } from './game'
import type { GameMeal, GameState, SpeciesId } from './types'
import { dailyMealReport, weekMealReports } from '../meals/analysis'
import type { MealReportReceipt } from '../meals/types'

/** A committed operation's result, independent of later changes on another device. */
export type FeedReceipt = Readonly<{
  kind: 'feed'
  meal: Readonly<Omit<GameMeal, 'photo'>>
  target: Readonly<{
    id: SpeciesId
    name: string
    beforeXp: number
    afterXp: number
    joined: boolean
  }>
  equipped: Readonly<GameState['equipped']>
  newCards: readonly string[]
  newVisitors: readonly SpeciesId[]
  newItems: readonly string[]
  streak: Readonly<{ beforeDays: number; afterDays: number; bonus: number; ticketBonus?: number }>
  mealReport?: MealReportReceipt
}>

function freezeReport(report: MealReportReceipt): MealReportReceipt {
  for (const day of [report.today, ...report.week]) {
    Object.freeze(day.groupCounts)
    Object.freeze(day)
  }
  Object.freeze(report.week)
  return Object.freeze(report)
}

export function createFeedReceipt(before: GameState, after: GameState): FeedReceipt | null {
  const previousIds = new Set(before.meals.map((meal) => meal.id))
  const meal = after.meals.find((entry) => !previousIds.has(entry.id))
  if (!meal) return null
  const id = meal.targetId ?? after.activeId
  if (!id) return null
  const previous = before.companions.find((companion) => companion.id === id)
  const current = after.companions.find((companion) => companion.id === id)
  if (!current) return null
  const { photo: _photo, ...record } = meal
  return Object.freeze({
    kind: 'feed',
    meal: Object.freeze(record),
    target: Object.freeze({
      id,
      name: id === after.activeId ? after.name : species.find((entry) => entry.id === id)!.name,
      beforeXp: previous?.xp ?? 0,
      afterXp: current.xp,
      joined: !previous,
    }),
    equipped: Object.freeze({ ...after.equipped }),
    newCards: Object.freeze(after.cards.filter((card) => !before.cards.includes(card))),
    newVisitors: Object.freeze(
      after.visitors.filter((visitor) => !before.visitors.includes(visitor)),
    ),
    newItems: Object.freeze(after.owned.filter((item) => !before.owned.includes(item))),
    streak: Object.freeze({
      beforeDays: streakOf({ ...before, today: meal.day }),
      afterDays: streakOf({ ...after, today: meal.day }),
      bonus: meal.streakBonus ?? 0,
      ticketBonus: meal.ticketBonus ?? 0,
    }),
    ...(meal.mealRecordId
      ? {
          mealReport: freezeReport({
            recordId: meal.mealRecordId,
            today: dailyMealReport(after.mealRecords ?? [], meal.day),
            week: weekMealReports(after.mealRecords ?? [], meal.day),
          }),
        }
      : {}),
  })
}
