import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Pet } from '../../ui/art/GameArt'
import { JourneyFrame } from '../../ui/journey/JourneyFrame'
import { species } from '../../app/game/browserGame'
import type { SpeciesId } from '../../app/game/browserGame'

export function StarterSelection({
  onChoose,
  busy = false,
  accountSettings,
}: {
  onChoose: (id: SpeciesId) => void
  busy?: boolean
  accountSettings?: ReactNode
}) {
  const [selected, setSelected] = useState<SpeciesId>('komugi')
  return (
    <JourneyFrame
      scene="choose"
      title="最初のなかまを選ぶ"
      headerAction={accountSettings}
      footer={
        <>
          <button
            className="journey-primary starter-start"
            disabled={busy}
            onClick={() => onChoose(selected)}
          >
            この子とはじめる
            <ArrowRight size={18} />
          </button>
        </>
      }
    >
      <div className="starter-screen">
        <div className="starter-choices" role="group" aria-label="最初のなかま">
          {species.slice(0, 3).map((entry) => (
            <button
              key={entry.id}
              className={`starter-choice starter-${entry.id} ${selected === entry.id ? 'is-selected' : ''}`}
              aria-label={`${entry.name}を選ぶ`}
              aria-pressed={selected === entry.id}
              onClick={() => setSelected(entry.id)}
            >
              <span className="starter-check" aria-hidden="true">
                {selected === entry.id && <Check size={15} />}
              </span>
              <span className="starter-portrait">
                <Pet
                  species={entry.id}
                  stage={0}
                  mood={selected === entry.id ? 'happy' : 'hungry'}
                />
              </span>
              <strong>{entry.name}</strong>
            </button>
          ))}
        </div>
      </div>
    </JourneyFrame>
  )
}
