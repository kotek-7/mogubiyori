import type { ExpansionCatalog } from '../../../shared/content/types'

export type * from '../../../shared/content/types'

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
