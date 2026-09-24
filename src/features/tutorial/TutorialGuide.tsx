import type { ReactNode } from 'react'
import { BookOpen, ChevronRight } from 'lucide-react'

export function TutorialGuide({
  children,
  action,
  className = '',
}: {
  children: ReactNode
  action?: { label: string; onClick: () => void; disabled?: boolean }
  className?: string
}) {
  return (
    <section className={`tutorial-guide ${className}`} aria-label="あそびかたガイド">
      <span className="tutorial-guide-label">
        <BookOpen size={14} aria-hidden="true" />
        あそびかたガイド
      </span>
      <p aria-live="polite" aria-atomic="true">
        {children}
      </p>
      {action && (
        <button
          type="button"
          className="tutorial-step-action"
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {action.label}
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      )}
    </section>
  )
}
