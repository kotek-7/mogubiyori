import { useId } from 'react'
import type { ReactNode } from 'react'

/** Keep an illustration's outline while saving its colours and details for discovery. */
export function DiscoverySilhouette({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const filterId = `discovery-${useId()}`
  return (
    <span className={`discovery-silhouette ${className}`} aria-hidden="true">
      <svg className="discovery-silhouette-filter" width="0" height="0" focusable="false">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feFlood className="discovery-silhouette-ink" floodColor="#1b1c33" />
            <feComposite in2="SourceAlpha" operator="in" />
          </filter>
        </defs>
      </svg>
      <span className="discovery-silhouette-art" style={{ filter: `url(#${filterId})` }}>
        {children}
      </span>
      <span className="discovery-silhouette-mark">?</span>
    </span>
  )
}
