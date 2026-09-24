import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
import {
  beginGesture,
  classifyGesture,
  GESTURE_HOLD_MS,
  GESTURE_SLOP,
  isHoldGesture,
  moveGesture,
} from './companionGestures'
import type { GestureKind, GestureState } from './companionGestures'

type Contact = {
  x: number
  y: number
  leanX: number
  leanY: number
  gesture: GestureKind | null
  holdEligible: boolean
}
type ActiveGesture = {
  pointerId: number
  target: HTMLButtonElement
  state: GestureState
  fired: boolean
}

export function useCompanionGestures(onGesture: (gesture: GestureKind) => void) {
  const active = useRef<ActiveGesture | null>(null)
  const backgroundPress = useRef<{
    pointerId: number
    x: number
    y: number
    moved: boolean
  } | null>(null)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressClick = useRef(false)
  const callback = useRef(onGesture)
  const [contact, setContact] = useState<Contact | null>(null)

  useLayoutEffect(() => {
    callback.current = onGesture
  }, [onGesture])

  const clearHold = useCallback(() => {
    if (holdTimer.current !== null) clearTimeout(holdTimer.current)
    holdTimer.current = null
  }, [])

  const release = useCallback(() => {
    const current = active.current
    active.current = null
    backgroundPress.current = null
    suppressClick.current = true
    clearHold()
    if (current?.target.hasPointerCapture(current.pointerId)) {
      current.target.releasePointerCapture(current.pointerId)
    }
    setContact(null)
  }, [clearHold])

  useEffect(() => {
    // A second finger may land outside the character; stop before a pinch becomes a gesture.
    const onOtherPointer = (event: globalThis.PointerEvent) => {
      const pointerId = active.current?.pointerId ?? backgroundPress.current?.pointerId
      if (pointerId !== undefined && event.pointerId !== pointerId) release()
    }
    const onBlur = () => release()
    const onVisibility = () => {
      if (document.hidden) release()
    }
    document.addEventListener('pointerdown', onOtherPointer, true)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('pointerdown', onOtherPointer, true)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
      clearHold()
      active.current = null
      backgroundPress.current = null
    }
  }, [clearHold, release])

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0) return
    suppressClick.current = false
    backgroundPress.current = null
    if (!(event.target as Element).closest('[data-gesture-surface]')) {
      backgroundPress.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        moved: false,
      }
      return
    }
    suppressClick.current = true
    const point = { x: event.clientX, y: event.clientY, time: event.timeStamp }
    const state = beginGesture(point)
    const bounds = event.currentTarget.getBoundingClientRect()
    active.current = {
      pointerId: event.pointerId,
      target: event.currentTarget,
      state,
      fired: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setContact({
      x: point.x - bounds.left,
      y: point.y - bounds.top,
      leanX: 0,
      leanY: 0,
      gesture: null,
      holdEligible: true,
    })
    clearHold()
    holdTimer.current = setTimeout(() => {
      const current = active.current
      if (
        !current ||
        current.fired ||
        !isHoldGesture(current.state, current.state.start.time + GESTURE_HOLD_MS)
      )
        return
      current.fired = true
      setContact((previous) =>
        previous ? { ...previous, gesture: 'hold', holdEligible: false } : null,
      )
      callback.current('hold')
    }, GESTURE_HOLD_MS)
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    trackBackgroundMovement(event)
    const current = active.current
    if (!current || current.pointerId !== event.pointerId) return
    const point = { x: event.clientX, y: event.clientY, time: event.timeStamp }
    current.state = moveGesture(current.state, point)
    const gesture = classifyGesture(current.state, point)
    if (!isHoldGesture(current.state, current.state.start.time + GESTURE_HOLD_MS)) clearHold()
    if (gesture === 'rub' && !current.fired) {
      current.fired = true
      callback.current('rub')
    }
    const bounds = event.currentTarget.getBoundingClientRect()
    setContact((previous) => ({
      x: Math.max(0, Math.min(bounds.width, point.x - bounds.left)),
      y: Math.max(0, Math.min(bounds.height, point.y - bounds.top)),
      leanX: Math.max(-12, Math.min(12, (point.x - current.state.start.x) * 0.16)),
      leanY: Math.max(-8, Math.min(8, (point.y - current.state.start.y) * 0.1)),
      gesture: current.fired ? (previous?.gesture === 'hold' ? 'hold' : 'rub') : gesture,
      holdEligible: !current.fired && current.state.maxDistance < GESTURE_SLOP,
    }))
  }

  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    trackBackgroundMovement(event)
    const current = active.current
    if (!current || current.pointerId !== event.pointerId) return
    const gesture = classifyGesture(current.state, {
      x: event.clientX,
      y: event.clientY,
      time: event.timeStamp,
    })
    if (!current.fired && gesture) callback.current(gesture)
    release()
  }

  function onPointerCancel(event: PointerEvent<HTMLButtonElement>) {
    if (
      active.current?.pointerId === event.pointerId ||
      backgroundPress.current?.pointerId === event.pointerId
    )
      release()
  }

  function trackBackgroundMovement(event: PointerEvent<HTMLButtonElement>) {
    const previous = backgroundPress.current
    if (
      previous?.pointerId === event.pointerId &&
      Math.hypot(event.clientX - previous.x, event.clientY - previous.y) >= GESTURE_SLOP
    ) {
      previous.moved = true
    }
  }

  function onClick(event: MouseEvent<HTMLButtonElement>) {
    if (event.detail === 0) {
      suppressClick.current = false
      onGesture('stroke')
    } else if (suppressClick.current) {
      suppressClick.current = false
    } else if (backgroundPress.current && !backgroundPress.current.moved) {
      onGesture('tap')
    }
    backgroundPress.current = null
  }

  function onContextMenu(event: MouseEvent<HTMLButtonElement>) {
    if (active.current || (event.target as Element).closest('[data-gesture-surface]')) {
      event.preventDefault()
    }
  }

  return {
    contact,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onLostPointerCapture: onPointerCancel,
      onClick,
      onContextMenu,
    },
  }
}
