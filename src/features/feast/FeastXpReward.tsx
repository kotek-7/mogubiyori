import { useEffect, useState } from 'react'
import { animate } from 'motion'
import { useReducedMotion } from 'motion/react'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { Pet } from '../../ui/art/GameArt'
import { growthProgress, growthStages, stageName } from '../../app/game/browserGame'
import type { SpeciesId } from '../../app/game/browserGame'

const COUNT_DELAY = 240
const COUNT_DURATION = 1100

export function FeastXpReward({
  species,
  name,
  hat,
  neck,
  bag,
  fromXp,
  toXp,
  gained,
}: {
  species: SpeciesId
  name: string
  hat: string
  neck: string
  bag: string
  fromXp: number
  toXp: number
  gained: number
}) {
  const reducedMotion = useReducedMotion()
  const [displayXp, setDisplayXp] = useState(() => (reducedMotion ? toXp : fromXp))
  useEffect(() => {
    const animation = animate(fromXp, toXp, {
      duration: reducedMotion ? 0 : COUNT_DURATION / 1000,
      delay: reducedMotion ? 0 : COUNT_DELAY / 1000,
      ease: [0.33, 1, 0.68, 1],
      onUpdate: (value) => setDisplayXp(Math.round(value)),
    })
    return () => animation.stop()
  }, [fromXp, toXp, reducedMotion])

  const before = growthProgress(fromXp)
  const threshold = before.nextThreshold
  const floor = growthStages[before.stage].threshold
  // Hold the old stage at 100% when it fills. The following scene reveals the
  // new form; interpolating straight to its smaller percentage would look like XP loss.
  const progress =
    threshold === null ? 100 : Math.min(100, ((displayXp - floor) / (threshold - floor)) * 100)
  const willGrow = threshold !== null && toXp >= threshold
  const reached = threshold !== null && displayXp >= threshold
  const remaining = threshold === null ? 0 : Math.max(0, threshold - displayXp)
  const finalProgress =
    threshold === null ? 100 : Math.min(100, ((toXp - floor) / (threshold - floor)) * 100)

  return (
    <div className="feast-xp-reward">
      <div className="feast-xp-portrait">
        <span className="feast-xp-orbit" aria-hidden="true" />
        <Pet species={species} stage={before.stage} hat={hat} neck={neck} bag={bag} mood="happy" />
        <Sparkles className="feast-xp-spark feast-xp-spark-left" aria-hidden="true" />
        <Sparkles className="feast-xp-spark feast-xp-spark-right" aria-hidden="true" />
      </div>
      <div className="feast-xp-gain" role="group" aria-label={`${gained} XP獲得`}>
        <Sparkles aria-hidden="true" />
        <strong>+{gained}</strong>
        <span>XP</span>
      </div>
      <div className={`feast-xp-panel${reached ? ' is-filled' : ''}`}>
        <div className="feast-xp-recipient">
          <strong>{name}</strong>
          <span>{stageName(before.stage)}</span>
        </div>
        <div className="feast-xp-total">
          <span>累計XP</span>
          <span aria-hidden="true">
            {fromXp} <ArrowRight size={16} /> <strong>{displayXp}</strong>
          </span>
          <span className="sr-only">
            {fromXp}から{toXp} XP
          </span>
        </div>
        <div
          className="feast-xp-meter"
          role="progressbar"
          aria-label="次の成長まで"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(finalProgress)}
          aria-valuetext={
            threshold === null
              ? `すべての姿を発見。累計${toXp} XP`
              : willGrow
                ? `成長に必要な${threshold} XPに到達。累計${toXp} XP`
                : `累計${toXp} XP。次の成長まで${threshold - toXp} XP`
          }
        >
          <span className="feast-xp-earned" style={{ width: `${progress}%` }} />
          <span className="feast-xp-existing" style={{ width: `${before.progress}%` }} />
        </div>
        <div className="feast-xp-next">
          {threshold === null ? (
            <>
              <Check size={16} /> すべての姿を発見
            </>
          ) : reached ? (
            <>
              <Sparkles size={17} /> 成長！
            </>
          ) : (
            <>
              次の成長まで <strong>{remaining} XP</strong>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
