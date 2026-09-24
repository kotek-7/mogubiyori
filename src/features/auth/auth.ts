import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { RuntimeConfig } from './runtimeConfig'

export { readRuntimeConfig } from './runtimeConfig'
export type { RuntimeConfig } from './runtimeConfig'

export function createAuthClient(
  config: Extract<RuntimeConfig, { mode: 'cloud' }>,
): SupabaseClient {
  return createClient(config.url, config.publishableKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}
