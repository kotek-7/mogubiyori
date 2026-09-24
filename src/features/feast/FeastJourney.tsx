import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Coins, Flame, Heart, Sparkles, Utensils } from 'lucide-react'
import { GatheringScene, ItemArt, Pet } from '../../ui/art/GameArt'
import { RecipeArt } from '../../ui/art/RecipeArt'
import { JourneyFrame } from '../../ui/journey/JourneyFrame'
import { FeastXpReward } from './FeastXpReward'
import { StreakCelebration } from '../streak/StreakCelebration'
import { items, recipeById, species, stageName, stageOf } from '../../app/game/browserGame'
import type { FeedReceipt } from '../../../shared/game/receipt'
import { feastStepsFromReceipt } from './feastSteps'
import { transitionScene } from '../../ui/journey/journeyTransition'

export const EATING_DURATION = 3600

export function FeastJourney({
  receipt,
  photo,
  onDone,
}: {
  receipt: FeedReceipt
  photo?: string
  onDone: () => void
}) {
  const steps = useMemo(() => feastStepsFromReceipt(receipt), [receipt])
  const [index, setIndex] = useState(0)
  const [completedStreak, setCompletedStreak] = useState<number | null>(null)
  const step = steps[index]
  const waitingForStreak = step?.type === 'streak' && completedStreak !== index
  const finished = useRef(false)
  const doneCallback = useRef(onDone)
  useEffect(() => {
    doneCallback.current = onDone
  }, [onDone])
  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    doneCallback.current()
  }, [])
  const advance = useCallback(() => {
    if (waitingForStreak) return
    if (index >= steps.length - 1) finish()
    else transitionScene(() => setIndex((current) => (current === index ? current + 1 : current)))
  }, [index, steps.length, finish, waitingForStreak])
  useEffect(() => {
    if (!step) {
      finish()
      return
    }
    if (step.type !== 'eating') return
    const timeout = window.setTimeout(advance, EATING_DURATION)
    return () => window.clearTimeout(timeout)
  }, [step, advance, finish])
  if (!step) return null

  const { meal, target, equipped, streak } = receipt
  const targetId = target.id
  const beforeStage = step.type === 'growth' ? step.from : stageOf(target.beforeXp)
  const afterStage = step.type === 'growth' ? step.to : stageOf(target.afterXp)
  const name = target.name
  const last = index === steps.length - 1
  const recipe = step.type === 'card' ? recipeById(step.recipeId) : undefined
  const giftName = items.find((item) => item.id === 'sprout')?.name ?? 'ふたばのかんむり'
  const titles = {
    eating: '食事中',
    growth: '新しい姿になりました',
    joined: `${name}が仲間になりました`,
    card: 'レシピカード獲得',
    arrivals: '新しいお客さん',
    streak: '自炊の連続記録',
    gift: '7日のおくりもの',
    xp: 'XP獲得',
  }
  const rewardSummary = (
    <div
      className={`feast-scene-rewards${waitingForStreak ? ' feast-summary-pending' : ''}`}
      role="group"
      aria-label="獲得した報酬"
      aria-hidden={waitingForStreak || undefined}
    >
      {step.type !== 'xp' && (
        <span>
          <Sparkles size={15} />
          <strong>+{meal.xp}</strong> XP
        </span>
      )}
      <span>
        <Coins size={15} />
        <strong>+{meal.coins}</strong> コイン
      </span>
      <span>
        <Flame size={15} />
        <strong>{streak.afterDays}日連続</strong>
      </span>
      {!!meal.streakBonus && <small>継続ボーナス +{meal.streakBonus} コインを含む</small>}
    </div>
  )

  return (
    <JourneyFrame
      key={`${index}-${step.type}`}
      scene={step.type}
      title={titles[step.type]}
      footer={
        <button
          type="button"
          className={step.type === 'eating' ? 'journey-secondary' : 'journey-primary'}
          onClick={advance}
          disabled={waitingForStreak}
          aria-label={step.type === 'eating' ? '早送り' : undefined}
        >
          {step.type === 'eating' ? '早送り' : last ? 'ひろばへ' : 'つづける'}
          {step.type !== 'eating' && <ArrowRight size={19} />}
        </button>
      }
    >
      <div className={`feast-scene feast-scene-${step.type}`}>
        {step.type === 'xp' && (
          <FeastXpReward
            species={targetId}
            name={name}
            hat={equipped.hat}
            neck={equipped.neck}
            bag={equipped.bag}
            fromXp={target.beforeXp}
            toXp={target.afterXp}
            gained={meal.xp}
          />
        )}
        {step.type === 'eating' && (
          <div className="journey-art feast-scene-art feast-dining-art">
            <div className="feast-dining-circle" />
            <Pet
              species={targetId}
              stage={beforeStage}
              mood="eating"
              hat={equipped.hat}
              neck={equipped.neck}
              bag={equipped.bag}
            />
            <div className="feast-table-edge" />
            <div className="feast-plate">
              {photo ? (
                <img src={photo} alt={meal.title} />
              ) : (
                <RecipeArt recipe={recipeById(meal.recipeId)} sample={meal.sample} />
              )}
            </div>
            <span className="feast-heart feast-heart-left" aria-hidden="true">
              <Heart fill="currentColor" />
            </span>
            <span className="feast-heart feast-heart-right" aria-hidden="true">
              <Heart fill="currentColor" />
            </span>
          </div>
        )}
        {step.type === 'growth' && (
          <div className="journey-art feast-scene-art feast-growth-art">
            <div className="feast-rays" />
            <Pet
              species={targetId}
              stage={afterStage}
              mood="happy"
              hat={equipped.hat}
              neck={equipped.neck}
              bag={equipped.bag}
              className="feast-growth-reveal"
            />
            <div className="feast-previous-form">
              <Pet
                species={targetId}
                stage={beforeStage}
                mood="happy"
                hat={equipped.hat}
                neck={equipped.neck}
                bag={equipped.bag}
              />
              <ArrowRight size={22} aria-hidden="true" />
            </div>
            <span className="feast-stage-label">
              <Sparkles size={17} />
              {stageName(afterStage)} · {afterStage + 1}/5
            </span>
          </div>
        )}
        {step.type === 'joined' && (
          <div className="journey-art feast-scene-art feast-joined-art">
            <Pet species={targetId} stage={afterStage} mood="happy" hat="none" />
          </div>
        )}
        {step.type === 'card' && recipe && (
          <div className="journey-art feast-card-art">
            <div
              className={`feast-recipe-flip rarity-${recipe.rarity}`}
              role="group"
              aria-label={`${recipe.name}のレシピカードを獲得`}
            >
              <div className="feast-recipe-flip-inner">
                <div className="feast-recipe-back" aria-hidden="true">
                  <Utensils size={68} />
                  <span>もぐ日和</span>
                  <Sparkles size={24} />
                </div>
                <div className="feast-recipe-front">
                  <span className="feast-card-rarity">
                    {recipe.rarity === 'special'
                      ? 'スペシャル'
                      : recipe.rarity === 'rare'
                        ? 'レア'
                        : 'ノーマル'}
                  </span>
                  <RecipeArt recipe={recipe} />
                  <strong>{recipe.name}</strong>
                  <span className="feast-card-bonus">
                    <Coins size={16} />
                    カードボーナス +{meal.cardBonus ?? 0} コイン
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {step.type === 'arrivals' && (
          <div className="journey-art feast-arrivals-art">
            <GatheringScene variant={equipped.room} />
            <div className="feast-arrival-friends">
              {step.visitors.map((id, position) => (
                <div key={id} style={{ animationDelay: `${position * 170}ms` }}>
                  <Pet species={id} stage={0} mood="hungry" />
                  <strong>{species.find((candidate) => candidate.id === id)?.name}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
        {step.type === 'gift' && (
          <div className="journey-art feast-scene-art feast-gift-art">
            <div className="feast-gift-number" aria-hidden="true">
              7
            </div>
            <ItemArt id="sprout" />
            <span className="feast-gift-ribbon">{giftName}</span>
          </div>
        )}
        {step.type === 'streak' && (
          <StreakCelebration
            beforeDays={step.beforeDays}
            afterDays={step.afterDays}
            reward={step.reward}
            onComplete={() => setCompletedStreak(index)}
          />
        )}
        {step.type === 'arrivals' && (
          <p className="journey-note">ごはんをあげると仲間になります。</p>
        )}
        {last && rewardSummary}
      </div>
    </JourneyFrame>
  )
}
