import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createCloudGameGateway } from '../../src/app/game/cloudGameGateway'
import { createApp } from '../../worker/app'
import { ApiError } from '../../worker/errors'
import type {
  CommitInput,
  CommitResult,
  GameRepository,
  StoredOperation,
} from '../../worker/game/repository'
import { chooseStarter, initialGame } from '../../shared/game/game'
import type { GameSnapshot } from '../../shared/game/contracts'
import type { GameCommand } from '../../shared/game/commands'

const origin = 'https://game.example'
const userId = '00000000-0000-4000-8000-000000000001'
const operationId = '10000000-0000-4000-8000-000000000001'
const day = '2026-09-26'
const photo =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
const saved = () => ({ state: chooseStarter(initialGame(day), 'komugi'), revision: 0 })
const session = (id = userId) => ({
  data: { session: { user: { id }, access_token: 'player-token' } },
  error: null,
})
const nativeFetch = globalThis.fetch

afterEach(() => vi.unstubAllGlobals())

function authClient() {
  const getSession = vi.fn(async () => session())
  return { getSession, client: { auth: { getSession } } as unknown as SupabaseClient }
}

function setup(initialSnapshot: GameSnapshot = saved()) {
  vi.stubGlobal('window', { location: { origin } })
  const { client, getSession } = authClient()
  const calls: Request[] = []
  let snapshot: GameSnapshot = initialSnapshot
  const operations = new Map<string, StoredOperation>()
  const photos = new Map<string, Uint8Array>()
  let failAfterCommit = false
  const repository: GameRepository = {
    async load() {
      return structuredClone(snapshot)
    },
    async findOperation(_user, id) {
      return operations.get(id) ?? null
    },
    async commit(input: CommitInput): Promise<CommitResult> {
      const previous = operations.get(input.operationId)
      if (previous) return { status: 'replayed', snapshot, receipt: previous.receipt }
      snapshot = { state: input.state, revision: snapshot.revision + 1 }
      operations.set(input.operationId, { requestHash: input.requestHash, receipt: input.receipt })
      return { status: 'applied', snapshot, receipt: input.receipt }
    },
    async uploadPhoto(user, id, bytes) {
      if (user !== userId) throw new ApiError(403, 'forbidden')
      photos.set(id, bytes)
    },
    async readPhotoUrls(_user, ids) {
      return ids.map((id) => ({ photoId: id, url: `https://photos.example/${id}?signed` }))
    },
  }
  const app = createApp({
    services: () => ({
      repository,
      authenticate: async (token) => {
        if (token !== 'player-token') throw new ApiError(401, 'unauthorized')
        return userId
      },
    }),
    now: () => new Date('2026-09-26T03:00:00Z'),
    uuid: () => '20000000-0000-4000-8000-000000000001',
  })
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = String(input)
    if (raw.startsWith('data:')) return nativeFetch(input, init)
    const request = new Request(input instanceof Request ? input : new URL(raw, origin), init)
    calls.push(request.clone())
    const response = await app.fetch(request, {
      ASSETS: { fetch: async () => new Response('asset') },
    })
    if (failAfterCommit && new URL(request.url).pathname === '/api/game/commands') {
      failAfterCommit = false
      throw new TypeError('response lost')
    }
    return response
  })
  vi.stubGlobal('fetch', fetchMock)
  return {
    gateway: createCloudGameGateway(client, userId),
    getSession,
    calls,
    photos,
    operations,
    fetchMock,
    snapshot: () => snapshot,
    loseCommandResponse: () => {
      failAfterCommit = true
    },
  }
}

describe('cloud game gateway through the real Worker API', () => {
  it('persists the introduction before selection and replays it after a lost API response', async () => {
    const initial = initialGame(day)
    const { gateway, calls, snapshot, operations, loseCommandResponse } = setup({
      state: initial,
      revision: 0,
    })
    const command = { type: 'tutorial', input: { introSeen: true } } as const
    loseCommandResponse()
    await expect(gateway.execute(command, operationId)).rejects.toThrow('response lost')
    const result = await gateway.execute(command, operationId)
    expect(result).toEqual({
      snapshot: {
        state: { ...initial, tutorial: { ...initial.tutorial, introSeen: true } },
        revision: 1,
      },
      receipt: null,
    })
    expect(snapshot()).toEqual(result.snapshot)
    expect(operations.size).toBe(1)
    expect(await calls[0].json()).toEqual({ operationId, command })
    expect(await calls[1].json()).toEqual({ operationId, command })
    expect(await gateway.load()).toEqual(result.snapshot)
    const selected = await gateway.execute(
      { type: 'chooseStarter', id: 'mame' },
      '10000000-0000-4000-8000-000000000002',
    )
    expect(selected.snapshot.state.tutorial).toEqual(result.snapshot.state.tutorial)
  })

  it('surfaces the free daily limit and persists a mock membership change through the API', async () => {
    const { gateway, snapshot } = setup()
    const command: GameCommand = { type: 'feed', input: { title: 'ごはん', sample: 'rice' } }
    await gateway.execute(command, operationId)
    await expect(gateway.execute(command, '10000000-0000-4000-8000-000000000002')).rejects.toThrow(
      '有料プランに切り替えると',
    )
    expect(snapshot().state.mealRecords).toHaveLength(1)
    const upgraded = await gateway.execute(
      { type: 'setSubscriptionPlan', plan: 'premium' },
      '10000000-0000-4000-8000-000000000003',
    )
    expect(upgraded.snapshot.state.subscriptionPlan).toBe('premium')
    expect((await gateway.load()).state.subscriptionPlan).toBe('premium')
  })

  it('uses the current bearer token, honors cancellation and has no local demo operations', async () => {
    const { gateway, calls } = setup()
    const abort = new AbortController()
    expect(await gateway.load(abort.signal)).toEqual(saved())
    expect(calls[0].headers.get('authorization')).toBe('Bearer player-token')
    expect(calls[0].url).toBe(`${origin}/api/game`)
    expect(calls[0].signal.aborted).toBe(false)
    abort.abort()
    expect(calls[0].signal.aborted).toBe(true)
    expect(gateway.mode).toBe('cloud')
    expect(gateway.identity).toBe(userId)
    expect(gateway.demo).toBeUndefined()
  })

  it('uploads a private photo with the operation ID and sends only its reference in the game command', async () => {
    const { gateway, calls, photos, snapshot } = setup()
    const command: GameCommand = {
      type: 'feed',
      input: { title: 'おにぎり', sample: 'rice', recipeId: 'onigiri', photo },
    }
    const result = await gateway.execute(command, operationId)
    expect(photos.size).toBe(1)
    expect(calls.map((request) => new URL(request.url).pathname)).toEqual([
      '/api/photos',
      '/api/game/commands',
    ])
    expect(calls[0].headers.get('x-operation-id')).toBe(operationId)
    expect(calls[0].headers.get('content-type')).toBe('image/png')
    expect(
      calls.every((request) => request.headers.get('authorization') === 'Bearer player-token'),
    ).toBe(true)
    expect(await calls[1].json()).toEqual({
      operationId,
      command: {
        type: 'feed',
        input: { title: 'おにぎり', sample: 'rice', recipeId: 'onigiri', photoId: operationId },
      },
    })
    expect(command.input.photo).toBe(photo)
    expect(result.receipt!.meal.photoId).toBe(operationId)
    expect(JSON.stringify(snapshot())).not.toContain('data:image')
    expect(snapshot().state.meals).toHaveLength(1)
  })

  it('accepts a photo-free meal draft that explicitly carries photo: undefined', async () => {
    const { gateway, calls, snapshot } = setup()
    await gateway.execute(
      {
        type: 'feed',
        input: { title: 'いつものごはん', sample: 'rice', photo: undefined, recipeId: undefined },
      },
      operationId,
    )
    expect(calls).toHaveLength(1)
    expect(new URL(calls[0].url).pathname).toBe('/api/game/commands')
    expect((await calls[0].json()).command.input).not.toHaveProperty('photo')
    expect(snapshot().state.meals).toHaveLength(1)
  })

  it('reuses both IDs after a lost command response and awards the meal once', async () => {
    const { gateway, loseCommandResponse, snapshot, calls, operations } = setup()
    const command: GameCommand = { type: 'feed', input: { title: 'ごはん', sample: 'rice', photo } }
    loseCommandResponse()
    await expect(gateway.execute(command, operationId)).rejects.toThrow('response lost')
    expect(snapshot().state.meals).toHaveLength(1)
    const result = await gateway.execute(command, operationId)
    expect(result.snapshot.state.meals).toHaveLength(1)
    expect(result.snapshot.revision).toBe(1)
    expect(operations.size).toBe(1)
    expect(
      calls
        .filter((request) => new URL(request.url).pathname === '/api/photos')
        .map((request) => request.headers.get('x-operation-id')),
    ).toEqual([operationId, operationId])
    const commands = await Promise.all(
      calls
        .filter((request) => new URL(request.url).pathname === '/api/game/commands')
        .map((request) => request.json()),
    )
    expect(commands[0]).toEqual(commands[1])
  })

  it('obtains a signed URL only for the requested photo', async () => {
    const { gateway, calls } = setup()
    await gateway.execute(
      { type: 'feed', input: { title: 'ごはん', sample: 'rice', photo } },
      operationId,
    )
    calls.length = 0
    expect(await gateway.photoUrl!(operationId)).toBe(
      `https://photos.example/${operationId}?signed`,
    )
    expect(await calls[0].json()).toEqual({ photoIds: [operationId] })
    expect(calls[0].headers.get('authorization')).toBe('Bearer player-token')
  })

  it('resets through the authenticated API and reuses the operation after a lost response', async () => {
    const { gateway, calls, snapshot, operations, loseCommandResponse } = setup()
    const resetId = '10000000-0000-4000-8000-000000000002'
    await gateway.execute(
      { type: 'feed', input: { title: 'ごはん', sample: 'rice', photo } },
      operationId,
    )
    expect(snapshot().state.meals).toHaveLength(1)
    calls.length = 0
    loseCommandResponse()
    await expect(gateway.execute({ type: 'resetProgress' }, resetId)).rejects.toThrow(
      'response lost',
    )
    expect(snapshot().state).toEqual(initialGame(day))
    const result = await gateway.execute({ type: 'resetProgress' }, resetId)
    expect(result.snapshot.state).toEqual(initialGame(day))
    expect(result.snapshot.revision).toBe(2)
    expect(result.receipt).toBeNull()
    expect(operations.size).toBe(2)
    expect(gateway.identity).toBe(userId)
    expect(calls).toHaveLength(2)
    expect(
      calls.every((request) => request.headers.get('authorization') === 'Bearer player-token'),
    ).toBe(true)
    expect(await calls[0].json()).toEqual({
      operationId: resetId,
      command: { type: 'resetProgress' },
    })
    expect(await calls[1].json()).toEqual({
      operationId: resetId,
      command: { type: 'resetProgress' },
    })
    expect((await gateway.load()).state).toEqual(initialGame(day))
    await expect(gateway.photoUrl!(operationId)).rejects.toThrow()
  })

  it('rechecks identity between photo upload and commit if the account changes', async () => {
    const { gateway, getSession, calls, snapshot } = setup()
    getSession.mockResolvedValueOnce(session()).mockResolvedValueOnce(session('other-user'))
    await expect(
      gateway.execute({ type: 'feed', input: { title: 'x', sample: 'rice', photo } }, operationId),
    ).rejects.toThrow('ログインし直し')
    expect(calls).toHaveLength(1)
    expect(snapshot().state.meals).toHaveLength(0)
  })
})

describe('cloud failure behavior', () => {
  it.each([401, 409, 422, 503])(
    'rejects HTTP %s without creating local state or retrying behind the caller',
    async (status) => {
      const { gateway, fetchMock } = setup()
      fetchMock.mockImplementation(async () => new Response('{"error":"unavailable"}', { status }))
      await expect(gateway.load()).rejects.toThrow()
      expect(fetchMock).toHaveBeenCalledTimes(1)
    },
  )

  it('rejects an invalid cloud snapshot with a readable error', async () => {
    const { gateway, fetchMock } = setup()
    fetchMock.mockImplementation(async () => Response.json({ state: {}, revision: 1 }))
    await expect(gateway.load()).rejects.toThrow('保存された記録を確認できませんでした')
  })

  it('does not submit the game command when upload fails', async () => {
    const { gateway, calls, fetchMock } = setup()
    const forward = fetchMock.getMockImplementation()!
    fetchMock.mockImplementation(async (input, init) =>
      String(input).startsWith('data:')
        ? forward(input, init)
        : new Response(null, { status: 413 }),
    )
    await expect(
      gateway.execute({ type: 'feed', input: { title: 'x', sample: 'rice', photo } }, operationId),
    ).rejects.toThrow('写真のサイズが大きすぎます')
    expect(calls).toEqual([])
    expect(
      fetchMock.mock.calls.filter(([input]) => String(input).includes('/api/game/commands')),
    ).toHaveLength(0)
  })

  it('does not access the API with another account session', async () => {
    const { gateway, getSession, fetchMock } = setup()
    getSession.mockResolvedValue(session('someone-else'))
    await expect(gateway.load()).rejects.toThrow('ログインし直し')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
