import { describe, expect, it } from 'vitest'
import { applyGameCommand } from '../game/commands'
import { commandResponseSchema, gameCommandSchema, feedReceiptSchema } from '../game/contracts'
import { chooseStarter, feed, initialGame, updateMealRecord } from '../game/game'
import { decodeGame } from '../game/stateCodec'
import type { FeedInput } from '../game/types'
import { dailyMealReport, suggestMealItem } from './analysis'
import type { MealRecordInput } from './types'

const today = '2026-09-25'
const mealRecord: MealRecordInput = {
  slot: 'dinner',
  source: 'home',
  items: [suggestMealItem('curry')],
}
const input: FeedInput = { title: '野菜カレー', sample: 'curry', recipeId: 'curry', mealRecord }
const starter = () => chooseStarter(initialGame(today), 'komugi')

describe('real meals and companion feeding', () => {
  it('records one human meal when the same meal is shared with another companion', () => {
    const state = { ...starter(), visitors: ['mame' as const] }
    const first = feed(state, input, { mealId: 'dinner' })
    const shared = feed(
      first,
      {
        title: 'client cannot replace dinner',
        sample: 'rice',
        recipeId: 'egg-rice',
        targetId: 'mame',
        mealRecordId: 'dinner',
      },
      { mealId: 'share' },
    )
    expect(shared.meals).toHaveLength(2)
    expect(shared.mealRecords).toHaveLength(1)
    expect(shared.meals[0]).toMatchObject({
      title: '野菜カレー',
      recipeId: 'curry',
      targetId: 'mame',
      mealRecordId: 'dinner',
    })
    expect(dailyMealReport(shared.mealRecords!, today)).toMatchObject({ score: 70, mealCount: 1 })
    expect(
      feed(
        shared,
        { ...input, mealRecord: undefined, mealRecordId: 'dinner', targetId: 'mame' },
        { mealId: 'repeat' },
      ),
    ).toBe(shared)
    expect(
      feed(
        { ...shared, today: '2026-09-26' },
        { ...input, mealRecord: undefined, mealRecordId: 'dinner', targetId: 'komugi' },
        { mealId: 'old' },
      ).meals,
    ).toHaveLength(2)
    expect(feed(shared, { ...input, mealRecordId: 'missing' }, { mealId: 'missing' })).toBe(shared)
  })

  it('counts new meals from legacy callers as home cooking without changing their rewards', () => {
    const first = feed(starter(), { ...input, mealRecord: undefined }, { mealId: 'dinner' })
    expect(first.mealRecords?.[0]).toMatchObject({ source: 'home', slot: 'unknown' })
    const second = feed(first, input, { mealId: 'second' })
    expect(second.mealRecords).toHaveLength(2)
    expect(dailyMealReport(second.mealRecords!, today).homeMealCount).toBe(2)
    expect(second.companions[0].xp).toBe(75)
    expect(second.meals[0].coins).toBe(0)
  })

  it('edits the diary and recomputes composition while preserving all earned game progress', () => {
    const first = feed(starter(), input, { mealId: 'dinner' })
    expect(
      updateMealRecord(first, 'dinner', { ...mealRecord, title: input.title, day: today }),
    ).toBe(first)
    const changed = updateMealRecord(first, 'dinner', {
      ...mealRecord,
      title: '夕食の記録',
      day: '2026-09-24',
      source: 'prepared',
      items: [{ ...suggestMealItem('onigiri'), groups: ['staple'], groupsConfirmed: true }],
    })
    const { mealRecords: _before, ...gameBefore } = first
    const { mealRecords: _after, ...gameAfter } = changed
    expect(gameAfter).toEqual(gameBefore)
    expect(dailyMealReport(changed.mealRecords!, '2026-09-24').score).toBe(30)
    expect(dailyMealReport(changed.mealRecords!, today).score).toBeNull()
    expect(
      updateMealRecord(first, 'dinner', { ...mealRecord, title: '未来', day: '2026-09-26' }),
    ).toBe(first)
    expect(
      updateMealRecord(first, 'dinner', { ...mealRecord, title: '壊れた日付', day: '2026-02-30' }),
    ).toBe(first)
  })

  it('freezes the receipt report at commit time and roundtrips local/cloud state', () => {
    const result = applyGameCommand(starter(), { type: 'feed', input }, { today, mealId: 'dinner' })
    const original = JSON.stringify(result.receipt)
    expect(result.receipt?.mealReport?.today.score).toBe(70)
    expect(Object.isFrozen(result.receipt?.mealReport?.today.groupCounts)).toBe(true)
    const response = { snapshot: { state: result.state, revision: 1 }, receipt: result.receipt }
    expect(commandResponseSchema.parse(JSON.parse(JSON.stringify(response)))).toEqual(response)
    expect(decodeGame(JSON.parse(JSON.stringify(result.state)), today)).toEqual(result.state)
    result.state.mealRecords![0].items[0].groups.push('protein')
    expect(JSON.stringify(result.receipt)).toBe(original)
  })

  it('keeps legacy meal history without manufacturing nutrition or self-cooking records', () => {
    const old = feed(starter(), { title: '昔のごはん', sample: 'rice' }, { mealId: 'old' })
    delete old.mealRecords
    delete old.meals[0].mealRecordId
    const decoded = decodeGame(JSON.parse(JSON.stringify(old)), today)
    expect(decoded.meals[0].title).toBe('昔のごはん')
    expect(decoded.mealRecords).toBeUndefined()
    expect(dailyMealReport(decoded.mealRecords ?? [], today).score).toBeNull()
    const receipt = applyGameCommand(
      starter(),
      { type: 'feed', input },
      { today, mealId: 'dinner' },
    ).receipt!
    const { mealReport: _report, ...legacyReceipt } = receipt
    expect(feedReceiptSchema.parse(legacyReceipt)).toEqual(legacyReceipt)
  })

  it('validates strict wire commands, rejecting forged rewards and invalid meal structure', () => {
    expect(gameCommandSchema.safeParse({ type: 'feed', input }).success).toBe(true)
    expect(
      gameCommandSchema.safeParse({
        type: 'updateMealRecord',
        id: 'dinner',
        input: { ...mealRecord, day: today, title: '夕食' },
      }).success,
    ).toBe(true)
    expect(
      gameCommandSchema.safeParse({ type: 'feed', input: { ...input, mealRecordId: 'duplicate' } })
        .success,
    ).toBe(false)
    expect(
      gameCommandSchema.safeParse({
        type: 'feed',
        input: { ...input, mealRecord: { ...mealRecord, score: 100 } },
      }).success,
    ).toBe(false)
    expect(
      gameCommandSchema.safeParse({
        type: 'feed',
        input: { ...input, mealRecord: { ...mealRecord, items: [] } },
      }).success,
    ).toBe(false)
    expect(
      gameCommandSchema.safeParse({
        type: 'updateMealRecord',
        id: 'dinner',
        input: { ...mealRecord, day: '2026-02-30', title: '夕食' },
      }).success,
    ).toBe(false)
  })
})
