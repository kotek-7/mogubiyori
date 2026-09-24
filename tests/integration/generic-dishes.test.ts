import { describe, expect, it } from 'vitest'
import { genericDishes } from '../../shared/content/dishes'
import { applyGameCommand } from '../../shared/game/commands'
import { commandResponseSchema, gameCommandSchema } from '../../shared/game/contracts'
import { chooseStarter, feed, initialGame, shiftDay } from '../../shared/game/game'
import { decodeGame } from '../../shared/game/stateCodec'

const today = '2026-09-25'
const start = () => chooseStarter(initialGame(today), 'komugi')

describe('generic meal classification across commands, rewards and saves', () => {
  it.each(genericDishes)('preserves $name in the command receipt and restored save', (dish) => {
    const command = gameCommandSchema.parse({
      type: 'feed',
      input: { title: ' ', sample: 'rice', dishId: dish.id },
    })
    const result = applyGameCommand(start(), command, { today, mealId: `meal-${dish.id}` })
    const response = { snapshot: { state: result.state, revision: 1 }, receipt: result.receipt }
    expect(commandResponseSchema.parse(JSON.parse(JSON.stringify(response)))).toEqual(response)
    expect(decodeGame(JSON.parse(JSON.stringify(result.state)), today)).toEqual(result.state)
    expect(result.receipt?.meal).toMatchObject({
      dishId: dish.id,
      title: dish.name,
      sample: dish.sample,
      xp: 45,
      coins: 30,
      cardBonus: 0,
    })
    expect(result.receipt?.meal).not.toHaveProperty('recipeId')
    expect(result.receipt?.newCards).toEqual([])
    expect(result.state.cards).toEqual([])
  })

  it('keeps generic curry separate from the collectible curry recipe and its repeat rewards', () => {
    const generic = { title: '', sample: 'rice', dishId: 'generic-curry' }
    const first = feed(start(), generic, { mealId: 'generic-first' })
    const repeat = feed(first, generic, { mealId: 'generic-repeat' })
    expect(first.coins).toBe(150)
    expect(repeat.coins).toBe(150)
    expect(repeat.meals[0]).toMatchObject({ xp: 45, coins: 0, cardBonus: 0 })
    expect(repeat.cards).toEqual([])

    const recipeInput = { title: 'カレー', sample: 'curry', recipeId: 'curry' }
    const recipe = feed(repeat, recipeInput, { mealId: 'recipe-first' })
    expect(recipe.cards).toEqual(['curry'])
    expect(recipe.meals[0]).toMatchObject({ recipeId: 'curry', xp: 45, cardBonus: 70, coins: 70 })
    expect(recipe.meals[0]).not.toHaveProperty('dishId')
    const recipeRepeat = feed(recipe, recipeInput, { mealId: 'recipe-repeat' })
    expect(recipeRepeat.meals[0]).toMatchObject({ xp: 30, cardBonus: 0, coins: 0 })
  })

  it('preserves daily and streak rewards for generic meals', () => {
    let state = start()
    for (let offset = 0; offset < 3; offset += 1) {
      state = applyGameCommand(
        state,
        { type: 'feed', input: { title: '', sample: 'rice', dishId: 'generic-pasta' } },
        { today: shiftDay(today, offset), mealId: `meal-day-${offset}` },
      ).state
    }
    expect(state.meals.map(({ coins }) => coins)).toEqual([60, 30, 30])
    expect(state.meals[0]).toMatchObject({ streakBonus: 30, xp: 45, cardBonus: 0 })
    expect(state.cards).toEqual([])
  })

  it('preserves an edited title and ignores unregistered classifications', () => {
    const classified = feed(
      start(),
      { title: '  お昼のパスタ  ', sample: 'rice', dishId: 'generic-pasta' },
      { mealId: 'custom-title' },
    )
    expect(classified.meals[0]).toMatchObject({ title: 'お昼のパスタ', sample: 'pasta' })
    const unknown = feed(
      start(),
      { title: '', sample: 'soup', recipeId: 'missing-recipe', dishId: 'missing-dish' },
      { mealId: 'unknown' },
    )
    expect(unknown.meals[0]).toMatchObject({ title: '今日のごはん', sample: 'soup', xp: 45 })
    expect(unknown.meals[0]).not.toHaveProperty('dishId')
    expect(unknown.meals[0]).not.toHaveProperty('recipeId')
    expect(unknown.cards).toEqual([])
  })

  it('prefers a valid exact recipe and falls back to a valid generic dish', () => {
    const recipe = feed(
      start(),
      { title: 'カレー', sample: 'curry', recipeId: 'curry', dishId: 'generic-pasta' },
      { mealId: 'both-valid' },
    )
    expect(recipe.meals[0]).toMatchObject({ recipeId: 'curry', sample: 'curry', cardBonus: 70 })
    expect(recipe.meals[0]).not.toHaveProperty('dishId')
    expect(recipe.cards).toEqual(['curry'])
    const fallback = feed(
      start(),
      { title: '', sample: 'rice', recipeId: 'missing-recipe', dishId: 'generic-pasta' },
      { mealId: 'valid-dish' },
    )
    expect(fallback.meals[0]).toMatchObject({
      dishId: 'generic-pasta',
      title: 'パスタ',
      sample: 'pasta',
    })
    expect(fallback.meals[0]).not.toHaveProperty('recipeId')
    expect(fallback.cards).toEqual([])
  })
})
