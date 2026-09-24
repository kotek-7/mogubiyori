import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../worker/index'
import type { Env } from '../worker/index'
import {
  FOOD_MODEL,
  MAX_PHOTO_BYTES,
  MAX_REQUEST_BYTES,
  RECOGNITION_TIMEOUT_MS,
} from '../worker/recognition'
import { recipes } from '../src/game'

const endpoint = 'https://mogubiyori.example/api/recognize-food'
const png =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
const completion = (value: unknown) => ({
  choices: [{ message: { role: 'assistant', content: JSON.stringify(value) } }],
})

function environment(output: unknown = completion({ candidates: ['curry'] })) {
  return {
    AI: { run: vi.fn(async (_model: string, _input: Record<string, unknown>) => output) },
    ASSETS: { fetch: vi.fn(async () => new Response('static asset')) },
  } satisfies Env
}

function request(body: unknown = { photo: png }, headers?: Record<string, string>) {
  return new Request(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('food recognition API', () => {
  it('uses the active game catalog, image messages, and the model-specific JSON schema', async () => {
    const env = environment(completion({ candidates: ['curry', 'onigiri'] }))
    const response = await worker.fetch(
      request(undefined, { Origin: new URL(endpoint).origin }),
      env,
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({ candidates: ['curry', 'onigiri'] })
    expect(env.AI.run).toHaveBeenCalledTimes(1)
    const [model, input] = env.AI.run.mock.calls[0]
    expect(model).toBe(FOOD_MODEL)
    expect(input).toMatchObject({
      stream: false,
      temperature: 0,
      max_completion_tokens: 256,
      chat_template_kwargs: { enable_thinking: false },
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'food_candidates',
          strict: true,
          schema: {
            required: ['candidates'],
            additionalProperties: false,
            properties: {
              candidates: { maxItems: 3, items: { enum: recipes.map((recipe) => recipe.id) } },
            },
          },
        },
      },
    })
    const messages = input.messages as { role: string; content: unknown }[]
    const content = messages[1].content as {
      type: string
      text?: string
      image_url?: { url: string }
    }[]
    expect(content[1]).toEqual({ type: 'image_url', image_url: { url: png } })
    const catalog = JSON.parse(content[0].text!.slice('登録料理カタログ: '.length))
    expect(catalog.map((entry: { id: string }) => entry.id)).toEqual(
      recipes.map((recipe) => recipe.id),
    )
    expect(catalog[0]).toMatchObject({ id: recipes[0].id, name: recipes[0].name })
    expect(catalog[0].ingredients).toContain(recipes[0].ingredients[0])
    expect(env.ASSETS.fetch).not.toHaveBeenCalled()
  })

  it('accepts adopted recipes, filters invented IDs, deduplicates, and caps candidates at three', async () => {
    const env = environment(
      completion({
        candidates: [
          'not-a-recipe',
          'r-oyako-don',
          'curry',
          'curry',
          'onigiri',
          'egg-rice',
          'gratin',
        ],
      }),
    )
    const response = await worker.fetch(request(), env)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ candidates: ['r-oyako-don', 'curry', 'onigiri'] })
  })

  it.each([{ candidates: [] }, { candidates: ['not-a-recipe'] }])(
    'allows an empty match without inventing a fallback',
    async ({ candidates }) => {
      const response = await worker.fetch(request(), environment(completion({ candidates })))
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ candidates: [] })
    },
  )

  it.each([
    null,
    { response: '{"candidates":["curry"]}' },
    { choices: [] },
    { choices: [{ message: { content: null } }] },
    { choices: [{ message: { content: '```json\n{"candidates":["curry"]}\n```' } }] },
    completion([]),
    completion({ candidates: 'curry' }),
    completion({ candidates: ['curry', 12] }),
    completion({ candidates: ['curry'], reward: 999 }),
  ])('rejects malformed model output without exposing it', async (output) => {
    const response = await worker.fetch(request(), environment(output))
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'recognition_failed' })
  })

  it.each([
    'https://internal.example/image.jpg',
    'data:image/svg+xml;base64,PHN2Zy8+',
    'data:image/jpeg;base64,aGVsbG8=',
    'data:image/jpeg;base64,!!!!',
    'data:image/png;base64,',
    'data:image/png;base64,abc',
    png.replace('image/png', 'image/jpeg'),
  ])('rejects invalid images and remote URLs before calling AI', async (photo) => {
    const env = environment()
    const response = await worker.fetch(request({ photo }), env)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'invalid_photo' })
    expect(env.AI.run).not.toHaveBeenCalled()
  })

  it.each([
    png,
    `data:image/jpeg;base64,${btoa('\xff\xd8\xff\xe0' + '\0'.repeat(12))}`,
    `data:image/webp;base64,${btoa('RIFF\x04\0\0\0WEBP')}`,
  ])('accepts each supported image signature', async (photo) => {
    const response = await worker.fetch(request({ photo }), environment())
    expect(response.status).toBe(200)
  })

  it.each([null, [], {}, { photo: png, extra: true }])(
    'requires the photo request object',
    async (body) => {
      const env = environment()
      const response = await worker.fetch(request(body), env)
      expect(response.status).toBe(400)
      expect(env.AI.run).not.toHaveBeenCalled()
    },
  )

  it('rejects malformed JSON and unsupported content types', async () => {
    const env = environment()
    const malformed = new Request(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    })
    expect((await worker.fetch(malformed, env)).status).toBe(400)
    const wrongType = request({ photo: png }, { 'Content-Type': 'text/plain' })
    expect((await worker.fetch(wrongType, env)).status).toBe(415)
    expect(env.AI.run).not.toHaveBeenCalled()
  })

  it('rejects a decoded photo over 2 MiB even within the JSON body limit', async () => {
    const env = environment()
    const photo = `data:image/jpeg;base64,${btoa('\xff\xd8\xff' + '\0'.repeat(MAX_PHOTO_BYTES - 2))}`
    expect(JSON.stringify({ photo }).length).toBeLessThan(MAX_REQUEST_BYTES)
    const response = await worker.fetch(request({ photo }), env)
    expect(response.status).toBe(413)
    expect(await response.json()).toEqual({ error: 'photo_too_large' })
    expect(env.AI.run).not.toHaveBeenCalled()
  })

  it('bounds streamed request bodies without trusting Content-Length', async () => {
    const env = environment()
    const cancel = vi.fn()
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_REQUEST_BYTES))
        controller.enqueue(new Uint8Array(1))
      },
      cancel,
    })
    const streamed = new Request(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      duplex: 'half',
    } as RequestInit)
    const response = await worker.fetch(streamed, env)
    expect(response.status).toBe(413)
    expect(await response.json()).toEqual({ error: 'request_too_large' })
    expect(cancel).toHaveBeenCalledOnce()
    expect(env.AI.run).not.toHaveBeenCalled()
  })

  it('rejects an oversized declared request before reading or invoking AI', async () => {
    const env = environment()
    const response = await worker.fetch(
      request(undefined, { 'Content-Length': String(MAX_REQUEST_BYTES + 1) }),
      env,
    )
    expect(response.status).toBe(413)
    expect(env.AI.run).not.toHaveBeenCalled()
  })

  it.each(['https://another.example', 'null'])(
    'rejects a cross-origin browser request',
    async (origin) => {
      const env = environment()
      const response = await worker.fetch(request(undefined, { Origin: origin }), env)
      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({ error: 'forbidden' })
      expect(env.AI.run).not.toHaveBeenCalled()
    },
  )

  it('returns 503 when the AI binding is unavailable', async () => {
    const { ASSETS } = environment()
    const response = await worker.fetch(request(), { ASSETS })
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'recognition_unavailable' })
  })

  it('sanitizes provider errors and does not log the photo or raw error', async () => {
    const env = environment()
    env.AI.run.mockRejectedValue(new Error(`provider token=secret photo=${png}`))
    const log = vi.spyOn(console, 'log')
    const error = vi.spyOn(console, 'error')
    const response = await worker.fetch(request(), env)
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'recognition_failed' })
    expect(log).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })

  it('returns a bounded timeout when the model does not finish', async () => {
    vi.useFakeTimers()
    const env = environment()
    env.AI.run.mockImplementation(() => new Promise(() => {}))
    const pending = worker.fetch(request(), env)
    await vi.waitFor(() => expect(env.AI.run).toHaveBeenCalledOnce())
    await vi.advanceTimersByTimeAsync(RECOGNITION_TIMEOUT_MS)
    const response = await pending
    expect(response.status).toBe(504)
    expect(await response.json()).toEqual({ error: 'recognition_timeout' })
  })

  it('serves non-API assets while keeping API 404 and 405 responses in JSON', async () => {
    const env = environment()
    const asset = new Request('https://mogubiyori.example/room')
    expect(await (await worker.fetch(asset, env)).text()).toBe('static asset')
    expect(env.ASSETS.fetch).toHaveBeenCalledWith(asset)
    const missing = await worker.fetch(new Request('https://mogubiyori.example/api/missing'), env)
    expect(missing.status).toBe(404)
    expect(await missing.json()).toEqual({ error: 'not_found' })
    const wrongMethod = await worker.fetch(new Request(endpoint), env)
    expect(wrongMethod.status).toBe(405)
    expect(wrongMethod.headers.get('allow')).toBe('POST')
    expect(await wrongMethod.json()).toEqual({ error: 'method_not_allowed' })
    expect(env.AI.run).not.toHaveBeenCalled()
  })
})
