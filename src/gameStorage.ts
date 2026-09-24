import { initialGame, todayTokyo } from './game'
import type { GameState } from './game'
import { decodeGame } from '../shared/stateCodec'

export const GAME_STORAGE_KEY = 'mogubiyori-v1'

/** Compatibility policy for local demo saves only; remote adapters use decodeGame. */
export function parseGame(raw: string | null, realDay = todayTokyo()): GameState {
  if (!raw) return initialGame(realDay)
  try {
    return decodeGame(JSON.parse(raw) as unknown, realDay)
  } catch {
    return initialGame(realDay)
  }
}

export function loadGame(): GameState {
  try {
    return parseGame(localStorage.getItem(GAME_STORAGE_KEY))
  } catch {
    return initialGame()
  }
}

export function saveGame(state: GameState): boolean {
  try {
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
