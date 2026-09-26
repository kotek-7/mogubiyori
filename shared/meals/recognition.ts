import { z } from 'zod'
import { recipes } from '../content/recipes'
import { genericDishes } from '../content/dishes'
import { mealChoices } from '../content/mealChoices'
import { foodGroupSchema } from './schemas'
import type { FoodGroup, MealItem, MealPortion } from './types'

export type FoodRecognitionResult = { candidates: string[]; items: MealItem[] }

const choiceIds = new Set(mealChoices.map((choice) => choice.id))
const recipeIds = new Set(recipes.map((recipe) => recipe.id))
const dishIds = new Set(genericDishes.map((dish) => dish.id))
const foodGroups = new Set<string>(foodGroupSchema.options)
const portions = new Set<string>(['small', 'regular', 'large', 'unknown'])
const recognizedItemSchema = z.strictObject({
  name: z.string().trim().min(1).max(200),
  recipeId: z.string().optional(),
  dishId: z.string().optional(),
  groups: z.array(z.string()),
  portion: z.string(),
  groupsConfirmed: z.boolean(),
})
const recognitionResultSchema = z.strictObject({
  candidates: z.array(z.string()),
  // Old deployments can still return only candidates during a rolling update.
  items: z.array(recognizedItemSchema).optional(),
})

/** Treat photo recognition as an editable estimate, never as user-confirmed data. */
export function parseFoodRecognitionResult(value: unknown): FoodRecognitionResult | null {
  const parsed = recognitionResultSchema.safeParse(value)
  if (!parsed.success) return null
  return {
    candidates: [...new Set(parsed.data.candidates.filter((id) => choiceIds.has(id)))].slice(0, 3),
    items: (parsed.data.items ?? []).slice(0, 12).map((item) => {
      const recipeId = item.recipeId && recipeIds.has(item.recipeId) ? item.recipeId : undefined
      const dishId = item.dishId && dishIds.has(item.dishId) ? item.dishId : undefined
      return {
        name: item.name,
        ...(recipeId && !dishId ? { recipeId } : {}),
        ...(dishId && !recipeId ? { dishId } : {}),
        groups: [
          ...new Set(item.groups.filter((group): group is FoodGroup => foodGroups.has(group))),
        ],
        portion: portions.has(item.portion) ? (item.portion as MealPortion) : 'unknown',
        groupsConfirmed: false,
      }
    }),
  }
}
