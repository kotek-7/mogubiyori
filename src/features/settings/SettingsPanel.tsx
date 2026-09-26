import { ChevronRight, HelpCircle, Sparkles } from 'lucide-react'
import { AccountSettings } from '../auth/AuthGate'
import { SubscriptionSettings } from '../subscription/Subscription'
import type { GameState } from '../../app/game/browserGame'

export function SettingsPanel({
  state,
  busy,
  isLocal,
  onReminderChange,
  onTutorial,
  onHelp,
}: {
  state: GameState
  busy: boolean
  isLocal: boolean
  onReminderChange: (reminder: GameState['reminder']) => void
  onTutorial: () => void
  onHelp: () => void
}) {
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
