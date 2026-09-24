import { species } from './catalog'
import { streakOf } from './game'
import type { GameMeal, GameState, SpeciesId } from './types'

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
  streak: Readonly<{ beforeDays: number; afterDays: number; bonus: number }>
}>

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
    }),
  })
}
