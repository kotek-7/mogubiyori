export type SpeciesId = 'komugi' | 'mame' | 'shizuku' | 'yuzu' | 'momo' | 'goma'
export type Companion = { id: SpeciesId; xp: number; joinedDay: string }
export type GrowthStage = 0 | 1 | 2 | 3 | 4
export type { Recipe } from './recipes'
export type FeedInput = {
  title: string
  photo?: string
  photoId?: string
  sample: string
  recipeId?: string
  targetId?: SpeciesId
}
export type GameMeal = {
  id: string
  day: string
  title: string
  photo?: string
  photoId?: string
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
