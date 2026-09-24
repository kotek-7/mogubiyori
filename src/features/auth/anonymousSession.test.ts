import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { ensureAnonymousSession } from './anonymousSession'

const session = { user: { id: 'anonymous-user', is_anonymous: true } } as Session
function authClient(saved: Session | null = null) {
  const auth = {
    initialize: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: saved }, error: null }),
    signInAnonymously: vi.fn().mockResolvedValue({ data: { session }, error: null }),
  }
  return { client: { auth } as unknown as SupabaseClient, auth }
}

afterEach(() => vi.unstubAllGlobals())

describe('automatic anonymous session', () => {
  it('shares the initial signup while multiple callers are mounting', async () => {
    const { client, auth } = authClient()
    const first = ensureAnonymousSession(client)
    const second = ensureAnonymousSession(client)
    expect(second).toBe(first)
    expect(await first).toBe(session)
    expect(auth.signInAnonymously).toHaveBeenCalledTimes(1)
  })

  it.each([true, false])('keeps the stored identity (anonymous=%s)', async (anonymous) => {
    const saved = { ...session, user: { ...session.user, is_anonymous: anonymous } }
    const { client, auth } = authClient(saved)
    expect(await ensureAnonymousSession(client)).toBe(saved)
    expect(auth.signInAnonymously).not.toHaveBeenCalled()
  })

  it('waits for OAuth initialization before deciding whether an anonymous user is needed', async () => {
    const { client, auth } = authClient()
    const linked = { ...session, user: { ...session.user, is_anonymous: false } }
    auth.initialize.mockImplementation(async () => {
      auth.getSession.mockResolvedValue({ data: { session: linked }, error: null })
      return { error: null }
    })
    expect(await ensureAnonymousSession(client)).toBe(linked)
    expect(auth.signInAnonymously).not.toHaveBeenCalled()
  })

  it('does not replace a failed OAuth callback with a new anonymous account', async () => {
    const { client, auth } = authClient()
    auth.initialize.mockResolvedValue({ error: new Error('OAuth failed') })
    await expect(ensureAnonymousSession(client)).rejects.toThrow('OAuth failed')
    expect(auth.getSession).not.toHaveBeenCalled()
    expect(auth.signInAnonymously).not.toHaveBeenCalled()
  })

  it('rejects a callback code that the SDK could not exchange', async () => {
    vi.stubGlobal('window', {
      location: { pathname: '/auth/callback', href: 'https://example.com/auth/callback?code=lost' },
    })
    const { client, auth } = authClient()
    await expect(ensureAnonymousSession(client)).rejects.toThrow('Googleとの連携')
    expect(auth.signInAnonymously).not.toHaveBeenCalled()
  })

  it('preserves session-read failures instead of creating a different account', async () => {
    const { client, auth } = authClient()
    auth.getSession.mockResolvedValue({ data: { session: null }, error: new Error('offline') })
    await expect(ensureAnonymousSession(client)).rejects.toThrow('offline')
    expect(auth.signInAnonymously).not.toHaveBeenCalled()
  })

  it('allows an explicit retry after failed anonymous signup', async () => {
    const { client, auth } = authClient()
    auth.signInAnonymously.mockResolvedValueOnce({
      data: { session: null },
      error: new Error('offline'),
    })
    await expect(ensureAnonymousSession(client)).rejects.toThrow('offline')
    expect(await ensureAnonymousSession(client)).toBe(session)
    expect(auth.signInAnonymously).toHaveBeenCalledTimes(2)
  })

  it('rejects a signup response without a session', async () => {
    const { client, auth } = authClient()
    auth.signInAnonymously.mockResolvedValue({ data: { session: null }, error: null })
    await expect(ensureAnonymousSession(client)).rejects.toThrow('保存先に接続')
  })

  it('rechecks the saved session inside the shared browser lock', async () => {
    const { client, auth } = authClient()
    const request = vi.fn(async (_name, operation) => {
      // Another tab signed in while this tab waited for the lock.
      auth.getSession.mockResolvedValue({ data: { session }, error: null })
      return operation()
    })
    vi.stubGlobal('navigator', { locks: { request } })
    expect(await ensureAnonymousSession(client)).toBe(session)
    expect(request).toHaveBeenCalledOnce()
    expect(auth.signInAnonymously).not.toHaveBeenCalled()
  })
})
