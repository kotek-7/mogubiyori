import { describe, expect, it } from 'vitest'
import { availableRecipes, canViewRecipe, FREE_RECIPE_IDS } from './freeRecipes'
import { recipes } from './recipes'

describe('subscription recipe access', () => {
  it('offers exactly 30 existing everyday recipes, including udon, fried rice and curry', () => {
    const recipeIds = new Set(recipes.map((recipe) => recipe.id))
    expect(FREE_RECIPE_IDS).toHaveLength(30)
    expect(new Set(FREE_RECIPE_IDS).size).toBe(30)
    expect(FREE_RECIPE_IDS.every((id) => recipeIds.has(id))).toBe(true)
    expect(FREE_RECIPE_IDS).toEqual(
      expect.arrayContaining(['r-kitsune-udon', 'fried-rice', 'curry', 'onigiri']),
    )
    expect(availableRecipes({ subscriptionPlan: 'free' })).toHaveLength(30)
    expect(availableRecipes({})).toEqual(availableRecipes({ subscriptionPlan: 'free' }))
  })

  it('makes the full catalog available to premium members', () => {
    expect(recipes.length).toBeGreaterThan(FREE_RECIPE_IDS.length)
    expect(availableRecipes({ subscriptionPlan: 'premium' })).toEqual(recipes)
    expect(
      recipes.every((recipe) => canViewRecipe({ subscriptionPlan: 'premium' }, recipe.id)),
    ).toBe(true)
    expect(canViewRecipe({ subscriptionPlan: 'premium' }, 'missing-recipe')).toBe(false)
  })

  it('removes access on downgrade without changing previously acquired cards', () => {
    const premiumRecipe = recipes.find((recipe) => !canViewRecipe({}, recipe.id))!
    const cards = ['curry', premiumRecipe.id]
    const premium = { subscriptionPlan: 'premium' as const, cards }
    const free = { ...premium, subscriptionPlan: 'free' as const }

    expect(canViewRecipe(premium, premiumRecipe.id)).toBe(true)
    expect(canViewRecipe(free, premiumRecipe.id)).toBe(false)
    expect(canViewRecipe(free, 'curry')).toBe(true)
    expect(availableRecipes(free).some((recipe) => recipe.id === premiumRecipe.id)).toBe(false)
    expect(free.cards).toEqual(cards)
  })
})
