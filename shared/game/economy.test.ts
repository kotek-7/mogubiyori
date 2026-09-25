import { describe, expect, it } from 'vitest'
import { items } from '../content/catalog'
import { gameSnapshotSchema } from './contracts'
import { chooseStarter, initialGame, purchaseItem } from './game'
import { gameStateSchema } from './schemas'
import { decodeGame } from './stateCodec'

const day = '2026-09-25'

describe('coins after retiring gem purchases', () => {
  it('starts without gems and makes every live shop item available for coins', () => {
    expect(initialGame(day)).toMatchObject({ coins: 120, gems: 0 })
    expect(items.every((item) => item.currency === 'coins')).toBe(true)
    const before = chooseStarter(initialGame(day), 'komugi')
    const purchased = purchaseItem(before, 'chef')
    expect(purchased).toEqual({
      ...before,
      coins: 40,
      owned: [...before.owned, 'chef'],
      equipped: { ...before.equipped, hat: 'chef' },
    })
    expect(purchaseItem(purchased, 'chef')).toBe(purchased)
    expect(purchaseItem({ ...before, coins: 79 }, 'chef')).toEqual({ ...purchased, coins: 0 })
  })

  it('converts a legacy gem balance once while preserving the rest of the local save', () => {
    const old = { ...chooseStarter(initialGame(day), 'komugi'), coins: 173, gems: 234 }
    const restored = decodeGame(old, day)
    expect(restored).toEqual({ ...old, coins: 407, gems: 0 })
    expect(old).toMatchObject({ coins: 173, gems: 234 })
    expect(decodeGame(JSON.parse(JSON.stringify(restored)), day)).toEqual(restored)
    const purchased = purchaseItem(restored, 'garden')
    expect(purchased).toMatchObject({ coins: 307, gems: 0, equipped: { room: 'garden' } })
    expect(decodeGame(purchased, day)).toEqual(purchased)
  })

  it('also converts cloud snapshots without changing revision or crediting twice', () => {
    const old = { ...chooseStarter(initialGame(day), 'mame'), coins: 120, gems: 60 }
    const snapshot = gameSnapshotSchema.parse({ state: old, revision: 17 })
    expect(snapshot).toEqual({ state: { ...old, coins: 180, gems: 0 }, revision: 17 })
    expect(gameSnapshotSchema.parse(snapshot)).toEqual(snapshot)
    const { gems: _gems, ...withoutLegacyField } = snapshot.state
    expect(gameStateSchema.parse(withoutLegacyField)).toEqual(snapshot.state)
  })

  it('rejects balances that cannot be converted without losing integer precision', () => {
    const old = { ...initialGame(day), coins: Number.MAX_SAFE_INTEGER, gems: 1 }
    expect(gameStateSchema.safeParse(old).success).toBe(false)
  })
})
