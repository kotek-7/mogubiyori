import { Pet } from '../../ui/art/GameArt'
import { DiscoverySilhouette } from '../../ui/art/DiscoverySilhouette'
import { growthStages } from '../../app/game/browserGame'
import type { GrowthStage, SpeciesId } from '../../app/game/browserGame'

/** Future forms show only their outlines; collected forms can be revisited. */
export function GrowthTrail({
  species,
  stage,
  selected = stage,
  onSelect,
}: {
  species: SpeciesId
  stage: GrowthStage | null
  selected?: GrowthStage | null
  onSelect?: (stage: GrowthStage) => void
}) {
  return (
    <span
      className="growth-trail"
      role="group"
      aria-label={`出会った姿 ${stage === null ? 0 : stage + 1}/5`}
    >
      {growthStages.map(({ stage: form, name }) => {
        const discovered = stage !== null && form <= stage
        const content = (
          <>
            <span className="growth-trail-art">
              {discovered ? (
                <Pet species={species} stage={form} mood="happy" />
              ) : (
                <DiscoverySilhouette>
                  <Pet species={species} stage={form} />
                </DiscoverySilhouette>
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
