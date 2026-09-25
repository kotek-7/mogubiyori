import { afterEach, describe, expect, it, vi } from 'vitest'
import { playStreakAnimation, STREAK_TIMING } from './streakAnimation'

afterEach(() => vi.useRealTimers())

describe('streak celebration timeline', () => {
  it('records the day before increasing the total and then revealing the saved bonus', () => {
    vi.useFakeTimers()
    const onPhase = vi.fn()
    const onComplete = vi.fn()
    playStreakAnimation({ changed: true, reward: 30, reducedMotion: false, onPhase, onComplete })
    expect(onPhase.mock.calls.flat()).toEqual(['waiting'])
    vi.advanceTimersByTime(STREAK_TIMING.record)
    expect(onPhase.mock.calls.flat()).toEqual(['waiting', 'recorded'])
    vi.advanceTimersByTime(STREAK_TIMING.count - STREAK_TIMING.record)
    expect(onPhase.mock.calls.flat()).toEqual(['waiting', 'recorded', 'counted'])
    vi.advanceTimersByTime(STREAK_TIMING.reward - STREAK_TIMING.count)
    expect(onPhase.mock.calls.flat()).toEqual(['waiting', 'recorded', 'counted', 'rewarded'])
    expect(onComplete).not.toHaveBeenCalled()
    vi.advanceTimersByTime(STREAK_TIMING.complete - STREAK_TIMING.reward)
    expect(onPhase.mock.calls.flat()).toEqual([
      'waiting',
      'recorded',
      'counted',
      'rewarded',
      'complete',
    ])
    expect(onComplete).toHaveBeenCalledTimes(1)
    vi.runAllTimers()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('finishes an ordinary practice day without inventing a milestone reward', () => {
    vi.useFakeTimers()
    const onPhase = vi.fn()
    const onComplete = vi.fn()
    playStreakAnimation({ changed: true, reward: 0, reducedMotion: false, onPhase, onComplete })
    vi.advanceTimersByTime(STREAK_TIMING.withoutReward)
    expect(onPhase.mock.calls.flat()).toEqual(['waiting', 'recorded', 'counted', 'complete'])
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('reveals a ticket-only reward before completing the celebration', () => {
    vi.useFakeTimers()
    const onPhase = vi.fn()
    const onComplete = vi.fn()
    playStreakAnimation({
      changed: true,
      reward: 0,
      ticketReward: 1,
      reducedMotion: false,
      onPhase,
      onComplete,
    })
    vi.advanceTimersByTime(STREAK_TIMING.reward)
    expect(onPhase.mock.calls.flat()).toEqual(['waiting', 'recorded', 'counted', 'rewarded'])
    expect(onComplete).not.toHaveBeenCalled()
    vi.advanceTimersByTime(STREAK_TIMING.complete - STREAK_TIMING.reward)
    expect(onPhase).toHaveBeenLastCalledWith('complete')
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('cancels all pending work when leaving or replacing the scene', () => {
    vi.useFakeTimers()
    const onPhase = vi.fn()
    const onComplete = vi.fn()
    const cancel = playStreakAnimation({
      changed: true,
      reward: 100,
      reducedMotion: false,
      onPhase,
      onComplete,
    })
    vi.advanceTimersByTime(STREAK_TIMING.record)
    cancel()
    vi.runAllTimers()
    expect(onPhase.mock.calls.flat()).toEqual(['waiting', 'recorded'])
    expect(onComplete).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each([
    { changed: true, reward: 100, reducedMotion: true },
    { changed: true, reward: 0, ticketReward: 1, reducedMotion: true },
    { changed: false, reward: 0, reducedMotion: false },
  ])('immediately settles without timers when animation is unnecessary: %j', (options) => {
    vi.useFakeTimers()
    const onPhase = vi.fn()
    const onComplete = vi.fn()
    const cancel = playStreakAnimation({ ...options, onPhase, onComplete })
    expect(onPhase.mock.calls.flat()).toEqual(['complete'])
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
    cancel()
    vi.runAllTimers()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
