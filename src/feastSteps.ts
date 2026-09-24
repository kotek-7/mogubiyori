import { recipeById, stageOf } from './game'
import type { GameState, SpeciesId } from './game'

export type FeastStep =
  | { type: 'eating' | 'joined' | 'satisfied' }
  | { type: 'growth'; from: 0 | 1 | 2; to: 0 | 1 | 2 }
  | { type: 'card'; recipeId: string }
  | { type: 'arrivals'; visitors: SpeciesId[] }
  | { type: 'gift'; itemId: 'sprout' }

/** Presentation only: the completed meal has already awarded every reward. */
export function deriveFeastSteps(before: GameState, after: GameState): FeastStep[] {
  const existingMealIds = new Set(before.meals.map((meal) => meal.id))
  const meal = after.meals.find((entry) => !existingMealIds.has(entry.id))
  if (!meal) return []
  const targetId = meal.targetId ?? after.activeId
  const previous = before.companions.find((companion) => companion.id === targetId)
  const current = after.companions.find((companion) => companion.id === targetId)
  const steps: FeastStep[] = [{ type: 'eating' }]

  if (previous && current && stageOf(current.xp) > stageOf(previous.xp)) {
    steps.push({ type: 'growth', from: stageOf(previous.xp), to: stageOf(current.xp) })
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
  if (!before.owned.includes('sprout') && after.owned.includes('sprout')) {
    steps.push({ type: 'gift', itemId: 'sprout' })
  }
  if (steps.length === 1) steps.push({ type: 'satisfied' })
  return steps
}
