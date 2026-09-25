import type { GameState } from '../game/types'
import { recipes } from './recipes'

// Keep the free selection stable as the full catalog grows.
export const FREE_RECIPE_IDS = [
  'egg-rice',
  'onigiri',
  'tofu-soup',
  'miso-soup',
  'fried-rice',
  'tomato-pasta',
  'cream-soup',
  'curry',
  'omurice',
  'gratin',
  'r-oyako-don',
  'r-gyudon',
  'r-kitsune-udon',
  'r-sauce-yakiudon',
  'r-vegetable-yakisoba',
  'r-mori-soba',
  'r-napolitan-spaghetti',
  'r-pork-root-tonjiru',
  'r-egg-salad-sandwich',
  'r-ham-cheese-hot-sandwich',
  'r-chicken-teriyaki',
  'r-ginger-chicken-karaage',
  'r-pork-ginger-onion',
  'r-onion-hamburg-steak',
  'r-mild-mapo-tofu',
  'r-salmon-mushroom-foil',
  'r-mackerel-miso-simmer',
  'r-spinach-ohitashi',
  'r-burdock-carrot-kinpira',
  'r-cucumber-wakame-sunomono',
] as const

type RecipeAccessState = Partial<Pick<GameState, 'subscriptionPlan'>>

const freeRecipeIds = new Set<string>(FREE_RECIPE_IDS)
const recipeIds = new Set(recipes.map((recipe) => recipe.id))

export function canViewRecipe(state: RecipeAccessState, recipeId: string) {
  return (
    recipeIds.has(recipeId) && (state.subscriptionPlan === 'premium' || freeRecipeIds.has(recipeId))
  )
}

export function availableRecipes(state: RecipeAccessState) {
  return state.subscriptionPlan === 'premium'
    ? recipes
    : recipes.filter((recipe) => freeRecipeIds.has(recipe.id))
}
