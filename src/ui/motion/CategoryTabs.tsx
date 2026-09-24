import { useId } from 'react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

export function CategoryTabs<Value extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: Value
  options: ReadonlyArray<{ value: Value; label: string }>
  onChange: (value: Value) => void
}) {
  const indicatorId = useId()
  const reducedMotion = useReducedMotion()

  return (
    <div className="play-book-tabs motion-category-tabs" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {value === option.value && (
            <motion.span
              className="motion-category-indicator"
              aria-hidden="true"
              layoutId={indicatorId}
              initial={false}
              transition={
                reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 38 }
              }
            />
          )}
        </button>
      ))}
    </div>
  )
}

export function CategoryPanel({
  category,
  className = '',
  children,
}: {
  category: string
  className?: string
  children: ReactNode
}) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      key={category}
      className={`motion-category-panel ${className}`}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
