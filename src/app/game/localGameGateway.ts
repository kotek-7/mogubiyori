import { applyGameCommand } from '../../../shared/game/commands'
import type { GameCommand } from '../../../shared/game/commands'
import type { CommandResponse, GameSnapshot } from '../../../shared/game/contracts'
import { mealRecordUpdateSchema } from '../../../shared/meals/schemas'
import {
  addDemoGems,
  advanceGame,
  demoGame,
  initialGame,
  shiftDay,
  todayTokyo,
} from './browserGame'
import { loadGame, saveGame } from './gameStorage'
import type { GameState } from './browserGame'
import type { DemoCommand, GameGateway } from './gameGateway'

type Storage = { read: () => GameState; write: (state: GameState) => boolean }

export function createLocalGameGateway(
  storage: Storage = { read: loadGame, write: saveGame },
  today: () => string = todayTokyo,
): GameGateway {
  let revision = 0
  let tail: Promise<unknown> = Promise.resolve()
  const completed = new Map<string, { command: string; receipt: CommandResponse['receipt'] }>()
  const serial = <T>(operation: () => T | Promise<T>): Promise<T> => {
    const result = tail.then(operation)
    tail = result.catch(() => undefined)
    return result
  }
  const currentState = (): GameState => {
    const state = storage.read()
    const currentDay = shiftDay(today(), state.dayOffset)
    return state.today === currentDay ? state : { ...state, today: currentDay }
  }
  const save = (state: GameState): GameSnapshot => {
    if (!storage.write(state))
      throw new Error(
        'この端末に保存できませんでした。入力を残しているので、もう一度お試しください。',
      )
    return { state, revision: ++revision }
  }
  return {
    mode: 'local',
    identity: 'local',
    load: (signal) =>
      serial(() => {
        signal?.throwIfAborted()
        return { state: currentState(), revision }
      }),
    execute: (command: GameCommand, operationId: string) =>
      serial(() => {
        const encoded = JSON.stringify(command)
        const previous = completed.get(operationId)
        if (previous) {
          if (previous.command !== encoded)
            throw new Error('同じ操作IDに別の入力は使用できません。')
          const state = currentState()
          // A completed meal must not reappear as a reward after progress was reset.
          const receipt = state.meals.some((meal) => meal.id === previous.receipt?.meal.id)
            ? previous.receipt
            : null
          return { snapshot: { state, revision }, receipt }
        }
        const state = currentState()
        if (
          command.type === 'updateMealRecord' &&
          (!mealRecordUpdateSchema.safeParse(command.input).success ||
            command.input.day > state.today ||
            !state.mealRecords?.some((record) => record.id === command.id))
        )
          throw new Error('食事の日付や記録を確認してください。')
        const result = applyGameCommand(state, command, {
          today: command.type === 'resetProgress' ? today() : state.today,
          mealId: `meal-${operationId}`,
        })
        if (command.type === 'feed' && !result.receipt)
          throw new Error('ごはんの相手を選び直してください。')
        if (!result.changed && ['purchase', 'rest', 'chooseStarter'].includes(command.type))
          throw new Error('操作を完了できませんでした。現在の状態を確認してください。')
        const snapshot = result.changed ? save(result.state) : { state: result.state, revision }
        const response: CommandResponse = { snapshot, receipt: result.receipt }
        completed.set(operationId, { command: encoded, receipt: result.receipt })
        return response
      }),
    demo: (command: DemoCommand) =>
      serial(() => {
        const current = currentState()
        const state =
          command.type === 'advanceDay'
            ? advanceGame(current)
            : command.type === 'addGems'
              ? addDemoGems(current)
              : command.preset === 'fresh'
                ? initialGame(today())
                : demoGame(today())
        const snapshot = save(state)
        completed.clear()
        return snapshot
      }),
  }
}
