import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Camera,
  Check,
  Coins,
  Flame,
  Heart,
  LockKeyhole,
  Sparkles,
  Utensils,
} from 'lucide-react'
import { DishArt, GatheringScene, Pet } from './GameArt'
import { JourneyFrame } from './JourneyFrame'
import { TutorialCards, TutorialFriends } from './TutorialCollectionLessons'
import { growthStages, LOGIN_BONUS, species } from './game'
import type { GrowthStage, SpeciesId, TutorialStep } from './game'
import './tutorial.css'

type Props = {
  speciesId: SpeciesId
  step: TutorialStep
  replay?: boolean
  onStep: (step: TutorialStep) => void
  onPause: () => void
  onComplete: (recordMeal: boolean) => void
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
  'お客さんをなかまにしよう',
  '料理を集めて図鑑を埋めよう',
  'まずは3日続けてみよう',
]
const descriptions = [
  '料理の写真を記録して、なかまにごはんをあげます。',
  '食事で経験値をためて、5つの姿を見つけましょう。',
  '育つとお客さんが来ます。ごはんをあげると仲間になります。',
  '初めての料理を記録すると、カードとコインを獲得できます。',
  '自炊を記録した日が連続記録になります。',
]

export function TutorialJourney(props: Props) {
  return <TutorialLesson key={props.step} {...props} />
}

function TutorialLesson({ speciesId, step, replay = false, onStep, onPause, onComplete }: Props) {
  const name = species.find((entry) => entry.id === speciesId)!.name
  const [meal, setMeal] = useState<'hungry' | 'eating' | 'full'>('hungry')
  const [form, setForm] = useState<GrowthStage>(0)
  const [ready, setReady] = useState(false)
  const [days, setDays] = useState(1)
  useEffect(() => {
    if (meal !== 'eating') return
    const timer = window.setTimeout(() => setMeal('full'), 850)
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
    step === 0 ? meal === 'full' : step === 1 ? form === 2 : step === 4 ? days === 3 : ready
  let action = 'つづける'
  if (step === 0 && !done) action = meal === 'eating' ? '食事中' : 'ごはんをあげてみる'
  if (step === 1 && !done) action = form === 0 ? '育った姿を見る' : 'もっと育った姿を見る'
  if (step === 4)
    action = done ? (replay ? 'ひろばへ' : 'はじめてのごはんへ') : '翌日のごはんを記録する'
  function advance() {
    if (step === 0 && meal === 'hungry') return setMeal('eating')
    if (step === 0 && meal === 'eating') return
    if (step === 1 && form < 2) return setForm((form + 1) as GrowthStage)
    if (step === 4 && days < 3) return setDays(days + 1)
    if (!done) return
    if (step === 4) return onComplete(!replay)
    onStep((step + 1) as TutorialStep)
  }
  return (
    <JourneyFrame
      scene={scenes[step]}
      eyebrow={`あそびかた ${step + 1}/5`}
      title={titles[step]}
      subtitle={descriptions[step]}
      progress={{ current: step + 1, total: 5, label: 'あそびかたの進み具合' }}
      onBack={step > 0 ? () => onStep((step - 1) as TutorialStep) : undefined}
      backLabel="前の練習に戻る"
      onClose={onPause}
      closeLabel="チュートリアルを中断"
      footer={
        <>
          {((step !== 2 && step !== 3) || ready) && (
            <button className="journey-primary" onClick={advance} disabled={meal === 'eating'}>
              {step === 0 && !done ? <Utensils size={20} /> : <ArrowRight size={20} />}
              {action}
            </button>
          )}
          <button
            className="journey-secondary"
            onClick={step === 4 && done ? () => onComplete(false) : onPause}
          >
            {step === 4 && done ? (replay ? '終了する' : 'あとで記録する') : 'ひろばを見てみる'}
          </button>
        </>
      }
    >
      <div className={`tutorial-lesson tutorial-step-${step}`}>
        <span className="tutorial-example">操作の練習</span>
        {step === 0 && (
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
              <span>次の姿まで {meal === 'full' ? 75 : 120} XP</span>
            </div>
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
                      <LockKeyhole size={20} />
                    )}
                  </div>
                  <span>{stage <= form ? formName : '???'}</span>
                  <small>{threshold} XP</small>
                </li>
              ))}
            </ol>
          </>
        )}
        {step === 2 && <TutorialFriends speciesId={speciesId} onReady={() => setReady(true)} />}
        {step === 3 && <TutorialCards onReady={() => setReady(true)} />}
        {step === 4 && (
          <>
            <div className={`tutorial-streak is-day-${days}`}>
              <Flame size={44} fill="currentColor" aria-hidden="true" />
              <div className="tutorial-day-count" role="status">
                <strong>{days}</strong>日連続
              </div>
              <ol className="tutorial-calendar" aria-label="3日間の自炊">
                {['rice', 'soup', 'curry'].map((dish, index) => (
                  <li key={dish} className={index < days ? 'is-recorded' : ''}>
                    <span>{index + 1}日目</span>
                    <div>{index < days ? <DishArt kind={dish} /> : <Utensils size={22} />}</div>
                    {index < days ? (
                      <Check size={18} />
                    ) : (
                      <span className="tutorial-calendar-dot" />
                    )}
                  </li>
                ))}
              </ol>
              <div className={`tutorial-streak-prize ${done ? 'is-earned' : ''}`} role="status">
                <Coins size={24} />
                <strong>{done ? '3日連続ボーナス +30' : '3日連続で +30'}</strong>
              </div>
            </div>
            <div className="tutorial-login">
              <Coins size={16} />
              ログインでも毎日 +{LOGIN_BONUS}コイン
            </div>
            {done && <p className="tutorial-next-goal">次は自分で作ったごはんを記録しましょう。</p>}
          </>
        )}
      </div>
    </JourneyFrame>
  )
}
