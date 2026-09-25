import { applyGameCommand } from '../../shared/game/commands'
import type { GameCommand } from '../../shared/game/commands'
import type { CommandResponse, GameSnapshot } from '../../shared/game/contracts'
import { initialGame, shiftDay } from '../../shared/game/game'
import { isDebugGameCommand } from '../../shared/game/debug'
import { canRecordMeal } from '../../shared/game/subscription'
import type { GameRepository } from './repository'
import { ApiError } from '../errors'

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

function dated(snapshot: GameSnapshot, today: string, debugEnabled = false): GameSnapshot {
  return {
    state: { ...snapshot.state, today: shiftDay(today, snapshot.state.dayOffset) },
    revision: snapshot.revision,
    ...(debugEnabled ? { debugEnabled: true } : {}),
  }
}

function responseWithCurrentReceipt(
  snapshot: GameSnapshot,
  receipt: CommandResponse['receipt'],
): CommandResponse {
  // Retain operation IDs across resets so retries cannot restore old rewards.
  // A receipt whose meal was reset must not reopen its old reward sequence.
  return {
    snapshot,
    receipt:
      receipt && snapshot.state.meals.some((meal) => meal.id === receipt.meal.id) ? receipt : null,
  }
}

export async function loadGame(
  repository: GameRepository,
  userId: string,
  today: string,
  debugEnabled = false,
): Promise<GameSnapshot> {
  return dated(await repository.load(userId, initialGame(today)), today, debugEnabled)
}

export async function readGamePhotoUrls(
  repository: GameRepository,
  userId: string,
  photoIds: string[],
  today: string,
): Promise<{ photoId: string; url: string }[]> {
  if (!photoIds.length) return []
  const snapshot = await loadGame(repository, userId, today)
  const currentPhotoIds = new Set(snapshot.state.meals.map((meal) => meal.photoId))
  if (photoIds.some((photoId) => !currentPhotoIds.has(photoId)))
    throw new ApiError(404, 'photo_not_found')
  return repository.readPhotoUrls(userId, photoIds)
}

export async function executeCommand(
  repository: GameRepository,
  userId: string,
  operationId: string,
  command: GameCommand,
  context: { today: string; mealId: string; debugEnabled?: boolean },
): Promise<CommandResponse> {
  if (isDebugGameCommand(command) && context.debugEnabled !== true)
    throw new ApiError(403, 'debug_disabled')
  const requestHash = await commandHash(command)
  const previous = await repository.findOperation(userId, operationId)
  if (previous) {
    if (previous.requestHash !== requestHash) throw new ApiError(409, 'operation_mismatch')
    return responseWithCurrentReceipt(
      await loadGame(repository, userId, context.today, context.debugEnabled),
      previous.receipt,
    )
  }
  // Each retry re-evaluates the operation against the latest persisted state.
  // The server date and meal ID stay fixed across attempts for this request.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const snapshot = await loadGame(repository, userId, context.today, context.debugEnabled)
    if (
      command.type === 'updateMealRecord' &&
      (command.input.day > snapshot.state.today ||
        !snapshot.state.mealRecords?.some((record) => record.id === command.id))
    )
      throw new ApiError(422, 'invalid_meal_record')
    const invalidDebugTarget =
      command.type === 'debugSetGrowth' &&
      !snapshot.state.companions.some((companion) => companion.id === command.id)
    const result = applyGameCommand(snapshot.state, command, {
      today: snapshot.state.today,
      realToday: context.today,
      mealId: context.mealId,
    })
    if (
      invalidDebugTarget ||
      (command.type === 'feed' && !result.receipt) ||
      (!result.changed && ['purchase', 'rest', 'chooseStarter'].includes(command.type))
    ) {
      // A simultaneous copy may have committed after our initial operation
      // lookup. Its newly persisted state can make this operation look invalid.
      const concurrent = await repository.findOperation(userId, operationId)
      if (concurrent) {
        if (concurrent.requestHash !== requestHash) throw new ApiError(409, 'operation_mismatch')
        return responseWithCurrentReceipt(
          await loadGame(repository, userId, context.today, context.debugEnabled),
          concurrent.receipt,
        )
      }
      if (command.type === 'feed' && !command.input.mealRecordId && !canRecordMeal(snapshot.state))
        throw new ApiError(422, 'daily_meal_limit_reached')
      if (invalidDebugTarget) throw new ApiError(422, 'invalid_debug_target')
      throw new ApiError(422, 'command_not_applied')
    }
    const photoId =
      command.type === 'feed' && !command.input.mealRecordId ? command.input.photoId : undefined
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
    return responseWithCurrentReceipt(
      dated(committed.snapshot, context.today, context.debugEnabled),
      committed.receipt,
    )
  }
  throw new ApiError(409, 'revision_conflict')
}
