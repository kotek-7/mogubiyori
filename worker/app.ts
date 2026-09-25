import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { commandRequestSchema } from '../shared/game/contracts'
import { ApiError, readBytes } from './errors'
import type { Env } from './env'
import { executeCommand, loadGame, readGamePhotoUrls, tokyoDay } from './game/gameService'
import type { CloudServices } from './game/repository'
import { MAX_PHOTO_BYTES, recognizeFood, RecognitionError } from './recognition/recognition'
import { createCloudServices, PHOTO_URL_LIFETIME } from './game/supabase'

type AppEnvironment = { Bindings: Env }
type Dependencies = { services: (env: Env) => CloudServices; now: () => Date; uuid: () => string }
const photoIdsSchema = z.object({ photoIds: z.array(z.uuid()).max(100) }).strict()

async function authorized(request: Request, services: CloudServices) {
  const match = /^Bearer (\S+)$/i.exec(request.headers.get('authorization') ?? '')
  if (!match) throw new ApiError(401, 'unauthorized')
  return { userId: await services.authenticate(match[1]), repository: services.repository }
}

function checkPhoto(bytes: Uint8Array, mime: string) {
  const prefix = String.fromCharCode(...bytes.slice(0, 12))
  if (!(
    (mime === 'image/jpeg' && prefix.startsWith('\xff\xd8\xff')) ||
    (mime === 'image/png' && prefix.startsWith('\x89PNG\r\n\x1a\n')) ||
    (mime === 'image/webp' && prefix.startsWith('RIFF') && prefix.slice(8, 12) === 'WEBP')
  ))
    throw new ApiError(400, 'invalid_photo')
}

export function createApp(overrides: Partial<Dependencies> = {}) {
  const dependencies: Dependencies = {
    services: createCloudServices,
    now: () => new Date(),
    uuid: () => crypto.randomUUID(),
    ...overrides,
  }
  const app = new Hono<AppEnvironment>()
  app.use('/api/*', async (context, next) => {
    context.header('Cache-Control', 'no-store')
    const origin = context.req.header('origin')
    if (origin !== undefined && origin !== new URL(context.req.url).origin)
      return context.json({ error: 'forbidden' }, 403)
    await next()
  })
  app.onError((error, context) => {
    if (error instanceof ApiError) return context.json({ error: error.message }, error.status)
    if (error instanceof HTTPException && error.status === 400)
      return context.json({ error: 'invalid_request' }, 400)
    return context.json({ error: 'service_unavailable' }, 502)
  })
  const jsonLimit: MiddlewareHandler<AppEnvironment> = async (context, next) => {
    if (
      context.req.header('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
    )
      throw new ApiError(415, 'unsupported_media_type')
    const bytes = await readBytes(context.req.raw, 16 * 1024)
    context.req.raw = new Request(context.req.raw, { body: bytes as Uint8Array<ArrayBuffer> })
    await next()
  }
  return app
    .post('/api/recognize-food', async (context) => {
      try {
        return context.json({ candidates: await recognizeFood(context.req.raw, context.env.AI) })
      } catch (error) {
        if (error instanceof RecognitionError)
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.status,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          })
        return context.json({ error: 'recognition_failed' }, 502)
      }
    })
    .get('/api/game', async (context) => {
      const { userId, repository } = await authorized(
        context.req.raw,
        dependencies.services(context.env),
      )
      return context.json(await loadGame(repository, userId, tokyoDay(dependencies.now())))
    })
    .post(
      '/api/game/commands',
      jsonLimit,
      zValidator('json', commandRequestSchema, (result) => {
        if (!result.success) throw new ApiError(400, 'invalid_command')
      }),
      async (context) => {
        const { userId, repository } = await authorized(
          context.req.raw,
          dependencies.services(context.env),
        )
        const { operationId, command } = context.req.valid('json')
        return context.json(
          await executeCommand(repository, userId, operationId, command, {
            today: tokyoDay(dependencies.now()),
            mealId: dependencies.uuid(),
          }),
        )
      },
    )
    .post('/api/photos', async (context) => {
      const { userId, repository } = await authorized(
        context.req.raw,
        dependencies.services(context.env),
      )
      const id = z.uuid().safeParse(context.req.header('x-operation-id'))
      if (!id.success) throw new ApiError(400, 'invalid_operation_id')
      const mime = context.req.header('content-type')?.split(';')[0].trim().toLowerCase() ?? ''
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime))
        throw new ApiError(415, 'unsupported_media_type')
      const bytes = await readBytes(context.req.raw, MAX_PHOTO_BYTES)
      checkPhoto(bytes, mime)
      await repository.uploadPhoto(userId, id.data, bytes, mime)
      return context.json({ photoId: id.data })
    })
    .post(
      '/api/photos/read-urls',
      jsonLimit,
      zValidator('json', photoIdsSchema, (result) => {
        if (!result.success) throw new ApiError(400, 'invalid_request')
      }),
      async (context) => {
        const { userId, repository } = await authorized(
          context.req.raw,
          dependencies.services(context.env),
        )
        return context.json({
          photos: await readGamePhotoUrls(
            repository,
            userId,
            context.req.valid('json').photoIds,
            tokyoDay(dependencies.now()),
          ),
          expiresIn: PHOTO_URL_LIFETIME,
        })
      },
    )
    .all('*', (context) => {
      const methods: Record<string, string> = {
        '/api/recognize-food': 'POST',
        '/api/game': 'GET',
        '/api/game/commands': 'POST',
        '/api/photos': 'POST',
        '/api/photos/read-urls': 'POST',
      }
      if (methods[context.req.path]) {
        context.header('Allow', methods[context.req.path])
        return context.json({ error: 'method_not_allowed' }, 405)
      }
      if (context.req.path === '/api' || context.req.path.startsWith('/api/')) {
        context.header('Cache-Control', 'no-store')
        return context.json({ error: 'not_found' }, 404)
      }
      return context.env.ASSETS.fetch(context.req.raw)
    })
}

export type AppType = ReturnType<typeof createApp>
