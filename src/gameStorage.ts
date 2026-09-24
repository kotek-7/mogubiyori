import { initialGame, items, recipeById, shiftDay, species, stageOf, todayTokyo } from './game'
import type { Companion, GameMeal, GameState, SpeciesId, TutorialState } from './game'

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

function normalizeTutorial(value: unknown, hasCompanion: boolean): TutorialState {
  if (
    object(value) &&
    value.version === 1 &&
    (value.step === 0 ||
      value.step === 1 ||
      value.step === 2 ||
      value.step === 3 ||
      value.step === 4) &&
    (value.status === 'active' || value.status === 'paused' || value.status === 'completed')
  )
    return {
      version: 1,
      step: value.step,
      status: value.status,
      ...(['meal', 'growth', 'book', 'done'].includes(value.homeGuide as string)
        ? { homeGuide: value.homeGuide as TutorialState['homeGuide'] }
        : {}),
    }

  // Missing or invalid guidance must not discard an existing player's progress.
  return hasCompanion
    ? { version: 1, step: 4, status: 'completed' }
    : { version: 1, step: 0, status: 'active' }
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

function migrateGrowthXp(xp: number): number {
  // Old stages were [0, 45), [45, 120), and [120, infinity).
  // Keep progress within each corresponding new stage; never skip to the new finale.
  if (xp < 45) return Math.min(119, Math.floor((xp / 45) * 120))
  if (xp < 120) return Math.min(599, 300 + Math.floor(((xp - 45) / 75) * 300))
  // The old final stage had no next threshold, so preserve its excess XP directly.
  return 600 + Math.min(449, xp - 120)
}

export function parseGame(raw: string | null, realDay = todayTokyo()): GameState {
  try {
    const state: unknown = raw ? JSON.parse(raw) : null
    if (
      !object(state) ||
      state.version !== 1 ||
      (state.growthVersion !== undefined && state.growthVersion !== 2) ||
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
    const migrateGrowth = state.growthVersion === undefined
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
      const xp = migrateGrowth ? migrateGrowthXp(state.xp) : state.xp
      const companions: Companion[] = [{ id: 'komugi', xp, joinedDay }]
      const visitors =
        stageOf(xp) >= 2
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
        growthVersion: 2,
        tutorial: normalizeTutorial(state.tutorial, true),
        today,
        xp,
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
    const migratedCompanions = migrateGrowth
      ? companions.map((companion) => ({ ...companion, xp: migrateGrowthXp(companion.xp) }))
      : companions
    const visitors = [...state.visitors]
    if (migrateGrowth && migratedCompanions.some((companion) => stageOf(companion.xp) >= 2)) {
      for (const candidate of species) {
        if (visitors.length >= 3) break
        if (
          !migratedCompanions.some((companion) => companion.id === candidate.id) &&
          !visitors.includes(candidate.id)
        )
          visitors.push(candidate.id)
      }
    }
    const active = migratedCompanions.find((companion) => companion.id === state.activeId)
    return {
      ...state,
      growthVersion: 2,
      tutorial: normalizeTutorial(state.tutorial, state.activeId !== null),
      today,
      companions: migratedCompanions,
      visitors,
      xp: active?.xp ?? 0,
    } as GameState
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
