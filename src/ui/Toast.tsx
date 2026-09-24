import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

export function Toast({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      className="toast"
      role="status"
      initial={{ opacity: 0, y: reducedMotion ? 0 : 14, scale: reducedMotion ? 1 : 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: reducedMotion ? 0 : -8, scale: reducedMotion ? 1 : 0.98 }}
      transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <Check size={17} />
      {children}
    </motion.div>
  )
}
