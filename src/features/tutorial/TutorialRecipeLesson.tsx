import { useEffect, useRef, useState } from 'react'
import { BookOpen, Camera, Check, Clock3, Coins, Hand, Sparkles, Utensils } from 'lucide-react'
import { DishArt } from '../../ui/art/GameArt'
import { TutorialGuide } from './TutorialGuide'
import { recipes } from '../../app/game/browserGame'

type Phase = 'cooking' | 'photo' | 'earned' | 'board' | 'recipe'
type NextPhase = Exclude<Phase, 'cooking'>

const sceneLabels: Record<Phase, string> = {
  cooking: '作ったカレー',
  photo: '撮ったカレーの写真',
  earned: 'カレーのカードを獲得',
  board: 'ずかんのレシピカード',
  recipe: 'おにぎりのレシピ',
}

export function TutorialCards({
  onReady,
  onPhaseChange,
}: {
  onReady: () => void
  onPhaseChange?: (phase: NextPhase) => void
}) {
  const curry = recipes.find((recipe) => recipe.id === 'curry')!
  const onigiri = recipes.find((recipe) => recipe.id === 'onigiri')!
  const [phase, setPhase] = useState<Phase>('cooking')
  const [coins, setCoins] = useState(0)
  const currentPhase = useRef<Phase>('cooking')
  const completed = useRef(false)
  const reducedMotion = useRef(false)
  const scene = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (phase !== 'cooking') scene.current?.focus({ preventScroll: true })
  }, [phase])

  useEffect(() => {
    if (phase !== 'earned' || reducedMotion.current) return
    let frame = 0
    let start: number | undefined
    function countCoins(time: number) {
      start ??= time
      const progress = Math.min((time - start) / 800, 1)
      setCoins(Math.round(curry.reward * (1 - (1 - progress) ** 3)))
      if (progress < 1) frame = requestAnimationFrame(countCoins)
    }
    frame = requestAnimationFrame(countCoins)
    return () => cancelAnimationFrame(frame)
  }, [phase, curry.reward])

  function advance(from: Phase, to: NextPhase) {
    if (currentPhase.current !== from) return
    if (from === 'earned' && coins < curry.reward) return
    currentPhase.current = to
    if (to === 'earned') {
      reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reducedMotion.current) setCoins(curry.reward)
    }
    setPhase(to)
    onPhaseChange?.(to)
    if (to === 'recipe' && !completed.current) {
      completed.current = true
      onReady()
    }
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
              できた料理
            </span>
            <div className="tutorial-recipe-placemat" aria-hidden="true">
              <DishArt kind={curry.sample} />
            </div>
            <strong className="tutorial-recipe-dish-name">{curry.name}</strong>
          </div>
        )}
        {phase === 'photo' && (
          <div className="tutorial-recipe-camera-view">
            <div
              className="tutorial-recipe-snapshot"
              role="img"
              aria-label="撮ったカレーの写真の例"
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
              撮った写真
            </span>
          </div>
        )}
        {phase === 'earned' && (
          <div className="tutorial-recipe-earned-stage">
            <div className="tutorial-recipe-new-card">
              <span className="tutorial-recipe-new-label">新しいカード</span>
              <DishArt kind={curry.sample} />
              <strong>{curry.name}</strong>
            </div>
            <div
              className="tutorial-recipe-first-reward"
              role="status"
              aria-label={`初回ボーナス ${curry.reward}コイン`}
            >
              <Sparkles size={22} aria-hidden="true" />
              <span>初回ボーナス</span>
              <strong aria-hidden="true">
                <Coins size={22} />+{coins}
              </strong>
              <span aria-hidden="true">コイン</span>
            </div>
            <span className="tutorial-recipe-coin-spark" aria-hidden="true">
              <Coins size={23} />
            </span>
          </div>
        )}
        {phase === 'board' && (
          <div className="tutorial-recipe-catalog">
            <div className="tutorial-recipe-hud">
              <div
                className="tutorial-recipe-total"
                role="group"
                aria-label={`レシピカード 1/${recipes.length}`}
              >
                <BookOpen size={15} aria-hidden="true" />
                <span>
                  ずかん<small>レシピカード</small>
                </span>
                <strong>
                  1<small>/{recipes.length}</small>
                </strong>
              </div>
              <div
                className="tutorial-recipe-wallet"
                role="group"
                aria-label={`${curry.reward}コイン`}
              >
                <Coins size={16} aria-hidden="true" />
                <strong>{curry.reward}</strong>
              </div>
            </div>
            <div className="tutorial-recipe-board">
              <div
                className="tutorial-recipe-slot is-filled"
                aria-label="カレーのカード 獲得済み"
                role="group"
              >
                <DishArt kind={curry.sample} />
                <strong>{curry.name}</strong>
                <span className="tutorial-recipe-owned">
                  <Check size={10} aria-hidden="true" />
                  獲得済み
                </span>
              </div>
              <button
                type="button"
                className="tutorial-recipe-slot tutorial-recipe-target"
                aria-label="おにぎりのレシピを見る"
                onClick={() => advance('board', 'recipe')}
              >
                <span className="tutorial-recipe-unknown" aria-hidden="true">
                  ?
                </span>
                <strong>おにぎり</strong>
                <span className="tutorial-recipe-open-label">レシピを見る</span>
                <Hand className="tutorial-recipe-pointer" size={25} aria-hidden="true" />
              </button>
              <div className="tutorial-recipe-slot tutorial-recipe-unavailable">
                <span className="tutorial-recipe-unknown" aria-hidden="true">
                  ?
                </span>
                <strong>スープ</strong>
                <span className="tutorial-recipe-empty">未獲得</span>
              </div>
            </div>
          </div>
        )}
        {phase === 'recipe' && (
          <section className="tutorial-recipe-detail" aria-labelledby="tutorial-onigiri-title">
            <header className="tutorial-recipe-detail-heading">
              <div className="tutorial-recipe-detail-art">
                <DishArt kind={onigiri.sample} />
              </div>
              <h2 id="tutorial-onigiri-title">
                <span>レシピ</span>
                {onigiri.name}
              </h2>
              <span className="tutorial-recipe-time">
                <Clock3 size={12} aria-hidden="true" />
                {onigiri.minutes}分
              </span>
            </header>
            <div
              className="tutorial-recipe-detail-scroll"
              tabIndex={0}
              role="region"
              aria-label="おにぎりの材料と作り方"
            >
              <ul className="tutorial-recipe-materials" aria-label="材料">
                {onigiri.ingredients.map((ingredient) => (
                  <li key={ingredient}>{ingredient}</li>
                ))}
              </ul>
              <details className="tutorial-recipe-method">
                <summary>作り方</summary>
                <ol>
                  {onigiri.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </details>
            </div>
          </section>
        )}
      </div>
      {phase === 'cooking' && (
        <TutorialGuide
          action={{ label: 'カレーの写真を撮る', onClick: () => advance('cooking', 'photo') }}
        >
          作った料理の写真を記録すると、料理に合ったカードが手に入ります。ここではカレーで試しましょう。
        </TutorialGuide>
      )}
      {phase === 'photo' && (
        <TutorialGuide
          action={{ label: 'この写真を記録する', onClick: () => advance('photo', 'earned') }}
        >
          今回はこの写真を使って試します。料理の写真を記録しましょう。
        </TutorialGuide>
      )}
      {phase === 'earned' && (
        <TutorialGuide
          action={{
            label: 'ずかんを見る',
            onClick: () => advance('earned', 'board'),
            disabled: coins < curry.reward,
          }}
        >
          初めて作った料理はカードになり、ずかんに残ります。
        </TutorialGuide>
      )}
      {phase === 'board' && (
        <TutorialGuide>まだ持っていないカードから、次に作る料理のレシピを探せます。</TutorialGuide>
      )}
      {phase === 'recipe' && (
        <TutorialGuide>
          次に作りたい料理が見つかったら、自分の台所で作ってみましょう。
        </TutorialGuide>
      )}
    </div>
  )
}
