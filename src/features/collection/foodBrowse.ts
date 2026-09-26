import { dishCategories, genericDishes } from '../../../shared/content/dishes'
import type { GenericDish } from '../../../shared/content/dishes'
import { availableRecipes } from '../../../shared/content/freeRecipes'
import type { Recipe } from '../../../shared/content/recipes'
import type { GameState } from '../../../shared/game/types'

export const foodCategories = {
  rice: 'ごはん・丼',
  noodles: '麺',
  main: 'おかず',
  side: '野菜・副菜',
  soup: '汁もの・鍋',
  breakfast: 'パン・朝ごはん',
  snack: 'おやつ・果物',
  drinks: '飲みもの',
  meals: '弁当・定食',
} as const

export type FoodCategory = keyof typeof foodCategories

const dishFoodCategories: Record<keyof typeof dishCategories, FoodCategory> = {
  rice: 'rice',
  noodles: 'noodles',
  bread: 'breakfast',
  meat: 'main',
  seafood: 'main',
  egg_soy: 'main',
  vegetables: 'side',
  soup_hotpot: 'soup',
  sweets: 'snack',
  other: 'main',
  drinks: 'drinks',
  meals: 'meals',
}

type FoodEntryBase = {
  id: string
  name: string
  category: FoodCategory
  searchText: string
}

export type FoodEntry = FoodEntryBase &
  ({ kind: 'recipe'; recipe: Recipe } | { kind: 'dish'; dish: GenericDish })

export type FoodFilters = {
  query: string
  category: 'all' | FoodCategory
  minutes: string
  difficulty: string
  acquired: string
}

export function normalizeFoodSearch(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (character) => String.fromCharCode(character.charCodeAt(0) + 0x60))
}

export function getFoodEntries(
  state: Partial<Pick<GameState, 'subscriptionPlan'>>,
  includeDishes: boolean,
): FoodEntry[] {
  const entries: FoodEntry[] = availableRecipes(state).map((recipe) => ({
    kind: 'recipe',
    id: recipe.id,
    name: recipe.name,
    category: recipe.category ?? 'main',
    recipe,
    searchText: normalizeFoodSearch(
      [recipe.name, ...recipe.ingredients, ...(recipe.tags ?? [])].join(' '),
    ),
  }))
  if (includeDishes) {
    entries.push(
      ...genericDishes.map((dish): FoodEntry => ({
        kind: 'dish',
        id: dish.id,
        name: dish.name,
        category: dishFoodCategories[dish.category],
        dish,
        searchText: normalizeFoodSearch([dish.name, ...dish.aliases].join(' ')),
      })),
    )
  }
  return entries
}

export function filterFoodEntries(
  entries: readonly FoodEntry[],
  filters: FoodFilters,
  cards: ReadonlySet<string>,
) {
  const terms = normalizeFoodSearch(filters.query).trim().split(/\s+/).filter(Boolean)
  const recipeOnly = [filters.minutes, filters.difficulty, filters.acquired].some(
    (value) => value !== 'all',
  )
  return entries.filter((entry) => {
    if (filters.category !== 'all' && entry.category !== filters.category) return false
    if (!terms.every((term) => entry.searchText.includes(term))) return false
    if (entry.kind === 'dish') return !recipeOnly
    if (filters.minutes !== 'all' && entry.recipe.minutes > Number(filters.minutes)) return false
    if (filters.difficulty !== 'all' && entry.recipe.difficulty !== Number(filters.difficulty)) {
      return false
    }
    if (filters.acquired === 'yes' && !cards.has(entry.id)) return false
    if (filters.acquired === 'no' && cards.has(entry.id)) return false
    return true
  })
}
