import { z } from 'zod'
import { items, recipeById, species } from '../content/catalog'
import type { GameState, SpeciesId } from './types'
import { mealRecordSchema } from '../meals/schemas'

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
const itemKinds = ['hat', 'neck', 'bag', 'room'] as const

/** Old saves and operation receipts predate the neck and bag slots. */
export const equippedSchema = z
  .strictObject({
    hat: z.string(),
    neck: z.string().default('neck-none'),
    bag: z.string().default('bag-none'),
    room: z.string(),
  })
  .refine(
    (equipped) =>
      itemKinds.every((kind) =>
        items.some((item) => item.id === equipped[kind] && item.kind === kind),
      ),
    'Invalid equipment slot',
  )

export const tutorialSchema = z.object({
  version: z.literal(1),
  step: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  status: z.enum(['active', 'paused', 'completed']),
  introSeen: z.boolean().optional(),
  homeGuide: z.enum(['meal', 'growth', 'book', 'shop', 'done']).optional(),
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
  dishId: z.string().min(1).optional(),
  targetId: speciesIdSchema.optional(),
  cardBonus: nonnegativeIntegerSchema.optional(),
  streakBonus: nonnegativeIntegerSchema.optional(),
  ticketBonus: nonnegativeIntegerSchema.optional(),
  mealRecordId: z.string().min(1).max(200).optional(),
})

/** Fields shared by the initial single-companion save and the current save. */
export const saveBaseSchema = z.object({
  version: z.literal(1),
  growthVersion: z.literal(2).optional(),
  subscriptionPlan: z.enum(['free', 'premium']).default('free'),
  today: daySchema,
  dayOffset: nonnegativeIntegerSchema,
  name: z.string().refine((value) => value.trim().length > 0),
  xp: nonnegativeIntegerSchema,
  coins: nonnegativeIntegerSchema,
  gems: nonnegativeIntegerSchema.default(0),
  meals: z
    .array(mealSchema)
    .refine((meals) => new Set(meals.map((meal) => meal.id)).size === meals.length),
  mealRecords: z
    .array(mealRecordSchema)
    .refine((records) => new Set(records.map((record) => record.id)).size === records.length)
    .optional(),
  rests: uniqueStrings.refine((days) => days.every((day) => daySchema.safeParse(day).success)),
  tickets: nonnegativeIntegerSchema,
  owned: uniqueStrings
    .refine(
      (ids) =>
        ids.includes('none') &&
        ids.includes('plain') &&
        ids.every((id) => items.some((item) => item.id === id)),
    )
    // Free removal choices also exist when reading a snapshot from an older server.
    .transform((ids) => [...ids, ...['neck-none', 'bag-none'].filter((id) => !ids.includes(id))]),
  equipped: equippedSchema,
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
      itemKinds.every((kind) =>
        items.some(
          (item) =>
            item.id === state.equipped[kind] && item.kind === kind && state.owned.includes(item.id),
        ),
      ),
    'Inconsistent game references',
  )
  .transform((state, context) => {
    // Shared by local saves and cloud snapshots. Clearing the retired balance
    // makes the conversion idempotent across repeated reads and command replies.
    const coins = state.coins + state.gems
    if (!Number.isSafeInteger(coins)) {
      context.addIssue({
        code: 'custom',
        message: 'Combined legacy balance exceeds safe integer range',
      })
      return z.NEVER
    }
    return { ...state, coins, gems: 0 }
  })
