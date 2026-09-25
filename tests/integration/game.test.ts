import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  activeCompanion,
  addDemoGems,
  claimLogin,
  chooseStarter,
  demoGame,
  growthProgress,
  growthStages,
  mealXp,
  recipes,
  selectCompanion,
  stageOf,
  stageName,
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
} from '../../src/app/game/browserGame'
import { GAME_STORAGE_KEY, loadGame, parseGame, saveGame } from '../../src/app/game/gameStorage'

const date = '2026-09-24'
const meal = { title: 'たまごごはん', sample: 'rice' }
const premium = (state: ReturnType<typeof initialGame>) => ({
  ...state,
  subscriptionPlan: 'premium' as const,
})
afterEach(() => vi.unstubAllGlobals())

describe('companions and recipe cards', () => {
  it('starts at selection and allows exactly one of three starters', () => {
    const initial = initialGame(date)
    expect(initial.activeId).toBe(null)
    expect(initial.companions).toEqual([])
    expect(initial.meals).toEqual([])
    expect(feed(initial, meal)).toBe(initial)
    expect(chooseStarter(initial, 'yuzu')).toBe(initial)
    for (const id of ['komugi', 'mame', 'shizuku'] as const) {
      const selected = chooseStarter(initial, id)
      expect(selected.activeId).toBe(id)
      expect(activeCompanion(selected)?.xp).toBe(0)
      expect(chooseStarter(selected, 'mame')).toBe(selected)
    }
    expect(initial.companions).toEqual([])
  })

  it('keeps the first two meals in the newborn stage and first grows on meal three', () => {
    const selected = chooseStarter(premium(initialGame(date)), 'mame')
    const first = feed(selected, { ...meal, recipeId: 'egg-rice' })
    const second = feed(first, { ...meal, recipeId: 'curry' })
    const third = feed(second, { ...meal, recipeId: 'onigiri' })
    expect([first.xp, second.xp, third.xp]).toEqual([45, 90, 135])
    expect([first, second, third].map((state) => stageOf(state.xp))).toEqual([0, 0, 1])
    expect(third.visitors).toEqual([])
    expect(selected.xp).toBe(0)
  })

  it('opens visits at the playful stage and keeps them available through the final stage', () => {
    const selected = chooseStarter(initialGame(date), 'mame')
    for (const beforeXp of [254, 255, 600, 1050]) {
      const before = {
        ...selected,
        xp: beforeXp,
        companions: [{ ...selected.companions[0], xp: beforeXp }],
      }
      const after = feed(before, meal)
      expect(after.visitors).toEqual(beforeXp === 254 ? [] : ['komugi', 'shizuku', 'yuzu'])
      expect(after.visitors).not.toContain('mame')
      expect(new Set(after.visitors).size).toBe(after.visitors.length)
    }
  })

  it('recruits visitors by feeding and keeps every companion growth independent', () => {
    const adult = feed(premium(demoGame(date)), meal)
    expect(adult.visitors).toEqual(['mame', 'shizuku', 'yuzu'])
    expect(selectCompanion(adult, 'mame')).toBe(adult)
    const joined = feed(adult, { ...meal, recipeId: 'curry', targetId: 'mame' })
    expect(joined.activeId).toBe('mame')
    expect(joined.name).toBe('まめ')
    expect(joined.xp).toBe(45)
    expect(joined.companions.map((companion) => [companion.id, companion.xp])).toEqual([
      ['komugi', 315],
      ['mame', 45],
    ])
    expect(joined.visitors).toEqual(['shizuku', 'yuzu', 'momo'])
    expect(joined.visitors).not.toContain('mame')
    expect(selectCompanion(joined, 'komugi').xp).toBe(315)
    expect(stageOf(joined.xp)).toBe(0)
    expect(stageOf(selectCompanion(joined, 'komugi').xp)).toBe(2)
    expect(selectCompanion(joined, 'komugi').name).toBe('こむぎ')
    expect(adult.companions).toHaveLength(1)
    expect(feed(adult, { ...meal, targetId: 'goma' })).toBe(adult)
  })

  it('reduces repeated recipes for the same recipient and resets after variety', () => {
    const start = premium(demoGame(date))
    const curry = { ...meal, recipeId: 'curry' }
    expect(mealXp(start, 'curry')).toBe(45)
    const first = feed(start, curry)
    expect(mealXp(first, 'curry')).toBe(30)
    const second = feed(first, curry)
    expect(mealXp(second, 'curry')).toBe(15)
    const third = feed(second, curry)
    expect(mealXp(third, 'curry')).toBe(15)
    const varied = feed(third, { ...meal, recipeId: 'egg-rice' })
    expect(mealXp(varied, 'curry')).toBe(45)
    const guest = feed(varied, { ...curry, targetId: 'mame' })
    expect(mealXp(guest, 'curry', 'mame')).toBe(30)
    expect(mealXp(guest, 'curry', 'komugi')).toBe(45)
    expect(mealXp(guest, undefined, 'mame')).toBe(45)
  })

  it('awards one card and rarity bonus, without rewarding the same card again', () => {
    const start = chooseStarter(premium(initialGame(date)), 'shizuku')
    const first = feed(start, { ...meal, recipeId: 'curry' })
    expect(first.cards).toEqual(['curry'])
    expect(first.meals[0].cardBonus).toBe(70)
    expect(first.meals[0].coins).toBe(100)
    expect(first.coins).toBe(220)
    const repeat = feed(first, { ...meal, recipeId: 'curry' })
    expect(repeat.coins).toBe(220)
    expect(repeat.meals[0].cardBonus).toBe(0)
    expect(repeat.cards).toEqual(['curry'])
    const common = feed(repeat, { ...meal, recipeId: 'egg-rice' })
    expect(common.meals[0].coins).toBe(20)
    expect(common.cards).toEqual(['curry', 'egg-rice'])
    expect(feed(common, { ...meal, recipeId: 'unknown' }).cards).toEqual(common.cards)
    expect(recipes).toHaveLength(310)
    expect(new Set(recipes.map((recipe) => recipe.id)).size).toBe(recipes.length)
  })

  it('tracks hunger per companion while daily cooking remains shared', () => {
    const adult = feed(premium(demoGame(date)), meal)
    const tomorrow = advanceGame(adult)
    const joined = feed(tomorrow, { ...meal, targetId: 'mame' })
    expect(hungerOf(joined)).toBe(96)
    expect(hungerOf(selectCompanion(joined, 'komugi'))).toBe(28)
    expect(fedToday(selectCompanion(joined, 'komugi'))).toBe(true)
    expect(feed(selectCompanion(joined, 'komugi'), meal).meals[0].coins).toBe(0)
  })
})

describe('login and streak bonuses', () => {
  it('awards login coins once per day across reload and date advancement', () => {
    const initial = initialGame(date)
    expect(claimLogin(initial)).toBe(initial)
    const selected = chooseStarter(initial, 'komugi')
    const claimed = claimLogin(selected)
    expect(claimed.coins).toBe(140)
    expect(claimed.claimedLoginDays).toEqual([date])
    expect(claimLogin(claimed)).toBe(claimed)
    const loaded = parseGame(JSON.stringify(claimed), date)
    expect(claimLogin(loaded).coins).toBe(140)
    expect(claimLogin(advanceGame(loaded)).coins).toBe(160)
    const realTomorrow = parseGame(JSON.stringify(claimed), shiftDay(date, 1))
    expect(claimLogin(realTomorrow).coins).toBe(160)
    expect(selected.coins).toBe(120)
  })

  it('awards the three-day and seven-day coins on the first meal only', () => {
    let state = chooseStarter(premium(initialGame(date)), 'komugi')
    state = advanceGame(feed(state, meal))
    state = advanceGame(feed(state, meal))
    const third = feed(state, meal)
    expect(third.meals[0].streakBonus).toBe(30)
    expect(third.meals[0].coins).toBe(60)
    expect(feed(third, meal).meals[0].streakBonus).toBe(0)
    const seventh = feed(premium(demoGame(date)), { ...meal, recipeId: 'curry' })
    expect(seventh.meals[0].streakBonus).toBe(100)
    expect(seventh.meals[0].coins).toBe(200)
    expect(feed(seventh, meal).meals[0].streakBonus).toBe(0)
    expect(restGame(premium(demoGame(date))).coins).toBe(120)
  })

  it('counts cooking days around rest tickets rather than awarding rests', () => {
    const rested = restGame(demoGame(date))
    expect(streakOf(rested)).toBe(6)
    const seventh = feed(advanceGame(rested), meal)
    expect(streakOf(seventh)).toBe(7)
    expect(seventh.meals[0].streakBonus).toBe(100)
    expect(seventh.meals[0].coins).toBe(130)
  })
})

describe('daily cooking and growth', () => {
  it('uses all five exact boundaries and caps appearance at the final stage', () => {
    expect(growthStages).toEqual([
      { stage: 0, name: 'うまれたて', threshold: 0 },
      { stage: 1, name: 'ちびっこ', threshold: 120 },
      { stage: 2, name: 'わんぱく', threshold: 300 },
      { stage: 3, name: 'おとな', threshold: 600 },
      { stage: 4, name: 'とっておき', threshold: 1050 },
    ])
    expect([0, 45, 119, 120, 299, 300, 599, 600, 1049, 1050, 9000].map(stageOf)).toEqual([
      0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4,
    ])
    expect(growthStages.map(({ stage }) => stageName(stage))).toEqual([
      'うまれたて',
      'ちびっこ',
      'わんぱく',
      'おとな',
      'とっておき',
    ])
  })

  it('reports local stage progress, remaining XP and a completed final stage', () => {
    for (const [xp, stage, nextThreshold] of [
      [0, 0, 120],
      [120, 1, 300],
      [300, 2, 600],
      [600, 3, 1050],
    ]) {
      expect(growthProgress(xp)).toEqual({
        stage,
        progress: 0,
        remaining: nextThreshold - xp,
        nextThreshold,
      })
      const halfway = (xp + nextThreshold) / 2
      expect(growthProgress(halfway)).toEqual({
        stage,
        progress: 50,
        remaining: nextThreshold - halfway,
        nextThreshold,
      })
      expect(growthProgress(nextThreshold - 1).remaining).toBe(1)
      expect(growthProgress(nextThreshold - 1).progress).toBeLessThan(100)
    }
    for (const xp of [1050, 9000, Number.MAX_SAFE_INTEGER]) {
      expect(growthProgress(xp)).toEqual({
        stage: 4,
        progress: 100,
        remaining: 0,
        nextThreshold: null,
      })
    }
  })

  it('keeps invalid XP from producing invalid progress or accidental growth', () => {
    for (const xp of [-1, -500, NaN, Infinity, -Infinity]) {
      expect(stageOf(xp)).toBe(0)
      expect(growthProgress(xp)).toEqual({
        stage: 0,
        progress: 0,
        remaining: 120,
        nextThreshold: 120,
      })
    }
    expect(stageOf(119.9)).toBe(0)
    expect(growthProgress(119.9).remaining).toBe(1)
    const maximum = chooseStarter(initialGame(date), 'komugi')
    maximum.companions[0].xp = Number.MAX_SAFE_INTEGER
    maximum.xp = Number.MAX_SAFE_INTEGER
    const after = feed(maximum, meal)
    expect(after.xp).toBe(Number.MAX_SAFE_INTEGER)
    expect(stageOf(after.xp)).toBe(4)
    expect(parseGame(JSON.stringify(after), date)).toEqual(after)
  })

  it('starts with six days and crosses the next growth level after a meal', () => {
    const before = demoGame(date)
    const after = feed(before, meal)
    expect(streakOf(before)).toBe(6)
    expect(levelOf(before)).toEqual({ level: 3, progress: 70, needed: 100 })
    expect(growthProgress(before.xp).remaining).toBe(30)
    expect(stageOf(before.xp)).toBe(1)
    expect(hungerOf(before)).toBe(28)
    expect(after.coins).toBe(250)
    expect(levelOf(after)).toEqual({ level: 4, progress: 15, needed: 100 })
    expect(stageOf(after.xp)).toBe(2)
    expect(streakOf(after)).toBe(7)
    expect(hungerOf(after)).toBe(96)
    expect(fedToday(after)).toBe(true)
    expect(after.owned).toContain('sprout')
    expect(after.equipped.hat).toBe('none')
    expect(before.meals).toHaveLength(6)
    expect(before.owned).not.toContain('sprout')
  })

  it('grows on extra meals without repeating daily coins or milestones', () => {
    const first = feed(premium(demoGame(date)), meal)
    const second = feed(first, { title: '夜のスープ', sample: 'soup' })
    expect(second.meals).toHaveLength(8)
    expect(second.xp).toBe(first.xp + 45)
    expect(second.coins).toBe(first.coins)
    expect(second.meals[0].xp).toBe(45)
    expect(second.meals[0].coins).toBe(0)
    expect(second.meals[0].id).not.toBe(second.meals[1].id)
    expect(streakOf(second)).toBe(7)
    expect(second.owned.filter((id) => id === 'sprout')).toHaveLength(1)
  })

  it('keeps a grace day, then breaks the streak and leaves the pet hungry', () => {
    const fed = feed(demoGame(date), meal)
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
    const fresh = chooseStarter(initialGame(date, true), 'komugi')
    expect(streakOf(fresh)).toBe(0)
    expect(levelOf(fresh).level).toBe(1)
    expect(fresh.meals).toEqual([])
    expect(feed(fresh, { ...meal, title: '  ' }).meals[0].title).toBe('今日のごはん')
    expect(streakOf(feed(fresh, meal))).toBe(1)
  })

  it('keeps an unfed new companion equally hungry on real and simulated days', () => {
    const fresh = chooseStarter(initialGame(date, true), 'komugi')
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
    const first = feed(chooseStarter(premium(initialGame(date, true)), 'komugi'), meal)
    const second = feed(first, meal)
    expect(getRandomValues).toHaveBeenCalledTimes(2)
    expect(new Set(second.meals.map((entry) => entry.id)).size).toBe(2)
    vi.stubGlobal('crypto', undefined)
    expect(feed(second, meal).meals).toHaveLength(3)
  })
})

describe('rest tickets', () => {
  it('protects a streak without feeding or earning a cooking day', () => {
    const initial = demoGame(date)
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
    const rested = restGame(demoGame(date))
    const fed = feed(rested, meal)
    expect(fed.tickets).toBe(2)
    expect(fed.rests).toEqual([])
    expect(feed(fed, meal).tickets).toBe(2)
    expect(restGame(fed)).toBe(fed)
    const empty = { ...demoGame(date), tickets: 0 }
    expect(restGame(empty)).toBe(empty)
  })
})

describe('cosmetic shop', () => {
  it('purchases and equips only once, without mutating the old state', () => {
    const original = demoGame(date)
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
    const state = demoGame(date)
    expect(purchaseItem(state, 'missing')).toBe(state)
    expect(purchaseItem(state, 'beret')).toBe(state)
    expect(purchaseItem(state, 'chef')).toBe(state)
    expect(equipItem(state, 'chef')).toBe(state)
    expect(equipItem(state, 'missing')).toBe(state)
  })

  it('uses gems only for premium cosmetics and never feeds the pet', () => {
    const state = demoGame(date)
    const topped = addDemoGems(state)
    const bought = purchaseItem(topped, 'garden')
    expect(topped.gems).toBe(210)
    expect(state.gems).toBe(60)
    expect(bought.gems).toBe(110)
    expect(bought.coins).toBe(120)
    expect(bought.equipped.room).toBe('garden')
    expect(hungerOf(bought)).toBe(28)
    expect(streakOf(bought)).toBe(6)
    expect(bought.xp).toBe(270)
  })
})

describe('calendar and persistence', () => {
  it('migrates a saved companion without losing its name, photos, coins or streak', () => {
    const source = demoGame(date)
    const legacy = JSON.parse(JSON.stringify(source)) as Record<string, unknown>
    for (const key of [
      'companions',
      'activeId',
      'visitors',
      'cards',
      'claimedLoginDays',
      'growthVersion',
    ])
      delete legacy[key]
    legacy.name = 'むぎちゃん'
    legacy.xp = 305
    legacy.coins = 987
    legacy.gems = 234
    legacy.owned = ['none', 'plain', 'beret']
    legacy.equipped = { hat: 'beret', room: 'plain' }
    const oldMeals = source.meals.map(({ targetId: _targetId, ...meal }) => meal)
    oldMeals[0] = { ...oldMeals[0], title: 'カレー', photo: 'data:image/jpeg;base64,YWJjZA==' }
    oldMeals[1] = { ...oldMeals[1], recipeId: 'egg-rice' }
    legacy.meals = oldMeals
    const migrated = parseGame(JSON.stringify(legacy), date)
    expect(migrated.activeId).toBe('komugi')
    expect(migrated.name).toBe('むぎちゃん')
    expect(migrated.growthVersion).toBe(2)
    expect(migrated.xp).toBe(785)
    expect(migrated.companions).toEqual([{ id: 'komugi', xp: 785, joinedDay: shiftDay(date, -6) }])
    expect(migrated.visitors).toEqual(['mame', 'shizuku', 'yuzu'])
    expect(migrated.coins).toBe(987)
    expect(migrated.gems).toBe(234)
    expect(migrated.equipped.hat).toBe('beret')
    expect(migrated.meals[0].photo).toBe(oldMeals[0].photo)
    expect(migrated.meals.every((meal) => meal.targetId === 'komugi')).toBe(true)
    expect(migrated.cards).toEqual(['egg-rice'])
    expect(streakOf(migrated)).toBe(6)
    expect(hungerOf(migrated)).toBe(28)
    expect(parseGame(JSON.stringify(migrated), date)).toEqual(migrated)
    expect(feed(migrated, { ...meal, recipeId: 'egg-rice' }).meals[0].cardBonus).toBe(0)
  })

  it('migrates old growth intervals once without promoting a near-threshold newborn', () => {
    const source = chooseStarter(initialGame(date), 'komugi')
    for (const [oldXp, migratedXp, stage] of [
      [0, 0, 0],
      [44, 117, 0],
      [45, 300, 2],
      [60, 360, 2],
      [90, 480, 2],
      [119, 596, 2],
      [120, 600, 3],
      [305, 785, 3],
      [569, 1049, 3],
      [9000, 1049, 3],
      [Number.MAX_SAFE_INTEGER, 1049, 3],
    ]) {
      const legacy = {
        ...source,
        growthVersion: undefined,
        xp: oldXp,
        companions: [{ ...source.companions[0], xp: oldXp }],
      }
      const migrated = parseGame(JSON.stringify(legacy), date)
      expect(migrated.growthVersion).toBe(2)
      expect(migrated.xp).toBe(migratedXp)
      expect(stageOf(migrated.xp)).toBe(stage)
      expect(migrated.visitors).toHaveLength(stage >= 2 ? 3 : 0)
      expect(parseGame(JSON.stringify(migrated), date)).toEqual(migrated)
    }
    expect(parseGame(JSON.stringify(source), date).xp).toBe(0)
  })

  it('migrates each old companion independently while preserving history and balances', () => {
    const source = demoGame(date)
    const legacy = {
      ...source,
      growthVersion: undefined,
      activeId: 'mame',
      xp: 999,
      coins: 987,
      gems: 234,
      companions: [
        { id: 'komugi', xp: 44, joinedDay: shiftDay(date, -6) },
        { id: 'mame', xp: 90, joinedDay: shiftDay(date, -3) },
        { id: 'shizuku', xp: 120, joinedDay: date },
      ],
      visitors: ['yuzu'],
    }
    const migrated = parseGame(JSON.stringify(legacy), date)
    expect(migrated.companions.map(({ id, xp }) => [id, xp])).toEqual([
      ['komugi', 117],
      ['mame', 480],
      ['shizuku', 600],
    ])
    expect(migrated.xp).toBe(480)
    expect(migrated.activeId).toBe('mame')
    expect(migrated.coins).toBe(987)
    expect(migrated.gems).toBe(234)
    expect(migrated.meals).toEqual(source.meals)
    expect(migrated.visitors).toEqual(['yuzu', 'momo', 'goma'])
    expect(migrated.companions.map(({ joinedDay }) => joinedDay)).toEqual(
      legacy.companions.map(({ joinedDay }) => joinedDay),
    )
    const afterMeal = feed(migrated, { ...meal, targetId: 'komugi' })
    expect(afterMeal.companions.map(({ xp }) => xp)).toEqual([162, 480, 600])
    expect(parseGame(JSON.stringify(afterMeal), date)).toEqual(afterMeal)
  })

  it('persists recruited companions and keeps the active XP alias synchronized', () => {
    const adult = feed(demoGame(date), meal)
    const recruited = feed(adult, { ...meal, recipeId: 'curry', targetId: 'mame' })
    const claimed = claimLogin(recruited)
    expect(parseGame(JSON.stringify(claimed), date)).toEqual(claimed)
    const staleAlias = parseGame(JSON.stringify({ ...claimed, xp: 999 }), date)
    expect(staleAlias.xp).toBe(activeCompanion(claimed)?.xp)
    const corrupt = [
      { activeId: 'missing' },
      { activeId: null },
      { companions: [...claimed.companions, claimed.companions[0]] },
      { companions: [{ id: 'komugi', xp: -1, joinedDay: date }] },
      { companions: [{ id: 'komugi', xp: Infinity, joinedDay: date }] },
      { companions: [{ id: 'komugi', xp: 0.5, joinedDay: date }] },
      { visitors: ['komugi'] },
      { visitors: ['goma', 'goma'] },
      { cards: ['curry', 'curry'] },
      { cards: ['missing'] },
      { claimedLoginDays: ['not-a-date'] },
      { claimedLoginDays: [date, date] },
      { meals: [{ ...claimed.meals[0], targetId: 'missing' }] },
      { meals: [{ ...claimed.meals[0], streakBonus: -1 }] },
      { meals: [{ ...claimed.meals[0], cardBonus: '70' }] },
    ]
    for (const patch of corrupt)
      expect(parseGame(JSON.stringify({ ...claimed, ...patch }), date)).toEqual(initialGame(date))
  })

  it('handles month boundaries and rejects invalid demo increments', () => {
    expect(shiftDay('2028-02-28', 1)).toBe('2028-02-29')
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01')
    const state = demoGame(date)
    for (const days of [-1, 0, 1.5, NaN, Infinity]) expect(advanceGame(state, days)).toBe(state)
  })

  it('rolls to the real day while retaining the selected demo offset', () => {
    const state = advanceGame(feed(demoGame(date), meal), 2)
    const parsed = parseGame(JSON.stringify(state), '2026-09-25')
    expect(parsed.today).toBe('2026-09-27')
    expect(parsed.dayOffset).toBe(2)
    expect(parsed.meals).toEqual(state.meals)
    expect(parsed.owned).toEqual(state.owned)
    expect(streakOf(parsed)).toBe(0)
    expect(hungerOf(parsed)).toBe(8)
  })

  it('roundtrips a photo and falls back on malformed fields', () => {
    const state = feed(demoGame(date), { ...meal, photo: 'data:image/jpeg;base64,YWJjZA==' })
    expect(parseGame(JSON.stringify(state), date)).toEqual(state)
    const corrupt = [
      null,
      '{oops',
      '[]',
      'null',
      ...[
        { version: 2 },
        { growthVersion: 3 },
        { growthVersion: '2' },
        { growthVersion: null },
        { today: '2026-02-31' },
        { dayOffset: -1 },
        { xp: -1 },
        { xp: Infinity },
        { xp: NaN },
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
