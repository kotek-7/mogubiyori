import { recipes } from './recipes'
import { genericDishes } from './dishes'

/** Recognition and meal selection include dish families as well as collectible recipes. */
export const mealChoices = [...recipes, ...genericDishes]

export function mealChoiceById(id?: string) {
  return mealChoices.find((choice) => choice.id === id)
}
