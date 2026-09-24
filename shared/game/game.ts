import { species, growthStages, recipeById, items } from '../content/catalog'
import type { Companion, FeedInput, GameState, GrowthStage, SpeciesId } from './types'

export function shiftDay(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function initialGame(day: string): GameState {
  return {
    version: 1,
    growthVersion: 2,
    tutorial: { version: 1, step: 0, status: 'active' },
    today: day,
    dayOffset: 0,
    name: 'こむぎ',
    xp: 0,
    coins: 120,
    gems: 60,
    meals: [],
    rests: [],
    tickets: 2,
    owned: ['none', 'plain'],
    equipped: { hat: 'none', room: 'plain' },
    reminder: 'eager',
    companions: [],
    activeId: null,
    visitors: [],
    cards: [],
    claimedLoginDays: [],
  }
}

export function activeCompanion(state: GameState): Companion | undefined {
  return state.companions.find((companion) => companion.id === state.activeId)
}
function normalizedXp(xp: number): number {
  return Number.isFinite(xp) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(xp))) : 0
}
export function stageOf(xp: number): GrowthStage {
  const earned = normalizedXp(xp)
  return growthStages.findLast((candidate) => earned >= candidate.threshold)!.stage
}
export function stageName(stage: GrowthStage): string {
  return growthStages[stage].name
}
export function growthProgress(xp: number): {
  stage: GrowthStage
  progress: number
  remaining: number
  nextThreshold: number | null
} {
  const earned = normalizedXp(xp)
  const stage = stageOf(earned)
  const nextThreshold = growthStages[stage + 1]?.threshold ?? null
  if (nextThreshold === null) return { stage, progress: 100, remaining: 0, nextThreshold }
  const threshold = growthStages[stage].threshold
  return {
    stage,
    progress: ((earned - threshold) / (nextThreshold - threshold)) * 100,
    remaining: nextThreshold - earned,
    nextThreshold,
  }
}
export function chooseStarter(state: GameState, id: SpeciesId): GameState {
  if (state.companions.length || !species.slice(0, 3).some((candidate) => candidate.id === id))
    return state
  return {
    ...state,
    companions: [{ id, xp: 0, joinedDay: state.today }],
    activeId: id,
    name: species.find((candidate) => candidate.id === id)!.name,
    xp: 0,
  }
}
export function selectCompanion(state: GameState, id: SpeciesId): GameState {
  const companion = state.companions.find((candidate) => candidate.id === id)
  if (!companion || state.activeId === id) return state
  return {
    ...state,
    activeId: id,
    xp: companion.xp,
    name: species.find((candidate) => candidate.id === id)!.name,
  }
}
export function mealXp(state: GameState, recipeId?: string, targetId = state.activeId): number {
  if (!recipeById(recipeId) || !targetId) return 45
  let repeats = 0
  for (const meal of state.meals) {
    if ((meal.targetId ?? 'komugi') !== targetId) continue
    if (meal.recipeId !== recipeId) break
    repeats += 1
  }
  return Math.max(15, 45 - 15 * repeats)
}
export const LOGIN_BONUS = 20
export function claimLogin(state: GameState): GameState {
  if (!state.activeId || state.claimedLoginDays.includes(state.today)) return state
  return {
    ...state,
    coins: state.coins + LOGIN_BONUS,
    claimedLoginDays: [...state.claimedLoginDays, state.today],
  }
}

export function fedToday(state: GameState): boolean {
  return state.meals.some((meal) => meal.day === state.today)
}

export function streakOf(state: GameState): number {
  const meals = new Set(state.meals.map((meal) => meal.day))
  const rests = new Set(state.rests)
  let day = state.today
  if (!meals.has(day) && !rests.has(day)) day = shiftDay(day, -1)
  let count = 0
  while (meals.has(day) || rests.has(day)) {
    if (meals.has(day)) count += 1
    day = shiftDay(day, -1)
  }
  return count
}

export function hungerOf(state: GameState): number {
  const lastMeal = state.meals.reduce<string | undefined>(
    (latest, meal) =>
      (meal.targetId ?? 'komugi') === state.activeId &&
      meal.day <= state.today &&
      (!latest || meal.day > latest)
        ? meal.day
        : latest,
    undefined,
  )
  if (!lastMeal) return 8
  if (lastMeal === state.today) return 96
  return lastMeal === shiftDay(state.today, -1) ? 28 : 8
}

export function levelOf(state: GameState): { level: number; progress: number; needed: number } {
  return { level: Math.floor(state.xp / 100) + 1, progress: state.xp % 100, needed: 100 }
}

export function feed(
  state: GameState,
  input: FeedInput,
  environment: { mealId: string },
): GameState {
  const targetId = input.targetId ?? state.activeId
  if (
    state.meals.some((meal) => meal.id === environment.mealId) ||
    !environment.mealId ||
    !targetId ||
    (!state.companions.some((companion) => companion.id === targetId) &&
      !state.visitors.includes(targetId))
  )
    return state
  const first = !fedToday(state)
  const recipe = recipeById(input.recipeId)
  const xp = mealXp(state, recipe?.id, targetId)
  const cardBonus = recipe && !state.cards.includes(recipe.id) ? recipe.reward : 0
  const coins = (first ? 30 : 0) + cardBonus
  const hadRest = state.rests.includes(state.today)
  const existing = state.companions.find((companion) => companion.id === targetId)
  const companion: Companion = {
    id: targetId,
    xp: Math.min(Number.MAX_SAFE_INTEGER, normalizedXp(existing?.xp ?? 0) + xp),
    joinedDay: existing?.joinedDay ?? state.today,
  }
  const companions = existing
    ? state.companions.map((current) => (current.id === targetId ? companion : current))
    : [...state.companions, companion]
  const ownedIds = companions.map((current) => current.id)
  const visitors = state.visitors.filter((id) => !ownedIds.includes(id))
  if (companions.some((current) => stageOf(current.xp) >= 2)) {
    for (const candidate of species) {
      if (visitors.length >= 3) break
      if (!ownedIds.includes(candidate.id) && !visitors.includes(candidate.id))
        visitors.push(candidate.id)
    }
  }
  const next: GameState = {
    ...state,
    activeId: targetId,
    name:
      targetId === state.activeId
        ? state.name
        : species.find((candidate) => candidate.id === targetId)!.name,
    xp: companion.xp,
    companions,
    visitors,
    cards: cardBonus && recipe ? [...state.cards, recipe.id] : state.cards,
    coins: state.coins + coins,
    meals: [
      {
        id: environment.mealId,
        day: state.today,
        title: input.title.trim() || '今日のごはん',
        ...(input.photo ? { photo: input.photo } : {}),
        ...(input.photoId ? { photoId: input.photoId } : {}),
        sample: input.sample,
        targetId,
        ...(recipe ? { recipeId: recipe.id } : {}),
        cardBonus,
        streakBonus: 0,
        xp,
        coins,
      },
      ...state.meals,
    ],
    rests: hadRest ? state.rests.filter((day) => day !== state.today) : state.rests,
    tickets: state.tickets + (hadRest ? 1 : 0),
  }
  const streak = streakOf(next)
  const streakBonus = first ? (streak > 0 && streak % 7 === 0 ? 100 : streak === 3 ? 30 : 0) : 0
  next.coins += streakBonus
  next.meals[0].streakBonus = streakBonus
  next.meals[0].coins += streakBonus
  if (first && streakOf(next) >= 7 && !state.owned.includes('sprout')) {
    next.owned = [...state.owned, 'sprout']
  }
  return next
}

export function restGame(state: GameState): GameState {
  if (fedToday(state) || state.rests.includes(state.today) || state.tickets < 1) return state
  return { ...state, rests: [...state.rests, state.today], tickets: state.tickets - 1 }
}

export function purchaseItem(state: GameState, id: string): GameState {
  const item = items.find((candidate) => candidate.id === id)
  if (!item || state.owned.includes(id) || state[item.currency] < item.price) return state
  return {
    ...state,
    [item.currency]: state[item.currency] - item.price,
    owned: [...state.owned, id],
    equipped: { ...state.equipped, [item.kind]: id },
  }
}

export function equipItem(state: GameState, id: string): GameState {
  const item = items.find((candidate) => candidate.id === id)
  if (!item || !state.owned.includes(id) || state.equipped[item.kind] === id) return state
  return { ...state, equipped: { ...state.equipped, [item.kind]: id } }
}
