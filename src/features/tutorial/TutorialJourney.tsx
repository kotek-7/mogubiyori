import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Camera, Check, Heart, Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import { GatheringScene, Pet } from '../../ui/art/GameArt'
import { DiscoverySilhouette } from '../../ui/art/DiscoverySilhouette'
import { JourneyFrame } from '../../ui/journey/JourneyFrame'
import { TutorialFriends } from './TutorialCollectionLessons'
import { TutorialCards } from './TutorialRecipeLesson'
import type { TutorialCardPhase } from './TutorialRecipeLesson'
import { TutorialFirstPhoto } from './TutorialFirstPhoto'
import type { TutorialFirstPhotoPhase } from './TutorialFirstPhoto'
import { TutorialGuide } from './TutorialGuide'
import { useTutorialPlayback } from './useTutorialPlayback'
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
  '最初の料理写真を撮ろう',
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
  const [playback, setPlayback] = useState(0)
  return (
    <TutorialLesson
      key={`${props.step}-${playback}`}
      {...props}
      onRestart={() => setPlayback((current) => current + 1)}
    />
  )
}

function TutorialLesson({
  speciesId,
  step,
  replay = false,
  onStep,
  onPause,
  onComplete,
  onRestart,
}: Props & { onRestart: () => void }) {
  const name = species.find((entry) => entry.id === speciesId)!.name
  const [meal, setMeal] = useState<TutorialFirstPhotoPhase | 'eating' | 'full'>('cooking')
  const [firstPhoto, setFirstPhoto] = useState('')
  const mealScene = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState<GrowthStage>(0)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [friendPhase, setFriendPhase] = useState<
    'waiting' | 'aroma' | 'noticed' | 'visiting' | 'joined' | 'home'
  >('waiting')
  const [cardPhase, setCardPhase] = useState<TutorialCardPhase>('cooking')
  const [days, setDays] = useState(0)
  const [streakReady, setStreakReady] = useState(true)
  useEffect(() => {
    if (meal === 'eating') mealScene.current?.focus({ preventScroll: true })
  }, [meal])
  useEffect(() => {
    if (step !== 4 || !streakReady || days >= 3) return
    const timer = window.setTimeout(() => {
      setStreakReady(false)
      setDays((current) => current + 1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [step, days, streakReady])
  useTutorialPlayback(meal, () => setMeal('full'), meal === 'eating' ? 1700 : null)
  useTutorialPlayback(
    form,
    () => setForm((form + 1) as GrowthStage),
    step === 1 && form < 2 ? 1600 : null,
    playing,
  )
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
      loading: '写真を読み込み中',
      photo: '料理の写真を確認しよう',
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
  if (step === 4 && days > 0) {
    title = !streakReady
      ? `${days}日目のごはんを記録`
      : days === 1
        ? '1日目を記録しました'
        : `${days}日連続を達成`
  }
  function advance() {
    if (step === 0 && !done) return
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
          {(step > 0 || done) && (
            <button
              className="tutorial-chapter-next"
              aria-label={step < 4 ? `次の章へ：${chapters[step + 1]}` : 'ひろばへ'}
              onClick={advance}
            >
              <span>
                <small>
                  {step < 4 ? '次の章へ' : replay ? 'チュートリアルを閉じる' : '自炊をはじめよう'}
                </small>
                <strong>{step < 4 ? chapters[step + 1] : 'ひろばへ'}</strong>
              </span>
              <ArrowRight size={23} aria-hidden="true" />
            </button>
          )}
          {step !== 4 && (
            <button className="journey-secondary" onClick={onPause}>
              ひろばを見てみる
            </button>
          )}
        </>
      }
    >
      <div className={`tutorial-lesson tutorial-step-${step}`} data-playing={playing}>
        {step > 0 && step < 4 ? (
          <div className="tutorial-playback">
            <span>{done ? 'おさらい' : playing ? '自動で紹介' : '一時停止中'}</span>
            <div>
              <button
                type="button"
                aria-label={done ? 'デモの再生完了' : playing ? 'デモを一時停止' : 'デモを再生'}
                aria-disabled={done}
                onClick={() => {
                  if (!done) setPlaying((current) => !current)
                }}
              >
                {done ? (
                  <Check size={15} aria-hidden="true" />
                ) : playing ? (
                  <Pause size={15} aria-hidden="true" />
                ) : (
                  <Play size={15} aria-hidden="true" />
                )}
                {done ? '再生完了' : playing ? '一時停止' : '再生'}
              </button>
              <button type="button" aria-label="最初から見る" onClick={onRestart}>
                <RotateCcw size={15} aria-hidden="true" />
                最初から
              </button>
            </div>
          </div>
        ) : step === 4 ? (
          <span className="tutorial-example">自炊の記録例</span>
        ) : null}
        {step === 0 && (meal === 'cooking' || meal === 'loading' || meal === 'photo') && (
          <TutorialFirstPhoto
            onPhaseChange={setMeal}
            onSubmit={(photo) => {
              setFirstPhoto(photo)
              setMeal('eating')
            }}
          />
        )}
        {step === 0 && (meal === 'eating' || meal === 'full') && (
          <>
            <div
              className={`tutorial-meal-world is-${meal}`}
              ref={mealScene}
              role="group"
              aria-label={`${name}のごはん`}
              tabIndex={-1}
            >
              <GatheringScene />
              <div className="tutorial-meal-pet">
                <Pet species={speciesId} stage={0} mood={meal === 'eating' ? 'eating' : 'happy'} />
              </div>
              <div className="tutorial-photo">
                <Camera size={18} />
                <img src={firstPhoto} alt="料理の写真" />
              </div>
              <ArrowRight className="tutorial-photo-arrow" size={28} aria-hidden="true" />
              {meal === 'full' && (
                <Heart className="tutorial-fed-heart" aria-hidden="true" fill="currentColor" />
              )}
              <span className="tutorial-pet-name">{name}</span>
            </div>
            <div className="tutorial-xp-panel" role="status">
              <div>
                <span>{meal === 'full' ? '満腹' : '食事中'}</span>
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
            <TutorialGuide>
              料理の写真でごはんをあげると、経験値（XP）がたまります。毎日の自炊で育てていきましょう。
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
            <TutorialGuide>
              ごはんで経験値がたまると、全部で5つの姿に成長します。育った姿は、自炊を続けて見つけましょう。
            </TutorialGuide>
          </>
        )}
        {step === 2 && (
          <TutorialFriends
            speciesId={speciesId}
            playing={playing}
            onReady={() => setReady(true)}
            onPhaseChange={setFriendPhase}
          />
        )}
        {step === 3 && (
          <TutorialCards
            playing={playing}
            onReady={() => setReady(true)}
            onPhaseChange={setCardPhase}
          />
        )}
        {step === 4 && (
          <>
            <StreakCelebration
              beforeDays={Math.max(0, days - 1)}
              afterDays={days}
              reward={days === 3 ? 30 : 0}
              ticketReward={days === 3 ? 1 : 0}
              compact
              onComplete={() => setStreakReady(true)}
            />
            <TutorialGuide>
              自炊の記録を3日続けると30コイン。3日ごとにおやすみチケット1枚、毎日のログインで
              {LOGIN_BONUS}コインもらえます。
              作った料理は「記録」、7日間の振り返りは「レポート」で見られます。
            </TutorialGuide>
          </>
        )}
      </div>
    </JourneyFrame>
  )
}
