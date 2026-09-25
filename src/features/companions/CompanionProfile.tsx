import { Pet } from '../../ui/art/GameArt'
import { GrowthTrail } from './GrowthTrail'
import { companionProfiles } from '../../../shared/content/companionProfiles'
import { growthProgress, species, stageName, stageOf } from '../../app/game/browserGame'
import type { GameState, GrowthStage, SpeciesId } from '../../app/game/browserGame'

export function CompanionProfile({
  state,
  speciesId,
  previewStage,
  onPreviewStage,
  onShop,
}: {
  state: GameState
  speciesId: SpeciesId
  previewStage: GrowthStage | null
  onPreviewStage: (stage: GrowthStage) => void
  onShop: () => void
}) {
  const companion = state.companions.find((entry) => entry.id === speciesId)
  const currentStage = stageOf(companion?.xp ?? 0)
  const shownStage = previewStage ?? currentStage
  const profile = companionProfiles[speciesId]
  const companionName = species.find((entry) => entry.id === speciesId)!.name
  const isActive = speciesId === state.activeId
  const fed = state.meals.some((meal) => meal.day === state.today && meal.targetId === speciesId)
  const growth = growthProgress(companion?.xp ?? 0)
  return (
    <div className="profile-sheet">
      <Pet
        species={speciesId}
        stage={shownStage}
        mood={fed ? 'happy' : 'hungry'}
        hat={isActive ? state.equipped.hat : undefined}
        neck={isActive ? state.equipped.neck : undefined}
        bag={isActive ? state.equipped.bag : undefined}
      />
      <span className="level-tag">
        {stageName(shownStage)} · {shownStage + 1}/5
      </span>
      <GrowthTrail
        species={speciesId}
        stage={currentStage}
        selected={shownStage}
        onSelect={onPreviewStage}
      />
      <section className="profile-form" aria-live="polite" aria-atomic="true">
        <h3>{stageName(shownStage)}のころ</h3>
        <p className="profile-form-description">{profile.stages[shownStage]}</p>
        <div className="profile-habit">
          <h4>しぐさ</h4>
          <p>{profile.habits[shownStage]}</p>
        </div>
      </section>
      {companion && (
        <>
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
          <small>
            {currentStage < 4 ? `次の成長まで ${growth.remaining} XP` : 'すべての姿を発見'}
          </small>
        </>
      )}
      <details className="profile-description" open>
        <summary>生態</summary>
        <p>{profile.ecology}</p>
      </details>
      <section className="profile-personality">
        <h3>{companionName}の性格</h3>
        <p>{profile.personality}</p>
      </section>
      {isActive && (
        <button className="secondary-button full" onClick={onShop}>
          きせかえ
        </button>
      )}
    </div>
  )
}
