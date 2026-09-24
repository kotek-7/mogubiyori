import { useId, useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react'

function SheetContent({ children }: { children: ReactNode }) {
  const isPresent = useIsPresent()
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      className="sheet-content"
      inert={!isPresent}
      aria-hidden={!isPresent || undefined}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reducedMotion ? 0 : -6 }}
      transition={{ duration: reducedMotion ? 0 : 0.16, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export function Sheet({
  title,
  onClose,
  contentKey,
  children,
}: {
  title: string
  onClose: () => void
  contentKey: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const previousContentKey = useRef(contentKey)
  const closeRequested = useRef(false)
  const id = useId()
  const isPresent = useIsPresent()
  const reducedMotion = useReducedMotion()

  useLayoutEffect(() => {
    const element = ref.current
    const previousFocus = document.activeElement
    element?.showModal()
    return () => {
      // Keep the native modal (and its inert background) until exit motion finishes.
      element?.close()
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true })
    }
  }, [])

  useLayoutEffect(() => {
    if (previousContentKey.current === contentKey) return
    previousContentKey.current = contentKey
    ref.current?.scrollTo({ top: 0, behavior: 'instant' })
    // The outgoing content becomes inert; move focus to a stable element first.
    titleRef.current?.focus({ preventScroll: true })
  }, [contentKey])

  useLayoutEffect(() => {
    if (isPresent) closeRequested.current = false
    else titleRef.current?.focus({ preventScroll: true })
  }, [isPresent])

  function requestClose() {
    if (!isPresent || closeRequested.current) return
    closeRequested.current = true
    onClose()
  }

  return (
    <motion.dialog
      ref={ref}
      className="sheet"
      data-motion-sheet
      data-closing={!isPresent || undefined}
      aria-labelledby={id}
      layout
      initial={{ opacity: 0, y: reducedMotion ? 0 : 32, scale: reducedMotion ? 1 : 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        y: reducedMotion ? 0 : 20,
        scale: reducedMotion ? 1 : 0.985,
        transition: { duration: reducedMotion ? 0 : 0.18, ease: 'easeIn' },
      }}
      transition={{
        duration: reducedMotion ? 0 : 0.3,
        ease: [0.16, 1, 0.3, 1],
        layout: { duration: reducedMotion ? 0 : 0.24 },
      }}
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const box = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            requestClose()
        }
      }}
    >
      <header className="sheet-header">
        <h2 id={id} ref={titleRef} tabIndex={-1}>
          {title}
        </h2>
        <button type="button" className="icon-button" aria-label="閉じる" onClick={requestClose}>
          <X size={20} />
        </button>
      </header>
      <div className="sheet-body" inert={!isPresent}>
        <AnimatePresence initial={false} mode="wait">
          <SheetContent key={contentKey}>{children}</SheetContent>
        </AnimatePresence>
      </div>
    </motion.dialog>
  )
}
