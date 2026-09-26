import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, Camera, Heart, Sparkles } from 'lucide-react'
import { DishArt, GatheringScene, Pet } from '../../ui/art/GameArt'
import { JourneyFrame } from '../../ui/journey/JourneyFrame'
import { transitionScene } from '../../ui/journey/journeyTransition'

const pages = [
  {
    scene: 'concept',
    title: 'きみのごはんで、なかまが育つ',
    description: 'もぐ日和は、自分で作った料理を記録して、小さな生き物「もぐ」を育てるゲームです。',
  },
  {
    scene: 'photo',
    title: '今日の一皿を、おすそわけ',
    description: '料理の写真を撮ってごはんをあげると、なかまが少しずつ成長します。',
  },
  {
    scene: 'discovery',
    title: '次のごはんが、楽しみになる',
    description: '育つ姿や新しいなかまとの出会い、集まる料理カードが、次の自炊の楽しみになります。',
  },
] as const

export function ConceptIntro({
  onComplete,
  busy,
  accountSettings,
  feedback,
}: {
  onComplete: () => void
  busy: boolean
  accountSettings: ReactNode
  feedback?: ReactNode
}) {
  const [step, setStep] = useState(0)
  const page = pages[step]
  const last = step === pages.length - 1

  return (
    <JourneyFrame
      scene={`intro-${page.scene}`}
      title={page.title}
      headerAction={accountSettings}
      onBack={step > 0 ? () => transitionScene(() => setStep(step - 1)) : undefined}
      backLabel="前の紹介に戻る"
      footer={
        <>
          <div
            className="concept-intro-progress"
            role="progressbar"
            aria-label="アプリ紹介の進み具合"
            aria-valuemin={0}
            aria-valuemax={pages.length}
            aria-valuenow={step + 1}
            aria-valuetext={`${step + 1} / ${pages.length}`}
          >
            {pages.map((entry, index) => (
              <span key={entry.scene} className={index === step ? 'is-current' : ''} />
            ))}
          </div>
          {feedback}
          <button
            type="button"
            className="journey-primary"
            disabled={busy}
            onClick={last ? onComplete : () => transitionScene(() => setStep(step + 1))}
          >
            {last ? 'なかまを選ぶ' : 'つづける'}
            <ArrowRight size={20} aria-hidden="true" />
          </button>
          <button type="button" className="concept-intro-skip" disabled={busy} onClick={onComplete}>
            紹介をスキップ
          </button>
        </>
      }
    >
      <div className={`concept-intro-art concept-intro-${page.scene}`} aria-hidden="true">
        {step === 0 ? (
          <>
            <GatheringScene />
            <Pet species="mame" mood="happy" className="concept-intro-friend friend-left" />
            <Pet species="shizuku" mood="happy" className="concept-intro-friend friend-right" />
            <Pet species="komugi" mood="happy" className="concept-intro-host" />
            <DishArt kind="curry" className="concept-intro-dish" />
            <Heart className="concept-intro-heart" fill="currentColor" />
          </>
        ) : step === 1 ? (
          <>
            <div className="concept-intro-photo-card">
              <img src={`${import.meta.env.BASE_URL}art/tutorial/sample-curry.jpg`} alt="" />
              <Camera size={24} />
            </div>
            <ArrowRight className="concept-intro-arrow" />
            <div className="concept-intro-meal">
              <Pet species="komugi" mood="eating" />
              <DishArt kind="curry" />
            </div>
            <Heart className="concept-intro-heart" fill="currentColor" />
          </>
        ) : (
          <>
            <div className="concept-intro-cards">
              <DishArt kind="rice" />
              <DishArt kind="curry" />
            </div>
            <Pet species="mame" mood="happy" className="concept-intro-friend friend-left" />
            <Pet species="shizuku" mood="happy" className="concept-intro-friend friend-right" />
            <Pet species="komugi" mood="happy" className="concept-intro-host" />
            <Sparkles className="concept-intro-sparkles" />
          </>
        )}
      </div>
      <p className="concept-intro-description">{page.description}</p>
    </JourneyFrame>
  )
}
