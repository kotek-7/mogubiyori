export type FoodGroup = 'staple' | 'protein' | 'vegetable' | 'fruit' | 'dairy'
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'unknown'
export type MealSource = 'home' | 'prepared' | 'restaurant' | 'unknown'
export type MealPortion = 'small' | 'regular' | 'large' | 'unknown'

export const foodGroupLabels: Record<FoodGroup, string> = {
  staple: '主食',
  protein: '肉・魚・卵・豆',
  vegetable: '野菜・きのこ・海藻',
  fruit: '果物',
  dairy: '乳製品',
}
export const mealSlotLabels: Record<MealSlot, string> = {
  breakfast: '朝ごはん',
  lunch: '昼ごはん',
  dinner: '夜ごはん',
  snack: '間食',
  unknown: '未設定',
}
export const mealSourceLabels: Record<MealSource, string> = {
  home: '自炊',
  prepared: '買ったもの',
  restaurant: '外食',
  unknown: '未設定',
}
export const mealPortionLabels: Record<MealPortion, string> = {
  small: '少なめ',
  regular: 'ふつう',
  large: '多め',
  unknown: '未設定',
}

export type MealItem = {
  name: string
  recipeId?: string
  dishId?: string
  groups: FoodGroup[]
  portion: MealPortion
  groupsConfirmed: boolean
}
export type MealRecordInput = { slot: MealSlot; source: MealSource; items: MealItem[] }
export type MealRecord = MealRecordInput & { id: string; day: string; title: string }
export type MealRecordUpdate = MealRecordInput & { day: string; title: string }
export type DailyMealReport = {
  day: string
  score: number | null
  mealCount: number
  scoredMealCount: number
  homeMealCount: number
  groupCounts: Record<FoodGroup, number>
}
export type MealReportReceipt = {
  recordId: string
  today: DailyMealReport
  week: DailyMealReport[]
}
