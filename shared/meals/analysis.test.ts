import { describe, expect, it } from 'vitest'
import { genericDishById } from '../content/dishes'
import { dailyMealReport, suggestMealItem, weekMealReports } from './analysis'
import type { MealItem, MealRecord } from './types'

const today = '2026-09-25'
const item = (groups: MealItem['groups'], groupsConfirmed = true): MealItem => ({
  name: 'ごはん',
  groups,
  groupsConfirmed,
  portion: 'regular',
})
const record = (items: MealItem[], extra: Partial<MealRecord> = {}): MealRecord => ({
  id: 'meal',
  day: today,
  title: 'ごはん',
  slot: 'dinner',
  source: 'home',
  items,
  ...extra,
})

describe('meal composition reports', () => {
  it('suggests groups from ingredients and known dish identities instead of illustration kinds', () => {
    expect(suggestMealItem('generic-salad').groups).toEqual(['vegetable'])
    expect(suggestMealItem('generic-grilled-fish').groups).toEqual(['protein'])
    // This registered curry has vegetables and rice, but no meat or beans.
    expect(suggestMealItem('curry').groups).toEqual(['staple', 'vegetable'])
    expect(suggestMealItem('egg-rice').groups).toEqual(['staple', 'protein'])
    expect(suggestMealItem('unknown', 'なにか').groups).toEqual([])
    expect(suggestMealItem('generic-salad').groupsConfirmed).toBe(false)
  })

  it('distinguishes whole fruit from chicken thigh names and excludes spices and jam', () => {
    expect(suggestMealItem('r-chicken-teriyaki').groups).toEqual(['protein', 'vegetable'])
    expect(suggestMealItem('r-banana-peanut-toast').groups).toContain('fruit')
    expect(suggestMealItem('r-spiced-roasted-chickpeas').groups).toEqual(['protein'])
    expect(suggestMealItem('r-vanilla-milk-pudding').groups).not.toContain('fruit')
  })

  it('uses named foods in the expanded choices and leaves unspecified ingredients unconfirmed', () => {
    expect(suggestMealItem('generic-oyakodon').groups).toEqual(['staple', 'protein'])
    expect(suggestMealItem('generic-vegetable-stir-fry').groups).toEqual(['vegetable'])
    expect(suggestMealItem('generic-banana').groups).toEqual(['fruit'])
    expect(suggestMealItem('generic-yogurt').groups).toEqual(['dairy'])
    for (const id of ['generic-tempura', 'generic-hotpot', 'generic-cake', 'generic-gyoza']) {
      expect(suggestMealItem(id)).toMatchObject({
        dishId: id,
        groups: [],
        groupsConfirmed: false,
        portion: 'unknown',
      })
    }
  })

  it('recognizes the named rice and pasta in international recipes without treating rice vinegar as a staple', () => {
    expect(suggestMealItem('r-chicken-biryani').groups).toContain('staple')
    expect(suggestMealItem('r-bolognese-tagliatelle').groups).toContain('staple')
    expect(suggestMealItem('r-kohaku-namasu').groups).not.toContain('staple')
  })

  it('lets people edit food groups without mutating future suggestions', () => {
    const item = suggestMealItem('generic-oyakodon')
    item.groups.push('vegetable')
    expect(genericDishById('generic-oyakodon')?.suggestedGroups).toEqual(['staple', 'protein'])
    expect(suggestMealItem('generic-oyakodon').groups).toEqual(['staple', 'protein'])
  })

  it('counts each food group once per real meal and does not add repeated plates to the score', () => {
    const dinner = record([item(['staple', 'protein']), item(['vegetable']), item(['vegetable'])])
    expect(dailyMealReport([dinner], today)).toEqual({
      day: today,
      score: 100,
      mealCount: 1,
      scoredMealCount: 1,
      homeMealCount: 1,
      groupCounts: { staple: 1, protein: 1, vegetable: 1, fruit: 0, dairy: 0 },
    })
    const lunch = record([item(['staple'])], { id: 'lunch', slot: 'lunch', source: 'restaurant' })
    expect(dailyMealReport([lunch, dinner], today)).toMatchObject({
      score: 65,
      mealCount: 2,
      homeMealCount: 1,
    })
  })

  it('keeps unknown meals unscored, allows explicitly confirmed empty groups, and excludes snacks', () => {
    expect(dailyMealReport([record([item([], false)])], today)).toMatchObject({
      score: null,
      scoredMealCount: 0,
      mealCount: 1,
    })
    expect(dailyMealReport([record([item([])])], today).score).toBe(0)
    expect(
      dailyMealReport([record([item(['fruit', 'dairy'])], { slot: 'snack' })], today),
    ).toMatchObject({
      score: null,
      scoredMealCount: 0,
      groupCounts: { fruit: 1, dairy: 1 },
    })
  })

  it('returns seven calendar days across month boundaries, leaving unrecorded days null', () => {
    const reports = weekMealReports(
      [record([item(['staple'])], { day: '2026-10-01' })],
      '2026-10-02',
    )
    expect(reports.map((day) => day.day)).toEqual([
      '2026-09-26',
      '2026-09-27',
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
    ])
    expect(reports.map((day) => day.score)).toEqual([null, null, null, null, null, 30, null])
  })
})
