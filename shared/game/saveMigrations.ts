import { z } from 'zod'
import { recipeById, species } from '../content/catalog'
import { shiftDay, stageOf } from './game'
import {
  companionSchema,
  daySchema,
  saveBaseSchema,
  speciesIdSchema,
  tutorialSchema,
} from './schemas'
import type { Companion, TutorialState } from './types'

export function migrateGrowthXp(xp: number): number {
  // Preserve the player's progress through the former three growth intervals.
  if (xp < 45) return Math.min(119, Math.floor((xp / 45) * 120))
  if (xp < 120) return Math.min(599, 300 + Math.floor(((xp - 45) / 75) * 300))
  return 600 + Math.min(449, xp - 120)
}

function normalizeTutorial(value: unknown, hasCompanion: boolean): TutorialState {
  // A stale optional guide cannot discard valid tutorial or game progress.
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const candidate = value as Record<string, unknown>
    const homeGuide = tutorialSchema.shape.homeGuide.safeParse(candidate.homeGuide)
    const parsed = tutorialSchema.safeParse({
      ...candidate,
      homeGuide: homeGuide.success ? homeGuide.data : undefined,
    })
    if (parsed.success) return parsed.data
  }
  return hasCompanion
    ? { version: 1, step: 4, status: 'completed' }
    : { version: 1, step: 0, status: 'active' }
}

/** Migrate saved values only; callers decide what a missing/corrupt local save means. */
export function migrateGameSave(value: unknown, realDay: string): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid saved game')
  const raw = value as Record<string, unknown>
  const state = saveBaseSchema.parse(value)
  const today = daySchema.parse(shiftDay(daySchema.parse(realDay), state.dayOffset))
  const migrateGrowth = state.growthVersion === undefined
  const legacy =
    raw.companions === undefined &&
    raw.activeId === undefined &&
    raw.visitors === undefined &&
    raw.cards === undefined
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
            .filter((entry) => entry.id !== 'komugi')
            .slice(0, 3)
            .map((entry) => entry.id)
        : []
    return {
      ...state,
      growthVersion: 2,
      tutorial: normalizeTutorial(raw.tutorial, true),
      today,
      xp,
      meals,
      companions,
      activeId: 'komugi',
      visitors,
      cards: [
        ...new Set(meals.flatMap((meal) => (recipeById(meal.recipeId) ? [meal.recipeId!] : []))),
      ],
      claimedLoginDays: [],
    }
  }
  const companions = z.array(companionSchema).parse(raw.companions)
  const activeId = speciesIdSchema.nullable().parse(raw.activeId)
  const migratedCompanions = migrateGrowth
    ? companions.map((companion) => ({ ...companion, xp: migrateGrowthXp(companion.xp) }))
    : companions
  const visitors = z.array(speciesIdSchema).parse(raw.visitors)
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
  const active = migratedCompanions.find((companion) => companion.id === activeId)
  return {
    ...state,
    growthVersion: 2,
    tutorial: normalizeTutorial(raw.tutorial, activeId !== null),
    today,
    companions: migratedCompanions,
    activeId,
    visitors,
    cards: raw.cards,
    claimedLoginDays: raw.claimedLoginDays,
    xp: active?.xp ?? 0,
  }
}
