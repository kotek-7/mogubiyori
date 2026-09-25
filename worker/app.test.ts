import { describe, expect, it } from 'vitest'
import { createApp } from './app'
import { ApiError } from './errors'
import type { CommitInput, CommitResult, GameRepository, StoredOperation } from './game/repository'
import type { GameSnapshot } from '../shared/game/contracts'
import type { GameState } from '../shared/game/types'
import type { GameCommand } from '../shared/game/commands'
import { chooseStarter, initialGame } from '../shared/game/game'
import { demoGame } from '../shared/game/demo'
import { executeCommand } from './game/gameService'

const userA = '00000000-0000-4000-8000-000000000001'
const userB = '00000000-0000-4000-8000-000000000002'
const opA = '10000000-0000-4000-8000-000000000001'
const opB = '10000000-0000-4000-8000-000000000002'
const opC = '10000000-0000-4000-8000-000000000003'
const mealId = '20000000-0000-4000-8000-000000000001'
const day = '2026-09-26'
const feed: GameCommand = {
  type: 'feed',
  input: { title: '今日のカレー', sample: 'rice', recipeId: 'curry' },
}
const env = { ASSETS: { fetch: async () => new Response('asset') } }

class MemoryRepository implements GameRepository {
  games = new Map<string, GameSnapshot>()
  operations = new Map<string, StoredOperation>()
  photos = new Map<string, { userId: string; bytes: Uint8Array; mime: string; mealId?: string }>()
  conflicts = 0

  async load(userId: string, initialState: GameState) {
    if (!this.games.has(userId)) this.games.set(userId, { state: initialState, revision: 0 })
    return structuredClone(this.games.get(userId)!)
  }
  async findOperation(userId: string, operationId: string) {
    return this.operations.get(`${userId}/${operationId}`) ?? null
  }
  async commit(input: CommitInput): Promise<CommitResult> {
    const snapshot = this.games.get(input.userId)!
    const previous = await this.findOperation(input.userId, input.operationId)
    if (previous)
      return previous.requestHash !== input.requestHash
        ? { status: 'operation_mismatch' }
        : { status: 'replayed', snapshot, receipt: previous.receipt }
    if (this.conflicts-- > 0) {
      // Model another device's independently committed update.
      this.games.set(input.userId, {
        state: { ...snapshot.state, coins: snapshot.state.coins + 7 },
        revision: snapshot.revision + 1,
      })
      return { status: 'conflict' }
    }
    if (snapshot.revision !== input.expectedRevision) return { status: 'conflict' }
    if (input.photoId) {
      const photo = this.photos.get(input.photoId)
      if (!photo || photo.userId !== input.userId || photo.mealId)
        return { status: 'invalid_photo' }
      photo.mealId = input.mealId
    }
    const next = { state: input.state, revision: snapshot.revision + 1 }
    this.games.set(input.userId, next)
    this.operations.set(`${input.userId}/${input.operationId}`, {
      requestHash: input.requestHash,
      receipt: input.receipt,
    })
    return { status: 'applied', snapshot: structuredClone(next), receipt: input.receipt }
  }
  async uploadPhoto(userId: string, photoId: string, bytes: Uint8Array, mime: string) {
    const previous = this.photos.get(photoId)
    if (
      previous &&
      (previous.userId !== userId ||
        previous.mime !== mime ||
        String(previous.bytes) !== String(bytes))
    )
      throw new ApiError(409, 'operation_mismatch')
    if (!previous) this.photos.set(photoId, { userId, bytes, mime })
  }
  async readPhotoUrls(userId: string, photoIds: string[]) {
    return photoIds.map((photoId) => {
      if (this.photos.get(photoId)?.userId !== userId) throw new ApiError(404, 'photo_not_found')
      return { photoId, url: `https://photos.example/${photoId}?signed` }
    })
  }
}

function setup() {
  const repository = new MemoryRepository()
  repository.games.set(userA, {
    state: chooseStarter(initialGame('2026-09-25'), 'komugi'),
    revision: 0,
  })
  const app = createApp({
    services: () => ({
      repository,
      authenticate: async (token) => {
        if (token === 'user-a') return userA
        if (token === 'user-b') return userB
        throw new ApiError(401, 'unauthorized')
      },
    }),
    now: () => new Date('2026-09-25T15:01:00Z'),
    uuid: () => mealId,
  })
  function request(path: string, body?: unknown, token = 'user-a') {
    return app.request(
      `https://game.example${path}`,
      {
        method: body === undefined ? 'GET' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      },
      env,
    )
  }
  return { repository, app, request }
}

describe('server-authoritative game API', () => {
  it('persists the mock plan and enforces daily limits against the latest server state', async () => {
    const { repository, request } = setup()
    const first = await executeCommand(repository, userA, opA, feed, { today: day, mealId })
    const blocked = await request('/api/game/commands', { operationId: opB, command: feed })
    expect(blocked.status).toBe(422)
    expect(await blocked.json()).toEqual({ error: 'daily_meal_limit_reached' })
    expect(repository.games.get(userA)!.state).toEqual(first.snapshot.state)
    const upgraded = await request('/api/game/commands', {
      operationId: opB,
      command: { type: 'setSubscriptionPlan', plan: 'premium' },
    })
    expect(upgraded.status).toBe(200)
    expect((await (await request('/api/game')).json()).state.subscriptionPlan).toBe('premium')
    const second = await executeCommand(repository, userA, 'second-meal', feed, {
      today: day,
      mealId: 'second',
    })
    expect(second.snapshot.state.mealRecords).toHaveLength(2)
    const downgraded = await executeCommand(
      repository,
      userA,
      'downgrade',
      { type: 'setSubscriptionPlan', plan: 'free' },
      { today: day, mealId: 'unused' },
    )
    expect(downgraded.snapshot.state.mealRecords).toEqual(second.snapshot.state.mealRecords)
    await expect(
      executeCommand(repository, userA, 'third-meal', feed, { today: day, mealId: 'third' }),
    ).rejects.toThrow('daily_meal_limit_reached')
    const replayed = await executeCommand(repository, userA, opA, feed, { today: day, mealId })
    expect(replayed.receipt).toEqual(first.receipt)
    expect(replayed.snapshot.state.mealRecords).toHaveLength(2)
  })

  it('requires configured cloud and a verified bearer token instead of falling back to local state', async () => {
    const response = await createApp().request('https://game.example/api/game', {}, env)
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'cloud_not_configured' })
    const { app, request } = setup()
    expect((await app.request('https://game.example/api/game', {}, env)).status).toBe(401)
    expect((await request('/api/game', undefined, 'untrusted')).status).toBe(401)
  })

  it('bootstraps separate users and derives the day in Tokyo from the server clock', async () => {
    const { request } = setup()
    const first = await (await request('/api/game')).json()
    const second = await (await request('/api/game', undefined, 'user-b')).json()
    expect(first.state.today).toBe(day)
    expect(first.state.dayOffset).toBe(0)
    expect(second.state.activeId).toBeNull()
    expect(second.revision).toBe(0)
  })

  it('awards one meal and replays the original receipt after a lost response', async () => {
    const { request, repository } = setup()
    const first = await (
      await request('/api/game/commands', { operationId: opA, command: feed })
    ).json()
    const second = await (
      await request('/api/game/commands', { operationId: opA, command: feed })
    ).json()
    expect(first).toEqual(second)
    expect(first.receipt.meal.id).toBe(mealId)
    expect(first.receipt.meal.day).toBe(day)
    expect(first.snapshot.state.meals).toHaveLength(1)
    expect(first.snapshot.revision).toBe(1)
    expect(repository.operations.size).toBe(1)
    expect(first.receipt.target.afterXp).toBe(45)
  })

  it('returns the latest snapshot alongside the original receipt on a later replay', async () => {
    const { request } = setup()
    const first = await (
      await request('/api/game/commands', { operationId: opA, command: feed })
    ).json()
    await request('/api/game/commands', {
      operationId: opB,
      command: { type: 'updateSettings', input: { name: 'ぽん' } },
    })
    const replay = await (
      await request('/api/game/commands', { operationId: opA, command: feed })
    ).json()
    expect(replay.receipt).toEqual(first.receipt)
    expect(replay.snapshot.state.name).toBe('ぽん')
    expect(replay.snapshot.revision).toBe(2)
  })

  it('resets only the authenticated user and retains the account for a new game', async () => {
    const { app, request, repository } = setup()
    repository.games.set(userA, { state: demoGame('2026-09-25'), revision: 8 })
    const other = { state: demoGame('2026-09-24'), revision: 4 }
    repository.games.set(userB, structuredClone(other))
    const body = { operationId: opA, command: { type: 'resetProgress' } }
    const unauthorized = await app.request(
      'https://game.example/api/game/commands',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      env,
    )
    expect(unauthorized.status).toBe(401)
    expect((await request('/api/game/commands', { ...body, userId: userB })).status).toBe(400)
    const reset = await request('/api/game/commands', body)
    expect(reset.status).toBe(200)
    expect(await reset.json()).toEqual({
      snapshot: { state: initialGame(day), revision: 9 },
      receipt: null,
    })
    expect(repository.games.get(userB)).toEqual(other)
    expect(await (await request('/api/game')).json()).toEqual({
      state: initialGame(day),
      revision: 9,
    })
    const restarted = await request('/api/game/commands', {
      operationId: opB,
      command: { type: 'chooseStarter', id: 'mame' },
    })
    expect(restarted.status).toBe(200)
    expect((await restarted.json()).snapshot.state.activeId).toBe('mame')
  })

  it('replays a lost reset response without clearing new progress or restoring earlier meals', async () => {
    const { request, repository } = setup()
    await request('/api/game/commands', { operationId: opA, command: feed })
    const reset = { operationId: opB, command: { type: 'resetProgress' } }
    await request('/api/game/commands', reset)
    const oldFeed = await (
      await request('/api/game/commands', { operationId: opA, command: feed })
    ).json()
    expect(oldFeed).toEqual({
      snapshot: { state: initialGame(day), revision: 2 },
      receipt: null,
    })
    await request('/api/game/commands', {
      operationId: opC,
      command: { type: 'chooseStarter', id: 'shizuku' },
    })
    const replay = await (await request('/api/game/commands', reset)).json()
    expect(replay.snapshot.state.activeId).toBe('shizuku')
    expect(replay.snapshot.state.meals).toEqual([])
    expect(replay.snapshot.revision).toBe(3)
    expect(replay.receipt).toBeNull()
    expect(repository.operations.size).toBe(3)
  })

  it('suppresses an old feed receipt when a reset commits before the transaction replay returns', async () => {
    const { repository } = setup()
    await executeCommand(repository, userA, opA, feed, { today: day, mealId })
    const find = repository.findOperation.bind(repository)
    let firstLookup = true
    repository.findOperation = async (userId, operationId) => {
      if (firstLookup) {
        firstLookup = false
        // This read began before the original feed committed.
        return null
      }
      return find(userId, operationId)
    }
    const commit = repository.commit.bind(repository)
    repository.commit = async (input) => {
      repository.commit = commit
      await executeCommand(
        repository,
        userA,
        opB,
        { type: 'resetProgress' },
        { today: day, mealId },
      )
      return commit(input)
    }
    const replay = await executeCommand(repository, userA, opA, feed, {
      today: day,
      mealId: 'retry-meal',
    })
    expect(replay).toEqual({
      snapshot: { state: initialGame(day), revision: 2 },
      receipt: null,
    })
    expect(repository.operations.size).toBe(2)
  })

  it('retries a reset against a concurrent revision and leaves the save intact if persistence fails', async () => {
    const { request, repository } = setup()
    const original = structuredClone(repository.games.get(userA))
    const commit = repository.commit.bind(repository)
    repository.commit = async () => {
      throw new ApiError(502, 'storage_unavailable')
    }
    const body = { operationId: opA, command: { type: 'resetProgress' } }
    expect((await request('/api/game/commands', body)).status).toBe(502)
    expect(repository.games.get(userA)).toEqual(original)
    expect(repository.operations.size).toBe(0)
    repository.commit = commit
    repository.conflicts = 1
    const reset = await (await request('/api/game/commands', body)).json()
    expect(reset).toEqual({
      snapshot: { state: initialGame(day), revision: 2 },
      receipt: null,
    })
    expect(repository.operations.size).toBe(1)
  })

  it('saves diary edits without replaying rewards and rejects future or missing records', async () => {
    const { request, repository } = setup()
    const first = await (
      await request('/api/game/commands', { operationId: opA, command: feed })
    ).json()
    const record = first.snapshot.state.mealRecords[0]
    const { id, ...input } = record
    const invalid = await request('/api/game/commands', {
      operationId: opB,
      command: { type: 'updateMealRecord', id, input: { ...input, day: '2099-01-01' } },
    })
    expect(invalid.status).toBe(422)
    expect(repository.games.get(userA)!.revision).toBe(1)
    const missing = await request('/api/game/commands', {
      operationId: opB,
      command: { type: 'updateMealRecord', id: 'missing', input },
    })
    expect(missing.status).toBe(422)
    const edited = await request('/api/game/commands', {
      operationId: opB,
      command: {
        type: 'updateMealRecord',
        id,
        input: { ...input, title: '昼のカレー', source: 'home' },
      },
    })
    expect(edited.status).toBe(200)
    const after = await edited.json()
    expect(after.snapshot.state.mealRecords[0].title).toBe('昼のカレー')
    expect(after.snapshot.state.meals).toEqual(first.snapshot.state.meals)
    expect(after.snapshot.state.coins).toBe(first.snapshot.state.coins)
    expect(after.receipt).toBeNull()
  })

  it('shares a saved meal and photo without attaching the already-used photo twice', async () => {
    const { repository } = setup()
    const state = repository.games.get(userA)!
    state.state.visitors = ['mame']
    repository.photos.set(opA, { userId: userA, bytes: new Uint8Array([1]), mime: 'image/png' })
    const first = await executeCommand(
      repository,
      userA,
      opA,
      { type: 'feed', input: { ...feed.input, photoId: opA } },
      { today: day, mealId },
    )
    const shared = await executeCommand(
      repository,
      userA,
      opB,
      {
        type: 'feed',
        input: {
          title: 'ignored',
          sample: 'rice',
          targetId: 'mame',
          mealRecordId: mealId,
          photoId: opA,
        },
      },
      { today: day, mealId: 'shared-meal' },
    )
    expect(shared.snapshot.state.mealRecords).toHaveLength(1)
    expect(shared.snapshot.state.meals).toHaveLength(2)
    expect(shared.snapshot.state.meals[0].photoId).toBe(opA)
    expect(shared.receipt!.mealReport!.today).toEqual(first.receipt!.mealReport!.today)
    expect(repository.photos.get(opA)!.mealId).toBe(mealId)
  })

  it('rejects reuse of an operation ID for a different intent', async () => {
    const { request } = setup()
    await request('/api/game/commands', { operationId: opA, command: feed })
    const response = await request('/api/game/commands', {
      operationId: opA,
      command: { type: 'rest' },
    })
    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'operation_mismatch' })
  })

  it('re-evaluates a command against a concurrent device update without losing it', async () => {
    const { repository } = setup()
    repository.conflicts = 1
    const expected = await executeCommand(
      new MemoryRepository(),
      userB,
      opB,
      { type: 'chooseStarter', id: 'komugi' },
      { today: day, mealId },
    )
    expect(expected.snapshot.state.activeId).toBe('komugi')
    const result = await executeCommand(repository, userA, opA, feed, { today: day, mealId })
    expect(result.snapshot.revision).toBe(2)
    expect(result.snapshot.state.coins).toBe(120 + 7 + result.receipt!.meal.coins)
    expect(result.snapshot.state.meals).toHaveLength(1)
  })

  it('bounds repeated revision conflicts and permits retrying the same operation ID', async () => {
    const { repository, request } = setup()
    repository.conflicts = 3
    const first = await request('/api/game/commands', { operationId: opA, command: feed })
    expect(first.status).toBe(409)
    expect(await first.json()).toEqual({ error: 'revision_conflict' })
    const second = await request('/api/game/commands', { operationId: opA, command: feed })
    expect(second.status).toBe(200)
    expect(repository.games.get(userA)!.state.meals).toHaveLength(1)
  })

  it('replays a simultaneous duplicate even when the committed operation now looks invalid', async () => {
    const { repository } = setup()
    const find = repository.findOperation.bind(repository)
    let firstLookup = true
    repository.findOperation = async (userId, operationId) => {
      if (firstLookup) {
        firstLookup = false
        await executeCommand(repository, userA, opA, { type: 'rest' }, { today: day, mealId })
        // Model a lookup that began before the other request committed.
        return null
      }
      return find(userId, operationId)
    }
    const result = await executeCommand(
      repository,
      userA,
      opA,
      { type: 'rest' },
      { today: day, mealId },
    )
    expect(result.snapshot.revision).toBe(1)
    expect(result.snapshot.state.tickets).toBe(1)
    expect(result.snapshot.state.rests).toEqual([day])
  })

  it('rejects inapplicable game actions without pretending they succeeded', async () => {
    const { request, repository } = setup()
    const invalid = [
      { type: 'chooseStarter', id: 'mame' },
      { type: 'purchase', id: 'nonexistent-item' },
      { type: 'feed', input: { title: 'x', sample: 'rice', targetId: 'yuzu' } },
    ]
    for (const command of invalid) {
      const response = await request('/api/game/commands', { operationId: opA, command })
      expect(response.status).toBe(422)
      expect(await response.json()).toEqual({ error: 'command_not_applied' })
    }
    expect(repository.games.get(userA)!.revision).toBe(0)
  })

  it.each([
    { operationId: opA, command: feed, userId: userB },
    { operationId: opA, command: { ...feed, xp: 9999 } },
    {
      operationId: opA,
      command: {
        type: 'feed',
        input: { title: 'x', sample: 'rice', photo: 'data:image/png;base64,AAAA' },
      },
    },
    { operationId: opA, command: { type: 'advanceGame' } },
    { operationId: opA, command: { type: 'claimLogin', today: '2030-01-01' } },
  ])('rejects client authority and demo-only fields: %j', async (body) => {
    const { request } = setup()
    expect((await request('/api/game/commands', body)).status).toBe(400)
  })

  it('keeps errors and missing API routes in JSON and blocks cross-origin writes', async () => {
    const { app } = setup()
    const response = await app.request(
      'https://game.example/api/game/commands',
      {
        method: 'POST',
        headers: { Origin: 'https://other.example' },
      },
      env,
    )
    expect(response.status).toBe(403)
    const missing = await app.request('https://game.example/api/unknown', {}, env)
    expect(missing.status).toBe(404)
    expect(missing.headers.get('cache-control')).toBe('no-store')
  })

  it('bounds streamed JSON even with an understated length and sanitizes malformed bodies', async () => {
    const { app } = setup()
    const call = (body: string, headers: Record<string, string> = {}) =>
      app.request(
        'https://game.example/api/game/commands',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer user-a',
            'Content-Type': 'application/json',
            ...headers,
          },
          body,
        },
        env,
      )
    expect((await call(' '.repeat(16 * 1024 + 1), { 'Content-Length': '1' })).status).toBe(413)
    const malformed = await call('{')
    expect(malformed.status).toBe(400)
    expect(await malformed.json()).toEqual({ error: 'invalid_request' })
    expect((await call('{}', { 'Content-Type': 'text/plain' })).status).toBe(415)
  })
})

describe('private photo API', () => {
  const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1])
  function upload(app: ReturnType<typeof createApp>, token = 'user-a', body = bytes) {
    return app.request(
      'https://game.example/api/photos',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'image/png',
          'X-Operation-Id': opA,
        },
        body,
      },
      env,
    )
  }

  it('uses a stable photo ID, accepts an identical retry and forbids foreign users', async () => {
    const { app, request, repository } = setup()
    expect(await (await upload(app)).json()).toEqual({ photoId: opA })
    expect((await upload(app)).status).toBe(200)
    expect(repository.photos.size).toBe(1)
    expect((await upload(app, 'user-b')).status).toBe(409)
    expect((await request('/api/photos/read-urls', { photoIds: [opA] }, 'user-b')).status).toBe(404)
    // Uploaded images only become readable once they belong to a saved meal.
    expect((await request('/api/photos/read-urls', { photoIds: [opA] })).status).toBe(404)
    await request('/api/game/commands', {
      operationId: opA,
      command: { type: 'feed', input: { ...feed.input, photoId: opA } },
    })
    const read = await (await request('/api/photos/read-urls', { photoIds: [opA] })).json()
    expect(read.expiresIn).toBe(300)
    expect(read.photos[0].photoId).toBe(opA)
  })

  it('stops issuing photo URLs after a reset while retaining immutable upload and operation history', async () => {
    const { app, request, repository } = setup()
    await upload(app)
    const command = { type: 'feed', input: { ...feed.input, photoId: opA } }
    await request('/api/game/commands', { operationId: opA, command })
    expect((await request('/api/photos/read-urls', { photoIds: [opA] })).status).toBe(200)
    await request('/api/game/commands', {
      operationId: opB,
      command: { type: 'resetProgress' },
    })
    const read = await request('/api/photos/read-urls', { photoIds: [opA] })
    expect(read.status).toBe(404)
    expect(await read.json()).toEqual({ error: 'photo_not_found' })
    expect(repository.photos.get(opA)?.mealId).toBe(mealId)
    const replay = await (await request('/api/game/commands', { operationId: opA, command })).json()
    expect(replay.receipt).toBeNull()
    expect(replay.snapshot.state.meals).toEqual([])
    expect(replay.snapshot.revision).toBe(2)
    expect(repository.operations.size).toBe(2)
  })

  it('links owned photos transactionally and rejects a missing or already used photo', async () => {
    const { app, request, repository } = setup()
    const command = { type: 'feed', input: { title: 'ごはん', sample: 'rice', photoId: opA } }
    expect((await request('/api/game/commands', { operationId: opA, command })).status).toBe(422)
    expect(repository.games.get(userA)!.state.meals).toHaveLength(0)
    await upload(app)
    const success = await request('/api/game/commands', { operationId: opA, command })
    expect(success.status).toBe(200)
    expect(repository.photos.get(opA)!.mealId).toBe(mealId)
    expect((await request('/api/game/commands', { operationId: opB, command })).status).toBe(422)
    expect(repository.games.get(userA)!.state.meals).toHaveLength(1)
  })

  it('validates the actual image signature and limits upload size', async () => {
    const { app } = setup()
    expect((await upload(app, 'user-a', new Uint8Array([1, 2, 3]))).status).toBe(400)
    expect((await upload(app, 'user-a', new Uint8Array(2 * 1024 * 1024 + 1))).status).toBe(413)
  })
})
