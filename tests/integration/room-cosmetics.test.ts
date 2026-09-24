import { describe, expect, it } from 'vitest'
import { applyGameCommand, type GameCommand } from '../../shared/game/commands'
import { commandRequestSchema, commandResponseSchema } from '../../shared/game/contracts'
import { chooseStarter, initialGame } from '../../shared/game/game'
import { decodeGame } from '../../shared/game/stateCodec'
import type { GameState } from '../../shared/game/types'
import { parseGame } from '../../src/app/game/gameStorage'

const day = '2026-09-25'
const rooms = [
  { id: 'seaside', currency: 'coins', price: 320, coins: 680, gems: 500 },
  { id: 'brook', currency: 'coins', price: 280, coins: 720, gems: 500 },
  { id: 'greenhouse', currency: 'gems', price: 140, coins: 1000, gems: 360 },
] as const

function execute(state: GameState, command: GameCommand) {
  const request = commandRequestSchema.parse({
    operationId: '10000000-0000-4000-8000-000000000001',
    command,
  })
  return applyGameCommand(state, request.command, { today: day, mealId: 'unused' })
}

describe('new room purchases and saved ownership', () => {
  it.each(rooms)(
    '$id charges the listed currency once and remains usable after reloading',
    ({ id, coins, gems }) => {
      const start = { ...chooseStarter(initialGame(day), 'mame'), coins: 1000, gems: 500 }
      const purchased = execute(start, { type: 'purchase', id })
      expect(purchased.changed).toBe(true)
      expect(purchased.receipt).toBeNull()
      expect(purchased.state).toEqual({
        ...start,
        coins,
        gems,
        owned: [...start.owned, id],
        equipped: { ...start.equipped, room: id },
      })
      expect(start.owned).toEqual(['none', 'plain'])
      expect(start.equipped.room).toBe('plain')

      const saved = JSON.stringify(purchased.state)
      const restored = decodeGame(JSON.parse(saved), day)
      expect(restored).toEqual(purchased.state)
      expect(parseGame(saved, day)).toEqual(restored)
      const response = commandResponseSchema.parse({
        snapshot: { state: JSON.parse(saved), revision: 1 },
        receipt: null,
      })
      expect(response.snapshot.state).toEqual(restored)

      const plain = execute(restored, { type: 'equip', id: 'plain' }).state
      expect(plain.equipped.room).toBe('plain')
      const repeatedPurchase = execute(plain, { type: 'purchase', id })
      expect(repeatedPurchase.changed).toBe(false)
      expect(repeatedPurchase.state).toBe(plain)
      const reequipped = execute(plain, { type: 'equip', id }).state
      expect(reequipped).toEqual(restored)
      expect(reequipped.owned.filter((ownedId) => ownedId === id)).toHaveLength(1)
    },
  )

  it.each(rooms)(
    '$id cannot be equipped or purchased before its cost is available',
    ({ id, currency, price }) => {
      const start = {
        ...chooseStarter(initialGame(day), 'mame'),
        coins: 1000,
        gems: 500,
        [currency]: price - 1,
      }
      expect(execute(start, { type: 'equip', id }).state).toBe(start)
      const result = execute(start, { type: 'purchase', id })
      expect(result.changed).toBe(false)
      expect(result.state).toBe(start)
    },
  )
})
