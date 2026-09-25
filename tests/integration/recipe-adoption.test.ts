import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  advanceGame,
  chooseStarter,
  feed,
  initialGame,
  recipeById,
  recipes,
} from '../../src/app/game/browserGame'
import { loadGame, parseGame, saveGame } from '../../src/app/game/gameStorage'
import { legacyRecipes, recipeCategories } from '../../shared/content/recipes'
import type { ExpansionCatalog } from '../../src/features/collection/expansion'

const date = '2026-09-25'
const expansion: ExpansionCatalog = JSON.parse(
  readFileSync('public/expansion/catalog.json', 'utf8'),
)

afterEach(() => vi.unstubAllGlobals())

describe('the integrated recipe registry', () => {
  it('retains the original ten IDs and appends all 300 expansion recipes', () => {
    expect(legacyRecipes.map(({ id }) => id)).toEqual([
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
    ])
    expect(recipes).toHaveLength(310)
    expect(new Set(recipes.map(({ id }) => id)).size).toBe(310)
    expect(recipes.slice(0, 10)).toEqual(legacyRecipes)
    expect(recipeCategories).toEqual(expansion.categories)
    for (const source of expansion.recipes) {
      expect(recipeById(source.id)).toMatchObject({
        id: source.id,
        name: source.name,
        category: source.category,
        description: source.description,
        cuisine: source.cuisine,
        servings: source.servings,
        difficulty: source.difficulty,
        rarity: source.rarity,
        minutes: source.minutes,
        ingredients: source.ingredients.map(({ name, amount }) => `${name} ${amount}`),
        steps: source.steps,
        tip: source.tip,
        tags: source.tags,
        equipment: source.equipment,
        reward: source.reward,
        artPath: source.artPath,
      })
    }
  })

  it('preserves saved cards, meals, companions and balances from the original catalog', () => {
    let state = chooseStarter({ ...initialGame(date), subscriptionPlan: 'premium' }, 'mame')
    for (const recipe of legacyRecipes)
      state = feed(state, {
        title: recipe.name,
        sample: recipe.sample,
        recipeId: recipe.id,
      })
    expect(state.cards).toEqual(legacyRecipes.map(({ id }) => id))
    expect(parseGame(JSON.stringify(state), date)).toEqual(state)
  })

  it.each(['common', 'rare', 'special'] as const)(
    'awards a %s expansion card once, including after reloading and advancing a day',
    (rarity) => {
      const source = expansion.recipes.find((recipe) => recipe.rarity === rarity)!
      const recipe = recipeById(source.id)!
      const start = chooseStarter({ ...initialGame(date), subscriptionPlan: 'premium' }, 'komugi')
      const input = { title: recipe.name, sample: recipe.sample, recipeId: recipe.id }
      const first = feed(start, input)
      expect(first.cards).toEqual([recipe.id])
      expect(first.meals[0]).toMatchObject({
        recipeId: recipe.id,
        cardBonus: recipe.reward,
        coins: 30 + recipe.reward,
        xp: 45,
      })
      expect(first.coins).toBe(start.coins + 30 + recipe.reward)
      const loaded = parseGame(JSON.stringify(first), date)
      expect(loaded).toEqual(first)
      const repeated = feed(loaded, input)
      expect(repeated.cards).toEqual([recipe.id])
      expect(repeated.coins).toBe(first.coins)
      expect(repeated.meals[0]).toMatchObject({ cardBonus: 0, coins: 0, xp: 30 })
      const nextDay = feed(advanceGame(repeated), input)
      expect(nextDay.cards).toEqual([recipe.id])
      expect(nextDay.meals[0]).toMatchObject({ cardBonus: 0, coins: 30 })
      expect(parseGame(JSON.stringify(nextDay), date)).toEqual(nextDay)
    },
  )

  it('loads all expansion card IDs immediately from local storage without a network request', () => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    })
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const recipe = recipeById(expansion.recipes.at(-1)!.id)!
    const state = {
      ...feed(chooseStarter(initialGame(), 'shizuku'), {
        title: recipe.name,
        sample: recipe.sample,
        recipeId: recipe.id,
      }),
      cards: expansion.recipes.map(({ id }) => id),
    }
    expect(saveGame(state)).toBe(true)
    expect(loadGame()).toEqual(state)
    expect(fetch).not.toHaveBeenCalled()
  })
})
