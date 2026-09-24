export type GameMeal = {
  id: string
  day: string
  title: string
  photo?: string
  sample: string
  xp: number
  coins: number
}

export type GameState = {
  version: 1
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
    name: 'いつものこむぎ',
    description: 'ふわふわ、そのまま。',
    kind: 'hat',
    currency: 'coins',
    price: 0,
  },
  {
    id: 'beret',
    name: 'どんぐりベレー',
    description: 'ちょっとおしゃれな食いしんぼう。',
    kind: 'hat',
    currency: 'coins',
    price: 180,
  },
  {
    id: 'sprout',
    name: 'ふたばのかんむり',
    description: 'いっしょに育った、ちいさな芽。',
    kind: 'hat',
    currency: 'coins',
    price: 120,
  },
  {
    id: 'chef',
    name: 'コックさんの帽子',
    description: '今日のごはんも、楽しみに。',
    kind: 'hat',
    currency: 'gems',
    price: 80,
  },
  {
    id: 'plain',
    name: 'いつものおへや',
    description: 'ただいまが似合う、あたたかな部屋。',
    kind: 'room',
    currency: 'coins',
    price: 0,
  },
  {
    id: 'garden',
    name: '木もれびのおへや',
    description: '窓いっぱいの緑と、ゆったりごはん。',
    kind: 'room',
    currency: 'gems',
    price: 100,
  },
  {
    id: 'night',
    name: '星あかりのおへや',
    description: '一日の終わりに、ほっとひと息。',
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

export function initialGame(day = todayTokyo(), fresh = false): GameState {
  const dishes = [
    { title: 'ふわたま炒飯', sample: 'rice' },
    { title: 'きのこのスープ', sample: 'soup' },
    { title: 'トマトのパスタ', sample: 'pasta' },
    { title: 'おかかのおにぎり', sample: 'rice' },
    { title: '豆腐のスープ', sample: 'soup' },
    { title: 'ツナたまごはん', sample: 'rice' },
  ]
  return {
    version: 1,
    today: day,
    dayOffset: 0,
    name: 'こむぎ',
    xp: fresh ? 0 : 260,
    coins: fresh ? 0 : 120,
    gems: 60,
    meals: fresh
      ? []
      : dishes.map((dish, i) => ({
          id: `seed-${i}`,
          day: shiftDay(day, -i - 1),
          ...dish,
          xp: i === 0 || i === 5 ? 40 : 45,
          coins: 30,
        })),
    rests: [],
    tickets: 2,
    owned: ['none', 'plain'],
    equipped: { hat: 'none', room: 'plain' },
    reminder: 'eager',
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
      meal.day <= state.today && (!latest || meal.day > latest) ? meal.day : latest,
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

export function feed(
  state: GameState,
  input: { title: string; photo?: string; sample: string },
): GameState {
  const first = !fedToday(state)
  const xp = first ? 45 : 0
  const coins = first ? 30 : 0
  const hadRest = state.rests.includes(state.today)
  const next: GameState = {
    ...state,
    xp: state.xp + xp,
    coins: state.coins + coins,
    meals: [
      {
        id: mealId(state),
        day: state.today,
        title: input.title.trim() || '今日のごはん',
        ...(input.photo ? { photo: input.photo } : {}),
        sample: input.sample,
        xp,
        coins,
      },
      ...state.meals,
    ],
    rests: hadRest ? state.rests.filter((day) => day !== state.today) : state.rests,
    tickets: state.tickets + (hadRest ? 1 : 0),
  }
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
