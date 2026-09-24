import { z } from 'zod'
import type { GameCommand } from './commands'
import type { FeedReceipt } from './receipt'
import type { GameState } from './types'
import {
  equippedSchema,
  gameStateSchema,
  mealSchema,
  nonnegativeIntegerSchema,
  speciesIdSchema,
  tutorialSchema,
} from './schemas'

export { gameStateSchema } from './schemas'

/** HTTP accepts photo references. Local data URLs never cross the game-command API. */
const feedInputSchema = z.strictObject({
  title: z.string().max(200),
  sample: z.string().min(1).max(80),
  recipeId: z.string().min(1).max(100).optional(),
  targetId: speciesIdSchema.optional(),
  photoId: z.uuid().optional(),
})
export const gameCommandSchema: z.ZodType<GameCommand> = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('chooseStarter'), id: speciesIdSchema }),
  z.strictObject({ type: z.literal('selectCompanion'), id: speciesIdSchema }),
  z.strictObject({ type: z.literal('feed'), input: feedInputSchema }),
  z.strictObject({ type: z.literal('purchase'), id: z.string().min(1).max(100) }),
  z.strictObject({ type: z.literal('equip'), id: z.string().min(1).max(100) }),
  z.strictObject({ type: z.literal('rest') }),
  z.strictObject({ type: z.literal('claimLogin') }),
  z.strictObject({
    type: z.literal('updateSettings'),
    input: z.strictObject({
      name: z.string().trim().min(1).max(80).optional(),
      reminder: z.enum(['gentle', 'eager']).optional(),
    }),
  }),
  z.strictObject({
    type: z.literal('tutorial'),
    input: z.strictObject({
      step: tutorialSchema.shape.step.optional(),
      status: tutorialSchema.shape.status.optional(),
      homeGuide: tutorialSchema.shape.homeGuide,
    }),
  }),
])

export const commandRequestSchema = z.strictObject({
  operationId: z.uuid(),
  command: gameCommandSchema,
})
export type CommandRequest = z.infer<typeof commandRequestSchema>
export type GameSnapshot = { state: GameState; revision: number }
export const gameSnapshotSchema: z.ZodType<GameSnapshot> = z.object({
  state: gameStateSchema,
  revision: nonnegativeIntegerSchema,
})

export const feedReceiptSchema: z.ZodType<FeedReceipt> = z.strictObject({
  kind: z.literal('feed'),
  meal: mealSchema.omit({ photo: true }).strict(),
  target: z.strictObject({
    id: speciesIdSchema,
    name: z.string(),
    beforeXp: nonnegativeIntegerSchema,
    afterXp: nonnegativeIntegerSchema,
    joined: z.boolean(),
  }),
  equipped: equippedSchema,
  newCards: z.array(z.string()),
  newVisitors: z.array(speciesIdSchema),
  newItems: z.array(z.string()),
  streak: z.strictObject({
    beforeDays: nonnegativeIntegerSchema,
    afterDays: nonnegativeIntegerSchema,
    bonus: nonnegativeIntegerSchema,
  }),
})
export type CommandResponse = { snapshot: GameSnapshot; receipt: FeedReceipt | null }
export const commandResponseSchema: z.ZodType<CommandResponse> = z.object({
  snapshot: gameSnapshotSchema,
  receipt: feedReceiptSchema.nullable(),
})
