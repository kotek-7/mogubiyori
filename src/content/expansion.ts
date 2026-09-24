/** Independent content contract. Loading the pack never mutates a saved game. */
export type RecipeCategory = 'rice' | 'noodles' | 'soup' | 'main' | 'side' | 'breakfast' | 'snack'
export type ExpansionRecipe = {
  id: string
  name: string
  description: string
  category: RecipeCategory
  cuisine: string
  difficulty: 1 | 2 | 3
  rarity: 'common' | 'rare' | 'special'
  minutes: number
  servings: number
  ingredients: { name: string; amount: string }[]
  steps: string[]
  tip: string
  tags: string[]
  equipment: string[]
  reward: number
  artPath: string
  art: {
    base: string
    motif: string
    colors: string[]
    toppings: string[]
    garnish: string[]
    vessel: string
  }
}
export type ExpansionGrowthForm = {
  name: string
  description: string
  artPath: string
  renderSpec: {
    headAnchor: { x: number; y: number }
    hatTransform: { translateX: number; translateY: number; scaleX: number; scaleY: number }
  }
}

export type ExpansionCharacter = {
  id: string
  name: string
  description: string
  personality: string
  habitat: string
  favoriteCategories: RecipeCategory[]
  favoriteTags: string[]
  discovery: { adultCompanions: number; uniqueRecipes: number }
  dialogue: { greeting: string; fed: string; newDish: string; repeatDish: string }
  stages: [
    ExpansionGrowthForm,
    ExpansionGrowthForm,
    ExpansionGrowthForm,
    ExpansionGrowthForm,
    ExpansionGrowthForm,
  ]
  palette: { body: string; accent: string; outline: string }
  silhouette: string
}
export type ExpansionItem = {
  id: string
  name: string
  description: string
  kind: 'hat' | 'room'
  currency: 'coins' | 'gems'
  price: number
  rarity: string
  collection: string
  unlock: { uniqueRecipes: number }
  artPath: string
  renderSpec: { viewBox: string; anchor: 'head' | 'background' }
}
export type ExpansionCatalog = {
  schemaVersion: 1
  id: string
  name: string
  categories: Record<RecipeCategory, string>
  collections: Record<string, string>
  recipes: ExpansionRecipe[]
  characters: ExpansionCharacter[]
  items: ExpansionItem[]
}
export async function loadExpansionCatalog(signal?: AbortSignal): Promise<ExpansionCatalog> {
  const response = await fetch(`${import.meta.env.BASE_URL}expansion/catalog.json`, { signal })
  if (!response.ok) throw new Error(`コンテンツの読み込みに失敗しました (${response.status})`)
  const data: unknown = await response.json()
  if (
    !data ||
    typeof data !== 'object' ||
    !('schemaVersion' in data) ||
    data.schemaVersion !== 1 ||
    !('recipes' in data) ||
    !Array.isArray(data.recipes) ||
    !('characters' in data) ||
    !Array.isArray(data.characters) ||
    !data.characters.every(
      (character: unknown) =>
        !!character &&
        typeof character === 'object' &&
        'stages' in character &&
        Array.isArray(character.stages) &&
        character.stages.length === 5,
    ) ||
    !('items' in data) ||
    !Array.isArray(data.items)
  )
    throw new Error('未対応のコンテンツ形式です')
  return data as ExpansionCatalog
}
