import { growthStages, recipeById, stageOf } from './game'
import type { GameState, GrowthStage, SpeciesId } from './game'
import { createFeedReceipt } from '../shared/receipt'
import type { FeedReceipt } from '../shared/receipt'

export type FeastStep =
  | { type: 'eating' | 'xp' | 'joined' }
  | { type: 'growth'; from: GrowthStage; to: GrowthStage }
  | { type: 'card'; recipeId: string }
  | { type: 'arrivals'; visitors: SpeciesId[] }
  | { type: 'streak'; beforeDays: number; afterDays: number; reward: number }
  | { type: 'gift'; itemId: 'sprout' }

/** Presentation only: this receipt describes one operation already committed. */
export function feastStepsFromReceipt(receipt: FeedReceipt): FeastStep[] {
  const steps: FeastStep[] = [{ type: 'eating' }, { type: 'xp' }]
  const { target, streak } = receipt
  if (!target.joined) {
    let from = stageOf(target.beforeXp)
    for (const { stage: to } of growthStages) {
      if (to > from && to <= stageOf(target.afterXp)) {
        steps.push({ type: 'growth', from, to })
        from = to
      }
    }
  } else steps.push({ type: 'joined' })

  for (const recipeId of new Set(receipt.newCards)) {
    if (recipeById(recipeId)) steps.push({ type: 'card', recipeId })
  }
  const visitors = [...new Set(receipt.newVisitors)]
  if (visitors.length) steps.push({ type: 'arrivals', visitors })
  if (streak.afterDays > streak.beforeDays) {
    steps.push({
      type: 'streak',
      beforeDays: streak.beforeDays,
      afterDays: streak.afterDays,
      reward: streak.bonus,
    })
  }
  if (receipt.newItems.includes('sprout')) steps.push({ type: 'gift', itemId: 'sprout' })
  return steps
}

/** Legacy adapter for callers holding a local synchronous transition. */
export function deriveFeastSteps(before: GameState, after: GameState): FeastStep[] {
  const receipt = createFeedReceipt(before, after)
  return receipt ? feastStepsFromReceipt(receipt) : []
}
