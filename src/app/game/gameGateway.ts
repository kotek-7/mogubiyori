import type { GameCommand } from '../../../shared/game/commands'
import type { CommandResponse, GameSnapshot } from '../../../shared/game/contracts'

export type DemoCommand =
  { type: 'advanceDay' } | { type: 'addGems' } | { type: 'reset'; preset: 'fresh' | 'seed' }

/** UI uses the same operation boundary for local play and the cloud service. */
export interface GameGateway {
  readonly mode: 'local' | 'cloud'
  readonly identity: string
  load(signal?: AbortSignal): Promise<GameSnapshot>
  execute(command: GameCommand, operationId: string): Promise<CommandResponse>
  demo?(command: DemoCommand): Promise<GameSnapshot>
  photoUrl?(photoId: string, signal?: AbortSignal): Promise<string>
}
