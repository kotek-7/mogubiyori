import { describe, expect, it } from 'vitest'
import { genericDishes } from '../../../shared/content/dishes'
import { availableRecipes, FREE_RECIPE_IDS } from '../../../shared/content/freeRecipes'
import { recipes } from '../../../shared/content/recipes'
import {
  filterFoodEntries,
  foodCategories,
  getFoodEntries,
  normalizeFoodSearch,
} from './foodBrowse'
import type { FoodFilters } from './foodBrowse'

const allFilters: FoodFilters = {
  query: '',
  category: 'all',
  minutes: 'all',
  difficulty: 'all',
  acquired: 'all',
}
const noCards = new Set<string>()

describe('food browsing entries', () => {
  it('keeps plan access and the source order, with dishes only in meal selection', () => {
    const free = getFoodEntries({ subscriptionPlan: 'free' }, false)
    const premium = getFoodEntries({ subscriptionPlan: 'premium' }, false)
    expect(free).toHaveLength(FREE_RECIPE_IDS.length)
    expect(free.map((entry) => entry.id)).toEqual(availableRecipes({}).map((recipe) => recipe.id))
    expect(premium.map((entry) => entry.id)).toEqual(recipes.map((recipe) => recipe.id))
    expect(free.every((entry) => entry.kind === 'recipe')).toBe(true)
    expect(getFoodEntries({}, false)).toEqual(free)

    for (const subscriptionPlan of ['free', 'premium'] as const) {
      const entries = getFoodEntries({ subscriptionPlan }, true)
      expect(entries.map((entry) => entry.id)).toEqual([
        ...availableRecipes({ subscriptionPlan }).map((recipe) => recipe.id),
        ...genericDishes.map((dish) => dish.id),
      ])
      expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length)
    }
  })

  it('places every available entry on exactly one category shelf', () => {
    const entries = getFoodEntries({ subscriptionPlan: 'premium' }, true)
    const shelves = Object.keys(foodCategories).flatMap((category) =>
      filterFoodEntries(
        entries,
        { ...allFilters, category: category as FoodFilters['category'] },
        noCards,
      ),
    )
    expect(shelves).toHaveLength(recipes.length + genericDishes.length)
    expect(shelves.map((entry) => entry.id).sort()).toEqual(entries.map((entry) => entry.id).sort())
    expect(new Set(shelves.map((entry) => entry.id)).size).toBe(entries.length)
    expect(entries.every((entry) => entry.category in foodCategories)).toBe(true)
  })

  it('uses broad dish categories without labeling fish or tofu as meat', () => {
    const entries = getFoodEntries({ subscriptionPlan: 'premium' }, true)
    const main = filterFoodEntries(entries, { ...allFilters, category: 'main' }, noCards)
    expect(foodCategories.main).toBe('おかず')
    expect(main.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        'r-chicken-teriyaki',
        'r-salmon-mushroom-foil',
        'r-mild-mapo-tofu',
        'generic-hamburg',
        'generic-grilled-fish',
      ]),
    )
    expect(
      main.every((entry) => entry.kind === 'recipe' || entry.dish.category !== 'vegetables'),
    ).toBe(true)
    expect(foodCategories).not.toHaveProperty('meat')
    expect(foodCategories).not.toHaveProperty('seafood')
  })
})

describe('food browsing filters', () => {
  const entries = getFoodEntries({ subscriptionPlan: 'premium' }, true)

  it('shows all allowed entries before any filter is selected', () => {
    expect(filterFoodEntries(entries, allFilters, noCards)).toEqual(entries)
    expect(filterFoodEntries(entries, { ...allFilters, query: ' \u3000 ' }, noCards)).toEqual(
      entries,
    )
  })

  it('normalizes kana and full-width text and matches aliases and every ingredient term', () => {
    expect(normalizeFoodSearch('ＴＯＦＵ ぎょうざ ｶﾚｰ')).toBe('tofu ギョウザ カレー')
    const aliasMatches = filterFoodEntries(entries, { ...allFilters, query: ' ｷﾞｮｳｻﾞ ' }, noCards)
    expect(aliasMatches.map((entry) => entry.id)).toContain('generic-gyoza')

    const ingredients = filterFoodEntries(
      entries,
      { ...allFilters, query: 'ｶﾚｰﾙｳ\u3000じゃがいも' },
      noCards,
    )
    expect(ingredients.map((entry) => entry.id)).toContain('curry')
    expect(ingredients.every((entry) => entry.kind === 'recipe')).toBe(true)
    expect(
      filterFoodEntries(entries, { ...allFilters, query: 'ｷﾞｮｳｻﾞ 存在しない材料' }, noCards),
    ).toEqual([])
  })

  it.each([{ minutes: '10' }, { difficulty: '1' }, { acquired: 'yes' }, { acquired: 'no' }])(
    'excludes generic dishes when recipe-only filters are active: %j',
    (extraFilter) => {
      const filtered = filterFoodEntries(
        entries,
        { ...allFilters, ...extraFilter },
        new Set(['egg-rice']),
      )
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.every((entry) => entry.kind === 'recipe')).toBe(true)
    },
  )

  it('combines category, recipe properties, and acquired status without mutating the inputs', () => {
    const cards = new Set(['egg-rice', 'curry', 'miso-soup'])
    const before = [...entries]
    expect(
      filterFoodEntries(
        entries,
        { ...allFilters, category: 'rice', minutes: '10', difficulty: '1', acquired: 'yes' },
        cards,
      ).map((entry) => entry.id),
    ).toEqual(['egg-rice'])
    const unacquired = filterFoodEntries(entries, { ...allFilters, acquired: 'no' }, cards)
    expect(unacquired.every((entry) => !cards.has(entry.id))).toBe(true)
    expect(entries).toEqual(before)
    expect([...cards]).toEqual(['egg-rice', 'curry', 'miso-soup'])
  })
})
