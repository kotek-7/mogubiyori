import { replaceEqualDeep } from '@tanstack/react-query'
import type { GameSnapshot } from '../../shared/contracts'

function isSnapshot(value: unknown): value is GameSnapshot {
  return (
    typeof value === 'object' &&
    value !== null &&
    'revision' in value &&
    typeof value.revision === 'number' &&
    'state' in value
  )
}

/** Reads and command responses share one monotonic cache, including late refetches. */
export function chooseLatestSnapshot(previous: unknown, incoming: unknown): GameSnapshot {
  if (!isSnapshot(incoming)) throw new Error('Invalid game snapshot')
  if (isSnapshot(previous) && previous.revision > incoming.revision) return previous
  return replaceEqualDeep(previous, incoming) as GameSnapshot
}
