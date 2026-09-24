import { useEffect, useState } from 'react'
import { ArrowRight, Camera, Heart, Sparkles } from 'lucide-react'
import { DishArt, GatheringScene, Pet } from '../../ui/art/GameArt'
import { DiscoverySilhouette } from '../../ui/art/DiscoverySilhouette'
import { JourneyFrame } from '../../ui/journey/JourneyFrame'
import { TutorialFriends } from './TutorialCollectionLessons'
import { TutorialCards } from './TutorialRecipeLesson'
import type { TutorialCardPhase } from './TutorialRecipeLesson'
import { TutorialPhotoExample } from './TutorialPhotoExample'
import type { TutorialPhotoPhase } from './TutorialPhotoExample'
import { TutorialGuide } from './TutorialGuide'
import { StreakCelebration } from '../streak/StreakCelebration'
import { growthStages, LOGIN_BONUS, species } from '../../app/game/browserGame'
import type { GrowthStage, SpeciesId, TutorialStep } from '../../app/game/browserGame'

type Props = {
  speciesId: SpeciesId
  step: TutorialStep
  replay?: boolean
  onStep: (step: TutorialStep) => void
  onPause: () => void
  onComplete: () => void
}

const scenes = [
  'welcome',
  'tutorial-growth',
  'tutorial-friends',
  'tutorial-cards',
  'tutorial-streak',
]
const titles = [
  '自炊でなかまを育てよう',
  '育つと姿が変わる',
  '育った子にごはんをあげよう',
  '作った料理を記録しよう',
  'まずは3日続けてみよう',
]
const chapters = [
  'ごはんをあげる',
  '姿を育てる',
  'なかまをふやす',
  '料理カードを集める',
  '自炊を続ける',
]

export function TutorialJourney(props: Props) {
  return <TutorialLesson key={props.step} {...props} />
}

function TutorialLesson({ speciesId, step, replay = false, onStep, onPause, onComplete }: Props) {
  const name = species.find((entry) => entry.id === speciesId)!.name
  const [meal, setMeal] = useState<TutorialPhotoPhase | 'hungry' | 'eating' | 'full'>('cooking')
  const [form, setForm] = useState<GrowthStage>(0)
  const [ready, setReady] = useState(false)
  const [friendPhase, setFriendPhase] = useState<
    'waiting' | 'aroma' | 'noticed' | 'visiting' | 'joined' | 'home'
  >('waiting')
  const [cardPhase, setCardPhase] = useState<TutorialCardPhase>('cooking')
  const [days, setDays] = useState(0)
  const [streakReady, setStreakReady] = useState(true)
  useEffect(() => {
    if (step !== 4 || !streakReady || days >= 3) return
    const timer = window.setTimeout(() => {
      setStreakReady(false)
      setDays((current) => current + 1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [step, days, streakReady])
  useEffect(() => {
    if (meal !== 'eating') return
    const timer = window.setTimeout(() => setMeal('full'), 1700)
    return () => window.clearTimeout(timer)
  }, [meal])
  useEffect(() => {
    function cancel(event: KeyboardEvent) {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault()
        onPause()
      }
    }
    window.addEventListener('keydown', cancel)
    return () => window.removeEventListener('keydown', cancel)
  }, [onPause])
  const done =
    step === 0
      ? meal === 'full'
      : step === 1
        ? form === 2
        : step === 4
          ? days === 3 && streakReady
          : ready
  let title = titles[step]
  if (step === 0 && meal !== 'cooking') {
    title = {
      capturing: 'カレーの例を撮影中',
      photo: '料理の写真を記録しよう',
      hungry: `${name}にごはんをあげよう`,
      eating: `${name}が食事中`,
      full: 'ごはんで経験値を獲得',
    }[meal]
  }
  if (step === 2 && friendPhase !== 'waiting') {
    title = {
      aroma: 'ごはんの匂いが広がる',
      noticed: '匂いに気づいた子がいる',
      visiting: '匂いに誘われて近づいてくる',
      joined: '新しいなかまが増えました',
      home: '新しいなかまも育てよう',
    }[friendPhase]
  }
  if (step === 3 && cardPhase !== 'cooking') {
    title = {
      capturing: 'カレーの例を撮影中',
      photo: '料理の写真を記録する',
      earned: 'はじめてのカードを獲得',
      board: 'カレーがずかんに加わりました',
      browse: 'ずかんで次の料理を探そう',
      recipe: '次に作る料理を見つけよう',
    }[cardPhase]
  }
  let action = 'つづける'
  if (step === 0 && !done) action = meal === 'hungry' ? 'ごはんをあげる' : '食事中'
  if (step === 1 && !done) action = form === 0 ? '育った姿を見る' : 'もっと育った姿を見る'
  if (step === 4) {
    action = 'ひろばへ'
    if (days > 0)
      title = !streakReady
        ? `${days}日目のごはんを記録`
        : days === 1
          ? '1日目を記録しました'
          : `${days}日連続を達成`
  }
  function advance() {
    if (step === 0 && meal === 'hungry') return setMeal('eating')
    if (step === 1 && form < 2) return setForm((form + 1) as GrowthStage)
    if (!done) return
    if (step === 4) return onComplete()
    onStep((step + 1) as TutorialStep)
  }
  return (
    <JourneyFrame
      scene={scenes[step]}
      eyebrow={`チュートリアル ${step + 1}/5 · ${chapters[step]}`}
      title={title}
      progress={{ current: step + 1, total: 5, label: 'チュートリアルの進み具合' }}
      onBack={step > 0 ? () => onStep((step - 1) as TutorialStep) : undefined}
      backLabel="前の練習に戻る"
      onClose={onPause}
      closeLabel="チュートリアルを中断"
      footer={
        <>
          {done && (
            <button
              className="tutorial-chapter-next"
              aria-label={step < 4 ? `次の章へ：${chapters[step + 1]}` : action}
              onClick={advance}
            >
              <span>
                <small>
                  {step < 4 ? '次の章へ' : replay ? 'チュートリアルを閉じる' : '自炊をはじめよう'}
                </small>
                <strong>{step < 4 ? chapters[step + 1] : action}</strong>
              </span>
              <ArrowRight size={23} aria-hidden="true" />
            </button>
          )}
          {!(step === 4 && done) && (
            <button className="journey-secondary" onClick={onPause}>
              ひろばを見てみる
            </button>
          )}
        </>
      }
    >
      <div className={`tutorial-lesson tutorial-step-${step}`}>
        <span className="tutorial-example">{step === 4 ? '自炊の記録例' : '操作の練習'}</span>
        {step === 0 && (meal === 'cooking' || meal === 'capturing' || meal === 'photo') && (
          <TutorialPhotoExample onPhaseChange={setMeal} onSubmit={() => setMeal('hungry')} />
        )}
        {step === 0 && (meal === 'hungry' || meal === 'eating' || meal === 'full') && (
          <>
            <div className={`tutorial-meal-world is-${meal}`}>
              <GatheringScene />
              <div className="tutorial-meal-pet">
                <Pet
                  species={speciesId}
                  stage={0}
                  mood={meal === 'hungry' ? 'hungry' : meal === 'eating' ? 'eating' : 'happy'}
                />
              </div>
              <div className="tutorial-photo">
                <Camera size={18} />
                <DishArt kind="curry" />
              </div>
              <ArrowRight className="tutorial-photo-arrow" size={28} aria-hidden="true" />
              {meal === 'full' && (
                <Heart className="tutorial-fed-heart" aria-hidden="true" fill="currentColor" />
              )}
              <span className="tutorial-pet-name">{name}</span>
            </div>
            <div className="tutorial-xp-panel" role="status">
              <div>
                <span>{meal === 'full' ? '満腹' : meal === 'eating' ? '食事中' : '空腹'}</span>
                <strong>{meal === 'full' ? '+45 XP' : '0 XP'}</strong>
              </div>
              <div
                className="tutorial-xp-track"
                role="progressbar"
                aria-label="最初の成長まで"
                aria-valuenow={meal === 'full' ? 45 : 0}
                aria-valuemin={0}
                aria-valuemax={120}
              >
                <i style={{ width: meal === 'full' ? '37.5%' : '0%' }} />
              </div>
              <span>次の成長まで {meal === 'full' ? 75 : 120} XP</span>
            </div>
            <TutorialGuide
              action={
                !done ? { label: action, onClick: advance, disabled: meal === 'eating' } : undefined
              }
            >
              {done
                ? 'ごはんを食べると経験値（XP）がたまります。毎日の自炊で育てていきましょう。'
                : meal === 'hungry'
                  ? `写真を記録できました。ごはんをあげて、${name}に食べてもらいましょう。`
                  : `${name}がごはんを食べています。`}
            </TutorialGuide>
          </>
        )}
        {step === 1 && (
          <>
            <div className="tutorial-evolution" key={form}>
              <div className="tutorial-evolution-ring" />
              <Pet species={speciesId} stage={form} mood="happy" />
              <Sparkles className="tutorial-evolution-spark" aria-hidden="true" />
              <strong role="status">{growthStages[form].name}</strong>
            </div>
            <ol className="tutorial-form-trail" aria-label="5段階の成長">
              {growthStages.map(({ stage, threshold, name: formName }) => (
                <li
                  key={stage}
                  className={stage <= form ? 'is-seen' : ''}
                  aria-current={stage === form ? 'step' : undefined}
                >
                  <div>
                    {stage <= form ? (
                      <Pet species={speciesId} stage={stage} mood="happy" />
                    ) : (
                      <DiscoverySilhouette>
                        <Pet species={speciesId} stage={stage} />
                      </DiscoverySilhouette>
                    )}
                  </div>
                  <span>{stage <= form ? formName : '???'}</span>
                  <small>{threshold} XP</small>
                </li>
              ))}
            </ol>
            <TutorialGuide action={!done ? { label: action, onClick: advance } : undefined}>
              {form === 0
                ? `経験値がたまると姿が変わります。${name}の成長を少し見てみましょう。`
                : form === 1
                  ? 'ちびっこになりました。さらに育つと、違う姿になります。'
                  : '全部で5つの姿に成長します。自炊を続けて見つけましょう。'}
            </TutorialGuide>
          </>
        )}
        {step === 2 && (
          <TutorialFriends
            speciesId={speciesId}
            onReady={() => setReady(true)}
            onPhaseChange={setFriendPhase}
          />
        )}
        {step === 3 && (
          <TutorialCards onReady={() => setReady(true)} onPhaseChange={setCardPhase} />
        )}
        {step === 4 && (
          <>
            <StreakCelebration
              beforeDays={Math.max(0, days - 1)}
              afterDays={days}
              reward={days === 3 ? 30 : 0}
              compact
              onComplete={() => setStreakReady(true)}
            />
            <TutorialGuide>
              毎日ごはんを記録すると連続記録が伸び、3日続けると30コインもらえます。
              毎日のログインでも{LOGIN_BONUS}コインもらえます。
            </TutorialGuide>
          </>
        )}
      </div>
    </JourneyFrame>
  )
}
