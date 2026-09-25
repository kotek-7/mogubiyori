import { describe, expect, it } from 'vitest'
import { applyGameCommand } from './commands'
import { gameCommandSchema } from './contracts'
import { chooseStarter, feed, initialGame, updateMealRecord } from './game'
import { decodeGame } from './stateCodec'
import {
  canRecordMeal,
  canViewReportDay,
  earliestReportDay,
  getSubscriptionPlan,
} from './subscription'

const today = '2026-03-01'
const input = { title: 'カレー', sample: 'curry', recipeId: 'curry' }
const starter = () => chooseStarter(initialGame(today), 'komugi')

describe('subscription entitlements', () => {
  it('starts free and restores old saves without losing their progress', () => {
    const state = feed(starter(), input, { mealId: 'first' })
    expect(getSubscriptionPlan(state)).toBe('free')
    const { subscriptionPlan: _plan, ...legacy } = state
    expect(decodeGame(legacy, today)).toEqual(state)
    expect(
      gameCommandSchema.safeParse({ type: 'setSubscriptionPlan', plan: 'premium' }).success,
    ).toBe(true)
    expect(
      gameCommandSchema.safeParse({ type: 'setSubscriptionPlan', plan: 'unknown' }).success,
    ).toBe(false)
  })

  it('persists mock upgrades and downgrades without deleting meals or earned progress', () => {
    const first = feed(starter(), input, { mealId: 'first' })
    const upgraded = applyGameCommand(
      first,
      { type: 'setSubscriptionPlan', plan: 'premium' },
      { today, mealId: 'unused' },
    )
    expect(upgraded.receipt).toBeNull()
    expect(decodeGame(upgraded.state, today)).toEqual(upgraded.state)
    const second = feed(upgraded.state, input, { mealId: 'second' })
    expect(second.mealRecords).toHaveLength(2)
    const downgraded = applyGameCommand(
      second,
      { type: 'setSubscriptionPlan', plan: 'free' },
      { today, mealId: 'unused' },
    )
    expect(downgraded.state).toEqual({ ...second, subscriptionPlan: 'free' })
    expect(canRecordMeal(downgraded.state)).toBe(false)
    expect(
      applyGameCommand(
        downgraded.state,
        { type: 'setSubscriptionPlan', plan: 'free' },
        { today, mealId: 'unused' },
      ).changed,
    ).toBe(false)
  })

  it('allows one new free record per day and still permits sharing that meal', () => {
    const state = { ...starter(), visitors: ['mame' as const] }
    expect(canRecordMeal(state)).toBe(true)
    const first = feed(state, input, { mealId: 'first' })
    expect(canRecordMeal(first)).toBe(false)
    expect(feed(first, input, { mealId: 'second' })).toBe(first)
    const shared = feed(
      first,
      { ...input, targetId: 'mame', mealRecordId: 'first' },
      { mealId: 'shared' },
    )
    expect(shared.meals).toHaveLength(2)
    expect(shared.mealRecords).toHaveLength(1)
    expect(canRecordMeal({ ...shared, today: '2026-03-02' })).toBe(true)
  })

  it('counts legacy meals and cannot reset today’s allowance by editing a record date', () => {
    const state = feed(starter(), input, { mealId: 'first' })
    const record = state.mealRecords![0]
    const legacy = {
      ...state,
      mealRecords: undefined,
      meals: state.meals.map(({ mealRecordId: _id, ...meal }) => meal),
    }
    expect(canRecordMeal(legacy)).toBe(false)
    expect(feed(legacy, input, { mealId: 'second' })).toBe(legacy)
    const { id, ...editable } = record
    const edited = updateMealRecord(state, id, { ...editable, day: '2026-02-28' })
    expect(edited.mealRecords![0].day).toBe('2026-02-28')
    expect(canRecordMeal(edited)).toBe(false)
  })

  it('includes today and the prior two calendar days, crossing months and leap days', () => {
    const state = starter()
    expect(earliestReportDay(state)).toBe('2026-02-27')
    expect(
      ['2026-02-26', '2026-02-27', '2026-02-28', today, '2026-03-02'].map((day) =>
        canViewReportDay(state, day),
      ),
    ).toEqual([false, true, true, true, false])
    expect(earliestReportDay({ ...state, today: '2024-03-01' })).toBe('2024-02-28')
    expect(earliestReportDay({ ...state, today: '2026-01-01' })).toBe('2025-12-30')
    const premium = { ...state, subscriptionPlan: 'premium' as const }
    expect(earliestReportDay(premium)).toBeUndefined()
    expect(canViewReportDay(premium, '2020-01-01')).toBe(true)
    expect(canViewReportDay(premium, '2026-03-02')).toBe(false)
  })
})
