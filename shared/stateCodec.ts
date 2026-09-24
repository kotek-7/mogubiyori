import { migrateGameSave } from './saveMigrations'
import { gameStateSchema } from './schemas'
import type { GameState } from './types'

export class InvalidSavedGameError extends Error {
  constructor(cause: unknown) {
    super('Saved game could not be restored', { cause })
    this.name = 'InvalidSavedGameError'
  }
}

/** Throws on invalid data. A remote read failure must never create a fresh game. */
export function decodeGame(value: unknown, realDay: string): GameState {
  try {
    return gameStateSchema.parse(migrateGameSave(value, realDay))
  } catch (cause) {
    throw new InvalidSavedGameError(cause)
  }
}
