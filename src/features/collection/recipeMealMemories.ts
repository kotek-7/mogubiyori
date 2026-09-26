import type { GameMeal, GameState } from '../../../shared/game/types'
import type { MealRecord } from '../../../shared/meals/types'

export type RecipeMealMemory = {
  key: string
  day: string
  title: string
  meal?: GameMeal
  record?: MealRecord
}

export function recipeMealMemories(
  state: Pick<GameState, 'meals' | 'mealRecords'>,
  recipeId: string,
): RecipeMealMemory[] {
  const records = state.mealRecords ?? []
  const recordIds = new Set(records.map((record) => record.id))
  const memories: RecipeMealMemory[] = records
    .filter((record) => record.items.some((item) => item.recipeId === recipeId))
    .map((record) => {
      const meals = state.meals.filter((meal) => meal.mealRecordId === record.id)
      return {
        key: `record:${record.id}`,
        day: record.day,
        title: record.title,
        record,
        meal: meals.find((meal) => meal.photo || meal.photoId) ?? meals[0],
      }
    })

  // Existing diary records own the current recipe association, even after editing.
  for (const meal of state.meals) {
    if (meal.mealRecordId && recordIds.has(meal.mealRecordId)) continue
    if (meal.recipeId !== recipeId) continue
    memories.push({ key: `meal:${meal.id}`, day: meal.day, title: meal.title, meal })
  }

  return memories.sort((left, right) => right.day.localeCompare(left.day))
}
