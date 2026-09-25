import { z } from 'zod'

export const mealDaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`)
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  })
export const foodGroupSchema = z.enum(['staple', 'protein', 'vegetable', 'fruit', 'dairy'])
export const mealItemSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(200),
    recipeId: z.string().min(1).max(100).optional(),
    dishId: z.string().min(1).max(100).optional(),
    groups: z
      .array(foodGroupSchema)
      .max(5)
      .refine((groups) => new Set(groups).size === groups.length),
    portion: z.enum(['small', 'regular', 'large', 'unknown']),
    groupsConfirmed: z.boolean(),
  })
  .refine((item) => !(item.recipeId && item.dishId))
export const mealRecordInputSchema = z.strictObject({
  slot: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'unknown']),
  source: z.enum(['home', 'prepared', 'restaurant', 'unknown']),
  items: z.array(mealItemSchema).min(1).max(12),
})
export const mealRecordUpdateSchema = mealRecordInputSchema.extend({
  title: z.string().trim().min(1).max(200),
  day: mealDaySchema,
})
export const mealRecordSchema = mealRecordUpdateSchema.extend({ id: z.string().min(1).max(200) })
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
export const dailyMealReportSchema = z.strictObject({
  day: mealDaySchema,
  score: z.number().int().min(0).max(100).nullable(),
  mealCount: count,
  scoredMealCount: count,
  homeMealCount: count,
  groupCounts: z.strictObject({
    staple: count,
    protein: count,
    vegetable: count,
    fruit: count,
    dairy: count,
  }),
})
export const mealReportReceiptSchema = z.strictObject({
  recordId: z.string().min(1),
  today: dailyMealReportSchema,
  week: z.array(dailyMealReportSchema).length(7),
})
