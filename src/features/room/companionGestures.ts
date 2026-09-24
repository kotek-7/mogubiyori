export type GesturePoint = Readonly<{ x: number; y: number; time: number }>
export type GestureKind = 'tap' | 'stroke' | 'rub' | 'hold' | 'flick'

export type GestureState = Readonly<{
  start: GesturePoint
  last: GesturePoint
  /** Last sample far enough from the previous accepted sample to count as travel. */
  tracePoint: GesturePoint
  maxDistance: number
  pathLength: number
  horizontalTravel: number
  direction: -1 | 0 | 1
  extremeX: number
  reversals: number
}>

/** Coordinates are CSS pixels; timestamps and durations are milliseconds. */
export const GESTURE_HOLD_MS = 600
export const GESTURE_SLOP = 10

const TRACE_STEP = 4
const STROKE_DISTANCE = 24
const RUB_DISTANCE = 60
const FLICK_DISTANCE = 40
const FLICK_MAX_DURATION = 400
const FLICK_MIN_SPEED = 0.45

export function beginGesture(point: GesturePoint): GestureState {
  const start = { ...point }
  return {
    start,
    last: start,
    tracePoint: start,
    maxDistance: 0,
    pathLength: 0,
    horizontalTravel: 0,
    direction: 0,
    extremeX: point.x,
    reversals: 0,
  }
}

export function moveGesture(state: GestureState, point: GesturePoint): GestureState {
  const last = { ...point }
  const maxDistance = Math.max(
    state.maxDistance,
    Math.hypot(point.x - state.start.x, point.y - state.start.y),
  )
  const distance = Math.hypot(point.x - state.tracePoint.x, point.y - state.tracePoint.y)
  // Keep the trace anchor still while ignoring jitter, so slow drags still accumulate.
  if (distance < TRACE_STEP) return { ...state, last, maxDistance }

  let { direction, extremeX, reversals } = state
  const horizontal = point.x - extremeX
  if (direction === 0) {
    if (Math.abs(horizontal) >= GESTURE_SLOP) {
      direction = horizontal > 0 ? 1 : -1
      extremeX = point.x
    }
  } else if (horizontal * direction > 0) {
    extremeX = point.x
  } else if (horizontal * direction <= -GESTURE_SLOP) {
    direction = direction === 1 ? -1 : 1
    extremeX = point.x
    reversals += 1
  }

  return {
    ...state,
    last,
    tracePoint: last,
    maxDistance,
    pathLength: state.pathLength + distance,
    horizontalTravel: state.horizontalTravel + Math.abs(point.x - state.tracePoint.x),
    direction,
    extremeX,
    reversals,
  }
}

export function isHoldGesture(state: GestureState, nowMs: number): boolean {
  return (
    nowMs - state.start.time >= GESTURE_HOLD_MS &&
    state.maxDistance < GESTURE_SLOP &&
    state.pathLength < STROKE_DISTANCE
  )
}

export function classifyGesture(state: GestureState, endPoint: GesturePoint): GestureKind | null {
  const ended = moveGesture(state, endPoint)
  const duration = endPoint.time - ended.start.time
  const upward = ended.start.y - endPoint.y
  const sideways = Math.abs(endPoint.x - ended.start.x)

  if (
    ended.reversals >= 2 &&
    ended.horizontalTravel >= RUB_DISTANCE &&
    ended.horizontalTravel >= ended.pathLength * 0.6
  ) {
    return 'rub'
  }
  // Whole-gesture speed prevents a held press or a long stroke ending in a short flick
  // from suddenly becoming a toss. Horizontal and downward swipes remain strokes.
  if (
    duration > 0 &&
    duration < FLICK_MAX_DURATION &&
    upward >= FLICK_DISTANCE &&
    upward >= sideways * 1.2 &&
    upward / duration >= FLICK_MIN_SPEED &&
    upward >= ended.pathLength * 0.7
  ) {
    return 'flick'
  }
  if (ended.pathLength >= STROKE_DISTANCE || ended.maxDistance >= STROKE_DISTANCE) return 'stroke'
  if (isHoldGesture(ended, endPoint.time)) return 'hold'
  if (ended.maxDistance < GESTURE_SLOP) return 'tap'
  // Movement between tap slop and a deliberate stroke does not trigger an action.
  return null
}
