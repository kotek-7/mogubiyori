import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { createAuthClient, readRuntimeConfig } from './auth'
import type { RuntimeConfig } from './auth'
import { createLocalGameGateway } from '../../app/game/localGameGateway'
import { createCloudGameGateway } from '../../app/game/cloudGameGateway'
import type { GameGateway } from '../../app/game/gameGateway'

type AuthContextValue = { client: SupabaseClient; session: Session }
const AuthContext = createContext<AuthContextValue | null>(null)
const useCloudAuth = () => useContext(AuthContext)
// Supabase owns listeners and refresh timers: use one client per browser tab,
// including React StrictMode's repeated initializer calls.
let authClient: SupabaseClient | undefined
const config = (() => {
  try {
    return { value: readRuntimeConfig(import.meta.env), error: null }
  } catch (error) {
    return { value: null, error: error instanceof Error ? error.message : '設定を確認してください' }
  }
})()

export function AuthGate({ children }: { children: (gateway: GameGateway) => ReactNode }) {
  const [local] = useState(createLocalGameGateway)
  if (!config.value)
    return (
      <main className="mx-auto max-w-xl p-8">
        <h1>接続設定を確認してください</h1>
        <p role="alert">{config.error}</p>
      </main>
    )
  if (config.value.mode === 'local') return children(local)
  return <CloudGate config={config.value}>{children}</CloudGate>
}

function CloudGate({
  config,
  children,
}: {
  config: Extract<RuntimeConfig, { mode: 'cloud' }>
  children: (gateway: GameGateway) => ReactNode
}) {
  const [client] = useState(() => (authClient ??= createAuthClient(config)))
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return
        setSession(data.session)
        setError(error?.message ?? '')
        setReady(true)
      })
      .catch((error: unknown) => {
        if (!active) return
        setError(error instanceof Error ? error.message : '接続できませんでした')
        setReady(true)
      })
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setReady(true)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [client])
  const userId = session?.user.id
  const gateway = useMemo(
    () => (userId ? createCloudGameGateway(client, userId) : null),
    [client, userId],
  )
  async function begin(google: boolean) {
    setBusy(true)
    setError('')
    try {
      const result = google
        ? await client.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback` },
          })
        : await client.auth.signInAnonymously()
      if (result.error) throw result.error
    } catch (error) {
      setError(error instanceof Error ? error.message : '接続できませんでした')
    } finally {
      setBusy(false)
    }
  }
  if (!ready)
    return (
      <main className="grid min-h-dvh place-items-center" role="status">
        読み込んでいます
      </main>
    )
  if (session && gateway)
    return <AuthContext value={{ client, session }}>{children(gateway)}</AuthContext>
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 p-6 text-center">
      <h1 className="text-3xl font-extrabold">もぐ日和</h1>
      <p>きみのごはんで、なかまが育つ。</p>
      <button className="primary-button full" disabled={busy} onClick={() => void begin(false)}>
        はじめる
      </button>
      <button className="secondary-button full" disabled={busy} onClick={() => void begin(true)}>
        Googleで続きから
      </button>
      {error && <p role="alert">{error}</p>}
    </main>
  )
}

export function AccountSettings() {
  const auth = useCloudAuth()
  const [error, setError] = useState('')
  if (!auth) return null
  async function link() {
    const result = await auth!.client.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (result.error) setError(result.error.message)
  }
  async function logout() {
    const result = await auth!.client.auth.signOut()
    if (result.error) setError(result.error.message)
  }
  return (
    <section className="my-5 flex flex-col gap-3" aria-label="アカウント">
      <h3>記録の引き継ぎ</h3>
      {auth.session.user.is_anonymous ? (
        <>
          <p>Googleと連携すると、ほかの端末でも続けられます。</p>
          <button className="secondary-button full" onClick={() => void link()}>
            Googleと連携する
          </button>
        </>
      ) : (
        <p>Googleアカウントに連携済みです。</p>
      )}
      {!auth.session.user.is_anonymous && (
        <button className="quiet-button" onClick={() => void logout()}>
          ログアウト
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}
