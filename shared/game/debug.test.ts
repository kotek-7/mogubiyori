import { describe, expect, it } from 'vitest'
import { applyGameCommand } from './commands'
import { gameCommandSchema, gameSnapshotSchema } from './contracts'
import { advanceDebugDays } from './debug'
import { demoGame } from './demo'
import { chooseStarter, initialGame, shiftDay } from './game'
import type { GrowthStage } from './types'

const today = '2026-09-26'
const environment = { today, realToday: today, mealId: 'unused' }

describe('bounded debug commands', () => {
  it('accepts only bounded operations, without caller dates, rewards, state or another user', () => {
    for (const days of [1, 30])
      expect(gameCommandSchema.safeParse({ type: 'debugAdvanceDays', days }).success).toBe(true)
    for (const days of [-1, 0, 1.5, 31, Infinity, '1'])
      expect(gameCommandSchema.safeParse({ type: 'debugAdvanceDays', days }).success).toBe(false)
    for (const stage of [0, 1, 2, 3, 4])
      expect(
        gameCommandSchema.safeParse({ type: 'debugSetGrowth', id: 'komugi', stage }).success,
      ).toBe(true)
    for (const command of [
      { type: 'debugAdvanceDays', days: 1, today: '2099-01-01' },
      { type: 'debugAdvanceDays', days: 1, userId: 'other' },
      { type: 'debugSetGrowth', id: 'komugi', stage: 5 },
      { type: 'debugSetGrowth', id: 'komugi', stage: 1.5 },
      { type: 'debugSetGrowth', id: 'unknown', stage: 1 },
      { type: 'debugSetGrowth', id: 'komugi', stage: 1, xp: 99999 },
      { type: 'debugReset', preset: 'custom', state: initialGame(today) },
    ])
      expect(gameCommandSchema.safeParse(command).success).toBe(false)
    for (const preset of ['seed', 'fresh'])
      expect(gameCommandSchema.safeParse({ type: 'debugReset', preset }).success).toBe(true)
  })

  it('advances both the effective date and persisted offset without granting rewards', () => {
    const before = { ...demoGame(today), dayOffset: 2 }
    const original = structuredClone(before)
    const result = applyGameCommand(before, { type: 'debugAdvanceDays', days: 7 }, environment)
    expect(result).toEqual({
      state: { ...before, today: shiftDay(today, 7), dayOffset: 9 },
      receipt: null,
      changed: true,
    })
    expect(before).toEqual(original)
    for (const days of [0, 31, NaN, 1.5]) expect(advanceDebugDays(before, days)).toBe(before)
  })

  it('sets the selected companion to each existing growth threshold without meal rewards', () => {
    const before = demoGame(today)
    for (const [stage, xp] of [0, 120, 300, 600, 1050].entries()) {
      const result = applyGameCommand(
        before,
        { type: 'debugSetGrowth', id: 'komugi', stage: stage as GrowthStage },
        environment,
      )
      expect(result.state).toEqual({
        ...before,
        xp,
        companions: [{ ...before.companions[0], xp }],
      })
      expect(result.receipt).toBeNull()
    }
    expect(before.companions[0].xp).toBe(270)
  })

  it('updates an inactive joined companion without changing the active XP or recruiting visitors', () => {
    const before = {
      ...demoGame(today),
      companions: [
        ...demoGame(today).companions,
        { id: 'mame' as const, xp: 15, joinedDay: today },
      ],
      visitors: ['shizuku' as const],
    }
    const result = applyGameCommand(
      before,
      { type: 'debugSetGrowth', id: 'mame', stage: 4 },
      environment,
    )
    expect(result.state.xp).toBe(270)
    expect(result.state.activeId).toBe('komugi')
    expect(result.state.companions[1].xp).toBe(1050)
    expect(result.state.visitors).toEqual(['shizuku'])
    expect(
      applyGameCommand(before, { type: 'debugSetGrowth', id: 'shizuku', stage: 4 }, environment),
    ).toEqual({ state: before, receipt: null, changed: false })
  })

  it.each(['seed', 'fresh'] as const)(
    'resets the %s preset to the real day and preserves membership',
    (preset) => {
      const before = {
        ...chooseStarter(initialGame(shiftDay(today, 7)), 'mame'),
        dayOffset: 7,
        subscriptionPlan: 'premium' as const,
      }
      const result = applyGameCommand(
        before,
        { type: 'debugReset', preset },
        { ...environment, today: before.today },
      )
      expect(result.state).toEqual({
        ...(preset === 'seed' ? demoGame(today) : initialGame(today)),
        subscriptionPlan: 'premium',
      })
      expect(result.receipt).toBeNull()
      const reset = applyGameCommand(
        before,
        { type: 'resetProgress' },
        { ...environment, today: before.today },
      )
      expect(reset.state.today).toBe(today)
      expect(reset.state.dayOffset).toBe(0)
    },
  )

  it('keeps snapshot capability optional and validates explicit values', () => {
    const snapshot = { state: initialGame(today), revision: 0 }
    expect(gameSnapshotSchema.parse(snapshot)).toEqual(snapshot)
    expect(gameSnapshotSchema.parse({ ...snapshot, debugEnabled: true }).debugEnabled).toBe(true)
    expect(gameSnapshotSchema.parse({ ...snapshot, debugEnabled: false }).debugEnabled).toBe(false)
    expect(gameSnapshotSchema.safeParse({ ...snapshot, debugEnabled: 'true' }).success).toBe(false)
  })
})
