import { recipeById } from '../content/catalog'
import { genericDishById } from '../content/dishes'
import type { DailyMealReport, FoodGroup, MealItem, MealRecord } from './types'

// These are suggestions from the named ingredients, never portion/nutrient estimates.
// Condiments (butter, stock, oils, miso, garnish amounts) do not establish a food group.
const ingredientPatterns: Record<FoodGroup, RegExp> = {
  staple:
    /ごはん|ご飯|米飯|パスタ|スパゲ|うどん|そば|中華麺|焼きそば麺|そうめん|食パン|ロールパン|餅|オートミール|小麦粉/,
  protein:
    /鶏(?:もも|むね|胸|ひき|挽|肉|手羽|ささみ)|豚|牛肉|牛ひき|合いびき|合挽|卵|たまご|豆腐|納豆|厚揚げ|油揚げ|ツナ|鮭|さけ|サバ|さば|イワシ|いわし|ブリ|ぶり|タラ|たら|しらす|えび|エビ|あさり|大豆|ひよこ豆|レンズ豆|ベーコン|ハム|ソーセージ|鶏ささみ/,
  vegetable:
    /キャベツ|にんじん|人参|玉ねぎ|玉葱|たまねぎ|ねぎ|ネギ|ほうれん草|小松菜|ブロッコリー|トマト|なす|ナス|ピーマン|パプリカ|レタス|きゅうり|白菜|大根|かぼちゃ|もやし|いんげん|オクラ|ごぼう|れんこん|きのこ|しめじ|しいたけ|えのき|まいたけ|マッシュルーム|わかめ|ひじき|海藻|水菜|チンゲン菜|アスパラ|にら|ニラ/,
  fruit:
    /^(?:冷凍|カット)?(?:りんご|リンゴ|バナナ|みかん|オレンジ|いちご|イチゴ|キウイ|ぶどう|ブルーベリー|桃|もも|パイナップル|マンゴー)/,
  dairy: /牛乳|ヨーグルト|チーズ/,
}
const genericGroups: Partial<Record<string, FoodGroup[]>> = {
  'generic-pasta': ['staple'],
  'generic-curry': ['staple'],
  'generic-fried-rice': ['staple'],
  'generic-hamburg': ['protein'],
  'generic-onigiri': ['staple'],
  'generic-donburi': ['staple'],
  'generic-udon': ['staple'],
  'generic-soba': ['staple'],
  'generic-ramen': ['staple'],
  'generic-yakisoba': ['staple'],
  'generic-salad': ['vegetable'],
  'generic-grilled-fish': ['protein'],
}

export function suggestMealItem(choiceId?: string, name?: string): MealItem {
  const recipe = recipeById(choiceId)
  const dish = genericDishById(choiceId)
  const ingredients =
    recipe?.ingredients
      .filter(
        (ingredient) =>
          !/少々|ひとつまみ|適量|お好み|飾り|トッピング|パウダー|スープの素|コンソメ|だし|ジャム|果汁|ジュース/.test(
            ingredient,
          ),
      )
      .flatMap((ingredient) => ingredient.split(/[・、]/)) ?? []
  const groups = recipe
    ? (Object.keys(ingredientPatterns) as FoodGroup[]).filter((group) =>
        ingredients.some((ingredient) => ingredientPatterns[group].test(ingredient.trim())),
      )
    : [...(genericGroups[dish?.id ?? ''] ?? [])]
  return {
    name: name?.trim() || recipe?.name || dish?.name || '今日のごはん',
    ...(recipe ? { recipeId: recipe.id } : {}),
    ...(dish ? { dishId: dish.id } : {}),
    groups,
    portion: 'unknown',
    groupsConfirmed: false,
  }
}

/** Composition only: presence, not intake adequacy or a medical nutrition score. */
export function dailyMealReport(records: readonly MealRecord[], day: string): DailyMealReport {
  const meals = records.filter((meal) => meal.day === day)
  const groupCounts: DailyMealReport['groupCounts'] = {
    staple: 0,
    protein: 0,
    vegetable: 0,
    fruit: 0,
    dairy: 0,
  }
  const scores: number[] = []
  for (const meal of meals) {
    const groups = new Set(meal.items.flatMap((item) => item.groups))
    for (const group of groups) groupCounts[group] += 1
    const assessable = meal.items.some((item) => item.groupsConfirmed || item.groups.length > 0)
    if (meal.slot === 'snack' || !assessable) continue
    scores.push(
      (groups.has('staple') ? 30 : 0) +
        (groups.has('protein') ? 30 : 0) +
        (groups.has('vegetable') ? 40 : 0),
    )
  }
  return {
    day,
    score: scores.length
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : null,
    mealCount: meals.length,
    scoredMealCount: scores.length,
    homeMealCount: meals.filter((meal) => meal.source === 'home').length,
    groupCounts,
  }
}

export function weekMealReports(records: readonly MealRecord[], today: string): DailyMealReport[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${today}T12:00:00Z`)
    date.setUTCDate(date.getUTCDate() + index - 6)
    return dailyMealReport(records, date.toISOString().slice(0, 10))
  })
}
