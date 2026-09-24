import { flushSync } from 'react-dom'

let activeTransition: ViewTransition | undefined

/** Keep the companion and dish visually connected between full-screen scenes. */
export function transitionScene(update: () => void) {
  if (
    typeof document.startViewTransition !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    update()
    return
  }
  activeTransition?.skipTransition()
  const transition = document.startViewTransition(() => flushSync(update))
  activeTransition = transition
  void transition.ready.catch(() => {})
  void transition.finished
    .catch(() => {})
    .finally(() => {
      if (activeTransition === transition) activeTransition = undefined
    })
}
