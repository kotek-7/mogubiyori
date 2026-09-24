import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { chooseLatestSnapshot } from './gameSnapshot'
import { initialGame } from '../../../shared/game/game'
import type { GameSnapshot } from '../../../shared/game/contracts'

const snapshot = (revision: number): GameSnapshot => ({
  revision,
  state: { ...initialGame('2026-09-25'), coins: 100 + revision },
})

describe('game snapshot cache', () => {
  it('keeps a committed command when a refetch started during it finishes later', async () => {
    const client = new QueryClient()
    const key = ['game', 'account-a']
    client.setQueryData(key, snapshot(1))
    let finishRead!: (value: GameSnapshot) => void
    const pendingRead = client.fetchQuery({
      queryKey: key,
      queryFn: () =>
        new Promise<GameSnapshot>((resolve) => {
          finishRead = resolve
        }),
      structuralSharing: chooseLatestSnapshot,
    })
    const committed = snapshot(2)
    client.setQueryData(key, (previous) => chooseLatestSnapshot(previous, committed))
    finishRead(snapshot(1))
    await pendingRead
    expect(client.getQueryData(key)).toEqual(committed)
    client.clear()
  })

  it('accepts the next local day at the same revision and retains unchanged references', () => {
    const current = snapshot(1)
    const nextDay = { ...current, state: { ...current.state, today: '2026-09-26' } }
    expect(chooseLatestSnapshot(current, nextDay)).toEqual(nextDay)
    expect(chooseLatestSnapshot(current, structuredClone(current))).toBe(current)
    expect(chooseLatestSnapshot(current, snapshot(0))).toBe(current)
  })
})
