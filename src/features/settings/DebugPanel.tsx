import { useState } from 'react'
import { growthStages, species } from '../../../shared/content/catalog'
import { stageOf } from '../../../shared/game/game'
import type { DebugGameCommand } from '../../../shared/game/debug'
import type { GrowthStage, SpeciesId } from '../../../shared/game/types'
import { useGameSession } from '../../app/game/useGameSession'

export function DebugPanel({
  onCommand,
}: {
  onCommand: (command: DebugGameCommand, onSuccess?: () => void) => void
}) {
  const { state, gateway, query, busy, error } = useGameSession()
  const enabled = gateway.mode === 'local' || query.data?.debugEnabled === true
  const [companionId, setCompanionId] = useState<SpeciesId | null>(state.activeId)
  const [stage, setStage] = useState<GrowthStage>(stageOf(state.xp))
  const [reset, setReset] = useState<'fresh' | 'seed' | null>(null)
  const [message, setMessage] = useState('')
  const selectedCompanion =
    state.companions.find((entry) => entry.id === companionId) ?? state.companions[0]
  function run(command: DebugGameCommand, success: string) {
    setMessage('')
    onCommand(command, () => {
      setReset(null)
      setMessage(success)
    })
  }
  return (
    <div className="debug-panel">
      <dl className="debug-status">
        <div>
          <dt>保存先</dt>
          <dd>{gateway.mode === 'cloud' ? 'クラウド' : 'この端末'}</dd>
        </div>
        <div>
          <dt>ゲーム内の日付</dt>
          <dd>{state.today}</dd>
        </div>
        <div>
          <dt>進めた日数</dt>
          <dd>{state.dayOffset}日</dd>
        </div>
        <div>
          <dt>更新番号</dt>
          <dd>{query.data?.revision ?? 0}</dd>
        </div>
      </dl>
      <button
        className="secondary-button full"
        disabled={busy || query.isFetching}
        onClick={() => {
          setMessage('')
          void query.refetch().then((result) => {
            if (!result.error) setMessage('保存データを読み直しました')
          })
        }}
      >
        保存データを読み直す
      </button>
      {enabled ? (
        <>
          <p className="settings-note">
            変更は{gateway.mode === 'cloud' ? 'このアカウント' : 'この端末'}に保存されます。
          </p>
          <fieldset disabled={busy}>
            <legend>日付</legend>
            <div className="debug-actions">
              <button
                className="secondary-button"
                onClick={() => run({ type: 'debugAdvanceDays', days: 1 }, '1日進めました')}
              >
                翌日に進む
              </button>
              <button
                className="secondary-button"
                onClick={() => run({ type: 'debugAdvanceDays', days: 7 }, '7日進めました')}
              >
                7日進める
              </button>
            </div>
          </fieldset>
          <fieldset disabled={busy || !state.companions.length}>
            <legend>育成</legend>
            <label>
              なかま
              <select
                value={selectedCompanion?.id ?? ''}
                onChange={(event) => {
                  const id = event.target.value as SpeciesId
                  setCompanionId(id)
                  setStage(stageOf(state.companions.find((entry) => entry.id === id)?.xp ?? 0))
                }}
              >
                {state.companions.map((companion) => (
                  <option key={companion.id} value={companion.id}>
                    {species.find((entry) => entry.id === companion.id)?.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              成長段階
              <select
                value={stage}
                onChange={(event) => setStage(Number(event.target.value) as GrowthStage)}
              >
                {growthStages.map((growth) => (
                  <option key={growth.stage} value={growth.stage}>
                    {growth.name}（{growth.threshold} XP）
                  </option>
                ))}
              </select>
            </label>
            <button
              className="secondary-button full"
              onClick={() => {
                if (selectedCompanion)
                  run(
                    { type: 'debugSetGrowth', id: selectedCompanion.id, stage },
                    '成長段階を変更しました',
                  )
              }}
            >
              成長段階を変更
            </button>
          </fieldset>
          <fieldset disabled={busy}>
            <legend>初期化</legend>
            <button className="secondary-button full" onClick={() => setReset('seed')}>
              体験用データに置き換える
            </button>
            <button className="secondary-button full" onClick={() => setReset('fresh')}>
              初期状態に戻す
            </button>
            {reset && (
              <section className="reset-confirm" aria-label="デバッグ初期化の確認">
                <p>
                  育成・持ちもの・食事の記録を消し、
                  {reset === 'seed' ? '体験用データに置き換えます。' : 'なかま選びから始めます。'}
                  日付も実際の今日に戻ります。元には戻せません。
                </p>
                <div className="reset-buttons">
                  <button onClick={() => setReset(null)}>やめる</button>
                  <button
                    onClick={() =>
                      run({ type: 'debugReset', preset: reset }, '記録を置き換えました')
                    }
                  >
                    記録を消して置き換える
                  </button>
                </div>
              </section>
            )}
          </fieldset>
        </>
      ) : (
        <p>この環境ではデバッグ操作が無効です。</p>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error.message}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  )
}
