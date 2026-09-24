import { growthStages, recipeById, stageOf, streakOf } from './game'
import type { GameState, GrowthStage, SpeciesId } from './game'

export type FeastStep =
  | { type: 'eating' | 'xp' | 'joined' }
  | { type: 'growth'; from: GrowthStage; to: GrowthStage }
  | { type: 'card'; recipeId: string }
  | { type: 'arrivals'; visitors: SpeciesId[] }
  | { type: 'streak'; beforeDays: number; afterDays: number; reward: number }
  | { type: 'gift'; itemId: 'sprout' }

/** Presentation only: the completed meal has already awarded every reward. */
export function deriveFeastSteps(before: GameState, after: GameState): FeastStep[] {
  const existingMealIds = new Set(before.meals.map((meal) => meal.id))
  const meal = after.meals.find((entry) => !existingMealIds.has(entry.id))
  if (!meal) return []
  const targetId = meal.targetId ?? after.activeId
  const previous = before.companions.find((companion) => companion.id === targetId)
  const current = after.companions.find((companion) => companion.id === targetId)
  const steps: FeastStep[] = [{ type: 'eating' }, { type: 'xp' }]

  if (previous && current) {
    let from = stageOf(previous.xp)
    for (const { stage: to } of growthStages) {
      if (to > from && to <= stageOf(current.xp)) {
        steps.push({ type: 'growth', from, to })
        from = to
      }
    }
  }
  if (!previous && current) steps.push({ type: 'joined' })

  for (const recipeId of new Set(after.cards)) {
    if (!before.cards.includes(recipeId) && recipeById(recipeId)) {
      steps.push({ type: 'card', recipeId })
    }
  }
  const visitors = [...new Set(after.visitors)].filter(
    (id) =>
      !before.visitors.includes(id) && !after.companions.some((companion) => companion.id === id),
  )
  if (visitors.length) steps.push({ type: 'arrivals', visitors })
  const beforeDays = streakOf({ ...before, today: meal.day })
  const afterDays = streakOf({ ...after, today: meal.day })
  if (
    !before.meals.some((previousMeal) => previousMeal.day === meal.day) &&
    afterDays > beforeDays
  ) {
    steps.push({ type: 'streak', beforeDays, afterDays, reward: meal.streakBonus ?? 0 })
  }
  if (!before.owned.includes('sprout') && after.owned.includes('sprout')) {
    steps.push({ type: 'gift', itemId: 'sprout' })
  }
  return steps
}
