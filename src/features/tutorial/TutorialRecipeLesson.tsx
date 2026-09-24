import { useCallback, useEffect, useRef, useState } from 'react'
import { BookOpen, Check, Clock3, Coins, Hand, Sparkles } from 'lucide-react'
import { DishArt } from '../../ui/art/GameArt'
import { RecipeArt } from '../../ui/art/RecipeArt'
import { TutorialGuide } from './TutorialGuide'
import { TutorialPhotoExample, type TutorialPhotoPhase } from './TutorialPhotoExample'
import { recipes } from '../../app/game/browserGame'

export type TutorialCardPhase = TutorialPhotoPhase | 'earned' | 'board' | 'browse' | 'recipe'
type Phase = TutorialCardPhase
type NextPhase = Exclude<Phase, 'cooking'>

const sceneLabels: Record<Exclude<Phase, TutorialPhotoPhase>, string> = {
  earned: 'カレーのカードを獲得',
  board: 'ずかんのレシピカード',
  browse: 'ずかんで次の料理を探す',
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
  const changePhotoPhase = useCallback(
    (next: TutorialPhotoPhase) => {
      currentPhase.current = next
      setPhase(next)
      if (next !== 'cooking') onPhaseChange?.(next)
    },
    [onPhaseChange],
  )

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

  if (phase === 'cooking' || phase === 'capturing' || phase === 'photo') {
    return (
      <TutorialPhotoExample
        onSubmit={() => advance('photo', 'earned')}
        onPhaseChange={changePhotoPhase}
      />
    )
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
        {(phase === 'board' || phase === 'browse') && (
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
              {phase === 'board' ? (
                <button
                  type="button"
                  className="tutorial-recipe-slot is-filled tutorial-recipe-target"
                  aria-label="追加されたカレーを確認する"
                  onClick={() => advance('board', 'browse')}
                >
                  <DishArt kind={curry.sample} />
                  <strong>{curry.name}</strong>
                  <span className="tutorial-recipe-owned">
                    <Check size={10} aria-hidden="true" />
                    追加済み
                  </span>
                  <Hand className="tutorial-recipe-pointer" size={25} aria-hidden="true" />
                </button>
              ) : (
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
              )}
              {phase === 'browse' ? (
                <button
                  type="button"
                  className="tutorial-recipe-slot tutorial-recipe-target"
                  aria-label="おにぎりのレシピを見る"
                  onClick={() => advance('browse', 'recipe')}
                >
                  <RecipeArt recipe={onigiri} silhouette />
                  <strong>おにぎり</strong>
                  <span className="tutorial-recipe-open-label">レシピを見る</span>
                  <Hand className="tutorial-recipe-pointer" size={25} aria-hidden="true" />
                </button>
              ) : (
                <div className="tutorial-recipe-slot tutorial-recipe-unavailable">
                  <RecipeArt recipe={onigiri} silhouette />
                  <strong>おにぎり</strong>
                  <span className="tutorial-recipe-empty">未獲得</span>
                </div>
              )}
              <div className="tutorial-recipe-slot tutorial-recipe-unavailable">
                <RecipeArt sample="soup" silhouette />
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
                <RecipeArt recipe={onigiri} silhouette />
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
        <TutorialGuide>
          カレーがずかんに追加されました。光っているカレーのカードを押して、確認しましょう。
        </TutorialGuide>
      )}
      {phase === 'browse' && (
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
