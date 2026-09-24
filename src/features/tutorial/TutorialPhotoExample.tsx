import { useEffect, useRef, useState } from 'react'
import { Camera, Check, Utensils } from 'lucide-react'
import { recipes } from '../../app/game/browserGame'
import { DishArt } from '../../ui/art/GameArt'
import { TutorialGuide } from './TutorialGuide'

export type TutorialPhotoPhase = 'cooking' | 'capturing' | 'photo'

const sceneLabels: Record<TutorialPhotoPhase, string> = {
  cooking: '撮影に使うカレーの例',
  capturing: 'カレーの例を撮影中',
  photo: '撮影した写真の例',
}

export function TutorialPhotoExample({
  onSubmit,
  onPhaseChange,
  submitLabel = 'この写真を記録する',
}: {
  onSubmit: () => void
  onPhaseChange?: (phase: TutorialPhotoPhase) => void
  submitLabel?: string
}) {
  const curry = recipes.find((recipe) => recipe.id === 'curry')!
  const [phase, setPhase] = useState<TutorialPhotoPhase>('cooking')
  const currentPhase = useRef<TutorialPhotoPhase>('cooking')
  const submitted = useRef(false)
  const scene = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (phase !== 'cooking') scene.current?.focus({ preventScroll: true })
  }, [phase])

  useEffect(() => {
    if (phase !== 'capturing') return
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1600
    const timer = window.setTimeout(() => {
      currentPhase.current = 'photo'
      setPhase('photo')
      onPhaseChange?.('photo')
    }, delay)
    return () => window.clearTimeout(timer)
  }, [phase, onPhaseChange])

  function capture() {
    if (currentPhase.current !== 'cooking') return
    currentPhase.current = 'capturing'
    setPhase('capturing')
    onPhaseChange?.('capturing')
  }

  function submit() {
    if (currentPhase.current !== 'photo' || submitted.current) return
    submitted.current = true
    onSubmit()
  }

  return (
    <div className="tutorial-recipe-lab" data-phase={phase}>
      <div
        className={`tutorial-recipe-scene tutorial-recipe-scene-${phase}`}
        role="group"
        aria-label={sceneLabels[phase]}
        ref={scene}
        tabIndex={-1}
      >
        {phase === 'cooking' && (
          <div className="tutorial-recipe-table">
            <span className="tutorial-recipe-place-label">
              <Utensils size={13} aria-hidden="true" />
              練習用のイラスト
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
              撮影した写真の例
            </span>
          </div>
        )}
      </div>
      {(phase === 'cooking' || phase === 'capturing') && (
        <TutorialGuide
          action={{
            label: phase === 'capturing' ? '撮影中' : 'この例で撮影を試す',
            onClick: capture,
            disabled: phase === 'capturing',
          }}
        >
          ここではカレーのイラストで撮影を練習します。本番では、自分で撮った料理の写真を使います。
        </TutorialGuide>
      )}
      {phase === 'photo' && (
        <TutorialGuide action={{ label: submitLabel, onClick: submit }}>
          カレーの写真の例ができました。本番ではAIが料理の候補を見つけ、自分でも選び直せます。
        </TutorialGuide>
      )}
    </div>
  )
}
