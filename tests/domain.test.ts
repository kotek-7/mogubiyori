import { describe, expect, it } from 'vitest'
import {
  addDays,
  advanceDay,
  cookedToday,
  freezeDay,
  initialState,
  recipes,
  recommend,
  recordMeal,
  rewardFor,
  streak,
  weekDays,
  weeklyCount,
} from '../src/domain'
import { parseState } from '../src/storage'
import type { Meal } from '../src/domain'

const day = '2026-09-24'
const meal = (recipeId = 'cabbage-rice'): Omit<Meal, 'id' | 'day' | 'xp'> => {
  const r = recipes.find((recipe) => recipe.id === recipeId)!
  return { recipeId, title: r.name, category: r.category, visibility: 'private', note: 'できた！' }
}

describe('daily cooking and continuity', () => {
  it('starts with six prior cooking days and no record today', () => {
    const state = initialState(day)
    expect(streak(state)).toBe(6)
    expect(cookedToday(state)).toBe(false)
  })
  it('awards XP only once a day while allowing more meals', () => {
    const first = recordMeal(initialState(day), meal())
    const second = recordMeal(first, meal())
    expect(streak(second)).toBe(7)
    expect(second.meals.at(-2)?.xp).toBe(20)
    expect(second.meals.at(-1)?.xp).toBe(0)
    expect(second.meals).toHaveLength(8)
  })
  it('breaks a streak when an unprotected day is missed', () => {
    expect(streak(advanceDay(initialState(day)))).toBe(0)
    expect(streak(recordMeal(advanceDay(initialState(day)), meal()))).toBe(1)
  })
  it('preserves but does not increase a streak with a rest', () => {
    const rested = freezeDay(initialState(day))
    expect(rested.freezes).toBe(1)
    expect(streak(rested)).toBe(6)
    expect(streak(advanceDay(rested))).toBe(6)
    expect(streak(recordMeal(advanceDay(rested), meal()))).toBe(7)
  })
  it('cannot spend multiple tickets on the same day or after cooking', () => {
    const rest = freezeDay(initialState(day))
    expect(freezeDay(rest)).toBe(rest)
    const cooked = recordMeal(initialState(day), meal())
    expect(freezeDay(cooked)).toBe(cooked)
  })
  it('cannot spend an exhausted ticket or spend one in weekly mode', () => {
    const state = initialState(day)
    state.freezes = 0
    expect(freezeDay(state)).toBe(state)
    state.freezes = 2
    state.settings.habit = 'weekly'
    expect(freezeDay(state)).toBe(state)
  })
  it('refunds a ticket if the user ends up cooking that day', () => {
    const state = recordMeal(freezeDay(initialState(day)), meal())
    expect(state.freezes).toBe(2)
    expect(state.rests).not.toContain(day)
    expect(streak(state)).toBe(7)
  })
  it('protects two consecutive rest days without counting them as cooking', () => {
    const state = freezeDay(advanceDay(freezeDay(initialState(day))))
    expect(state.freezes).toBe(0)
    expect(streak(state)).toBe(6)
    expect(streak(advanceDay(advanceDay(state)))).toBe(0)
  })
})

describe('experiment variants', () => {
  it('applies a repetition penalty to a repeated category, not just a title', () => {
    const state = initialState(day)
    expect(rewardFor(state, 'ごはん').xp).toBe(20)
    state.settings.repetition = 'penalty'
    expect(rewardFor(state, 'ごはん').xp).toBe(10)
    expect(rewardFor(state, 'スープ').xp).toBe(20)
  })
  it('awards a first-category bonus and retains recorded XP when settings change', () => {
    const state = initialState(day, true)
    expect(rewardFor(state, 'ごはん').xp).toBe(30)
    const saved = recordMeal(state, meal())
    saved.settings.repetition = 'penalty'
    expect(saved.meals[0].xp).toBe(30)
  })
  it('counts unique cooking days within Monday–Sunday, excluding rest days', () => {
    let state = initialState(day)
    expect(weeklyCount(state)).toBe(3)
    state = recordMeal(recordMeal(state, meal()), meal())
    expect(weeklyCount(state)).toBe(4)
    expect(weeklyCount(freezeDay(advanceDay(state)))).toBe(4)
    state.today = '2026-09-28'
    expect(weeklyCount(state)).toBe(0)
  })
  it('respects time and makes pantry changes affect recommendations', () => {
    const state = initialState(day)
    state.minutes = 5
    expect(recommend(state).every((r) => r.minutes <= 5)).toBe(true)
    state.pantry = ['うどん', 'ツナ', '卵']
    expect(recommend(state)[0].id).toBe('tuna-udon')
    state.pantry = ['豆腐', '卵']
    expect(recommend(state)[0].id).toBe('tofu-egg')
    expect(recommend(state, 1)[0].id).not.toBe(recommend(state)[0].id)
  })
})

describe('photo-only recording', () => {
  it('does not award a novelty bonus or repetition penalty for an unknown dish', () => {
    const state = initialState(day, true)
    expect(rewardFor(state, '未分類').xp).toBe(20)
    const saved = recordMeal(state, {
      ...meal(),
      category: '未分類',
      recipeId: '',
      title: '今日の一皿',
    })
    expect(parseState(JSON.stringify(saved))).toEqual(saved)
    expect(streak(saved)).toBe(1)
    let next = recordMeal(advanceDay(saved), { ...meal(), category: '未分類', recipeId: '' })
    next = advanceDay(next)
    next.settings.repetition = 'penalty'
    expect(rewardFor(next, '未分類').xp).toBe(20)
  })
})

describe('calendar and persistence', () => {
  it('handles month, year and leap-day boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(weekDays('2026-09-27')).toEqual([
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
    ])
  })
  it('round-trips meals, privacy, settings, and dates', () => {
    const state = recordMeal(initialState(day), { ...meal(), visibility: 'anonymous' })
    expect(parseState(JSON.stringify(state))).toEqual(state)
  })
  it('recovers from corrupted, stale, and incomplete storage', () => {
    for (const value of [
      'not JSON',
      '{}',
      'null',
      JSON.stringify({ ...initialState(day), meals: [null] }),
      JSON.stringify({ ...initialState(day), settings: { habit: 'unknown' } }),
    ]) {
      expect(parseState(value).version).toBe(1)
      expect(parseState(value).meals).toHaveLength(6)
    }
  })
})
