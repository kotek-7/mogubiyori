import { describe, expect, it } from 'vitest'
import {
  advanceGame,
  chooseStarter,
  demoGame as createDemoGame,
  feed,
  initialGame as createInitialGame,
  restGame,
} from '../../app/game/browserGame'
import { deriveFeastSteps, feastStepsFromReceipt } from './feastSteps'
import { createFeedReceipt } from '../../../shared/game/receipt'
import type { FeedReceipt } from '../../../shared/game/receipt'

// These reward/animation scenarios exercise multiple meals on the paid plan.
const initialGame = (day: string) => ({
  ...createInitialGame(day),
  subscriptionPlan: 'premium' as const,
})
const demoGame = (day: string) => ({ ...createDemoGame(day), subscriptionPlan: 'premium' as const })

const day = '2026-09-24'
const plainMeal = { title: '今日のごはん', sample: 'rice' }
const types = (before: ReturnType<typeof initialGame>, after: ReturnType<typeof initialGame>) =>
  deriveFeastSteps(before, after).map((step) => step.type)

describe('feast journey events', () => {
  it('shows XP after eating even when no discovery occurred', () => {
    const before = feed(demoGame(day), plainMeal)
    const after = feed(before, plainMeal)
    expect(types(before, after)).toEqual(['eating', 'xp', 'mealReport'])
  })

  it('keeps the first two meals newborn and celebrates the third meal growth', () => {
    const start = chooseStarter(initialGame(day), 'shizuku')
    const first = feed(start, plainMeal)
    const second = feed(first, plainMeal)
    const third = feed(second, plainMeal)
    expect(types(start, first)).toEqual(['eating', 'xp', 'streak', 'mealReport'])
    expect(types(first, second)).toEqual(['eating', 'xp', 'mealReport'])
    expect(deriveFeastSteps(second, third)).toEqual([
      { type: 'eating' },
      { type: 'xp' },
      { type: 'growth', from: 0, to: 1 },
      { type: 'mealReport' },
    ])
  })

  it('presents every crossed growth stage in order when one reward spans multiple stages', () => {
    const before = chooseStarter(initialGame(day), 'komugi')
    const fed = feed(before, plainMeal)
    const after = {
      ...fed,
      xp: 1100,
      companions: [{ ...fed.companions[0], xp: 1100 }],
    }
    expect(deriveFeastSteps(before, after)).toEqual([
      { type: 'eating' },
      { type: 'xp' },
      { type: 'growth', from: 0, to: 1 },
      { type: 'growth', from: 1, to: 2 },
      { type: 'growth', from: 2, to: 3 },
      { type: 'growth', from: 3, to: 4 },
      { type: 'streak', beforeDays: 0, afterDays: 1, reward: 0, ticketReward: 0 },
      { type: 'mealReport' },
    ])
    const next = feed(after, plainMeal)
    expect(deriveFeastSteps(after, next).filter((step) => step.type === 'growth')).toEqual([])
  })

  it('reveals growth, a new recipe, arrivals, the streak and seven-day gift in that order', () => {
    const before = demoGame(day)
    const after = feed(before, { ...plainMeal, recipeId: 'curry' })
    const steps = deriveFeastSteps(before, after)
    expect(steps.map((step) => step.type)).toEqual([
      'eating',
      'xp',
      'growth',
      'card',
      'arrivals',
      'streak',
      'gift',
      'mealReport',
    ])
    expect(steps[2]).toEqual({ type: 'growth', from: 1, to: 2 })
    expect(steps[3]).toEqual({ type: 'card', recipeId: 'curry' })
    expect(steps[4]).toEqual({ type: 'arrivals', visitors: ['mame', 'shizuku', 'yuzu'] })
    expect(steps[5]).toEqual({
      type: 'streak',
      beforeDays: 6,
      afterDays: 7,
      reward: 100,
      ticketReward: 0,
    })
  })

  it('celebrates a visitor joining without claiming that an unowned baby evolved', () => {
    const before = feed(demoGame(day), plainMeal)
    const after = feed(before, { ...plainMeal, targetId: 'mame', recipeId: 'egg-rice' })
    expect(types(before, after)).toEqual([
      'eating',
      'xp',
      'joined',
      'card',
      'arrivals',
      'mealReport',
    ])
    expect(deriveFeastSteps(before, after).at(-2)).toEqual({ type: 'arrivals', visitors: ['momo'] })
  })

  it('does not replay collected cards, already seen visitors or a purchased gift', () => {
    const initial = { ...demoGame(day), owned: ['none', 'plain', 'sprout'] }
    const grown = feed(initial, { ...plainMeal, recipeId: 'curry' })
    expect(types(initial, grown)).toEqual([
      'eating',
      'xp',
      'growth',
      'card',
      'arrivals',
      'streak',
      'mealReport',
    ])
    const repeated = feed(grown, { ...plainMeal, recipeId: 'curry' })
    expect(types(grown, repeated)).toEqual(['eating', 'xp', 'mealReport'])
  })

  it('uses the recipient growth rather than the previously active companion', () => {
    const house = feed(demoGame(day), plainMeal)
    const joined = feed(house, { ...plainMeal, targetId: 'mame' })
    const backToAdult = feed(joined, { ...plainMeal, targetId: 'komugi' })
    expect(types(joined, backToAdult)).toEqual(['eating', 'xp', 'mealReport'])
  })

  it('does not create a journey without a new meal and never changes game state', () => {
    const before = chooseStarter(initialGame(day), 'shizuku')
    const after = feed(before, plainMeal)
    const beforeJson = JSON.stringify(before),
      afterJson = JSON.stringify(after)
    expect(deriveFeastSteps(before, before)).toEqual([])
    expect(types(before, after)).toEqual(['eating', 'xp', 'streak', 'mealReport'])
    deriveFeastSteps(before, after)
    expect(JSON.stringify(before)).toBe(beforeJson)
    expect(JSON.stringify(after)).toBe(afterJson)
  })

  it('reports XP exactly once at the final form without inventing another growth stage', () => {
    const starter = chooseStarter(initialGame(day), 'komugi')
    const before = {
      ...starter,
      xp: 1050,
      companions: [{ ...starter.companions[0], xp: 1050 }],
      visitors: ['mame', 'shizuku', 'yuzu'] as typeof starter.visitors,
    }
    const after = feed(before, plainMeal)
    expect(after.xp).toBe(1095)
    expect(deriveFeastSteps(before, after)).toEqual([
      { type: 'eating' },
      { type: 'xp' },
      { type: 'streak', beforeDays: 0, afterDays: 1, reward: 0, ticketReward: 0 },
      { type: 'mealReport' },
    ])
  })

  it('marks every newly cooked day while presenting only the bonuses actually awarded', () => {
    let before = chooseStarter(initialGame(day), 'komugi')
    for (let count = 1; count <= 14; count += 1) {
      const after = feed(before, plainMeal)
      const snapshot = JSON.stringify({ before, after })
      const streakSteps = deriveFeastSteps(before, after).filter((step) => step.type === 'streak')
      const bonus = count === 3 ? 30 : count % 7 === 0 ? 100 : 0
      expect(streakSteps).toEqual([
        {
          type: 'streak',
          beforeDays: count - 1,
          afterDays: count,
          reward: bonus,
          ticketReward: count % 3 === 0 ? 1 : 0,
        },
      ])
      expect(after.meals[0].streakBonus).toBe(bonus)
      expect(after.coins - before.coins).toBe(30 + bonus)
      expect(deriveFeastSteps(after, after)).toEqual([])
      const sameDay = feed(after, plainMeal)
      expect(types(after, sameDay)).not.toContain('streak')
      expect(sameDay.coins).toBe(after.coins)
      expect(JSON.stringify({ before, after })).toBe(snapshot)
      before = advanceGame(after)
    }
  })

  it('keeps a protected rest day out of the streak count and celebrates the next cooked day', () => {
    const resting = restGame(demoGame(day))
    expect(types(resting, advanceGame(resting))).not.toContain('streak')
    const before = advanceGame(resting)
    const after = feed(before, plainMeal)
    expect(deriveFeastSteps(before, after)).toContainEqual({
      type: 'streak',
      beforeDays: 6,
      afterDays: 7,
      reward: 100,
      ticketReward: 0,
    })
  })

  it('does not turn a previously saved milestone into another celebration on the same day', () => {
    const before = feed(demoGame(day), plainMeal)
    const next = feed(before, plainMeal)
    // Even a stale UI snapshot carrying the prior bonus must not replay that day's milestone.
    const staleBonus = {
      ...next,
      meals: [{ ...next.meals[0], streakBonus: 100 }, ...next.meals.slice(1)],
    }
    expect(types(before, staleBonus)).not.toContain('streak')
  })

  it('shows a fresh first day after a broken streak without inventing a bonus', () => {
    const first = feed(chooseStarter(initialGame(day), 'komugi'), plainMeal)
    const before = advanceGame(first, 2)
    const after = feed(before, plainMeal)
    // Older meals may omit the optional streak bonus field entirely.
    const withoutBonusField = {
      ...after,
      meals: [{ ...after.meals[0], streakBonus: undefined }, ...after.meals.slice(1)],
    }
    expect(deriveFeastSteps(before, withoutBonusField)).toContainEqual({
      type: 'streak',
      beforeDays: 0,
      afterDays: 1,
      reward: 0,
      ticketReward: 0,
    })
  })
})

describe('committed meal receipts', () => {
  it('does not infer a ticket reward from legacy receipts at a three-day milestone', () => {
    const first = feed(chooseStarter(initialGame(day), 'komugi'), plainMeal)
    const second = feed(advanceGame(first), plainMeal)
    const before = advanceGame(second)
    const after = feed(before, plainMeal)
    const receipt = JSON.parse(JSON.stringify(createFeedReceipt(before, after))) as FeedReceipt
    expect(feastStepsFromReceipt(receipt)).toContainEqual({
      type: 'streak',
      beforeDays: 2,
      afterDays: 3,
      reward: 30,
      ticketReward: 1,
    })
    delete receipt.streak.ticketBonus
    delete receipt.meal.ticketBonus
    expect(feastStepsFromReceipt(receipt)).toContainEqual({
      type: 'streak',
      beforeDays: 2,
      afterDays: 3,
      reward: 30,
      ticketReward: 0,
    })
  })

  it('keeps receipts saved before food reports on their original journey', () => {
    const before = demoGame(day)
    const after = feed(before, { ...plainMeal, recipeId: 'curry' })
    const receipt = JSON.parse(JSON.stringify(createFeedReceipt(before, after))) as FeedReceipt
    const { mealReport: _report, ...legacyReceipt } = receipt
    expect(feastStepsFromReceipt(legacyReceipt).map((step) => step.type)).toEqual([
      'eating',
      'xp',
      'growth',
      'card',
      'arrivals',
      'streak',
      'gift',
    ])
  })
  it('presents a serialized receipt without depending on later saved state', () => {
    const before = demoGame(day)
    const after = feed(before, { ...plainMeal, recipeId: 'curry' })
    const receipt = JSON.parse(JSON.stringify(createFeedReceipt(before, after))) as FeedReceipt
    const expected = deriveFeastSteps(before, after)
    after.companions[0].xp += 1000
    after.cards.push('onigiri')
    after.visitors = []
    after.equipped.hat = 'none'
    expect(feastStepsFromReceipt(receipt)).toEqual(expected)
    expect(receipt.meal).not.toHaveProperty('photo')
    expect(receipt).not.toHaveProperty('before')
    expect(receipt).not.toHaveProperty('after')
  })
})
