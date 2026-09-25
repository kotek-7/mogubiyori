export type RuntimeConfig =
  | { mode: 'local' }
  | { mode: 'cloud'; url: string; publishableKey: string; googleAuthEnabled: boolean }

export function readRuntimeConfig(env: Record<string, unknown>): RuntimeConfig {
  const configured =
    env.VITE_SUPABASE_URL !== undefined || env.VITE_SUPABASE_PUBLISHABLE_KEY !== undefined
  const mode = env.VITE_GAME_MODE ?? (configured ? 'cloud' : 'local')
  if (mode === 'local') return { mode }
  if (mode !== 'cloud') throw new Error('VITE_GAME_MODE must be local or cloud')
  const url = env.VITE_SUPABASE_URL
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY
  let endpoint: URL | undefined
  if (typeof url === 'string') {
    try {
      endpoint = new URL(url)
    } catch {
      /* Report the configuration error below. */
    }
  }
  if (
    typeof url !== 'string' ||
    !endpoint ||
    !(
      endpoint.protocol === 'https:' ||
      (endpoint.protocol === 'http:' && endpoint.hostname === '127.0.0.1')
    ) ||
    typeof publishableKey !== 'string' ||
    !publishableKey.trim()
  )
    throw new Error('Cloud mode requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY')
  const googleFlag = env.VITE_GOOGLE_AUTH_ENABLED ?? 'false'
  if (googleFlag !== '' && googleFlag !== 'true' && googleFlag !== 'false')
    throw new Error('VITE_GOOGLE_AUTH_ENABLED must be true or false')
  return { mode, url, publishableKey, googleAuthEnabled: googleFlag === 'true' }
}
