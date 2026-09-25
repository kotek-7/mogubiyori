import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyGameCommand } from './commands'
import { commandRequestSchema, commandResponseSchema, gameCommandSchema } from './contracts'
import { demoGame } from './demo'
import { chooseStarter, initialGame, restGame, shiftDay } from './game'
import { createFeedReceipt } from './receipt'
import { decodeGame, InvalidSavedGameError } from './stateCodec'

const today = '2026-09-25'
const environment = { today, mealId: 'meal-fixed' }
const command = {
  type: 'feed',
  input: { title: 'カレー', sample: 'curry', recipeId: 'curry' },
} as const
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('explicit game commands', () => {
  it('resets all progress to the supplied day and restarts companion selection without mutating the old save', () => {
    const before = demoGame('2026-09-24')
    const original = structuredClone(before)
    const result = applyGameCommand(before, { type: 'resetProgress' }, environment)
    expect(result).toEqual({ state: initialGame(today), receipt: null, changed: true })
    expect(before).toEqual(original)
    expect(gameCommandSchema.parse({ type: 'resetProgress' })).toEqual({ type: 'resetProgress' })
    for (const extra of [{ preset: 'seed' }, { userId: 'another-user' }, { today: '2099-01-01' }])
      expect(gameCommandSchema.safeParse({ type: 'resetProgress', ...extra }).success).toBe(false)
  })

  it('uses only the provided day and meal ID, without browser clock or randomness', () => {
    const before = demoGame(today)
    const original = JSON.stringify(before)
    vi.stubGlobal('crypto', {
      getRandomValues: () => {
        throw new Error('Unexpected random call')
      },
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'))
    const first = applyGameCommand(before, command, environment)
    vi.setSystemTime(new Date('2040-01-01T00:00:00Z'))
    const second = applyGameCommand(before, command, environment)
    expect(first).toEqual(second)
    expect(first.state.meals[0]).toMatchObject({ id: 'meal-fixed', day: today })
    expect(JSON.stringify(before)).toBe(original)
    expect(applyGameCommand(first.state, command, environment)).toEqual({
      state: first.state,
      receipt: null,
      changed: false,
    })
  })

  it('awards daily rewards using the adapter day and does not repeat them on another meal', () => {
    const tomorrow = shiftDay(today, 1)
    const state = demoGame(today)
    const login = applyGameCommand(
      state,
      { type: 'claimLogin' },
      { ...environment, today: tomorrow },
    )
    expect(login.state.today).toBe(tomorrow)
    expect(login.state.claimedLoginDays).toEqual([tomorrow])
    const duplicate = applyGameCommand(
      login.state,
      { type: 'claimLogin' },
      { ...environment, today: tomorrow },
    )
    expect(duplicate.changed).toBe(false)
    const first = applyGameCommand(login.state, command, { ...environment, today: tomorrow })
    const second = applyGameCommand(first.state, command, {
      today: tomorrow,
      mealId: 'meal-second',
    })
    expect(first.receipt?.meal.coins).toBe(100)
    expect(second.receipt?.meal.coins).toBe(0)
  })

  it('keeps rejected operations unchanged and advances the guide after a successful meal', () => {
    const fresh = initialGame(today)
    expect(applyGameCommand(fresh, command, environment)).toEqual({
      state: fresh,
      receipt: null,
      changed: false,
    })
    const starter = applyGameCommand(
      fresh,
      { type: 'chooseStarter', id: 'mame' },
      environment,
    ).state
    const guided = applyGameCommand(
      starter,
      {
        type: 'tutorial',
        input: { step: 4, status: 'completed', homeGuide: 'meal' },
      },
      environment,
    ).state
    const fed = applyGameCommand(guided, command, environment)
    expect(fed.state.tutorial.homeGuide).toBe('growth')
    const settings = applyGameCommand(
      fed.state,
      {
        type: 'updateSettings',
        input: { name: '  まめちゃん  ', reminder: 'gentle' },
      },
      environment,
    )
    expect(settings.state.name).toBe('まめちゃん')
    expect(settings.state.reminder).toBe('gentle')
    expect(settings.receipt).toBeNull()
    expect(
      applyGameCommand(settings.state, { type: 'purchase', id: 'missing' }, environment).changed,
    ).toBe(false)
  })
})

describe('committed feed receipts', () => {
  it('captures one operation without saved photos, complete snapshots, or shared mutable state', () => {
    const state = demoGame(today)
    const result = applyGameCommand(
      state,
      {
        ...command,
        input: {
          ...command.input,
          photo: 'data:image/jpeg;base64,YWJjZA==',
          photoId: '93e407eb-37a4-4df2-9c09-35cc5d0f634b',
        },
      },
      environment,
    )
    const receipt = result.receipt!
    expect(receipt).toMatchObject({
      kind: 'feed',
      target: { id: 'komugi', name: 'こむぎ', beforeXp: 270, afterXp: 315, joined: false },
      meal: {
        id: 'meal-fixed',
        xp: 45,
        coins: 200,
        photoId: '93e407eb-37a4-4df2-9c09-35cc5d0f634b',
      },
      newCards: ['curry'],
      newVisitors: ['mame', 'shizuku', 'yuzu'],
      newItems: ['sprout'],
      streak: { beforeDays: 6, afterDays: 7, bonus: 100 },
    })
    expect(receipt.meal).not.toHaveProperty('photo')
    expect(receipt).not.toHaveProperty('before')
    expect(receipt).not.toHaveProperty('after')
    const encoded = JSON.stringify(receipt)
    result.state.meals[0].title = 'Later edit'
    result.state.equipped.hat = 'chef'
    result.state.companions[0].xp = 999
    expect(JSON.stringify(receipt)).toBe(encoded)
    expect(Object.isFrozen(receipt)).toBe(true)
    expect(Object.isFrozen(receipt.target)).toBe(true)
    expect(Object.isFrozen(receipt.newVisitors)).toBe(true)
    // A bounded seven-day aggregate is included, never the full diary or photos.
    expect(JSON.stringify(receipt).length).toBeLessThan(3000)
  })

  it('reports the fed visitor rather than the previously active companion', () => {
    const ready = applyGameCommand(demoGame(today), command, environment).state
    const result = applyGameCommand(
      ready,
      {
        type: 'feed',
        input: { ...command.input, targetId: 'mame' },
      },
      { today, mealId: 'meal-visitor' },
    )
    expect(result.receipt?.target).toMatchObject({
      id: 'mame',
      beforeXp: 0,
      afterXp: 45,
      joined: true,
    })
    expect(result.receipt?.newCards).toEqual([])
    expect(createFeedReceipt(ready, ready)).toBeNull()
  })

  it('records non-bonus cooking progress and excludes protected rest days', () => {
    const starter = chooseStarter(initialGame(today), 'komugi')
    const first = applyGameCommand(starter, command, environment)
    expect(first.receipt?.streak).toEqual({ beforeDays: 0, afterDays: 1, bonus: 0 })
    const tomorrow = shiftDay(today, 1)
    const rested = restGame({ ...first.state, today: tomorrow })
    const dayAfter = shiftDay(tomorrow, 1)
    const next = applyGameCommand(rested, command, { today: dayAfter, mealId: 'meal-after-rest' })
    expect(next.receipt?.streak).toEqual({ beforeDays: 1, afterDays: 2, bonus: 0 })
  })
})

describe('transport and saved-data boundaries', () => {
  it('accepts commands with photo references, rejecting client rewards, dates, local photos and demo controls', () => {
    const request = { operationId: '489f6941-d2d9-4747-8af5-ea9ad39e1982', command }
    expect(commandRequestSchema.parse(request)).toEqual(request)
    expect(
      gameCommandSchema.safeParse({
        ...command,
        input: { ...command.input, photoId: '93e407eb-37a4-4df2-9c09-35cc5d0f634b' },
      }).success,
    ).toBe(true)
    for (const input of [
      { ...command.input, xp: 999 },
      { ...command.input, coins: 999 },
      { ...command.input, photo: 'data:image/jpeg;base64,YWJjZA==' },
      { ...command.input, photoId: 'not-a-photo-id' },
    ])
      expect(gameCommandSchema.safeParse({ ...command, input }).success).toBe(false)
    expect(gameCommandSchema.safeParse({ ...command, today: '2099-01-01' }).success).toBe(false)
    expect(gameCommandSchema.safeParse({ type: 'addDemoGems' }).success).toBe(false)
    expect(gameCommandSchema.safeParse({ type: 'advanceGame' }).success).toBe(false)
  })

  it('validates a response and roundtrips cloud photo IDs without converting decode errors to new games', () => {
    const result = applyGameCommand(
      demoGame(today),
      {
        ...command,
        input: { ...command.input, photoId: '93e407eb-37a4-4df2-9c09-35cc5d0f634b' },
      },
      environment,
    )
    const response = { snapshot: { state: result.state, revision: 3 }, receipt: result.receipt }
    expect(commandResponseSchema.parse(JSON.parse(JSON.stringify(response)))).toEqual(response)
    expect(decodeGame(JSON.parse(JSON.stringify(result.state)), today)).toEqual(result.state)
    expect(() => decodeGame({ error: 'network_failure' }, today)).toThrow(InvalidSavedGameError)
    expect(() => decodeGame(null, today)).toThrow(InvalidSavedGameError)
    expect(
      commandResponseSchema.safeParse({
        ...response,
        snapshot: { state: result.state, revision: -1 },
      }).success,
    ).toBe(false)
  })
})
