/** Browser compatibility surface. Shared/server code imports shared modules directly. */
export * from '../shared/types'
export * from '../shared/catalog'
export * from '../shared/game'
export { advanceGame, addDemoGems } from '../shared/demo'

import { feed as applyFeed, initialGame as createGame } from '../shared/game'
import { demoGame as createDemo } from '../shared/demo'
import type { FeedInput, GameState } from '../shared/types'

export function todayTokyo(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date())
}

export function initialGame(day = todayTokyo(), _fresh = true): GameState {
  return createGame(day)
}

export function demoGame(day = todayTokyo()): GameState {
  return createDemo(day)
}

function mealId(state: GameState): string {
  const random = new Uint32Array(4)
  const crypto = globalThis.crypto
  const token =
    typeof crypto?.getRandomValues === 'function'
      ? Array.from(crypto.getRandomValues(random), (value) => value.toString(16)).join('-')
      : `${state.today}-${state.meals.length}`
  let id = `meal-${token}`
  while (state.meals.some((meal) => meal.id === id)) id += '-1'
  return id
}

/** Existing local callers retain browser IDs; command callers pass explicit IDs. */
export function feed(state: GameState, input: FeedInput): GameState {
  return applyFeed(state, input, { mealId: mealId(state) })
}
