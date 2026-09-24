import { readFileSync, existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { items } from '../../shared/content/catalog'
import type { ExpansionItem } from '../../shared/content/types'
import { applyGameCommand } from '../../shared/game/commands'
import {
  commandResponseSchema,
  feedReceiptSchema,
  gameSnapshotSchema,
} from '../../shared/game/contracts'
import { chooseStarter, equipItem, initialGame, purchaseItem } from '../../shared/game/game'
import { decodeGame, InvalidSavedGameError } from '../../shared/game/stateCodec'
import type { GameState, ItemKind } from '../../shared/game/types'
import { parseGame } from '../../src/app/game/gameStorage'

const day = '2026-09-25'
const environment = { today: day, mealId: 'wardrobe-meal' }
const hatIds = [
  'i-picnic-straw',
  'i-wildflower-crown',
  'i-ladybird-cap',
  'i-mushroom-cap',
  'i-sailor-knot',
  'i-moon-wizard',
]
const starter = () => ({ ...chooseStarter(initialGame(day), 'komugi'), coins: 2000, gems: 1000 })
const dressed = () =>
  ['i-picnic-straw', 'neck-bandana', 'bag-satchel', 'garden'].reduce(
    (state, id) => purchaseItem(state, id),
    starter(),
  )

function withoutNewSlots(state: GameState) {
  return {
    ...state,
    owned: state.owned.filter((id) => id !== 'neck-none' && id !== 'bag-none'),
    equipped: { hat: state.equipped.hat, room: state.equipped.room },
  }
}

describe('wardrobe catalogs and independent equipment', () => {
  it('adopts the six original hats and their art without requiring recipe unlocks', () => {
    const expansion: ExpansionItem[] = JSON.parse(
      readFileSync('content/expansion/items.json', 'utf8'),
    )
    for (const id of hatIds) {
      const original = expansion.find((item) => item.id === id)!
      const { name, description, kind, currency, price, artPath } = original
      expect(items.find((item) => item.id === id)).toEqual({
        id,
        name,
        description,
        kind,
        currency,
        price,
        artPath,
      })
      expect(existsSync(`public${artPath}`)).toBe(true)
      const purchased = purchaseItem(starter(), id)
      expect(purchased.cards).toEqual([])
      expect(purchased.equipped.hat).toBe(id)
      expect(decodeGame(JSON.parse(JSON.stringify(purchased)), day)).toEqual(purchased)
    }
  })

  it('wears a hat, neck accessory and bag together while retaining the selected room', () => {
    const state = dressed()
    expect(state.equipped).toEqual({
      hat: 'i-picnic-straw',
      neck: 'neck-bandana',
      bag: 'bag-satchel',
      room: 'garden',
    })
    expect(state.coins).toBe(1620)
    expect(state.gems).toBe(900)
    expect(state.xp).toBe(0)
    expect(state.meals).toEqual([])
    expect(decodeGame(JSON.parse(JSON.stringify(state)), day)).toEqual(state)
  })

  it.each([
    ['hat', 'none'],
    ['neck', 'neck-none'],
    ['bag', 'bag-none'],
    ['room', 'plain'],
  ] as const)(
    'removes only the %s slot and can restore it without buying again',
    (kind, emptyId) => {
      const state = dressed()
      const removed = equipItem(state, emptyId)
      expect(removed).toEqual({ ...state, equipped: { ...state.equipped, [kind]: emptyId } })
      const ownedId = state.equipped[kind]
      expect(purchaseItem(removed, ownedId)).toBe(removed)
      expect(equipItem(removed, ownedId)).toEqual(state)
    },
  )

  it.each(items.filter((item) => ['neck', 'bag'].includes(item.kind) && item.price > 0))(
    '$id uses its own slot and currency, and cannot be bought twice',
    (item) => {
      const before = dressed()
      const withoutItem = {
        ...equipItem(before, `${item.kind}-none`),
        owned: before.owned.filter((id) => id !== item.id),
      }
      const purchased = purchaseItem(withoutItem, item.id)
      expect(purchased).toEqual({
        ...withoutItem,
        [item.currency]: before[item.currency] - item.price,
        owned: [...withoutItem.owned, item.id],
        equipped: { ...before.equipped, [item.kind]: item.id },
      })
      expect(purchaseItem(purchased, item.id)).toBe(purchased)
      expect(decodeGame(JSON.parse(JSON.stringify(purchased)), day)).toEqual(purchased)
      const poor = { ...withoutItem, [item.currency]: item.price - 1 }
      expect(purchaseItem(poor, item.id)).toBe(poor)
    },
  )
})

describe('wardrobe compatibility at persistence and cloud boundaries', () => {
  it('extends an existing two-slot save and cloud snapshot without resetting progress', () => {
    const before = purchaseItem(purchaseItem(starter(), 'beret'), 'garden')
    const fed = applyGameCommand(
      before,
      {
        type: 'feed',
        input: { title: 'カレー', sample: 'curry', recipeId: 'curry' },
      },
      environment,
    ).state
    const oldSave = withoutNewSlots(fed)
    const expected = { ...fed, owned: [...oldSave.owned, 'neck-none', 'bag-none'] }
    const saved = JSON.stringify(oldSave)
    const restored = decodeGame(JSON.parse(saved), day)
    expect(restored).toEqual(expected)
    expect(restored.version).toBe(1)
    expect(parseGame(saved, day)).toEqual(expected)
    expect(gameSnapshotSchema.parse({ state: oldSave, revision: 12 })).toEqual({
      state: expected,
      revision: 12,
    })
    expect(decodeGame(JSON.parse(JSON.stringify(restored)), day)).toEqual(restored)
    expect(oldSave.equipped).toEqual({ hat: 'beret', room: 'garden' })
    expect(oldSave.owned).not.toContain('neck-none')
  })

  it('also adds the removal choices during the original single-companion save migration', () => {
    const oldSave: Record<string, unknown> = withoutNewSlots(purchaseItem(starter(), 'beret'))
    for (const key of [
      'companions',
      'activeId',
      'visitors',
      'cards',
      'claimedLoginDays',
      'tutorial',
    ])
      delete oldSave[key]
    const restored = decodeGame(oldSave, day)
    expect(restored.name).toBe(oldSave.name)
    expect(restored.coins).toBe(oldSave.coins)
    expect(restored.gems).toBe(oldSave.gems)
    expect(restored.activeId).toBe('komugi')
    expect(restored.equipped).toEqual({
      hat: 'beret',
      neck: 'neck-none',
      bag: 'bag-none',
      room: 'plain',
    })
    expect(restored.owned).toEqual(['none', 'plain', 'beret', 'neck-none', 'bag-none'])
    expect(decodeGame(JSON.parse(JSON.stringify(restored)), day)).toEqual(restored)
  })

  it('roundtrips all slots in new receipts and supplies only missing slots in old receipts', () => {
    const result = applyGameCommand(
      dressed(),
      {
        type: 'feed',
        input: { title: 'カレー', sample: 'curry', recipeId: 'curry' },
      },
      environment,
    )
    const response = { snapshot: { state: result.state, revision: 4 }, receipt: result.receipt }
    expect(commandResponseSchema.parse(JSON.parse(JSON.stringify(response)))).toEqual(response)
    expect(result.receipt!.equipped).toEqual(dressed().equipped)
    const oldReceipt = {
      ...result.receipt,
      equipped: { hat: 'i-picnic-straw', room: 'garden' },
    }
    expect(feedReceiptSchema.parse(oldReceipt)).toEqual({
      ...oldReceipt,
      equipped: { ...oldReceipt.equipped, neck: 'neck-none', bag: 'bag-none' },
    })
    for (const malformed of [null, 1, '', 'unknown', 'bag-satchel'])
      expect(
        feedReceiptSchema.safeParse({
          ...oldReceipt,
          equipped: { ...oldReceipt.equipped, neck: malformed },
        }).success,
      ).toBe(false)
  })

  it.each([
    ['hat', 'neck-bandana'],
    ['neck', 'bag-satchel'],
    ['bag', 'garden'],
    ['room', 'i-picnic-straw'],
    ['neck', 'neck-bow'],
    ['bag', 'bag-star'],
    ['neck', null],
    ['bag', 42],
  ] satisfies [ItemKind, unknown][])(
    'rejects invalid %s reference %s instead of silently migrating it',
    (kind, value) => {
      const state = dressed()
      const malformed = { ...state, equipped: { ...state.equipped, [kind]: value } }
      expect(() => decodeGame(malformed, day)).toThrow(InvalidSavedGameError)
      expect(gameSnapshotSchema.safeParse({ state: malformed, revision: 4 }).success).toBe(false)
    },
  )
})
