import { Pet } from '../../ui/art/GameArt'
import { GrowthTrail } from './GrowthTrail'
import { companionFormDescription } from '../../ui/art/CompanionArt'
import { growthProgress, stageName, stageOf } from '../../app/game/browserGame'
import type { GameState, GrowthStage } from '../../app/game/browserGame'

export function CompanionProfile({
  state,
  previewStage,
  onPreviewStage,
  onShop,
}: {
  state: GameState
  previewStage: GrowthStage | null
  onPreviewStage: (stage: GrowthStage) => void
  onShop: () => void
}) {
  const active = state.companions.find((entry) => entry.id === state.activeId)
  const activeStage = stageOf(active?.xp ?? 0)
  const shownStage = previewStage ?? activeStage
  const activeSpecies = state.activeId ?? 'komugi'
  const activeFed = state.meals.some(
    (meal) => meal.day === state.today && meal.targetId === state.activeId,
  )
  const growth = growthProgress(active?.xp ?? 0)
  return (
    <div className="profile-sheet">
      <Pet
        species={activeSpecies}
        stage={shownStage}
        mood={activeFed ? 'happy' : 'hungry'}
        hat={state.equipped.hat}
      />
      <span className="level-tag">
        {stageName(shownStage)} · {shownStage + 1}/5
      </span>
      <GrowthTrail
        species={activeSpecies}
        stage={activeStage}
        selected={shownStage}
        onSelect={onPreviewStage}
      />
      <details className="profile-description">
        <summary>姿の特徴</summary>
        <p className="profile-form-description" aria-live="polite">
          {companionFormDescription(activeSpecies, shownStage)}
        </p>
      </details>
      <div
        className="meter"
        role="progressbar"
        aria-label="次の成長まで"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(growth.progress)}
      >
        <span style={{ width: `${growth.progress}%` }} />
      </div>
      <small>{activeStage < 4 ? `次の成長まで ${growth.remaining} XP` : 'すべての姿を発見'}</small>
      <button className="secondary-button full" onClick={onShop}>
        きせかえ
      </button>
    </div>
  )
}
