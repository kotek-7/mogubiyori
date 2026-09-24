import { applyGameCommand } from '../shared/commands'
import type { GameCommand } from '../shared/commands'
import type { CommandResponse, GameSnapshot } from '../shared/contracts'
import { initialGame } from '../shared/game'
import type { GameRepository } from './repository'
import { ApiError } from './errors'

export function tokyoDay(now: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(now)
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value !== null && typeof value === 'object')
    return `{${Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(',')}}`
  return JSON.stringify(value)
}

export async function commandHash(command: GameCommand): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(command)))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function dated(snapshot: GameSnapshot, today: string): GameSnapshot {
  return { ...snapshot, state: { ...snapshot.state, today, dayOffset: 0 } }
}

export async function loadGame(
  repository: GameRepository,
  userId: string,
  today: string,
): Promise<GameSnapshot> {
  return dated(await repository.load(userId, initialGame(today)), today)
}

export async function executeCommand(
  repository: GameRepository,
  userId: string,
  operationId: string,
  command: GameCommand,
  context: { today: string; mealId: string },
): Promise<CommandResponse> {
  const requestHash = await commandHash(command)
  const previous = await repository.findOperation(userId, operationId)
  if (previous) {
    if (previous.requestHash !== requestHash) throw new ApiError(409, 'operation_mismatch')
    return {
      snapshot: await loadGame(repository, userId, context.today),
      receipt: previous.receipt,
    }
  }
  // Each retry re-evaluates the operation against the latest persisted state.
  // The server date and meal ID stay fixed across attempts for this request.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const snapshot = await loadGame(repository, userId, context.today)
    const result = applyGameCommand(snapshot.state, command, context)
    if (
      (command.type === 'feed' && !result.receipt) ||
      (!result.changed && ['purchase', 'rest', 'chooseStarter'].includes(command.type))
    ) {
      // A simultaneous copy may have committed after our initial operation
      // lookup. Its newly persisted state can make this operation look invalid.
      const concurrent = await repository.findOperation(userId, operationId)
      if (concurrent) {
        if (concurrent.requestHash !== requestHash) throw new ApiError(409, 'operation_mismatch')
        return {
          snapshot: await loadGame(repository, userId, context.today),
          receipt: concurrent.receipt,
        }
      }
      throw new ApiError(422, 'command_not_applied')
    }
    const photoId = command.type === 'feed' ? command.input.photoId : undefined
    const committed = await repository.commit({
      userId,
      operationId,
      requestHash,
      kind: command.type,
      expectedRevision: snapshot.revision,
      state: result.state,
      receipt: result.receipt,
      ...(photoId && result.changed ? { photoId, mealId: context.mealId } : {}),
    })
    if (committed.status === 'conflict') continue
    if (committed.status === 'operation_mismatch') throw new ApiError(409, 'operation_mismatch')
    if (committed.status === 'invalid_photo') throw new ApiError(422, 'invalid_photo')
    return { snapshot: dated(committed.snapshot, context.today), receipt: committed.receipt }
  }
  throw new ApiError(409, 'revision_conflict')
}
