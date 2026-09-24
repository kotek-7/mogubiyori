import { Pet } from './GameArt'
import './growth.css'
import { growthStages } from './game'
import type { GrowthStage, SpeciesId } from './game'

/** Future forms stay undisclosed; collected forms remain available to revisit. */
export function GrowthTrail({
  species,
  stage,
  selected = stage,
  onSelect,
}: {
  species: SpeciesId
  stage: GrowthStage
  selected?: GrowthStage
  onSelect?: (stage: GrowthStage) => void
}) {
  return (
    <span className="growth-trail" role="group" aria-label={`出会った姿 ${stage + 1}/5`}>
      {growthStages.map(({ stage: form, name }) => {
        const discovered = form <= stage
        const content = (
          <>
            <span className="growth-trail-art">
              {discovered ? (
                <Pet species={species} stage={form} mood="happy" />
              ) : (
                <span aria-hidden="true">?</span>
              )}
            </span>
            <small>{discovered ? name : '？？？'}</small>
          </>
        )
        const className = `growth-trail-step ${discovered ? 'is-discovered' : 'is-unknown'} ${form === selected ? 'is-selected' : ''}`
        return onSelect ? (
          <button
            key={form}
            className={className}
            type="button"
            disabled={!discovered}
            aria-label={discovered ? `${name}の姿を見る` : `まだ出会っていない${form + 1}番目の姿`}
            aria-pressed={form === selected}
            onClick={() => onSelect(form)}
          >
            {content}
          </button>
        ) : (
          <span key={form} className={className}>
            {content}
          </span>
        )
      })}
    </span>
  )
}
