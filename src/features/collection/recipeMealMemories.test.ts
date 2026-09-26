import { describe, expect, it } from 'vitest'
import type { GameMeal } from '../../../shared/game/types'
import { suggestMealItem } from '../../../shared/meals/analysis'
import type { MealRecord } from '../../../shared/meals/types'
import { recipeMealMemories } from './recipeMealMemories'

const day = '2026-09-26'
const record = (id: string, recipeId = 'curry', changes: Partial<MealRecord> = {}): MealRecord => ({
  id,
  day,
  title: 'カレーの記録',
  slot: 'dinner',
  source: 'home',
  items: [suggestMealItem(recipeId)],
  ...changes,
})
const meal = (id: string, changes: Partial<GameMeal> = {}): GameMeal => ({
  id,
  day,
  title: 'カレー',
  sample: 'curry',
  recipeId: 'curry',
  xp: 30,
  coins: 0,
  ...changes,
})

describe('recipe meal memories', () => {
  it('shows one memory for a meal shared with multiple companions and prefers a photo preview', () => {
    const dinner = record('dinner')
    const original = meal('original', { mealRecordId: dinner.id, photoId: 'photo-1' })
    const shared = meal('shared', { mealRecordId: dinner.id, targetId: 'mame' })

    expect(
      recipeMealMemories({ mealRecords: [dinner], meals: [shared, original] }, 'curry'),
    ).toEqual([{ key: 'record:dinner', day, title: dinner.title, record: dinner, meal: original }])
  })

  it('uses current edited dishes, title and day instead of the original feeding snapshot', () => {
    const edited = record('dinner', 'onigiri', { day: '2026-09-24', title: 'おにぎり弁当' })
    const original = meal('original', { mealRecordId: edited.id })
    const state = { mealRecords: [edited], meals: [original] }

    expect(recipeMealMemories(state, 'curry')).toEqual([])
    expect(recipeMealMemories(state, 'onigiri')).toEqual([
      {
        key: 'record:dinner',
        day: edited.day,
        title: edited.title,
        record: edited,
        meal: original,
      },
    ])
  })

  it('matches secondary dishes and keeps a record without a linked feeding', () => {
    const dinner = record('dinner', 'onigiri', {
      items: [suggestMealItem('onigiri'), suggestMealItem('miso-soup')],
    })

    expect(recipeMealMemories({ mealRecords: [dinner], meals: [] }, 'miso-soup')).toEqual([
      { key: 'record:dinner', day, title: dinner.title, record: dinner, meal: undefined },
    ])
  })

  it('retains old saves without meal records and ignores unrelated recipes', () => {
    const legacy = meal('legacy', { photo: 'data:image/png;base64,photo' })
    const unrelated = meal('other', { recipeId: 'onigiri' })

    expect(recipeMealMemories({ meals: [unrelated, legacy] }, 'curry')).toEqual([
      { key: 'meal:legacy', day, title: legacy.title, meal: legacy },
    ])
  })

  it('falls back to a feeding when its referenced diary record is missing', () => {
    const orphan = meal('orphan', { mealRecordId: 'missing' })

    expect(recipeMealMemories({ mealRecords: [], meals: [orphan] }, 'curry')).toEqual([
      { key: 'meal:orphan', day, title: orphan.title, meal: orphan },
    ])
  })

  it('sorts edited and legacy dates newest first while preserving the order of equal dates', () => {
    const older = record('older', 'curry', { day: '2026-09-23' })
    const first = record('first')
    const second = record('second')
    const legacy = meal('legacy', { day: '2026-09-25' })
    const state = { mealRecords: [older, first, second], meals: [legacy] }

    expect(recipeMealMemories(state, 'curry').map((memory) => memory.key)).toEqual([
      'record:first',
      'record:second',
      'meal:legacy',
      'record:older',
    ])
    expect(state.mealRecords).toEqual([older, first, second])
  })

  it('uses a local photo or the first linked feeding when there is no uploaded photo', () => {
    const dinner = record('dinner')
    const first = meal('first', { mealRecordId: dinner.id })
    const withPhoto = meal('second', {
      mealRecordId: dinner.id,
      photo: 'data:image/png;base64,photo',
    })

    expect(
      recipeMealMemories({ mealRecords: [dinner], meals: [first, withPhoto] }, 'curry')[0].meal,
    ).toBe(withPhoto)
    expect(recipeMealMemories({ mealRecords: [dinner], meals: [first] }, 'curry')[0].meal).toBe(
      first,
    )
  })
})
