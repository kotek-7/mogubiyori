import type { GameSnapshot, CommandResponse } from '../shared/contracts'
import type { GameState } from '../shared/types'

export type StoredOperation = {
  requestHash: string
  receipt: CommandResponse['receipt']
}

export type CommitInput = {
  userId: string
  operationId: string
  requestHash: string
  kind: string
  expectedRevision: number
  state: GameState
  receipt: CommandResponse['receipt']
  photoId?: string
  mealId?: string
}

export type CommitResult =
  | { status: 'applied' | 'replayed'; snapshot: GameSnapshot; receipt: CommandResponse['receipt'] }
  | { status: 'conflict' }
  | { status: 'operation_mismatch' }
  | { status: 'invalid_photo' }

export interface GameRepository {
  load(userId: string, initialState: GameState): Promise<GameSnapshot>
  findOperation(userId: string, operationId: string): Promise<StoredOperation | null>
  commit(input: CommitInput): Promise<CommitResult>
  uploadPhoto(userId: string, photoId: string, bytes: Uint8Array, mime: string): Promise<void>
  readPhotoUrls(userId: string, photoIds: string[]): Promise<{ photoId: string; url: string }[]>
}

export interface CloudServices {
  authenticate(token: string): Promise<string>
  repository: GameRepository
}
