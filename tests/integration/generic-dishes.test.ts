import { describe, expect, it } from 'vitest'
import dishSource from '../../content/meal-dishes.json' with { type: 'json' }
import legacyDishSource from '../../content/legacy-meal-dishes.json' with { type: 'json' }
import { recipeById } from '../../shared/content/catalog'
import { dishCategories, genericDishById, genericDishes } from '../../shared/content/dishes'
import { mealChoiceById, mealChoices } from '../../shared/content/mealChoices'
import { applyGameCommand } from '../../shared/game/commands'
import { commandResponseSchema, gameCommandSchema } from '../../shared/game/contracts'
import { chooseStarter, feed, initialGame, shiftDay } from '../../shared/game/game'
import { decodeGame } from '../../shared/game/stateCodec'
import { dailyMealReport, suggestMealItem } from '../../shared/meals/analysis'
import { parseFoodRecognitionResult } from '../../shared/meals/recognition'
import { foodGroupLabels } from '../../shared/meals/types'

const today = '2026-09-25'
const start = () => chooseStarter(initialGame(today), 'komugi')

describe('generic meal classification across commands, rewards and saves', () => {
  it('keeps a small catalog of unambiguous dish families with valid nutrition suggestions', () => {
    expect(genericDishes).toEqual(dishSource)
    expect(genericDishes.length).toBeGreaterThan(0)
    expect(genericDishes.length).toBeLessThanOrEqual(50)
    expect(new Set(genericDishes.map((dish) => dish.id)).size).toBe(genericDishes.length)
    expect(new Set(genericDishes.map((dish) => dish.name)).size).toBe(genericDishes.length)
    const names = new Map<string, string>()
    for (const dish of genericDishes) {
      expect(dish.id).toMatch(/^generic-[a-z]+(?:-[a-z]+)*$/)
      expect(dish.description.trim()).not.toBe('')
      expect(dishCategories).toHaveProperty(dish.category)
      expect(['rice', 'pasta', 'curry', 'soup']).toContain(dish.sample)
      expect(dish).not.toHaveProperty('foodGroups')
      expect(dish.aliases.length).toBeGreaterThan(0)
      expect(new Set(dish.suggestedGroups).size).toBe(dish.suggestedGroups.length)
      for (const group of dish.suggestedGroups) expect(foodGroupLabels).toHaveProperty(group)
      for (const name of [dish.name, ...dish.aliases]) {
        expect(name.trim()).toBe(name)
        expect(name).not.toBe('')
        const normalized = name
          .normalize('NFKC')
          .toLowerCase()
          .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60))
        expect(names.get(normalized) ?? dish.id, name).toBe(dish.id)
        names.set(normalized, dish.id)
      }
    }
  })

  it('uses pasta as the selectable family while keeping concrete dishes as recipe cards', () => {
    const pasta = genericDishes.find((dish) => dish.id === 'generic-pasta')
    expect(pasta?.aliases).toEqual(expect.arrayContaining(['カルボナーラ', 'ペペロンチーノ']))
    expect(pasta?.suggestedGroups).toEqual(['staple'])
    for (const id of ['generic-carbonara', 'generic-peperoncino']) {
      expect(genericDishes.some((dish) => dish.id === id)).toBe(false)
      expect(mealChoices.some((choice) => choice.id === id)).toBe(false)
      expect(genericDishById(id)).toBeDefined()
    }
    for (const id of ['r-carbonara', 'r-bacon-peperoncino']) {
      expect(recipeById(id), id).toBeDefined()
      expect(
        mealChoices.some((choice) => choice.id === id),
        id,
      ).toBe(true)
    }
  })

  it('resolves every historical classification without putting retired IDs back in choices', () => {
    const activeIds = new Set(genericDishes.map((dish) => dish.id))
    for (const dish of legacyDishSource) {
      expect(genericDishById(dish.id), dish.id).toBeDefined()
      expect(mealChoiceById(dish.id), dish.id).toBeDefined()
      if (!activeIds.has(dish.id)) {
        expect(genericDishById(dish.id), dish.id).toEqual(dish)
        expect(
          mealChoices.some((choice) => choice.id === dish.id),
          dish.id,
        ).toBe(false)
      }
    }
    // A family can reuse an old ID; its current name and broad suggestions take precedence.
    for (const dish of genericDishes) {
      expect(genericDishById(dish.id)).toEqual(dish)
      expect(mealChoiceById(dish.id)).toEqual(dish)
    }
  })

  it('filters retired specific IDs from recognition even though history can resolve them', () => {
    const result = parseFoodRecognitionResult({
      candidates: ['generic-carbonara', 'generic-peperoncino', 'generic-pasta', 'r-carbonara'],
      items: [
        {
          name: 'カルボナーラ',
          dishId: 'generic-carbonara',
          groups: ['staple'],
          portion: 'unknown',
          groupsConfirmed: false,
        },
      ],
    })
    expect(result?.candidates).toEqual(['generic-pasta', 'r-carbonara'])
    expect(result?.items[0]).toMatchObject({ name: 'カルボナーラ', groups: ['staple'] })
    expect(result?.items[0]).not.toHaveProperty('dishId')
    expect(result?.items[0]).not.toHaveProperty('recipeId')
  })

  it('restores and shares a historical carbonara meal without changing its nutrition or awarding a card', () => {
    const command = gameCommandSchema.parse({
      type: 'feed',
      input: {
        title: '昼のカルボナーラ',
        sample: 'pasta',
        dishId: 'generic-carbonara',
        mealRecord: {
          slot: 'lunch',
          source: 'restaurant',
          items: [
            {
              name: '昼のカルボナーラ',
              dishId: 'generic-carbonara',
              groups: ['staple', 'protein', 'dairy'],
              portion: 'large',
              groupsConfirmed: true,
            },
          ],
        },
      },
    })
    // A queued command from an older client is still accepted after the selectable catalog is simplified.
    const result = applyGameCommand({ ...start(), visitors: ['mame'] }, command, {
      today,
      mealId: 'old-carbonara',
    })
    const response = { snapshot: { state: result.state, revision: 1 }, receipt: result.receipt }
    expect(commandResponseSchema.parse(JSON.parse(JSON.stringify(response)))).toEqual(response)
    const restored = decodeGame(JSON.parse(JSON.stringify(result.state)), today)
    expect(restored).toEqual(result.state)
    expect(restored.meals[0]).toMatchObject({
      dishId: 'generic-carbonara',
      title: '昼のカルボナーラ',
      sample: 'pasta',
      cardBonus: 0,
    })
    expect(restored.mealRecords?.[0].items[0]).toMatchObject({
      dishId: 'generic-carbonara',
      groups: ['staple', 'protein', 'dairy'],
      portion: 'large',
      groupsConfirmed: true,
    })
    expect(mealChoiceById(restored.meals[0].dishId)?.name).toBe('カルボナーラ')
    const shared = feed(
      restored,
      {
        title: '共有時の入力で置き換えない',
        sample: 'rice',
        dishId: 'generic-pasta',
        targetId: 'mame',
        mealRecordId: 'old-carbonara',
      },
      { mealId: 'shared-carbonara' },
    )
    expect(shared.meals).toHaveLength(2)
    expect(shared.meals[0]).toMatchObject({
      dishId: 'generic-carbonara',
      title: '昼のカルボナーラ',
      sample: 'pasta',
      targetId: 'mame',
      mealRecordId: 'old-carbonara',
      cardBonus: 0,
    })
    expect(shared.mealRecords).toEqual(restored.mealRecords)
    expect(dailyMealReport(shared.mealRecords!, today)).toEqual(
      dailyMealReport(restored.mealRecords!, today),
    )
    expect(shared.cards).toEqual([])
  })

  it('leaves uncertain families without inferred ingredients and named staples unconfirmed', () => {
    for (const id of [
      'generic-dessert',
      'generic-drink',
      'generic-assorted-dishes',
      'generic-curry',
      'generic-soup',
      'generic-stir-fry',
    ]) {
      expect(
        genericDishes.some((dish) => dish.id === id),
        id,
      ).toBe(true)
      expect(suggestMealItem(id), id).toMatchObject({
        dishId: id,
        groups: [],
        portion: 'unknown',
        groupsConfirmed: false,
      })
    }
    for (const id of ['generic-pasta', 'generic-rice']) {
      expect(
        genericDishes.some((dish) => dish.id === id),
        id,
      ).toBe(true)
      expect(suggestMealItem(id), id).toMatchObject({
        dishId: id,
        groups: ['staple'],
        portion: 'unknown',
        groupsConfirmed: false,
      })
    }
  })

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
    const first = feed({ ...start(), subscriptionPlan: 'premium' }, generic, {
      mealId: 'generic-first',
    })
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
