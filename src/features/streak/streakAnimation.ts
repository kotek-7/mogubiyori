export type StreakPhase = 'waiting' | 'recorded' | 'counted' | 'rewarded' | 'complete'

export const STREAK_TIMING = {
  record: 180,
  count: 700,
  reward: 1250,
  complete: 2000,
  withoutReward: 1250,
} as const

/** Drives presentation only. The caller has already committed the cooking reward. */
export function playStreakAnimation({
  changed,
  reward,
  ticketReward = 0,
  reducedMotion,
  onPhase,
  onComplete,
}: {
  changed: boolean
  reward: number
  ticketReward?: number
  reducedMotion: boolean
  onPhase: (phase: StreakPhase) => void
  onComplete: () => void
}): () => void {
  const timers: ReturnType<typeof setTimeout>[] = []
  let cancelled = false
  let completed = false
  const finish = () => {
    if (cancelled || completed) return
    completed = true
    onPhase('complete')
    onComplete()
  }
  const schedule = (delay: number, action: () => void) => {
    timers.push(
      setTimeout(() => {
        if (!cancelled && !completed) action()
      }, delay),
    )
  }

  if (reducedMotion || !changed) finish()
  else {
    onPhase('waiting')
    schedule(STREAK_TIMING.record, () => onPhase('recorded'))
    schedule(STREAK_TIMING.count, () => onPhase('counted'))
    const hasReward = reward > 0 || ticketReward > 0
    if (hasReward) schedule(STREAK_TIMING.reward, () => onPhase('rewarded'))
    schedule(hasReward ? STREAK_TIMING.complete : STREAK_TIMING.withoutReward, finish)
  }

  return () => {
    cancelled = true
    for (const timer of timers) clearTimeout(timer)
  }
}
