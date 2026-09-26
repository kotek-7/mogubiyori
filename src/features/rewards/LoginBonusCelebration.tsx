import { useCallback, useEffect, useRef } from 'react'
import { Coins, Sparkles, X } from 'lucide-react'
import { motion, useIsPresent, useReducedMotion } from 'motion/react'

type LoginBonusCelebrationProps = {
  amount: number
  onComplete: () => void
}

const DISPLAY_DURATION = 4800

export function LoginBonusCelebration({ amount, onComplete }: LoginBonusCelebrationProps) {
  const reducedMotion = useReducedMotion()
  const isPresent = useIsPresent()
  const completeCallback = useRef(onComplete)
  const completed = useRef(false)
  useEffect(() => {
    completeCallback.current = onComplete
  }, [onComplete])
  const complete = useCallback(() => {
    if (completed.current) return
    completed.current = true
    completeCallback.current()
  }, [])

  useEffect(() => {
    // AnimatePresence keeps the card mounted while it leaves for another screen.
    if (!isPresent) return
    let remaining = DISPLAY_DURATION
    let startedAt = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const updateVisibility = () => {
      if (document.hidden) {
        if (timer === undefined) return
        clearTimeout(timer)
        timer = undefined
        remaining = Math.max(0, remaining - (performance.now() - startedAt))
      } else if (timer === undefined && !completed.current) {
        startedAt = performance.now()
        timer = setTimeout(complete, remaining)
      }
    }
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [complete, isPresent])

  return (
    <motion.div
      className="login-bonus-celebration"
      role="status"
      aria-label="ログインボーナス"
      aria-live="polite"
      aria-atomic="true"
      initial={{ opacity: 0, y: reducedMotion ? 0 : -16, scale: reducedMotion ? 1 : 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: reducedMotion ? 0 : -10, scale: reducedMotion ? 1 : 0.98 }}
      transition={{ duration: reducedMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="login-bonus-art" aria-hidden="true">
        <span className="login-bonus-halo" />
        <span className="login-bonus-coin">
          <Coins strokeWidth={1.8} />
        </span>
        <Sparkles className="login-bonus-spark login-bonus-spark-left" />
        <Sparkles className="login-bonus-spark login-bonus-spark-right" />
      </div>
      <div className="login-bonus-copy">
        <span className="login-bonus-label">ログインボーナス</span>
        <motion.div
          className="login-bonus-amount"
          initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 7 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reducedMotion ? 0 : 0.22,
            duration: reducedMotion ? 0 : 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <strong>+{amount.toLocaleString()}</strong>
          <span>コイン</span>
        </motion.div>
      </div>
      <p className="login-bonus-message">今日も会いに来てくれてありがとう</p>
      <button
        type="button"
        className="login-bonus-close"
        aria-label="ログインボーナスを閉じる"
        onClick={complete}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </motion.div>
  )
}
