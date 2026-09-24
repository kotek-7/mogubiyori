import type { Session, SupabaseClient } from '@supabase/supabase-js'

const pendingSessions = new WeakMap<SupabaseClient, Promise<Session>>()

/** Restore OAuth / a saved session before creating an anonymous user. */
export function ensureAnonymousSession(client: SupabaseClient): Promise<Session> {
  const pending = pendingSessions.get(client)
  if (pending) return pending

  async function restoreOrCreate() {
    const initialized = await client.auth.initialize()
    if (initialized.error) throw initialized.error
    // A code left in the URL was not exchanged (for example, its PKCE verifier
    // is missing). Do not silently replace a failed OAuth return with a guest.
    if (
      typeof window !== 'undefined' &&
      window.location.pathname === '/auth/callback' &&
      new URL(window.location.href).searchParams.has('code')
    )
      throw new Error('Googleとの連携を完了できませんでした。')
    const restored = await client.auth.getSession()
    if (restored.error) throw restored.error
    if (restored.data.session) return restored.data.session
    const created = await client.auth.signInAnonymously()
    if (created.error) throw created.error
    if (!created.data.session) throw new Error('保存先に接続できませんでした。')
    return created.data.session
  }

  // StrictMode and simultaneous first visits in multiple tabs must not create
  // separate users. Re-read storage inside a lock shared by tabs on this origin.
  const request = (
    typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request('mogubiyori-anonymous-session', restoreOrCreate)
      : restoreOrCreate()
  ).finally(() => pendingSessions.delete(client))
  pendingSessions.set(client, request)
  return request
}
