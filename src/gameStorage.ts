import { initialGame, items, shiftDay, todayTokyo } from './game'
import type { GameMeal, GameState } from './game'

export const GAME_STORAGE_KEY = 'mogubiyori-v1'

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function integer(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function day(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isMeal(value: unknown): value is GameMeal {
  return (
    object(value) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    day(value.day) &&
    typeof value.title === 'string' &&
    value.title.trim().length > 0 &&
    typeof value.sample === 'string' &&
    value.sample.length > 0 &&
    integer(value.xp) &&
    integer(value.coins) &&
    (value.photo === undefined ||
      (typeof value.photo === 'string' &&
        /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value.photo)))
  )
}

export function parseGame(raw: string | null, realDay = todayTokyo()): GameState {
  try {
    const state: unknown = raw ? JSON.parse(raw) : null
    if (
      !object(state) ||
      state.version !== 1 ||
      !day(state.today) ||
      !integer(state.dayOffset) ||
      typeof state.name !== 'string' ||
      state.name.trim().length === 0 ||
      !integer(state.xp) ||
      !integer(state.coins) ||
      !integer(state.gems) ||
      !Array.isArray(state.meals) ||
      !state.meals.every(isMeal) ||
      new Set(state.meals.map((meal) => meal.id)).size !== state.meals.length ||
      !strings(state.rests) ||
      !state.rests.every(day) ||
      new Set(state.rests).size !== state.rests.length ||
      !integer(state.tickets) ||
      !strings(state.owned) ||
      new Set(state.owned).size !== state.owned.length ||
      !state.owned.includes('none') ||
      !state.owned.includes('plain') ||
      !state.owned.every((id) => items.some((item) => item.id === id)) ||
      !object(state.equipped) ||
      !['hat', 'room'].every((kind) =>
        items.some(
          (item) =>
            item.id === (state.equipped as Record<string, unknown>)[kind] &&
            item.kind === kind &&
            (state.owned as string[]).includes(item.id),
        ),
      ) ||
      !['gentle', 'eager'].includes(state.reminder as string)
    )
      return initialGame(realDay)

    const today = shiftDay(realDay, state.dayOffset)
    if (!day(today)) return initialGame(realDay)
    return { ...state, today } as GameState
  } catch {
    return initialGame(realDay)
  }
}

export function loadGame(): GameState {
  try {
    return parseGame(localStorage.getItem(GAME_STORAGE_KEY))
  } catch {
    return initialGame()
  }
}

export function saveGame(state: GameState): boolean {
  try {
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
