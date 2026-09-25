import { useEffect, useRef } from 'react'

/** Advance one demo beat; leaving, pausing or hiding the lesson cancels the pending beat. */
export function useTutorialPlayback(
  phase: string | number,
  advance: () => void,
  delay: number | null,
  playing = true,
) {
  const callback = useRef(advance)
  useEffect(() => {
    callback.current = advance
  }, [advance])

  useEffect(() => {
    if (!playing || delay === null) return
    let timer: number | undefined
    function schedule() {
      window.clearTimeout(timer)
      if (!document.hidden) timer = window.setTimeout(() => callback.current(), delay!)
    }
    schedule()
    document.addEventListener('visibilitychange', schedule)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', schedule)
    }
  }, [phase, delay, playing])
}
