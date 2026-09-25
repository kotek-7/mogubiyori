import { useEffect, useRef, useState } from 'react'
import { Check, Coins, Flame, Moon, Sparkles, Utensils } from 'lucide-react'
import { playStreakAnimation } from './streakAnimation'
import type { StreakPhase } from './streakAnimation'

export type StreakCelebrationProps = {
  beforeDays: number
  afterDays: number
  reward: number
  ticketReward?: number
  compact?: boolean
  onComplete?: () => void
}

const whole = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0)

/** Replays when the day counts change; never writes to the game's saved state. */
export function StreakCelebration(props: StreakCelebrationProps) {
  const afterDays = whole(props.afterDays)
  const beforeDays = Math.min(whole(props.beforeDays), afterDays)
  const reward = whole(props.reward)
  const ticketReward = whole(props.ticketReward ?? 0)
  return (
    <StreakAnimation
      key={`${beforeDays}-${afterDays}-${reward}-${ticketReward}`}
      {...props}
      beforeDays={beforeDays}
      afterDays={afterDays}
      reward={reward}
      ticketReward={ticketReward}
    />
  )
}

function StreakAnimation({
  beforeDays,
  afterDays,
  reward,
  ticketReward = 0,
  compact = false,
  onComplete,
}: StreakCelebrationProps) {
  const [reducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const changed = afterDays > beforeDays
  const [phase, setPhase] = useState<StreakPhase>(
    reducedMotion || !changed ? 'complete' : 'waiting',
  )
  const completeCallback = useRef(onComplete)
  const completed = useRef(false)
  useEffect(() => {
    completeCallback.current = onComplete
  }, [onComplete])
  useEffect(
    () =>
      playStreakAnimation({
        changed,
        reward,
        ticketReward,
        reducedMotion,
        onPhase: setPhase,
        onComplete: () => {
          if (completed.current) return
          completed.current = true
          completeCallback.current?.()
        },
      }),
    [changed, reward, ticketReward, reducedMotion],
  )

  const recorded = phase !== 'waiting'
  const counted = phase === 'counted' || phase === 'rewarded' || phase === 'complete'
  const rewarded = phase === 'rewarded' || phase === 'complete'
  const shownDays = counted ? afterDays : beforeDays
  const startDay = Math.max(1, afterDays - 6)
  const length = afterDays <= 3 ? 3 : 7
  const days = Array.from({ length }, (_, index) => startDay + index)
  const hasReward = reward > 0 || ticketReward > 0

  return (
    <div
      className={`streak-celebration${compact ? ' is-compact' : ''}${ticketReward > 0 ? ' has-ticket-reward' : ''}${counted ? ' is-counted' : ''}${rewarded && hasReward ? ' is-rewarded' : ''}`}
      data-phase={phase}
      role="group"
      aria-label="連続記録"
    >
      <div className="streak-celebration-count">
        <div className="streak-celebration-flame" aria-hidden="true">
          <Flame fill="currentColor" />
          {hasReward && <Sparkles className="streak-celebration-spark" />}
        </div>
        <div className="streak-celebration-number" role="status" aria-atomic="true">
          <span>連続記録</span>
          <div>
            <strong>{shownDays}</strong>
            <span>日</span>
          </div>
        </div>
      </div>
      <ol
        className="streak-celebration-days"
        aria-label="自炊の記録"
        style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
      >
        {days.map((day) => {
          const filled = day <= beforeDays || (recorded && day <= afterDays)
          const latest = changed && day === afterDays
          return (
            <li
              key={day}
              className={`${filled ? 'is-recorded' : ''}${latest ? ' is-latest' : ''}`}
              aria-label={`${day}日目 ${filled ? '記録済み' : '未記録'}`}
            >
              <span>{day}日目</span>
              <div className="streak-celebration-stamp" aria-hidden="true">
                {filled ? <Check strokeWidth={3} /> : <Utensils />}
              </div>
            </li>
          )
        })}
      </ol>
      <div className="streak-celebration-prize-slot">
        {hasReward && (
          <div className="streak-celebration-prize" role="status" aria-hidden={!rewarded}>
            {reward > 0 ? <Coins aria-hidden="true" /> : <Moon aria-hidden="true" />}
            <div>
              <span>{afterDays}日連続ボーナス</span>
              <div className="streak-celebration-rewards">
                {reward > 0 && (
                  <strong>
                    +{reward}
                    <small> コイン</small>
                  </strong>
                )}
                {ticketReward > 0 && (
                  <strong className="streak-celebration-ticket">
                    +{ticketReward}枚<small> おやすみチケット</small>
                  </strong>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
