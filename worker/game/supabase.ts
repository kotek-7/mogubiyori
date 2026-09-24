import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { GameState } from '../../shared/game/types'
import { feedReceiptSchema, gameSnapshotSchema } from '../../shared/game/contracts'
import type { GameSnapshot } from '../../shared/game/contracts'
import type { Env } from '../env'
import { ApiError } from '../errors'
import type {
  CloudServices,
  CommitInput,
  CommitResult,
  GameRepository,
  StoredOperation,
} from './repository'

export const PHOTO_URL_LIFETIME = 300
const commitResultSchema = z.union([
  z.object({
    status: z.enum(['applied', 'replayed']),
    snapshot: gameSnapshotSchema,
    receipt: feedReceiptSchema.nullable(),
  }),
  z.object({ status: z.literal('conflict') }),
  z.object({ status: z.literal('operation_mismatch') }),
  z.object({ status: z.literal('invalid_photo') }),
])

function required<T>(data: T | null, error: unknown): T {
  if (error || data === null) throw new ApiError(502, 'storage_unavailable')
  return data
}

export class SupabaseGameRepository implements GameRepository {
  private readonly client: SupabaseClient
  private readonly bucket: string

  constructor(client: SupabaseClient, bucket: string) {
    this.client = client
    this.bucket = bucket
  }

  async load(userId: string, initialState: GameState): Promise<GameSnapshot> {
    const { data, error } = await this.client.rpc('bootstrap_game', {
      p_user_id: userId,
      p_state: initialState,
    })
    const parsed = gameSnapshotSchema.safeParse(required(data, error))
    if (!parsed.success) throw new ApiError(503, 'invalid_saved_game')
    return parsed.data
  }

  async findOperation(userId: string, operationId: string): Promise<StoredOperation | null> {
    const { data, error } = await this.client
      .from('game_operations')
      .select('request_hash,receipt')
      .eq('user_id', userId)
      .eq('operation_id', operationId)
      .maybeSingle()
    if (error) throw new ApiError(502, 'storage_unavailable')
    if (!data) return null
    const receipt = feedReceiptSchema.nullable().safeParse(data.receipt)
    if (!receipt.success) throw new ApiError(503, 'invalid_saved_game')
    return { requestHash: data.request_hash, receipt: receipt.data }
  }

  async commit(input: CommitInput): Promise<CommitResult> {
    const { data, error } = await this.client.rpc('commit_game_command', {
      p_user_id: input.userId,
      p_operation_id: input.operationId,
      p_request_hash: input.requestHash,
      p_kind: input.kind,
      p_expected_revision: input.expectedRevision,
      p_state: input.state,
      p_receipt: input.receipt,
      p_photo_id: input.photoId ?? null,
      p_meal_id: input.mealId ?? null,
    })
    const parsed = commitResultSchema.safeParse(required(data, error))
    if (!parsed.success) throw new ApiError(503, 'invalid_saved_game')
    return parsed.data
  }

  async uploadPhoto(
    userId: string,
    photoId: string,
    bytes: Uint8Array,
    mime: string,
  ): Promise<void> {
    const digest = await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>)
    const hash = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('')
    const objectKey = `${userId}/${photoId}`
    const reservation = await this.client.from('photo_assets').upsert(
      {
        id: photoId,
        user_id: userId,
        object_key: objectKey,
        bytes: bytes.byteLength,
        mime,
        content_hash: hash,
        status: 'uploading',
      },
      { onConflict: 'id', ignoreDuplicates: true },
    )
    if (reservation.error) throw new ApiError(502, 'storage_unavailable')
    const record = await this.client
      .from('photo_assets')
      .select('content_hash,mime,status')
      .eq('id', photoId)
      .eq('user_id', userId)
      .maybeSingle()
    if (record.error) throw new ApiError(502, 'storage_unavailable')
    if (!record.data || record.data.content_hash !== hash || record.data.mime !== mime)
      throw new ApiError(409, 'operation_mismatch')
    if (record.data.status === 'uploaded') return
    const uploaded = await this.client.storage
      .from(this.bucket)
      .upload(objectKey, bytes, { contentType: mime, upsert: false })
    // The object name is immutable and its reserved digest was checked above.
    // A duplicate means a previous identical upload lost its HTTP response.
    if (uploaded.error) {
      const error = uploaded.error as { statusCode?: string; code?: string }
      if (
        error.statusCode !== '409' &&
        error.code !== 'Duplicate' &&
        error.code !== 'ResourceAlreadyExists'
      )
        throw new ApiError(502, 'photo_upload_failed')
    }
    const completed = await this.client
      .from('photo_assets')
      .update({ status: 'uploaded' })
      .eq('id', photoId)
      .eq('user_id', userId)
      .eq('content_hash', hash)
    if (completed.error) throw new ApiError(502, 'storage_unavailable')
  }

  async readPhotoUrls(
    userId: string,
    photoIds: string[],
  ): Promise<{ photoId: string; url: string }[]> {
    if (!photoIds.length) return []
    const unique = [...new Set(photoIds)]
    const selected = await this.client
      .from('photo_assets')
      .select('id,object_key')
      .eq('user_id', userId)
      .eq('status', 'uploaded')
      .in('id', unique)
    const records = required(selected.data, selected.error)
    if (records.length !== unique.length) throw new ApiError(404, 'photo_not_found')
    const signed = await this.client.storage.from(this.bucket).createSignedUrls(
      records.map((record) => record.object_key),
      PHOTO_URL_LIFETIME,
    )
    const urls = required(signed.data, signed.error)
    return records.map((record) => {
      const url = urls.find((entry) => entry.path === record.object_key)
      if (!url?.signedUrl || url.error) throw new ApiError(502, 'photo_url_failed')
      return { photoId: record.id, url: url.signedUrl }
    })
  }
}

export function createCloudServices(env: Env): CloudServices {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
    throw new ApiError(503, 'cloud_not_configured')
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15_000) }),
    },
  })
  return {
    async authenticate(token) {
      const { data, error } = await client.auth.getUser(token)
      if (error && (!error.status || error.status >= 500))
        throw new ApiError(503, 'auth_unavailable')
      if (error || !data.user) throw new ApiError(401, 'unauthorized')
      return data.user.id
    },
    repository: new SupabaseGameRepository(client, env.SUPABASE_PHOTO_BUCKET ?? 'meal-photos'),
  }
}
