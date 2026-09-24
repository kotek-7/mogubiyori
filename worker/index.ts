import { recognizeFood, RecognitionError } from './recognition'
import type { AiBinding } from './recognition'

export interface Env {
  AI?: AiBinding
  ASSETS: { fetch(request: Request): Promise<Response> }
}

function json(body: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== '/api/recognize-food') {
      if (url.pathname === '/api' || url.pathname.startsWith('/api/'))
        return json({ error: 'not_found' }, 404)
      return env.ASSETS.fetch(request)
    }
    if (request.method !== 'POST')
      return json({ error: 'method_not_allowed' }, 405, { Allow: 'POST' })
    const origin = request.headers.get('origin')
    if (origin !== null && origin !== url.origin) return json({ error: 'forbidden' }, 403)

    try {
      return json({ candidates: await recognizeFood(request, env.AI) })
    } catch (error) {
      if (error instanceof RecognitionError) return json({ error: error.message }, error.status)
      return json({ error: 'recognition_failed' }, 502)
    }
  },
}
