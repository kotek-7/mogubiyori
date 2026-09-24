import {
  chooseStarter,
  claimLogin,
  equipItem,
  feed,
  purchaseItem,
  restGame,
  selectCompanion,
} from './game'
import { createFeedReceipt } from './receipt'
import type { FeedReceipt } from './receipt'
import type { FeedInput, GameState, SpeciesId, TutorialState } from './types'

export type GameCommand =
  | { type: 'chooseStarter'; id: SpeciesId }
  | { type: 'selectCompanion'; id: SpeciesId }
  | { type: 'feed'; input: FeedInput }
  | { type: 'purchase'; id: string }
  | { type: 'equip'; id: string }
  | { type: 'rest' }
  | { type: 'claimLogin' }
  | { type: 'updateSettings'; input: { name?: string; reminder?: GameState['reminder'] } }
  | { type: 'tutorial'; input: Partial<Pick<TutorialState, 'step' | 'status' | 'homeGuide'>> }

export type CommandEnvironment = { today: string; mealId: string }
export type GameCommandResult = { state: GameState; receipt: FeedReceipt | null; changed: boolean }

/** Clock, IDs, persistence and network retries belong to the calling adapter. */
export function applyGameCommand(
  state: GameState,
  command: GameCommand,
  environment: CommandEnvironment,
): GameCommandResult {
  const current = state.today === environment.today ? state : { ...state, today: environment.today }
  let next: GameState
  switch (command.type) {
    case 'chooseStarter':
      next = chooseStarter(current, command.id)
      break
    case 'selectCompanion':
      next = selectCompanion(current, command.id)
      break
    case 'feed':
      next = feed(current, command.input, environment)
      if (next !== current && next.tutorial.homeGuide === 'meal')
        next = { ...next, tutorial: { ...next.tutorial, homeGuide: 'growth' } }
      break
    case 'purchase':
      next = purchaseItem(current, command.id)
      break
    case 'equip':
      next = equipItem(current, command.id)
      break
    case 'rest':
      next = restGame(current)
      break
    case 'claimLogin':
      next = claimLogin(current)
      break
    case 'updateSettings': {
      const name = command.input.name?.trim() || current.name
      const reminder = command.input.reminder ?? current.reminder
      next =
        name === current.name && reminder === current.reminder
          ? current
          : { ...current, name, reminder }
      break
    }
    case 'tutorial': {
      const tutorial = { ...current.tutorial, ...command.input }
      next =
        tutorial.step === current.tutorial.step &&
        tutorial.status === current.tutorial.status &&
        tutorial.homeGuide === current.tutorial.homeGuide
          ? current
          : { ...current, tutorial }
      break
    }
  }
  return {
    state: next,
    receipt: command.type === 'feed' && next !== current ? createFeedReceipt(current, next) : null,
    changed: next !== state,
  }
}
