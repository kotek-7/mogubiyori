import { z } from 'zod'
import { items, recipeById, species } from './catalog'
import type { GameState, SpeciesId } from './types'

export const daySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`)
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  }, 'Invalid calendar day')
export const nonnegativeIntegerSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
export const speciesIdSchema = z.custom<SpeciesId>(
  (value) => species.some((entry) => entry.id === value),
  'Unknown companion',
)
export const localPhotoSchema = z
  .string()
  .regex(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/)
const uniqueStrings = z.array(z.string()).refine((values) => new Set(values).size === values.length)
export const tutorialSchema = z.object({
  version: z.literal(1),
  step: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  status: z.enum(['active', 'paused', 'completed']),
  homeGuide: z.enum(['meal', 'growth', 'book', 'done']).optional(),
})
export const companionSchema = z.object({
  id: speciesIdSchema,
  xp: nonnegativeIntegerSchema,
  joinedDay: daySchema,
})
export const mealSchema = z.object({
  id: z.string().min(1),
  day: daySchema,
  title: z.string().refine((value) => value.trim().length > 0),
  photo: localPhotoSchema.optional(),
  photoId: z.uuid().optional(),
  sample: z.string().min(1),
  xp: nonnegativeIntegerSchema,
  coins: nonnegativeIntegerSchema,
  recipeId: z.string().min(1).optional(),
  targetId: speciesIdSchema.optional(),
  cardBonus: nonnegativeIntegerSchema.optional(),
  streakBonus: nonnegativeIntegerSchema.optional(),
})

/** Fields shared by the initial single-companion save and the current save. */
export const saveBaseSchema = z.object({
  version: z.literal(1),
  growthVersion: z.literal(2).optional(),
  today: daySchema,
  dayOffset: nonnegativeIntegerSchema,
  name: z.string().refine((value) => value.trim().length > 0),
  xp: nonnegativeIntegerSchema,
  coins: nonnegativeIntegerSchema,
  gems: nonnegativeIntegerSchema,
  meals: z
    .array(mealSchema)
    .refine((meals) => new Set(meals.map((meal) => meal.id)).size === meals.length),
  rests: uniqueStrings.refine((days) => days.every((day) => daySchema.safeParse(day).success)),
  tickets: nonnegativeIntegerSchema,
  owned: uniqueStrings.refine(
    (ids) =>
      ids.includes('none') &&
      ids.includes('plain') &&
      ids.every((id) => items.some((item) => item.id === id)),
  ),
  equipped: z.object({ hat: z.string(), room: z.string() }),
  reminder: z.enum(['gentle', 'eager']),
})

export const gameStateSchema: z.ZodType<GameState> = saveBaseSchema
  .extend({
    growthVersion: z.literal(2),
    tutorial: tutorialSchema,
    companions: z
      .array(companionSchema)
      .refine((entries) => new Set(entries.map((entry) => entry.id)).size === entries.length),
    activeId: speciesIdSchema.nullable(),
    visitors: z
      .array(speciesIdSchema)
      .max(3)
      .refine((ids) => new Set(ids).size === ids.length),
    cards: uniqueStrings.refine((ids) => ids.every((id) => recipeById(id))),
    claimedLoginDays: uniqueStrings.refine((days) =>
      days.every((day) => daySchema.safeParse(day).success),
    ),
  })
  .refine(
    (state) =>
      (state.activeId === null
        ? state.companions.length === 0
        : state.companions.some((companion) => companion.id === state.activeId)) &&
      !state.visitors.some((id) => state.companions.some((companion) => companion.id === id)) &&
      (['hat', 'room'] as const).every((kind) =>
        items.some(
          (item) =>
            item.id === state.equipped[kind] && item.kind === kind && state.owned.includes(item.id),
        ),
      ),
    'Inconsistent game references',
  )
