import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { recipes as legacyRecipes } from '../src/game'
import {
  mergeById,
  adaptRecipe,
  availableVisitors,
  availableCosmetics,
} from '../src/content/adoption'
import type { ExpansionCatalog } from '../src/content/expansion'
// Pure JavaScript is also used by the standalone catalog, without a framework runtime.
import { normalizeSearch, selectEntries } from '../public/expansion/catalog-tools.js'
const data: ExpansionCatalog = JSON.parse(readFileSync('public/expansion/catalog.json', 'utf8'))
describe('expansion adoption boundaries', () => {
  it('adds 300 recipes while preserving every existing recipe and its ID', () => {
    const before = JSON.stringify(legacyRecipes)
    const merged = mergeById(legacyRecipes, data.recipes.map(adaptRecipe))
    expect(merged).toHaveLength(legacyRecipes.length + 300)
    expect(JSON.stringify(legacyRecipes)).toBe(before)
    for (const original of legacyRecipes)
      expect(merged.find((r) => r.id === original.id)).toBe(original)
    expect(() => mergeById(legacyRecipes, [legacyRecipes[0]])).toThrow('重複')
  })
  it('keeps every stage and cosmetic reference local and present', () => {
    const paths = [
      ...data.recipes.map((r) => r.artPath),
      ...data.characters.flatMap((c) => c.stages.map((s) => s.artPath)),
      ...data.items.map((i) => i.artPath),
    ]
    expect(paths).toHaveLength(480)
    for (const path of paths) expect(existsSync(`public${path}`), path).toBe(true)
  })
  it('only offers eligible unowned visitors, in a bounded deterministic group', () => {
    expect(
      availableVisitors(data.characters, [], { adultCompanions: 0, uniqueRecipes: 0 }),
    ).toHaveLength(0)
    const progress = { adultCompanions: 100, uniqueRecipes: 300 }
    const first = availableVisitors(data.characters, [], progress)
    expect(first).toHaveLength(3)
    expect(
      availableVisitors(
        data.characters,
        first.map((c) => c.id),
        progress,
      ).some((c) => first.includes(c)),
    ).toBe(false)
    expect(availableVisitors(data.characters, [], progress, 0)).toHaveLength(0)
    expect(availableCosmetics(data.items, 300)).toHaveLength(72)
  })
})
describe('large catalog discovery', () => {
  it('normalizes full-width input and kana, with AND matching', () => {
    expect(normalizeSearch('　トマト Ａ　')).toBe('とまと a')
    const target = data.recipes.find((r) => r.ingredients.some((i) => i.name.includes('トマト')))!
    const results = selectEntries(data.recipes, { query: 'とまと', pageSize: 400 })
    expect(results.entries.some((r) => r.id === target.id)).toBe(true)
    expect(selectEntries(data.recipes, { query: 'トマト 存在しない材料' }).total).toBe(0)
    const breakfast = selectEntries(data.recipes, {
      query: '朝ごはん',
      labels: data.categories,
      pageSize: 400,
    })
    expect(breakfast.entries.filter((r) => r.category === 'breakfast')).toHaveLength(30)
  })
  it('intersects category, time and difficulty before pagination', () => {
    const options = { category: 'side', maxMinutes: 20, difficulty: '1', pageSize: 5, page: 1 }
    const result = selectEntries(data.recipes, options)
    expect(result.total).toBeGreaterThan(5)
    expect(result.entries).toHaveLength(5)
    expect(
      result.entries.every((r) => r.category === 'side' && r.minutes <= 20 && r.difficulty === 1),
    ).toBe(true)
    const second = selectEntries(data.recipes, { ...options, page: 2 })
    expect(second.entries.some((r) => result.entries.some((first) => first.id === r.id))).toBe(
      false,
    )
    const end = selectEntries(data.recipes, { ...options, page: 999 })
    expect(end.page).toBe(end.pages)
  })
  it('bounds DOM work to 24 cards and covers the complete collection', () => {
    const ids = new Set<string>()
    for (let page = 1; page <= 13; page++) {
      const result = selectEntries(data.recipes, { page })
      expect(result.entries.length).toBeLessThanOrEqual(24)
      for (const entry of result.entries) ids.add(entry.id)
    }
    expect(ids.size).toBe(300)
  })
})
