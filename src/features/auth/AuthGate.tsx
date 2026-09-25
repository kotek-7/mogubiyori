import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { createAuthClient, readRuntimeConfig } from './auth'
import type { RuntimeConfig } from './auth'
import { createLocalGameGateway } from '../../app/game/localGameGateway'
import { createCloudGameGateway } from '../../app/game/cloudGameGateway'
import type { GameGateway } from '../../app/game/gameGateway'
import { ensureAnonymousSession } from './anonymousSession'

type AuthContextValue = { client: SupabaseClient; session: Session; googleAuthEnabled: boolean }
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
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState('')
  const [oauthReturn] = useState(() => window.location.pathname === '/auth/callback')
  useEffect(() => {
    let active = true
    let initialized = false
    void ensureAnonymousSession(client)
      .then((restored) => {
        if (!active) return
        initialized = true
        setSession(restored)
        setReady(true)
      })
      .catch(() => {
        if (!active) return
        setError(
          oauthReturn
            ? 'Googleとの連携を完了できませんでした。元の画面に戻ってやり直せます。'
            : '記録の保存先に接続できませんでした。通信状況を確認して、もう一度お試しください。',
        )
        setReady(true)
      })
    const { data } = client.auth.onAuthStateChange((event, next) => {
      if (!active || !initialized || event === 'INITIAL_SESSION') return
      setSession(next)
      if (!next) {
        setReady(false)
        setAttempt((current) => current + 1)
      }
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [client, attempt, oauthReturn])
  const userId = session?.user.id
  const gateway = useMemo(
    () => (userId ? createCloudGameGateway(client, userId) : null),
    [client, userId],
  )
  if (!ready)
    return (
      <main className="grid min-h-dvh place-items-center" role="status">
        読み込んでいます
      </main>
    )
  if (session && gateway)
    return (
      <AuthContext value={{ client, session, googleAuthEnabled: config.googleAuthEnabled }}>
        {children(gateway)}
      </AuthContext>
    )
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 p-6 text-center">
      <h1>{oauthReturn ? 'Googleとの連携を完了できませんでした' : '接続できませんでした'}</h1>
      {error && <p role="alert">{error}</p>}
      {oauthReturn ? (
        <a className="primary-button" href="/">
          ひろばへ戻る
        </a>
      ) : (
        <button
          className="primary-button"
          onClick={() => {
            setReady(false)
            setError('')
            setAttempt((current) => current + 1)
          }}
        >
          もう一度試す
        </button>
      )}
    </main>
  )
}

export function AccountSettings() {
  const auth = useCloudAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [restore, setRestore] = useState(false)
  if (!auth) return null
  async function accountAction(action: 'link' | 'restore' | 'logout') {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const options = { redirectTo: `${window.location.origin}/auth/callback` }
      const result =
        action === 'logout'
          ? await auth!.client.auth.signOut({ scope: 'local' })
          : action === 'link'
            ? await auth!.client.auth.linkIdentity({ provider: 'google', options })
            : await auth!.client.auth.signInWithOAuth({ provider: 'google', options })
      if (result.error) throw result.error
    } catch {
      setError(
        action === 'logout'
          ? 'ログアウトできませんでした。もう一度お試しください。'
          : 'Googleに接続できませんでした。記録はそのままです。もう一度お試しください。',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="my-5 flex flex-col gap-3" aria-label="アカウント">
      <h3>{auth.googleAuthEnabled ? '記録の引き継ぎ' : '記録の保存'}</h3>
      {auth.session.user.is_anonymous ? (
        <>
          <p>記録は自動で保存されています。</p>
          <p>
            {auth.googleAuthEnabled ? '連携せずに' : ''}
            ブラウザーのデータを消すと、この記録には戻れなくなります。
          </p>
          {auth.googleAuthEnabled && (
            <>
              <p>Googleと連携すると、ほかの端末でも続けられます。</p>
              <button
                className="secondary-button full"
                disabled={busy}
                onClick={() => void accountAction('link')}
              >
                Googleと連携する
              </button>
              <button className="quiet-button" disabled={busy} onClick={() => setRestore(true)}>
                Googleで続きから
              </button>
              {restore && (
                <div className="flex flex-col gap-3">
                  <p>
                    以前Googleと連携した記録を開きます。今の記録は合算されません。今の記録を残したい場合は、先に「Googleと連携する」を選んでください。
                  </p>
                  <button
                    className="secondary-button full"
                    disabled={busy}
                    onClick={() => void accountAction('restore')}
                  >
                    Googleの記録を開く
                  </button>
                  <button
                    className="quiet-button"
                    disabled={busy}
                    onClick={() => setRestore(false)}
                  >
                    やめる
                  </button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <p>Googleアカウントに連携済みです。</p>
      )}
      {!auth.session.user.is_anonymous && (
        <button
          className="quiet-button"
          disabled={busy}
          onClick={() => void accountAction('logout')}
        >
          ログアウト
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}
