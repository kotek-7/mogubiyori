import { useId } from 'react'
import { ChevronRight, HelpCircle, RotateCcw, Sparkles } from 'lucide-react'
import { AccountSettings } from '../auth/AuthGate'
import { SubscriptionSettings } from '../subscription/Subscription'
import type { GameState } from '../../app/game/browserGame'

export function SettingsPanel({
  state,
  busy,
  isLocal,
  reset,
  error,
  onResetChange,
  onReset,
  onReminderChange,
  onTutorial,
  onHelp,
  onAdvanceDay,
}: {
  state: GameState
  busy: boolean
  isLocal: boolean
  reset: 'seed' | 'fresh' | null
  error?: string
  onResetChange: (preset: 'seed' | 'fresh' | null) => void
  onReset: (preset: 'seed' | 'fresh') => void
  onReminderChange: (reminder: GameState['reminder']) => void
  onTutorial: () => void
  onHelp: () => void
  onAdvanceDay: () => void
}) {
  const resetConfirmationId = useId()
  return (
    <div className="settings-sheet">
      <SubscriptionSettings />
      <fieldset className="reminder-setting" disabled={busy}>
        <legend>ごはんのお知らせ</legend>
        <div className="segmented">
          <button
            type="button"
            aria-pressed={state.reminder === 'gentle'}
            onClick={() => onReminderChange('gentle')}
          >
            ひかえめ
          </button>
          <button
            type="button"
            aria-pressed={state.reminder === 'eager'}
            onClick={() => onReminderChange('eager')}
          >
            しっかり
          </button>
        </div>
      </fieldset>
      <button className="secondary-button full" disabled={busy} onClick={onTutorial}>
        <Sparkles size={18} />
        {state.tutorial.status === 'completed'
          ? 'チュートリアルをもう一度'
          : 'チュートリアルを続ける'}
      </button>
      <button className="settings-row" onClick={onHelp}>
        <HelpCircle size={17} />
        あそびかた
        <ChevronRight size={16} />
      </button>
      <AccountSettings />
      {isLocal && (
        <details className="playground">
          <summary>おためし設定</summary>
          <p>日付や育成状況を変更できます。</p>
          <button className="secondary-button full" disabled={busy} onClick={onAdvanceDay}>
            翌日に進む
          </button>
          <div className="reset-buttons">
            <button disabled={busy} onClick={() => onResetChange('seed')}>
              成長・出会いを体験
            </button>
          </div>
        </details>
      )}
      <button
        type="button"
        className="settings-row"
        disabled={busy}
        aria-expanded={reset === 'fresh'}
        aria-controls={resetConfirmationId}
        onClick={() => onResetChange('fresh')}
      >
        <RotateCcw size={17} />
        進捗をリセット
        <ChevronRight size={16} />
      </button>
      {reset && (
        <section id={resetConfirmationId} className="reset-confirm" aria-label="進捗リセットの確認">
          <p>
            {isLocal ? 'このブラウザー' : 'このアカウント'}
            のもぐの成長・なかま・持ちもの・コイン・ジェム・料理カード・食事の記録をリセットして、
            {reset === 'fresh' ? '最初から育てます。' : '成長・出会いを体験します。'}
            元には戻せません。
            {!isLocal && 'アカウントとログイン状態はそのままです。'}
          </p>
          {error && <p role="alert">{error}</p>}
          <div className="reset-buttons">
            <button disabled={busy} onClick={() => onResetChange(null)}>
              やめる
            </button>
            <button disabled={busy} onClick={() => onReset(reset)}>
              {busy ? 'リセット中' : '記録を消して始める'}
            </button>
          </div>
        </section>
      )}
      <p className="settings-note">
        {isLocal
          ? '記録はこのブラウザーに保存されます。'
          : '記録と写真はアカウントごとにクラウドへ保存されます。'}
        <br />
        写真は料理の候補を見つけるため、縮小してCloudflareへ送信します。
        端末へのプッシュ通知は行いません。
      </p>
    </div>
  )
}
