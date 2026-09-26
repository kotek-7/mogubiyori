import { describe, expect, it, vi } from 'vitest'
import { createLocalGameGateway } from './localGameGateway'
import { chooseStarter, demoGame, initialGame, LOGIN_BONUS, shiftDay } from './browserGame'
import type { GameState } from './browserGame'
import type { GameCommand } from '../../../shared/game/commands'

const day = '2026-09-25'
const meal: GameCommand = { type: 'feed', input: { title: '今日のごはん', sample: 'rice' } }
const starter = () => chooseStarter(initialGame(day), 'komugi')

function memoryStorage(initial: GameState) {
  let saved = structuredClone(initial)
  let fail = false
  return {
    read: vi.fn(() => structuredClone(saved)),
    write: vi.fn((state: GameState) => {
      if (fail) {
        fail = false
        return false
      }
      saved = structuredClone(state)
      return true
    }),
    failNextWrite() {
      fail = true
    },
    saved: () => structuredClone(saved),
  }
}

describe('local game gateway', () => {
  it('saves the introduction before selection and restores it after reload, retrying failed writes', async () => {
    const initial = initialGame(day)
    const storage = memoryStorage(initial)
    const gateway = createLocalGameGateway(storage, () => day)
    const command = { type: 'tutorial', input: { introSeen: true } } as const
    storage.failNextWrite()
    await expect(gateway.execute(command, 'intro')).rejects.toThrow('保存できませんでした')
    expect(storage.saved()).toEqual(initial)
    const result = await gateway.execute(command, 'intro')
    expect(result).toEqual({
      snapshot: {
        state: { ...initial, tutorial: { ...initial.tutorial, introSeen: true } },
        revision: 1,
      },
      receipt: null,
    })
    expect(await gateway.execute(command, 'intro')).toEqual(result)
    const reloaded = createLocalGameGateway(storage, () => day)
    expect((await reloaded.load()).state).toEqual(result.snapshot.state)
    const selected = await reloaded.execute({ type: 'chooseStarter', id: 'mame' }, 'starter')
    expect(selected.snapshot.state.tutorial).toEqual(result.snapshot.state.tutorial)
  })

  it('rejects the removed gem top-up without changing the saved game', async () => {
    const storage = memoryStorage(starter())
    const gateway = createLocalGameGateway(storage, () => day)
    await expect(gateway.demo!({ type: 'addGems' } as never)).rejects.toThrow('利用できません')
    expect(storage.saved()).toEqual(starter())
    expect(storage.write).not.toHaveBeenCalled()
  })

  it('persists mock plan changes and enforces the free daily limit without blocking replay', async () => {
    const storage = memoryStorage(starter())
    const gateway = createLocalGameGateway(storage, () => day)
    const first = await gateway.execute(meal, 'first')
    await expect(gateway.execute(meal, 'second')).rejects.toThrow('有料プランに切り替えると')
    expect(storage.saved()).toEqual(first.snapshot.state)
    expect((await gateway.execute(meal, 'first')).receipt).toEqual(first.receipt)
    await gateway.execute({ type: 'setSubscriptionPlan', plan: 'premium' }, 'upgrade')
    const second = await gateway.execute(meal, 'second')
    expect(second.snapshot.state.mealRecords).toHaveLength(2)
    const downgraded = await gateway.execute(
      { type: 'setSubscriptionPlan', plan: 'free' },
      'downgrade',
    )
    expect(downgraded.snapshot.state.mealRecords).toEqual(second.snapshot.state.mealRecords)
    expect((await createLocalGameGateway(storage, () => day).load()).state.subscriptionPlan).toBe(
      'free',
    )
    await expect(gateway.execute(meal, 'third')).rejects.toThrow('1日1回')
  })

  it('retains the last good save and retries a rejected meal without losing the input', async () => {
    const initial = starter()
    const storage = memoryStorage(initial)
    const gateway = createLocalGameGateway(storage, () => day)
    storage.failNextWrite()
    await expect(gateway.execute(meal, 'meal-operation')).rejects.toThrow('保存できませんでした')
    expect(storage.saved()).toEqual(initial)
    expect(await gateway.load()).toEqual({ state: initial, revision: 0 })
    const retry = await gateway.execute(meal, 'meal-operation')
    expect(retry.snapshot.revision).toBe(1)
    expect(retry.snapshot.state.meals).toHaveLength(1)
    expect(retry.receipt?.meal).toMatchObject({ id: 'meal-meal-operation', title: '今日のごはん' })
    expect(storage.saved()).toEqual(retry.snapshot.state)
  })

  it('replays an operation once while returning current state and its original receipt', async () => {
    const storage = memoryStorage(starter())
    const gateway = createLocalGameGateway(storage, () => day)
    const first = await gateway.execute(meal, 'first-meal')
    const latest = await gateway.execute(
      { type: 'updateSettings', input: { name: '新しい名前', reminder: 'eager' } },
      'settings',
    )
    const replay = await gateway.execute(meal, 'first-meal')
    expect(replay.receipt).toEqual(first.receipt)
    expect(replay.snapshot).toEqual(latest.snapshot)
    expect(replay.snapshot.state.meals).toHaveLength(1)
    expect(replay.snapshot.state.xp).toBe(45)
    expect(storage.write).toHaveBeenCalledTimes(2)
  })

  it('rejects a changed payload under an already completed operation ID', async () => {
    const storage = memoryStorage(starter())
    const gateway = createLocalGameGateway(storage, () => day)
    const first = await gateway.execute(meal, 'same-id')
    await expect(
      gateway.execute({ type: 'feed', input: { title: '別の料理', sample: 'rice' } }, 'same-id'),
    ).rejects.toThrow('同じ操作ID')
    expect(storage.saved()).toEqual(first.snapshot.state)
    expect(storage.write).toHaveBeenCalledTimes(1)
  })

  it('applies concurrently requested commands in order without losing prior updates', async () => {
    const initial = initialGame(day)
    const storage = memoryStorage(initial)
    const gateway = createLocalGameGateway(storage, () => day)
    const results = await Promise.all([
      gateway.execute({ type: 'chooseStarter', id: 'komugi' }, 'starter'),
      gateway.execute({ type: 'claimLogin' }, 'login'),
      gateway.execute(meal, 'meal'),
      gateway.execute(
        { type: 'updateSettings', input: { name: 'こむぎの部屋', reminder: 'gentle' } },
        'settings',
      ),
    ])
    const saved = storage.saved()
    expect(results.map((result) => result.snapshot.revision)).toEqual([1, 2, 3, 4])
    expect(saved).toMatchObject({
      activeId: 'komugi',
      xp: 45,
      name: 'こむぎの部屋',
      reminder: 'gentle',
    })
    expect(saved.coins).toBe(initial.coins + LOGIN_BONUS + 30)
    expect(saved.claimedLoginDays).toEqual([day])
    expect(saved.meals).toHaveLength(1)
    expect(saved).toEqual(results[3].snapshot.state)
  })

  it('uses the injected current day and local day offset at command time', async () => {
    let currentDay = day
    const initial = { ...starter(), today: '2026-09-20', dayOffset: 2 }
    const storage = memoryStorage(initial)
    const gateway = createLocalGameGateway(storage, () => currentDay)
    const loaded = await gateway.load()
    expect(loaded.state.today).toBe('2026-09-27')
    expect(storage.write).not.toHaveBeenCalled()
    currentDay = shiftDay(day, 1)
    const result = await gateway.execute(meal, 'after-midnight')
    expect(result.snapshot.state.today).toBe('2026-09-28')
    expect(result.receipt?.meal.day).toBe('2026-09-28')
    expect(storage.saved().meals[0].day).toBe('2026-09-28')
  })

  it('keeps operation replay available when a demo reset cannot be saved', async () => {
    const storage = memoryStorage(starter())
    const gateway = createLocalGameGateway(storage, () => day)
    const committed = await gateway.execute(meal, 'first-meal')
    storage.failNextWrite()
    await expect(gateway.demo!({ type: 'reset', preset: 'fresh' })).rejects.toThrow(
      '保存できませんでした',
    )
    const replay = await gateway.execute(meal, 'first-meal')
    expect(replay).toEqual(committed)
    expect(storage.saved()).toEqual(committed.snapshot.state)
    expect(storage.write).toHaveBeenCalledTimes(2)
  })

  it.each(['fresh', 'seed'] as const)(
    'keeps the membership when loading the %s demo preset',
    async (preset) => {
      const storage = memoryStorage({ ...starter(), subscriptionPlan: 'premium' })
      const gateway = createLocalGameGateway(storage, () => day)
      const result = await gateway.demo!({ type: 'reset', preset })
      expect(result.state.subscriptionPlan).toBe('premium')
      expect((await createLocalGameGateway(storage, () => day).load()).state.subscriptionPlan).toBe(
        'premium',
      )
    },
  )

  it('resets progress and the demo date while keeping the local save revision increasing', async () => {
    const storage = memoryStorage({ ...demoGame(day), dayOffset: 5 })
    const gateway = createLocalGameGateway(storage, () => day)
    await gateway.execute({ type: 'updateSettings', input: { name: '育てたこむぎ' } }, 'name')
    const result = await gateway.execute({ type: 'resetProgress' }, 'reset')
    expect(result).toEqual({ snapshot: { state: initialGame(day), revision: 2 }, receipt: null })
    expect(storage.saved()).toEqual(initialGame(day))
    expect(await createLocalGameGateway(storage, () => day).load()).toMatchObject({
      state: initialGame(day),
    })
  })

  it('retains progress when a reset cannot be saved and allows retrying the same operation', async () => {
    const storage = memoryStorage(demoGame(day))
    const gateway = createLocalGameGateway(storage, () => day)
    const before = await gateway.load()
    storage.failNextWrite()
    await expect(gateway.execute({ type: 'resetProgress' }, 'reset')).rejects.toThrow(
      '保存できませんでした',
    )
    expect(await gateway.load()).toEqual(before)
    const result = await gateway.execute({ type: 'resetProgress' }, 'reset')
    expect(result.snapshot).toEqual({ state: initialGame(day), revision: 1 })
  })

  it('does not erase new progress or revive old meals when completed operations are retried', async () => {
    const storage = memoryStorage(starter())
    const gateway = createLocalGameGateway(storage, () => day)
    await gateway.execute(meal, 'old-meal')
    await gateway.execute({ type: 'resetProgress' }, 'reset')
    await gateway.execute({ type: 'chooseStarter', id: 'komugi' }, 'new-starter')
    const fresh = await gateway.execute({ type: 'claimLogin' }, 'new-login')
    expect(fresh.snapshot.state.coins).toBe(initialGame(day).coins + LOGIN_BONUS)
    expect(await gateway.execute({ type: 'resetProgress' }, 'reset')).toEqual(fresh)
    expect(await gateway.execute(meal, 'old-meal')).toEqual(fresh)
    expect(storage.saved().meals).toEqual([])
    expect(storage.write).toHaveBeenCalledTimes(4)
  })

  it.each([
    { type: 'purchase', id: 'sunhat' },
    { type: 'rest' },
    { type: 'chooseStarter', id: 'shizuku' },
  ] satisfies GameCommand[])(
    'rejects an unapplied $type even when the date rolled over',
    async (command) => {
      const initial = { ...starter(), today: '2026-09-24', coins: 0, tickets: 0 }
      const storage = memoryStorage(initial)
      const gateway = createLocalGameGateway(storage, () => day)
      await expect(gateway.execute(command, 'unapplied')).rejects.toThrow(
        '操作を完了できませんでした',
      )
      expect(storage.saved()).toEqual(initial)
      expect(storage.write).not.toHaveBeenCalled()
      expect((await gateway.load()).revision).toBe(0)
    },
  )

  it('saves purchase and guide completion together and retries without charging twice', async () => {
    const initial = starter()
    initial.tutorial = { version: 1, step: 4, status: 'completed', homeGuide: 'shop' }
    const storage = memoryStorage(initial)
    const gateway = createLocalGameGateway(storage, () => day)
    storage.failNextWrite()
    await expect(
      gateway.execute({ type: 'purchase', id: 'chef' }, 'guide-purchase'),
    ).rejects.toThrow('保存できませんでした')
    expect(storage.saved()).toEqual(initial)
    const result = await gateway.execute({ type: 'purchase', id: 'chef' }, 'guide-purchase')
    expect(result.snapshot.state.tutorial.homeGuide).toBe('done')
    expect(result.snapshot.state.coins).toBe(initial.coins - 80)
    expect(result.snapshot.state.owned).toContain('chef')
    expect(result.snapshot.state.equipped.hat).toBe('chef')
    const writes = storage.write.mock.calls.length
    expect(await gateway.execute({ type: 'purchase', id: 'chef' }, 'guide-purchase')).toEqual(
      result,
    )
    expect(storage.write).toHaveBeenCalledTimes(writes)
  })

  it('recovers the command queue after a failure', async () => {
    const storage = memoryStorage(starter())
    const gateway = createLocalGameGateway(storage, () => day)
    storage.failNextWrite()
    const rejected = gateway.execute(meal, 'rejected')
    const next = gateway.execute({ type: 'updateSettings', input: { name: '元気' } }, 'next')
    await expect(rejected).rejects.toThrow('保存できませんでした')
    await expect(next).resolves.toMatchObject({
      snapshot: { revision: 1, state: { name: '元気' } },
    })
    expect(storage.saved().meals).toHaveLength(0)
  })

  it('does not load storage for a cancelled request', async () => {
    const storage = memoryStorage(starter())
    const gateway = createLocalGameGateway(storage, () => day)
    const controller = new AbortController()
    controller.abort()
    await expect(gateway.load(controller.signal)).rejects.toThrow()
    expect(storage.read).not.toHaveBeenCalled()
    await expect(gateway.load()).resolves.toMatchObject({ revision: 0 })
  })
})
