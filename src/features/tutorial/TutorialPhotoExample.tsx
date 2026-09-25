import { useRef, useState } from 'react'
import { Camera, Check, Utensils } from 'lucide-react'
import { recipes } from '../../app/game/browserGame'
import { DishArt } from '../../ui/art/GameArt'
import { TutorialGuide } from './TutorialGuide'
import { useTutorialPlayback } from './useTutorialPlayback'

export type TutorialPhotoPhase = 'cooking' | 'capturing' | 'photo'

export const tutorialCardsGuide =
  '料理の写真からAIが候補を見つけ、自分でも選び直せます。記録するとカードがずかんに残り、初めての料理はコインも獲得。未獲得のカードからも材料と作り方を見られます。'

const sceneLabels: Record<TutorialPhotoPhase, string> = {
  cooking: '撮影に使うカレーの例',
  capturing: 'カレーの例を撮影中',
  photo: '撮影した写真の例',
}

export function TutorialPhotoExample({
  onSubmit,
  onPhaseChange,
  playing,
}: {
  onSubmit: () => void
  onPhaseChange?: (phase: TutorialPhotoPhase) => void
  playing: boolean
}) {
  const curry = recipes.find((recipe) => recipe.id === 'curry')!
  const [phase, setPhase] = useState<TutorialPhotoPhase>('cooking')
  const currentPhase = useRef<TutorialPhotoPhase>('cooking')
  const submitted = useRef(false)

  useTutorialPlayback(
    phase,
    () => {
      if (currentPhase.current !== phase) return
      if (phase === 'photo') {
        if (submitted.current) return
        submitted.current = true
        onSubmit()
        return
      }
      const next = phase === 'cooking' ? 'capturing' : 'photo'
      currentPhase.current = next
      setPhase(next)
      onPhaseChange?.(next)
    },
    phase === 'cooking' ? 1200 : 1600,
    playing,
  )

  return (
    <div className="tutorial-recipe-lab" data-phase={phase}>
      <div
        className={`tutorial-recipe-scene tutorial-recipe-scene-${phase}`}
        role="group"
        aria-label={sceneLabels[phase]}
      >
        {phase === 'cooking' && (
          <div className="tutorial-recipe-table">
            <span className="tutorial-recipe-place-label">
              <Utensils size={13} aria-hidden="true" />
              イラストで撮影の流れを紹介
            </span>
            <div className="tutorial-recipe-placemat" aria-hidden="true">
              <DishArt kind={curry.sample} />
            </div>
            <strong className="tutorial-recipe-dish-name">{curry.name}</strong>
          </div>
        )}
        {phase === 'capturing' && (
          <div className="tutorial-recipe-camera-cut" aria-hidden="true">
            <div className="tutorial-recipe-camera-device">
              <div className="tutorial-recipe-camera-preview">
                <DishArt kind={curry.sample} />
                <div className="tutorial-recipe-viewfinder">
                  <i className="tutorial-recipe-focus-corner is-top-left" />
                  <i className="tutorial-recipe-focus-corner is-top-right" />
                  <i className="tutorial-recipe-focus-corner is-bottom-left" />
                  <i className="tutorial-recipe-focus-corner is-bottom-right" />
                </div>
              </div>
              <span className="tutorial-recipe-shutter">
                <Camera size={20} />
              </span>
            </div>
          </div>
        )}
        {phase === 'photo' && (
          <div className="tutorial-recipe-camera-view">
            <div
              className="tutorial-recipe-snapshot"
              role="img"
              aria-label="カレーのイラストを使った写真の例"
            >
              <DishArt kind={curry.sample} />
              <i className="tutorial-recipe-focus-corner is-top-left" />
              <i className="tutorial-recipe-focus-corner is-top-right" />
              <i className="tutorial-recipe-focus-corner is-bottom-left" />
              <i className="tutorial-recipe-focus-corner is-bottom-right" />
              <span className="tutorial-recipe-photo-check">
                <Check size={15} aria-hidden="true" />
              </span>
            </div>
            <span className="tutorial-recipe-snapshot-label">
              <Camera size={14} aria-hidden="true" />
              撮影した写真の例（イラスト）
            </span>
          </div>
        )}
      </div>
      <TutorialGuide>{tutorialCardsGuide}</TutorialGuide>
    </div>
  )
}
