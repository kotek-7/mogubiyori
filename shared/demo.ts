import { chooseStarter, initialGame, shiftDay } from './game'
import type { GameState } from './types'

export function demoGame(day: string): GameState {
  const dishes = [
    { title: 'ふわたま炒飯', sample: 'rice' },
    { title: 'きのこのスープ', sample: 'soup' },
    { title: 'トマトのパスタ', sample: 'pasta' },
    { title: 'おかかのおにぎり', sample: 'rice' },
    { title: '豆腐のスープ', sample: 'soup' },
    { title: 'ツナたまごはん', sample: 'rice' },
  ]
  return {
    ...chooseStarter(initialGame(day), 'komugi'),
    tutorial: { version: 1, step: 4, status: 'completed' },
    xp: 270,
    companions: [{ id: 'komugi', xp: 270, joinedDay: shiftDay(day, -6) }],
    meals: dishes.map((dish, i) => ({
      id: `seed-${i}`,
      day: shiftDay(day, -i - 1),
      ...dish,
      targetId: 'komugi',
      xp: 45,
      coins: 30,
    })),
  }
}

export function advanceGame(state: GameState, days = 1): GameState {
  if (!Number.isSafeInteger(days) || days <= 0) return state
  return { ...state, today: shiftDay(state.today, days), dayOffset: state.dayOffset + days }
}

export function addDemoGems(state: GameState): GameState {
  return { ...state, gems: state.gems + 150 }
}
