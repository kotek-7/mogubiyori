import type { ReactNode } from 'react'
import { BookOpen, X } from 'lucide-react'

export function PlayGuide({
  id,
  children,
  onDismiss,
  label = 'ひろばのガイド',
}: {
  id: string
  children: ReactNode
  onDismiss?: () => void
  label?: string
}) {
  return (
    <section className="play-guide" id={id} aria-label={label}>
      <span className="play-guide-label">
        <BookOpen size={14} aria-hidden="true" />
        あそびかたガイド
      </span>
      <p id={`${id}-text`}>{children}</p>
      {onDismiss && (
        <button
          type="button"
          className="play-guide-close"
          aria-label="ガイドを終了する"
          onClick={onDismiss}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </section>
  )
}
