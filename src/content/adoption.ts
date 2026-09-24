import type { Recipe } from '../game'
import type { ExpansionCharacter, ExpansionItem, ExpansionRecipe } from './expansion'

/** Combine catalog releases without changing existing IDs or previously saved progress. */
export function mergeById<T extends { id: string }>(
  base: readonly T[],
  addition: readonly T[],
): T[] {
  const merged = new Map<string, T>()
  for (const entry of [...base, ...addition]) {
    if (merged.has(entry.id)) throw new Error(`コンテンツ ID が重複しています: ${entry.id}`)
    merged.set(entry.id, entry)
  }
  return [...merged.values()]
}

export function adaptRecipe(recipe: ExpansionRecipe): Recipe {
  const samples: Record<string, string> = {
    rice: 'rice',
    noodles: 'pasta',
    soup: 'soup',
    curry: 'curry',
  }
  return {
    id: recipe.id,
    name: recipe.name,
    sample: samples[recipe.art.base] ?? 'rice',
    difficulty: recipe.difficulty,
    rarity: recipe.rarity,
    minutes: recipe.minutes,
    ingredients: recipe.ingredients.map((ingredient) => `${ingredient.name} ${ingredient.amount}`),
    steps: recipe.steps,
    reward: recipe.reward,
  }
}

export type DiscoveryProgress = { adultCompanions: number; uniqueRecipes: number }
export function availableVisitors(
  characters: readonly ExpansionCharacter[],
  ownedIds: readonly string[],
  progress: DiscoveryProgress,
  limit = 3,
): ExpansionCharacter[] {
  const owned = new Set(ownedIds)
  return characters
    .filter(
      (character) =>
        !owned.has(character.id) &&
        progress.adultCompanions >= character.discovery.adultCompanions &&
        progress.uniqueRecipes >= character.discovery.uniqueRecipes,
    )
    .slice(0, Math.max(0, limit))
}
export function availableCosmetics(
  items: readonly ExpansionItem[],
  uniqueRecipes: number,
): ExpansionItem[] {
  return items.filter((item) => uniqueRecipes >= item.unlock.uniqueRecipes)
}
