import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { MoguMark, VillageBackdrop } from '../art/GameMotifs'

export type JourneyFrameProps = {
  scene: string
  eyebrow?: string
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  headerAction?: ReactNode
  onBack?: () => void
  onClose?: () => void
  backLabel?: string
  closeLabel?: string
  progress?: { current: number; total: number; label?: string }
}

export function JourneyFrame({
  scene,
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  headerAction,
  onBack,
  onClose,
  backLabel = '戻る',
  closeLabel = '閉じる',
  progress,
}: JourneyFrameProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const titleId = useId()
  const total = Math.max(1, Math.floor(progress?.total ?? 1))
  const current = Math.max(0, Math.min(total, Math.floor(progress?.current ?? 0)))

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [scene])

  return (
    <main className="journey-screen" data-scene={scene} aria-labelledby={titleId}>
      <VillageBackdrop />
      <header className="journey-header">
        <span className="journey-header-side">
          {onBack && (
            <button
              type="button"
              className="journey-icon-button"
              aria-label={backLabel}
              onClick={onBack}
            >
              <ArrowLeft size={22} />
            </button>
          )}
        </span>
        {progress ? (
          <div
            className="journey-progress"
            role="progressbar"
            aria-label={progress.label ?? 'ごはんの記録'}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={current}
          >
            {Array.from({ length: total }, (_, index) => (
              <span key={index} className={index < current ? 'is-complete' : ''} />
            ))}
          </div>
        ) : (
          <span className="journey-brand">
            <MoguMark />
            <span>もぐ日和</span>
          </span>
        )}
        <span className="journey-header-side">
          {headerAction}
          {onClose && (
            <button
              type="button"
              className="journey-icon-button"
              aria-label={closeLabel}
              onClick={onClose}
            >
              <X size={22} />
            </button>
          )}
        </span>
      </header>
      <div className="journey-heading" key={`${scene}-heading`}>
        {eyebrow && <span className="journey-eyebrow">{eyebrow}</span>}
        <h1 className="journey-title" id={titleId} ref={titleRef} tabIndex={-1}>
          {title}
        </h1>
        {subtitle && <p className="journey-subtitle">{subtitle}</p>}
      </div>
      <div className="journey-content" key={`${scene}-content`}>
        {children}
      </div>
      {footer && (
        <footer className="journey-footer" key={`${scene}-footer`}>
          {footer}
        </footer>
      )}
    </main>
  )
}
