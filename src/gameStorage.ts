import { initialGame, items, recipeById, shiftDay, species, stageOf, todayTokyo } from './game'
import type { Companion, GameMeal, GameState, SpeciesId } from './game'

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

function speciesId(value: unknown): value is SpeciesId {
  return species.some((candidate) => candidate.id === value)
}

function isCompanion(value: unknown): value is Companion {
  return object(value) && speciesId(value.id) && integer(value.xp) && day(value.joinedDay)
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
    (value.recipeId === undefined ||
      (typeof value.recipeId === 'string' && value.recipeId.length > 0)) &&
    (value.targetId === undefined || speciesId(value.targetId)) &&
    (value.cardBonus === undefined || integer(value.cardBonus)) &&
    (value.streakBonus === undefined || integer(value.streakBonus)) &&
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
    const legacy =
      state.companions === undefined &&
      state.activeId === undefined &&
      state.visitors === undefined &&
      state.cards === undefined
    if (legacy) {
      const meals = state.meals.map((meal) => ({
        ...meal,
        targetId: meal.targetId ?? ('komugi' as const),
      }))
      const joinedDay = meals.reduce(
        (earliest, meal) => (meal.day < earliest ? meal.day : earliest),
        state.today,
      )
      const companions: Companion[] = [{ id: 'komugi', xp: state.xp, joinedDay }]
      const visitors =
        stageOf(state.xp) === 2
          ? species
              .filter((candidate) => candidate.id !== 'komugi')
              .slice(0, 3)
              .map((candidate) => candidate.id)
          : []
      const cards = [
        ...new Set(meals.flatMap((meal) => (recipeById(meal.recipeId) ? [meal.recipeId!] : []))),
      ]
      return {
        ...state,
        today,
        meals,
        companions,
        activeId: 'komugi',
        visitors,
        cards,
        claimedLoginDays: [],
      } as unknown as GameState
    }
    const companions = state.companions
    if (
      !Array.isArray(companions) ||
      !companions.every(isCompanion) ||
      new Set(companions.map((companion) => companion.id)).size !== companions.length ||
      !(state.activeId === null
        ? companions.length === 0
        : companions.some((companion) => companion.id === state.activeId)) ||
      !strings(state.visitors) ||
      state.visitors.length > 3 ||
      !state.visitors.every(speciesId) ||
      new Set(state.visitors).size !== state.visitors.length ||
      state.visitors.some((id) => companions.some((companion: Companion) => companion.id === id)) ||
      !strings(state.cards) ||
      !state.cards.every((id) => recipeById(id)) ||
      new Set(state.cards).size !== state.cards.length ||
      !strings(state.claimedLoginDays) ||
      !state.claimedLoginDays.every(day) ||
      new Set(state.claimedLoginDays).size !== state.claimedLoginDays.length
    )
      return initialGame(realDay)
    const active = companions.find((companion) => companion.id === state.activeId)
    return { ...state, today, xp: active?.xp ?? 0 } as GameState
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
