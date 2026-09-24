import { createApp } from './app'
import type { Env } from './env'

export type { Env } from './env'
export type { AppType } from './app'

const app = createApp()

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return Promise.resolve(app.fetch(request, env))
  },
}
