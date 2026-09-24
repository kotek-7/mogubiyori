import { describe, expect, it } from 'vitest'
import {
  beginGesture,
  classifyGesture,
  GESTURE_HOLD_MS,
  GESTURE_SLOP,
  isHoldGesture,
  moveGesture,
  type GesturePoint,
} from './companionGestures'

const point = (x: number, y: number, time: number): GesturePoint => ({ x, y, time })
const origin = point(100, 100, 1000)

function trace(points: GesturePoint[]) {
  return points.reduce(moveGesture, beginGesture(origin))
}

describe('companion gestures', () => {
  it('recognizes a tap with small incidental movement, including the release point', () => {
    expect(classifyGesture(beginGesture(origin), point(103, 104, 1100))).toBe('tap')
    expect(classifyGesture(beginGesture(origin), point(124, 100, 1300))).toBe('stroke')
  })

  it('leaves ambiguous movement between tap and stroke thresholds without an action', () => {
    expect(classifyGesture(beginGesture(origin), point(100 + GESTURE_SLOP, 100, 1100))).toBeNull()
    expect(classifyGesture(beginGesture(origin), point(123, 100, 1100))).toBeNull()
  })

  it('recognizes a stationary hold at the same threshold during and after pressing', () => {
    const gesture = beginGesture(origin)
    expect(isHoldGesture(gesture, origin.time + GESTURE_HOLD_MS - 1)).toBe(false)
    expect(isHoldGesture(gesture, origin.time + GESTURE_HOLD_MS)).toBe(true)
    expect(classifyGesture(gesture, point(100, 100, 1600))).toBe('hold')
    expect(classifyGesture(gesture, point(100, 100, 1599))).toBe('tap')
  })

  it('ignores repeated tiny pointer noise instead of accumulating a false drag', () => {
    const gesture = trace(
      Array.from({ length: 100 }, (_, index) => point(index % 2 ? 102 : 98, 100, 1001 + index)),
    )
    expect(gesture.pathLength).toBe(0)
    expect(classifyGesture(gesture, point(101, 100, 1200))).toBe('tap')
    expect(isHoldGesture(gesture, 1600)).toBe(true)
  })

  it('accumulates a slow drag even when every individual pointer move is tiny', () => {
    const gesture = trace(
      Array.from({ length: 30 }, (_, index) => point(101 + index, 100, 1020 + index * 20)),
    )
    expect(classifyGesture(gesture, point(130, 100, 1800))).toBe('stroke')
    expect(isHoldGesture(gesture, 1800)).toBe(false)
  })

  it('never recovers a tap or hold after leaving slop and returning to the start', () => {
    const moved = trace([point(111, 100, 1100), point(100, 100, 1200)])
    expect(isHoldGesture(moved, 1800)).toBe(false)
    expect(classifyGesture(moved, point(100, 100, 1800))).toBeNull()

    const dragged = trace([point(140, 100, 1100), point(100, 100, 1400)])
    expect(classifyGesture(dragged, point(100, 100, 1800))).toBe('stroke')
    expect(isHoldGesture(dragged, 1800)).toBe(false)
  })

  it('classifies repeated horizontal rubbing only after two meaningful reversals', () => {
    const once = trace([point(130, 100, 1100), point(100, 100, 1200)])
    expect(classifyGesture(once, point(100, 100, 1250))).toBe('stroke')

    const twice = moveGesture(once, point(130, 100, 1300))
    expect(classifyGesture(twice, point(130, 100, 1350))).toBe('rub')
  })

  it('requires enough travel even if short movements have two meaningful reversals', () => {
    const gesture = trace([point(112, 100, 1100), point(100, 100, 1200), point(112, 100, 1300)])
    expect(gesture.reversals).toBe(2)
    expect(classifyGesture(gesture, point(112, 100, 1400))).toBe('stroke')
  })

  it('does not interpret small backward jitter during a stroke as rubbing', () => {
    const gesture = trace([
      point(120, 100, 1100),
      point(117, 100, 1150),
      point(140, 100, 1200),
      point(137, 100, 1250),
      point(160, 100, 1300),
    ])
    expect(gesture.reversals).toBe(0)
    expect(classifyGesture(gesture, point(160, 100, 1400))).toBe('stroke')
  })

  it('keeps vertical zigzags as strokes, including when there is some horizontal drift', () => {
    const gesture = trace([point(130, 170, 1200), point(100, 240, 1400), point(130, 310, 1600)])
    expect(classifyGesture(gesture, point(130, 310, 1800))).toBe('stroke')
  })

  it('recognizes a sufficiently long and fast upward flick', () => {
    expect(classifyGesture(beginGesture(origin), point(100, 50, 1100))).toBe('flick')
    expect(classifyGesture(beginGesture(origin), point(110, 60, 1080))).toBe('flick')
  })

  it('keeps short upward movement and slower upward drags from becoming flicks', () => {
    expect(classifyGesture(beginGesture(origin), point(100, 70, 1050))).toBe('stroke')
    expect(classifyGesture(beginGesture(origin), point(100, 60, 1100))).toBe('stroke')
    expect(classifyGesture(beginGesture(origin), point(100, -100, 1400))).toBe('stroke')
    expect(classifyGesture(beginGesture(origin), point(100, 50, 1500))).toBe('stroke')
  })

  it('keeps fast horizontal, downward, and predominantly horizontal diagonal swipes as strokes', () => {
    for (const end of [point(180, 100, 1100), point(100, 180, 1100), point(180, 40, 1100)]) {
      expect(classifyGesture(beginGesture(origin), end)).toBe('stroke')
    }
  })

  it('does not turn a stationary press followed by a quick upward stroke into a flick', () => {
    const gesture = moveGesture(beginGesture(origin), point(100, 100, 1900))
    expect(classifyGesture(gesture, point(100, 40, 2000))).toBe('stroke')
  })

  it('does not turn an indirect out-and-back path ending upward into a flick', () => {
    const gesture = trace([point(180, 100, 1050), point(100, 100, 1100)])
    expect(classifyGesture(gesture, point(100, 40, 1150))).toBe('stroke')
  })

  it('does not infer flick velocity when the event timestamps have no elapsed time', () => {
    expect(classifyGesture(beginGesture(origin), point(100, 40, 1000))).toBe('stroke')
  })

  it('keeps earlier gesture states and caller-owned points unchanged', () => {
    const input = { ...origin }
    const started = beginGesture(input)
    input.x = 999
    expect(started.start.x).toBe(100)

    Object.freeze(started)
    const nextPoint = Object.freeze(point(140, 100, 1200))
    const moved = moveGesture(started, nextPoint)
    expect(moved).not.toBe(started)
    expect(started.last).toEqual(origin)
    expect(started.pathLength).toBe(0)
    const beforeClassification = { ...moved }
    expect(classifyGesture(moved, point(160, 100, 1400))).toBe('stroke')
    expect(moved).toEqual(beforeClassification)
  })
})
