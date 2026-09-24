import { flushSync } from 'react-dom'

let activeTransition: ViewTransition | undefined

/** Share one interruptible transition across router commits and full-screen scenes. */
export function transitionView(update: () => void | Promise<void>, types: string[] = []) {
  if (
    typeof document.startViewTransition !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return Promise.resolve(update())
  }
  activeTransition?.skipTransition()
  const transition = document.startViewTransition(
    CSS.supports('selector(:active-view-transition-type(page))') ? { update, types } : update,
  )
  activeTransition = transition
  void transition.ready.catch(() => {})
  void transition.finished
    .catch(() => {})
    .finally(() => {
      if (activeTransition === transition) activeTransition = undefined
    })
  return transition.updateCallbackDone
}

/** Keep the companion and dish visually connected between full-screen scenes. */
export function transitionScene(update: () => void) {
  void transitionView(() => flushSync(update))
}
