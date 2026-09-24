/** Original village signs. Small controls keep their ordinary interface icons. */
export function MoguMark({ className = '' }: { className?: string }) {
  return (
    <svg className={`mogu-mark ${className}`} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M8 24h32c-1 11-8 16-16 16S9 35 8 24Z" fill="currentColor" />
      <path d="M6 23h36M18 42h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M17 17c-5-5 5-6 0-12m14 12c-5-5 5-6 0-12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="m14 28 4 4 6-4 6 4 4-4" stroke="var(--game-surface)" strokeWidth="2" />
    </svg>
  )
}

export function VillageSign({ kind }: { kind: 'room' | 'book' | 'shop' }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className="village-sign">
      {kind === 'room' ? (
        <>
          <path
            d="M8 39V23a16 16 0 0 1 32 0v16Z"
            fill="#e7a567"
            stroke="currentColor"
            strokeWidth="2.4"
          />
          <path d="M16 40V28a8 8 0 0 1 16 0v12" fill="currentColor" />
          <path d="M21 35c-3-4 1-7 3-10 0 4 7 6 4 11Z" fill="#f6c64e" />
          <path
            d="M5 40h38M15 16h4m9 0h4M22 10h4"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      ) : kind === 'book' ? (
        <>
          <path
            d="M9 8h28v33H9c-4 0-4-6 0-6h28M10 8v27"
            fill="#fff9eb"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path d="M14 8h23v26H14Z" fill="#83c7cd" />
          <path d="M23 17c-3-3-7 1-5 4l6 6 6-6c2-3-2-7-5-4Z" fill="currentColor" />
          <path d="M31 8v9l-3-2-3 2V8" fill="#d85b43" />
        </>
      ) : (
        <>
          <path d="M9 21h30v20H9Z" fill="#fff9eb" stroke="currentColor" strokeWidth="2.4" />
          <path
            d="m9 7-4 15c3 4 7 4 10 0 3 4 7 4 10 0 3 4 7 4 10 0 3 4 6 4 8 0L39 7Z"
            fill="#d85b43"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path d="m18 8-3 14m12-14-2 14M9 7h30" stroke="#fff9eb" strokeWidth="4" />
          <path
            d="M16 31h16M5 42h38"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  )
}
