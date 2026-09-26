import dishSource from '../../content/meal-dishes.json' with { type: 'json' }
import type { FoodGroup } from '../meals/types'

export const dishCategories = {
  rice: 'ごはん・丼',
  noodles: '麺',
  bread: 'パン・粉もの・シリアル',
  meat: '肉のおかず',
  seafood: '魚介のおかず',
  egg_soy: '卵・豆腐・豆',
  vegetables: '野菜・副菜',
  soup_hotpot: '汁物・鍋',
  sweets: 'おやつ・果物',
  other: 'その他のおかず',
  drinks: '飲みもの',
  meals: '弁当・定食・盛り合わせ',
} as const

export type DishCategory = keyof typeof dishCategories

/** Broad meal classifications do not grant collectible recipe cards. */
export type GenericDish = {
  id: string
  name: string
  category: DishCategory
  aliases: readonly string[]
  sample: 'rice' | 'pasta' | 'curry' | 'soup'
  description: string
  /** Named foods only; these suggestions do not establish portions or nutrient adequacy. */
  suggestedGroups: readonly FoodGroup[]
  artPath?: string
}

export const genericDishes = dishSource as GenericDish[]

export function genericDishById(id?: string): GenericDish | undefined {
  return genericDishes.find((dish) => dish.id === id)
}
