import { describe, expect, it } from 'vitest'
import { chooseStarter, demoGame, feed, initialGame } from '../src/game'
import { deriveFeastSteps } from '../src/feastSteps'

const day = '2026-09-24'
const plainMeal = { title: '今日のごはん', sample: 'rice' }
const types = (before: ReturnType<typeof initialGame>, after: ReturnType<typeof initialGame>) =>
  deriveFeastSteps(before, after).map((step) => step.type)

describe('feast journey events', () => {
  it('shows only a short satisfied scene when no discovery occurred', () => {
    const before = feed(demoGame(day), plainMeal)
    const after = feed(before, plainMeal)
    expect(types(before, after)).toEqual(['eating', 'satisfied'])
  })

  it('reveals growth, a new recipe, arrivals and the seven-day gift in that order', () => {
    const before = demoGame(day)
    const after = feed(before, { ...plainMeal, recipeId: 'curry' })
    const steps = deriveFeastSteps(before, after)
    expect(steps.map((step) => step.type)).toEqual(['eating', 'growth', 'card', 'arrivals', 'gift'])
    expect(steps[1]).toEqual({ type: 'growth', from: 1, to: 2 })
    expect(steps[2]).toEqual({ type: 'card', recipeId: 'curry' })
    expect(steps[3]).toEqual({ type: 'arrivals', visitors: ['mame', 'shizuku', 'yuzu'] })
  })

  it('celebrates a visitor joining without claiming that an unowned baby evolved', () => {
    const before = feed(demoGame(day), plainMeal)
    const after = feed(before, { ...plainMeal, targetId: 'mame', recipeId: 'egg-rice' })
    expect(types(before, after)).toEqual(['eating', 'joined', 'card', 'arrivals'])
    expect(deriveFeastSteps(before, after).at(-1)).toEqual({ type: 'arrivals', visitors: ['momo'] })
  })

  it('does not replay collected cards, already seen visitors or a purchased gift', () => {
    const initial = { ...demoGame(day), owned: ['none', 'plain', 'sprout'] }
    const grown = feed(initial, { ...plainMeal, recipeId: 'curry' })
    expect(types(initial, grown)).toEqual(['eating', 'growth', 'card', 'arrivals'])
    const repeated = feed(grown, { ...plainMeal, recipeId: 'curry' })
    expect(types(grown, repeated)).toEqual(['eating', 'satisfied'])
  })

  it('uses the recipient growth rather than the previously active companion', () => {
    const house = feed(demoGame(day), plainMeal)
    const joined = feed(house, { ...plainMeal, targetId: 'mame' })
    const backToAdult = feed(joined, { ...plainMeal, targetId: 'komugi' })
    expect(types(joined, backToAdult)).toEqual(['eating', 'satisfied'])
  })

  it('does not create a journey without a new meal and never changes game state', () => {
    const before = chooseStarter(initialGame(day), 'shizuku')
    const after = feed(before, plainMeal)
    const beforeJson = JSON.stringify(before),
      afterJson = JSON.stringify(after)
    expect(deriveFeastSteps(before, before)).toEqual([])
    expect(types(before, after)).toEqual(['eating', 'growth'])
    deriveFeastSteps(before, after)
    expect(JSON.stringify(before)).toBe(beforeJson)
    expect(JSON.stringify(after)).toBe(afterJson)
  })
})
