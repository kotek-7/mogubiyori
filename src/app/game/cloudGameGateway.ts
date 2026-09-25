import { hc } from 'hono/client'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppType } from '../../../worker/app'
import {
  commandResponseSchema,
  gameCommandSchema,
  gameSnapshotSchema,
} from '../../../shared/game/contracts'
import type { GameGateway } from './gameGateway'
import { DAILY_MEAL_LIMIT_MESSAGE } from '../../../shared/game/subscription'

function validated<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success)
    throw new Error('保存された記録を確認できませんでした。もう一度読み込んでください。')
  return result.data
}

export function createCloudGameGateway(auth: SupabaseClient, userId: string): GameGateway {
  const authenticatedFetch: typeof fetch = async (input, init) => {
    const { data, error } = await auth.auth.getSession()
    if (error || !data.session || data.session.user.id !== userId)
      throw new Error('ログインし直してください。入力はこの画面に残っています。')
    const headers = new Headers(init?.headers)
    headers.set('Authorization', `Bearer ${data.session.access_token}`)
    const response = await fetch(input, {
      ...init,
      headers,
      signal: init?.signal ?? AbortSignal.timeout(30_000),
    })
    if (!response.ok) {
      if (response.status === 401) throw new Error('ログインし直してください。')
      if (response.status === 409)
        throw new Error('記録が更新されています。もう一度お試しください。')
      if (response.status === 413)
        throw new Error('写真のサイズが大きすぎます。別の写真を選んでください。')
      if (response.status === 422) {
        const body: unknown = await response.json().catch(() => null)
        if (
          body &&
          typeof body === 'object' &&
          'error' in body &&
          body.error === 'daily_meal_limit_reached'
        )
          throw new Error(DAILY_MEAL_LIMIT_MESSAGE)
        throw new Error('操作を完了できませんでした。現在の記録を確認してください。')
      }
      throw new Error('保存サービスに接続できませんでした。もう一度お試しください。')
    }
    return response
  }
  const client = hc<AppType>(window.location.origin, { fetch: authenticatedFetch })
  return {
    mode: 'cloud',
    identity: userId,
    async load(signal) {
      const response = await client.api.game.$get({}, { init: { signal } })
      return validated(gameSnapshotSchema, await response.json())
    },
    async execute(command, operationId) {
      let wireCommand = command
      if (command.type === 'feed') {
        const { photo, ...input } = command.input
        let photoId = input.photoId
        if (photo) {
          const blob = await (await fetch(photo)).blob()
          const uploaded = await authenticatedFetch('/api/photos', {
            method: 'POST',
            headers: { 'Content-Type': blob.type, 'X-Operation-Id': operationId },
            body: blob,
          })
          photoId = validated(z.object({ photoId: z.uuid() }), await uploaded.json()).photoId
        }
        // Even an undefined local photo field is not part of the wire schema.
        wireCommand = { type: 'feed', input: { ...input, ...(photoId ? { photoId } : {}) } }
      }
      const parsed = gameCommandSchema.safeParse(wireCommand)
      if (!parsed.success)
        throw new Error('入力を確認できませんでした。料理や相手を選び直してください。')
      const response = await client.api.game.commands.$post({
        json: { operationId, command: parsed.data },
      })
      return validated(commandResponseSchema, await response.json())
    },
    async photoUrl(photoId, signal) {
      const response = await authenticatedFetch('/api/photos/read-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds: [photoId] }),
        signal,
      })
      const result = validated(
        z.object({ photos: z.array(z.object({ photoId: z.string(), url: z.url() })) }),
        await response.json(),
      )
      const photo = result.photos.find((photo) => photo.photoId === photoId)
      if (!photo) throw new Error('写真を読み込めませんでした。')
      return photo.url
    },
  }
}
