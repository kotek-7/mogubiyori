import { afterEach, describe, expect, it, vi } from 'vitest'
import { chooseStarter, demoGame, feed, initialGame } from './browserGame'
import type { GameState, TutorialState } from './browserGame'
import { GAME_STORAGE_KEY, parseGame, saveGame } from './gameStorage'

const day = '2026-09-24'
const active: TutorialState = { version: 1, step: 0, status: 'active' }
const completed: TutorialState = { version: 1, step: 4, status: 'completed' }

afterEach(() => vi.unstubAllGlobals())

describe('tutorial persistence', () => {
  it('starts fresh guidance before selection and retains it after choosing a starter', () => {
    const initial = initialGame(day)
    expect(initial.activeId).toBeNull()
    expect(initial.tutorial).toEqual(active)
    expect(parseGame(JSON.stringify(initial), day)).toEqual(initial)

    for (const id of ['komugi', 'mame', 'shizuku'] as const) {
      const chosen = chooseStarter(initial, id)
      expect(chosen.tutorial).toEqual(active)
      expect(parseGame(JSON.stringify(chosen), day)).toEqual(chosen)
    }
  })

  it('restores a seen introduction before a companion is selected without advancing guidance', () => {
    const state = {
      ...initialGame(day),
      tutorial: { ...active, introSeen: true },
    }
    const restored = parseGame(JSON.stringify(state), day)
    expect(restored).toEqual(state)
    expect(restored.activeId).toBeNull()
    expect(chooseStarter(restored, 'mame').tutorial).toEqual(state.tutorial)
    expect(initialGame(day).tutorial).not.toHaveProperty('introSeen')
  })

  it('keeps old saves playable without forcing existing companions through guidance', () => {
    const selected = chooseStarter(initialGame(day), 'mame')
    const existing = feed(selected, {
      title: 'カレー',
      sample: 'curry',
      recipeId: 'curry',
      photo: 'data:image/jpeg;base64,YWJjZA==',
    })
    const { tutorial: _tutorial, ...oldSave } = existing
    expect(parseGame(JSON.stringify(oldSave), day)).toEqual({
      ...existing,
      tutorial: completed,
    })

    const { tutorial: _freshTutorial, ...unselected } = initialGame(day)
    expect(parseGame(JSON.stringify(unselected), day)).toEqual(initialGame(day))
  })

  it('marks the oldest single-companion save completed after companion migration', () => {
    const legacy: Record<string, unknown> = { ...demoGame(day) }
    for (const key of [
      'tutorial',
      'companions',
      'activeId',
      'visitors',
      'cards',
      'claimedLoginDays',
      'growthVersion',
    ])
      delete legacy[key]
    const restored = parseGame(JSON.stringify(legacy), day)
    expect(restored.activeId).toBe('komugi')
    expect(restored.tutorial).toEqual(completed)
    expect(restored.meals).toHaveLength(6)
    expect(restored.coins).toBe(legacy.coins)
    expect(parseGame(JSON.stringify(restored), day)).toEqual(restored)
  })

  it.each<TutorialState>([
    { version: 1, step: 0, status: 'active' },
    { version: 1, step: 0, status: 'active', introSeen: false },
    { version: 1, step: 0, status: 'active', introSeen: true },
    { version: 1, step: 1, status: 'active' },
    { version: 1, step: 2, status: 'paused' },
    { version: 1, step: 3, status: 'paused' },
    { version: 1, step: 4, status: 'active' },
    { version: 1, step: 4, status: 'completed' },
    { version: 1, step: 4, status: 'completed', homeGuide: 'meal' },
    { version: 1, step: 4, status: 'completed', homeGuide: 'growth' },
    { version: 1, step: 4, status: 'completed', homeGuide: 'book' },
    { version: 1, step: 4, status: 'completed', homeGuide: 'done' },
    { version: 1, step: 4, status: 'completed', introSeen: true, homeGuide: 'meal' },
  ])('saves and restores progress at $step with status $status', (tutorial) => {
    const stored = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      setItem: (key: string, value: string) => stored.set(key, value),
    })
    const state: GameState = {
      ...chooseStarter(initialGame(day), 'shizuku'),
      tutorial,
    }
    expect(saveGame(state)).toBe(true)
    expect(parseGame(stored.get(GAME_STORAGE_KEY) ?? null, day)).toEqual(state)
  })

  it('repairs only invalid tutorial data while preserving photos, growth and rewards', () => {
    const existing = feed(demoGame(day), {
      title: 'たまごごはん',
      recipeId: 'egg-rice',
      sample: 'rice',
      photo: 'data:image/jpeg;base64,YWJjZA==',
    })
    const invalid = [
      null,
      false,
      [],
      {},
      { version: 2, step: 2, status: 'paused' },
      { version: 1, step: -1, status: 'active' },
      { version: 1, step: 5, status: 'active' },
      { version: 1, step: 1.5, status: 'paused' },
      { version: 1, step: '2', status: 'paused' },
      { version: 1, step: 2, status: 'unknown' },
    ]
    for (const tutorial of invalid) {
      expect(parseGame(JSON.stringify({ ...existing, tutorial }), day)).toEqual({
        ...existing,
        tutorial: completed,
      })
      expect(parseGame(JSON.stringify({ ...initialGame(day), tutorial }), day)).toEqual(
        initialGame(day),
      )
    }
  })

  it('starts the seeded demo with guidance completed and resets fresh guidance separately', () => {
    const demo = demoGame(day)
    expect(demo.tutorial).toEqual(completed)
    expect(parseGame(JSON.stringify(demo), day)).toEqual(demo)
    expect(initialGame(day, true).tutorial).toEqual(active)
  })

  it('ignores an invalid in-game guide without losing the game or the completed tutorial', () => {
    const game = demoGame(day)
    const raw = JSON.stringify({ ...game, tutorial: { ...completed, homeGuide: 'unknown' } })
    expect(parseGame(raw, day)).toEqual(game)
  })

  it.each([null, 'true', 1, {}, []])(
    'ignores malformed introduction state %j without losing tutorial or game progress',
    (introSeen) => {
      const game = {
        ...demoGame(day),
        tutorial: { version: 1, step: 2, status: 'paused', homeGuide: 'book' } as TutorialState,
      }
      const raw = JSON.stringify({ ...game, tutorial: { ...game.tutorial, introSeen } })
      const restored = parseGame(raw, day)
      expect(restored).toEqual(game)
      expect(restored.tutorial).not.toHaveProperty('introSeen')
    },
  )
})
