import { recipes } from './recipes'
import type { Recipe } from './recipes'

export { recipes } from './recipes'
export type { Recipe } from './recipes'

export type SpeciesId = 'komugi' | 'mame' | 'shizuku' | 'yuzu' | 'momo' | 'goma'
export const species: { id: SpeciesId; name: string; description: string }[] = [
  { id: 'komugi', name: 'こむぎ', description: '食いしんぼうで活発な性格。' },
  { id: 'mame', name: 'まめ', description: '人見知りだが食欲は旺盛。' },
  { id: 'shizuku', name: 'しずく', description: '温かいスープを好む。' },
  { id: 'yuzu', name: 'ゆず', description: '好奇心が強く初めての料理にもよく近づく。' },
  { id: 'momo', name: 'もも', description: 'のんびりした性格で食べるのが遅い。' },
  { id: 'goma', name: 'ごま', description: '夕方になると活発になる。' },
]
export type Companion = { id: SpeciesId; xp: number; joinedDay: string }
export type GrowthStage = 0 | 1 | 2 | 3 | 4
export const growthStages: ReadonlyArray<{
  stage: GrowthStage
  name: string
  threshold: number
}> = [
  { stage: 0, name: 'うまれたて', threshold: 0 },
  { stage: 1, name: 'ちびっこ', threshold: 120 },
  { stage: 2, name: 'わんぱく', threshold: 300 },
  { stage: 3, name: 'おとな', threshold: 600 },
  { stage: 4, name: 'とっておき', threshold: 1050 },
]
export function recipeById(id?: string): Recipe | undefined {
  return recipes.find((recipe) => recipe.id === id)
}
export type FeedInput = {
  title: string
  photo?: string
  sample: string
  recipeId?: string
  targetId?: SpeciesId
}
export type GameMeal = {
  id: string
  day: string
  title: string
  photo?: string
  sample: string
  xp: number
  coins: number
  recipeId?: string
  targetId?: SpeciesId
  cardBonus?: number
  streakBonus?: number
}

export type TutorialStep = 0 | 1 | 2 | 3 | 4
export type TutorialState = {
  version: 1
  step: TutorialStep
  status: 'active' | 'paused' | 'completed'
  homeGuide?: 'meal' | 'growth' | 'book' | 'done'
}

export type GameState = {
  version: 1
  growthVersion: 2
  tutorial: TutorialState
  today: string
  dayOffset: number
  name: string
  xp: number
  coins: number
  gems: number
  meals: GameMeal[]
  rests: string[]
  tickets: number
  owned: string[]
  equipped: { hat: string; room: string }
  reminder: 'gentle' | 'eager'
  companions: Companion[]
  activeId: SpeciesId | null
  visitors: SpeciesId[]
  cards: string[]
  claimedLoginDays: string[]
}

export type Item = {
  id: string
  name: string
  description: string
  kind: 'hat' | 'room'
  currency: 'coins' | 'gems'
  price: number
}

export const items: Item[] = [
  {
    id: 'none',
    name: 'いつものすがた',
    description: '帽子を外します。',
    kind: 'hat',
    currency: 'coins',
    price: 0,
  },
  {
    id: 'beret',
    name: 'どんぐりベレー',
    description: 'どんぐりをかたどったベレー帽。',
    kind: 'hat',
    currency: 'coins',
    price: 180,
  },
  {
    id: 'sprout',
    name: 'ふたばのかんむり',
    description: '双葉をかたどったかんむり。',
    kind: 'hat',
    currency: 'coins',
    price: 120,
  },
  {
    id: 'chef',
    name: 'コックさんの帽子',
    description: '白いコック帽。',
    kind: 'hat',
    currency: 'gems',
    price: 80,
  },
  {
    id: 'plain',
    name: 'いつものひろば',
    description: '最初のひろば。',
    kind: 'room',
    currency: 'coins',
    price: 0,
  },
  {
    id: 'garden',
    name: '木もれびのひろば',
    description: '木々に囲まれたひろば。',
    kind: 'room',
    currency: 'gems',
    price: 100,
  },
  {
    id: 'night',
    name: '星あかりのひろば',
    description: '星空が見える夜のひろば。',
    kind: 'room',
    currency: 'gems',
    price: 120,
  },
]

export function todayTokyo(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date())
}

export function shiftDay(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function initialGame(day = todayTokyo(), _fresh = true): GameState {
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

export function demoGame(day = todayTokyo()): GameState {
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

function mealId(state: GameState): string {
  // getRandomValues is available on LAN HTTP as well as HTTPS.
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

export function feed(state: GameState, input: FeedInput): GameState {
  const targetId = input.targetId ?? state.activeId
  if (
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
        id: mealId(state),
        day: state.today,
        title: input.title.trim() || '今日のごはん',
        ...(input.photo ? { photo: input.photo } : {}),
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

export function advanceGame(state: GameState, days = 1): GameState {
  if (!Number.isSafeInteger(days) || days <= 0) return state
  return { ...state, today: shiftDay(state.today, days), dayOffset: state.dayOffset + days }
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

export function addDemoGems(state: GameState): GameState {
  return { ...state, gems: state.gems + 150 }
}
