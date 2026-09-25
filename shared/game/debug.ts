import { growthStages } from '../content/catalog'
import { advanceGame, demoGame } from './demo'
import { initialGame } from './game'
import type { GameState, GrowthStage, SpeciesId } from './types'

export type DebugGameCommand =
  | { type: 'debugAdvanceDays'; days: number }
  | { type: 'debugSetGrowth'; id: SpeciesId; stage: GrowthStage }
  | { type: 'debugReset'; preset: 'seed' | 'fresh' }

export function isDebugGameCommand(command: { type: string }): command is DebugGameCommand {
  return ['debugAdvanceDays', 'debugSetGrowth', 'debugReset'].includes(command.type)
}

export function advanceDebugDays(state: GameState, days: number): GameState {
  if (!Number.isInteger(days) || days < 1 || days > 30) return state
  return advanceGame(state, days)
}

export function setDebugGrowth(state: GameState, id: SpeciesId, stage: GrowthStage): GameState {
  const companion = state.companions.find((entry) => entry.id === id)
  const growth = growthStages.find((entry) => entry.stage === stage)
  if (!companion || !growth || companion.xp === growth.threshold) return state
  return {
    ...state,
    companions: state.companions.map((entry) =>
      entry.id === id ? { ...entry, xp: growth.threshold } : entry,
    ),
    // The top-level XP mirrors the selected companion, not the sum of all companions.
    xp: state.activeId === id ? growth.threshold : state.xp,
  }
}

export function resetDebugProgress(
  state: GameState,
  preset: 'seed' | 'fresh',
  realToday: string,
): GameState {
  return {
    ...(preset === 'seed' ? demoGame(realToday) : initialGame(realToday)),
    subscriptionPlan: state.subscriptionPlan,
  }
}
