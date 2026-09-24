import { Pet } from '../../ui/art/GameArt'
import { fedToday, stageOf } from '../../app/game/browserGame'
import type { GameState } from '../../app/game/browserGame'

export function RestPanel({
  state,
  busy,
  onUse,
}: {
  state: GameState
  busy: boolean
  onUse: () => void
}) {
  const already = state.rests.includes(state.today)
  const activeSpecies = state.activeId ?? 'komugi'
  const active = state.companions.find((entry) => entry.id === state.activeId)
  const activeStage = stageOf(active?.xp ?? 0)
  return (
    <div className="rest-sheet">
      <Pet
        species={activeSpecies}
        stage={activeStage}
        mood="sleepy"
        hat={state.equipped.hat}
        neck={state.equipped.neck}
        bag={state.equipped.bag}
      />
      <p>1枚使うと今日の連続記録を維持できます。</p>
      <span className="rest-tickets">おやすみチケット　あと {state.tickets} 枚</span>
      <button
        className="primary-button full"
        disabled={busy || already || state.tickets === 0 || fedToday(state)}
        onClick={onUse}
      >
        {already
          ? '使用済み'
          : fedToday(state)
            ? '今日のごはんは記録済みです'
            : state.tickets === 0
              ? 'チケットがありません'
              : '1枚使う'}
      </button>
      <small className="privacy-note">空腹は回復しません。</small>
    </div>
  )
}
