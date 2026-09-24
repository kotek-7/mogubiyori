import { Pet } from '../../ui/art/GameArt'
import { hungerOf, stageOf } from '../../app/game/browserGame'
import type { GameState } from '../../app/game/browserGame'

export function MealReminder({ state, onRecord }: { state: GameState; onRecord: () => void }) {
  const activeSpecies = state.activeId ?? 'komugi'
  const active = state.companions.find((entry) => entry.id === state.activeId)
  const activeStage = stageOf(active?.xp ?? 0)
  const activeFed = state.meals.some(
    (meal) => meal.day === state.today && meal.targetId === state.activeId,
  )
  return (
    <div className="letter-sheet">
      <Pet
        species={activeSpecies}
        stage={activeStage}
        mood={hungerOf(state) > 50 ? 'happy' : 'hungry'}
        hat={state.equipped.hat}
      />
      <h3>{activeFed ? '今日のごはんは記録済みです' : '今日のごはんが未記録です'}</h3>
      <p>{state.name}</p>
      {!activeFed && (
        <button className="primary-button full" onClick={() => onRecord()}>
          ごはんをあげる
        </button>
      )}
    </div>
  )
}
