import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addDemoGems,
  advanceGame,
  equipItem,
  fedToday,
  feed,
  hungerOf,
  initialGame,
  levelOf,
  purchaseItem,
  restGame,
  shiftDay,
  streakOf,
} from '../src/game'
import { GAME_STORAGE_KEY, loadGame, parseGame, saveGame } from '../src/gameStorage'

const date = '2026-09-24'
const meal = { title: 'たまごごはん', sample: 'rice' }
afterEach(() => vi.unstubAllGlobals())

describe('daily cooking and growth', () => {
  it('starts with six days and crosses the next growth level after a meal', () => {
    const before = initialGame(date)
    const after = feed(before, meal)
    expect(streakOf(before)).toBe(6)
    expect(levelOf(before)).toEqual({ level: 3, progress: 60, needed: 100 })
    expect(hungerOf(before)).toBe(28)
    expect(after.coins).toBe(150)
    expect(levelOf(after)).toEqual({ level: 4, progress: 5, needed: 100 })
    expect(streakOf(after)).toBe(7)
    expect(hungerOf(after)).toBe(96)
    expect(fedToday(after)).toBe(true)
    expect(after.owned).toContain('sprout')
    expect(after.equipped.hat).toBe('none')
    expect(before.meals).toHaveLength(6)
    expect(before.owned).not.toContain('sprout')
  })

  it('allows extra meals without farming rewards or duplicating milestones', () => {
    const first = feed(initialGame(date), meal)
    const second = feed(first, { title: '夜のスープ', sample: 'soup' })
    expect(second.meals).toHaveLength(8)
    expect(second.xp).toBe(first.xp)
    expect(second.coins).toBe(first.coins)
    expect(second.meals[0].xp).toBe(0)
    expect(second.meals[0].coins).toBe(0)
    expect(second.meals[0].id).not.toBe(second.meals[1].id)
    expect(streakOf(second)).toBe(7)
    expect(second.owned.filter((id) => id === 'sprout')).toHaveLength(1)
  })

  it('keeps a grace day, then breaks the streak and leaves the pet hungry', () => {
    const fed = feed(initialGame(date), meal)
    const tomorrow = advanceGame(fed)
    expect(tomorrow.dayOffset).toBe(1)
    expect(streakOf(tomorrow)).toBe(7)
    expect(fedToday(tomorrow)).toBe(false)
    expect(hungerOf(tomorrow)).toBe(28)
    const missed = advanceGame(tomorrow)
    expect(streakOf(missed)).toBe(0)
    expect(hungerOf(missed)).toBe(8)
    expect(hungerOf(advanceGame(missed, 100))).toBe(8)
    expect(streakOf(feed(missed, meal))).toBe(1)
  })

  it('starts fresh without claiming an unearned streak', () => {
    const fresh = initialGame(date, true)
    expect(streakOf(fresh)).toBe(0)
    expect(levelOf(fresh).level).toBe(1)
    expect(fresh.meals).toEqual([])
    expect(feed(fresh, { ...meal, title: '  ' }).meals[0].title).toBe('今日のごはん')
    expect(streakOf(feed(fresh, meal))).toBe(1)
  })

  it('keeps an unfed new companion equally hungry on real and simulated days', () => {
    const fresh = initialGame(date, true)
    const realTomorrow = parseGame(JSON.stringify(fresh), shiftDay(date, 1))
    const simulatedTomorrow = advanceGame(fresh)
    expect(realTomorrow.today).toBe(simulatedTomorrow.today)
    expect(realTomorrow.dayOffset).toBe(0)
    expect(simulatedTomorrow.dayOffset).toBe(1)
    expect(hungerOf(fresh)).toBe(8)
    expect(hungerOf(realTomorrow)).toBe(8)
    expect(hungerOf(simulatedTomorrow)).toBe(8)
    expect(hungerOf(feed(realTomorrow, meal))).toBe(96)
    expect(hungerOf(feed(simulatedTomorrow, meal))).toBe(96)
  })

  it('works on LAN HTTP where randomUUID is unavailable', () => {
    const getRandomValues = vi.fn((array: Uint32Array) => array.fill(42))
    vi.stubGlobal('crypto', { getRandomValues })
    const first = feed(initialGame(date, true), meal)
    const second = feed(first, meal)
    expect(getRandomValues).toHaveBeenCalledTimes(2)
    expect(new Set(second.meals.map((entry) => entry.id)).size).toBe(2)
    vi.stubGlobal('crypto', undefined)
    expect(feed(second, meal).meals).toHaveLength(3)
  })
})

describe('rest tickets', () => {
  it('protects a streak without feeding or earning a cooking day', () => {
    const initial = initialGame(date)
    const rested = restGame(initial)
    expect(rested.tickets).toBe(1)
    expect(fedToday(rested)).toBe(false)
    expect(hungerOf(rested)).toBe(hungerOf(initial))
    expect(streakOf(rested)).toBe(6)
    expect(restGame(rested)).toBe(rested)
    const tomorrow = advanceGame(rested)
    expect(streakOf(tomorrow)).toBe(6)
    expect(streakOf(feed(tomorrow, meal))).toBe(7)
    expect(hungerOf(tomorrow)).toBe(8)
  })

  it('refunds a ticket when cooking later the same day, exactly once', () => {
    const rested = restGame(initialGame(date))
    const fed = feed(rested, meal)
    expect(fed.tickets).toBe(2)
    expect(fed.rests).toEqual([])
    expect(feed(fed, meal).tickets).toBe(2)
    expect(restGame(fed)).toBe(fed)
    const empty = { ...initialGame(date), tickets: 0 }
    expect(restGame(empty)).toBe(empty)
  })
})

describe('cosmetic shop', () => {
  it('purchases and equips only once, without mutating the old state', () => {
    const original = initialGame(date)
    const bought = purchaseItem(original, 'sprout')
    expect(bought.coins).toBe(0)
    expect(bought.owned).toContain('sprout')
    expect(bought.equipped.hat).toBe('sprout')
    expect(original.coins).toBe(120)
    expect(original.equipped.hat).toBe('none')
    expect(purchaseItem(bought, 'sprout')).toBe(bought)
    expect(equipItem(bought, 'none').equipped.hat).toBe('none')
    expect(feed(bought, meal).owned.filter((id) => id === 'sprout')).toHaveLength(1)
  })

  it('rejects unknown, unowned and unaffordable items', () => {
    const state = initialGame(date)
    expect(purchaseItem(state, 'missing')).toBe(state)
    expect(purchaseItem(state, 'beret')).toBe(state)
    expect(purchaseItem(state, 'chef')).toBe(state)
    expect(equipItem(state, 'chef')).toBe(state)
    expect(equipItem(state, 'missing')).toBe(state)
  })

  it('uses gems only for premium cosmetics and never feeds the pet', () => {
    const state = initialGame(date)
    const topped = addDemoGems(state)
    const bought = purchaseItem(topped, 'garden')
    expect(topped.gems).toBe(210)
    expect(state.gems).toBe(60)
    expect(bought.gems).toBe(110)
    expect(bought.coins).toBe(120)
    expect(bought.equipped.room).toBe('garden')
    expect(hungerOf(bought)).toBe(28)
    expect(streakOf(bought)).toBe(6)
    expect(bought.xp).toBe(260)
  })
})

describe('calendar and persistence', () => {
  it('handles month boundaries and rejects invalid demo increments', () => {
    expect(shiftDay('2028-02-28', 1)).toBe('2028-02-29')
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01')
    const state = initialGame(date)
    for (const days of [-1, 0, 1.5, NaN, Infinity]) expect(advanceGame(state, days)).toBe(state)
  })

  it('rolls to the real day while retaining the selected demo offset', () => {
    const state = advanceGame(feed(initialGame(date), meal), 2)
    const parsed = parseGame(JSON.stringify(state), '2026-09-25')
    expect(parsed.today).toBe('2026-09-27')
    expect(parsed.dayOffset).toBe(2)
    expect(parsed.meals).toEqual(state.meals)
    expect(parsed.owned).toEqual(state.owned)
    expect(streakOf(parsed)).toBe(0)
    expect(hungerOf(parsed)).toBe(8)
  })

  it('roundtrips a photo and falls back on malformed fields', () => {
    const state = feed(initialGame(date), { ...meal, photo: 'data:image/jpeg;base64,YWJjZA==' })
    expect(parseGame(JSON.stringify(state), date)).toEqual(state)
    const corrupt = [
      null,
      '{oops',
      '[]',
      'null',
      ...[
        { version: 2 },
        { today: '2026-02-31' },
        { dayOffset: -1 },
        { xp: -1 },
        { coins: 0.5 },
        { gems: '60' },
        { name: '' },
        { reminder: 'pushy' },
        { tickets: -1 },
        { owned: ['none', 'plain', 'unknown'] },
        { owned: ['none', 'plain', 'none'] },
        { rests: ['no-date'] },
        { equipped: { hat: 'chef', room: 'plain' } },
        { equipped: { hat: 'plain', room: 'none' } },
        { meals: [{ ...state.meals[0], photo: 'https://example.com/photo.jpg' }] },
        { meals: [{ ...state.meals[0], sample: null }] },
        { meals: [state.meals[0], state.meals[0]] },
      ].map((patch) => JSON.stringify({ ...state, ...patch })),
    ]
    for (const raw of corrupt) expect(parseGame(raw, date)).toEqual(initialGame(date))
  })

  it('uses its own storage key and reports a failed save', () => {
    const values = new Map([['hitosaji-demo-v1', 'previous-product-data']])
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value)
      },
    }
    vi.stubGlobal('localStorage', storage)
    const state = initialGame()
    expect(saveGame(state)).toBe(true)
    expect(values.has(GAME_STORAGE_KEY)).toBe(true)
    expect(values.get('hitosaji-demo-v1')).toBe('previous-product-data')
    expect(loadGame()).toEqual(state)
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('quota')
      },
    })
    expect(saveGame(state)).toBe(false)
    expect(loadGame().version).toBe(1)
  })
})
