import { ArrowRight, Heart, Sparkles } from 'lucide-react'
import { GatheringScene, Pet } from './GameArt'
import { JourneyFrame } from './JourneyFrame'
import { species } from './game'
import type { SpeciesId } from './game'

export function WelcomeScene({
  speciesId,
  onContinue,
  onLater,
}: {
  speciesId: SpeciesId
  onContinue: () => void
  onLater: () => void
}) {
  const friend = species.find((entry) => entry.id === speciesId)!
  return (
    <JourneyFrame
      scene="welcome"
      eyebrow="あたらしい毎日の、はじまり"
      title={`${friend.name}と、いっしょに。`}
      subtitle="まだ、うまれたて。小さなひとくちから育てよう。"
      footer={
        <>
          <button className="journey-primary" onClick={onContinue}>
            はじめてのごはんへ
            <ArrowRight size={19} />
          </button>
          <button className="journey-secondary" onClick={onLater}>
            ひろばを見てみる
          </button>
        </>
      }
    >
      <div className={`journey-welcome journey-welcome-${speciesId}`}>
        <div className="journey-welcome-world">
          <GatheringScene />
          <div className="journey-welcome-companion">
            <Pet species={speciesId} stage={0} mood="happy" />
          </div>
          <Sparkles className="journey-welcome-sparkle" size={31} aria-hidden="true" />
          <Heart className="journey-welcome-heart" size={22} aria-hidden="true" />
        </div>
        <p className="journey-speech journey-welcome-speech">きょうから、いっしょだね。</p>
        <p className="welcome-growth-note">
          うまれたて · 1/5 の姿
          <br />
          はじめてのごはんの後も、この姿でいっしょに過ごせます。
        </p>
      </div>
    </JourneyFrame>
  )
}
