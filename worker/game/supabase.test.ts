import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCloudServices } from './supabase'
import { initialGame } from '../../shared/game/game'

const userId = '00000000-0000-4000-8000-000000000001'
const otherUserId = '00000000-0000-4000-8000-000000000002'
const photoId = '10000000-0000-4000-8000-000000000001'
const env = {
  SUPABASE_URL: 'https://supabase.example',
  SUPABASE_SERVICE_ROLE_KEY: 'server-secret',
  ASSETS: { fetch: async () => new Response('asset') },
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

afterEach(() => vi.unstubAllGlobals())

describe('Supabase HTTP adapter', () => {
  it('verifies the caller through Auth but uses the server key for database access', async () => {
    const requests: Request[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init)
        requests.push(request)
        if (new URL(request.url).pathname === '/auth/v1/user')
          return json({
            id: userId,
            aud: 'authenticated',
            role: 'authenticated',
            email: '',
            app_metadata: {},
            user_metadata: {},
            created_at: '',
          })
        return json({ state: initialGame('2026-09-26'), revision: 0 })
      }),
    )
    const services = createCloudServices(env)
    expect(await services.authenticate('verified-player-token')).toBe(userId)
    await services.repository.load(userId, initialGame('2026-09-26'))
    expect(requests[0].headers.get('authorization')).toBe('Bearer verified-player-token')
    expect(requests[1].headers.get('authorization')).toBe('Bearer server-secret')
    expect(await requests[1].json()).toMatchObject({ p_user_id: userId })
  })

  it('rejects corrupt cloud state without creating a replacement save', async () => {
    const mock = vi.fn(async () => json({ state: { coins: 999 }, revision: 4 }))
    vi.stubGlobal('fetch', mock)
    await expect(
      createCloudServices(env).repository.load(userId, initialGame('2026-09-26')),
    ).rejects.toMatchObject({ status: 503, message: 'invalid_saved_game' })
    expect(mock).toHaveBeenCalledTimes(1)
  })

  it('checks every requested photo owner before issuing any signed URL', async () => {
    const requests: Request[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init)
        requests.push(request)
        return json([])
      }),
    )
    await expect(
      createCloudServices(env).repository.readPhotoUrls(otherUserId, [photoId]),
    ).rejects.toMatchObject({ status: 404, message: 'photo_not_found' })
    expect(requests).toHaveLength(1)
    const query = new URL(requests[0].url).searchParams
    expect(query.get('user_id')).toBe(`eq.${otherUserId}`)
    expect(query.get('status')).toBe('eq.uploaded')
    expect(query.get('id')).toContain(photoId)
  })

  it('signs only owned object keys for five minutes', async () => {
    let signing: unknown
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init)
        if (new URL(request.url).pathname === '/rest/v1/photo_assets')
          return json([{ id: photoId, object_key: `${userId}/${photoId}` }])
        signing = await request.json()
        return json([
          {
            path: `${userId}/${photoId}`,
            signedURL: '/object/sign/meal-photos/example?token=secret',
          },
        ])
      }),
    )
    const photos = await createCloudServices(env).repository.readPhotoUrls(userId, [photoId])
    expect(signing).toEqual({ paths: [`${userId}/${photoId}`], expiresIn: 300 })
    expect(photos[0]).toEqual({
      photoId,
      url: 'https://supabase.example/storage/v1/object/sign/meal-photos/example?token=secret',
    })
  })

  it('recovers an interrupted immutable upload using the reserved content hash', async () => {
    let reservation: Record<string, unknown> = {}
    let completed = false
    let uploads = 0
    const requests: Request[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init)
        requests.push(request)
        const path = new URL(request.url).pathname
        if (path === '/rest/v1/photo_assets') {
          if (request.method === 'POST') {
            reservation = await request.json()
            return new Response(null, { status: 201 })
          }
          if (request.method === 'GET')
            return json({
              content_hash: reservation.content_hash,
              mime: 'image/png',
              status: completed ? 'uploaded' : 'uploading',
            })
          completed = true
          return new Response(null, { status: 204 })
        }
        uploads += 1
        return json(
          { statusCode: '409', error: 'Duplicate', message: 'The resource already exists' },
          409,
        )
      }),
    )
    const services = createCloudServices(env)
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    await services.repository.uploadPhoto(userId, photoId, bytes, 'image/png')
    await services.repository.uploadPhoto(userId, photoId, bytes, 'image/png')
    expect(completed).toBe(true)
    expect(uploads).toBe(1)
    expect(reservation).toMatchObject({
      id: photoId,
      user_id: userId,
      object_key: `${userId}/${photoId}`,
    })
    expect(String(reservation.content_hash)).toHaveLength(64)
    const upload = requests.find((request) =>
      new URL(request.url).pathname.startsWith('/storage/'),
    )!
    expect(upload.headers.get('x-upsert')).toBe('false')
  })

  it('does not replace a previously reserved photo with a different image', async () => {
    const requests: Request[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init)
        requests.push(request)
        return request.method === 'POST'
          ? new Response(null, { status: 201 })
          : json({ content_hash: 'different', mime: 'image/png', status: 'uploaded' })
      }),
    )
    await expect(
      createCloudServices(env).repository.uploadPhoto(
        userId,
        photoId,
        new Uint8Array([1]),
        'image/png',
      ),
    ).rejects.toMatchObject({ status: 409, message: 'operation_mismatch' })
    expect(
      requests.every((request) => !new URL(request.url).pathname.startsWith('/storage/')),
    ).toBe(true)
  })
})
