import type { AiBinding } from './recognition/recognition'

export interface Env {
  AI?: AiBinding
  ASSETS: { fetch(request: Request): Promise<Response> }
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  SUPABASE_PHOTO_BUCKET?: string
}
