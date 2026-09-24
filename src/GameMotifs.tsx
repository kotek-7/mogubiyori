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
            fill="var(--game-clay)"
            stroke="currentColor"
            strokeWidth="2.4"
          />
          <path d="M16 40V28a8 8 0 0 1 16 0v12" fill="currentColor" />
          <path d="M21 35c-3-4 1-7 3-10 0 4 7 6 4 11Z" fill="var(--game-gold)" />
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
            fill="var(--game-surface)"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path d="M14 8h23v26H14Z" fill="var(--game-sea)" />
          <path d="M23 17c-3-3-7 1-5 4l6 6 6-6c2-3-2-7-5-4Z" fill="currentColor" />
          <path d="M31 8v9l-3-2-3 2V8" fill="var(--game-action)" />
        </>
      ) : (
        <>
          <path
            d="M9 21h30v20H9Z"
            fill="var(--game-surface)"
            stroke="currentColor"
            strokeWidth="2.4"
          />
          <path
            d="m9 7-4 15c3 4 7 4 10 0 3 4 7 4 10 0 3 4 7 4 10 0 3 4 6 4 8 0L39 7Z"
            fill="var(--game-action)"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path d="m18 8-3 14m12-14-2 14M9 7h30" stroke="var(--game-surface)" strokeWidth="4" />
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

/** Marginal drawings shared by the village, the notebook and every journey.
 *  These are a single composition, not a tiled texture behind readable content. */
export function VillageBackdrop() {
  return (
    <div className="village-backdrop" aria-hidden="true">
      <svg className="village-margin village-margin-left" viewBox="0 0 240 620" fill="none">
        <path
          d="M-25 614V376c32-23 70-25 91 1 39 51 63 104 70 237Z"
          fill="currentColor"
          opacity=".3"
        />
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M86 601c-6-92-34-179-18-288m-2 251c-25-51-48-98-43-161m64 186c20-82 55-156 93-208" />
          <path d="M66 373c-28-14-33-36-21-54 23 9 30 31 21 54Zm-1 26c27-12 37-33 31-56-24 9-36 30-31 56Zm4 46c-29-8-47-31-39-54 24 3 41 25 39 54Zm6 22c27-7 43-23 43-46-26 3-43 22-43 46Zm6 42c-30-6-51-22-46-47 24 3 45 22 46 47Zm2 18c28-2 44-14 49-38-24-2-44 14-49 38Z" />
          <path d="M153 423c-12-20-8-40 8-51 14 19 9 39-8 51Zm9-13c24 1 42-13 43-33-22-2-39 14-43 33Zm-25 40c-12-20-11-38 3-49 16 14 16 33-3 49Zm7-5c24 4 42-6 46-27-23-6-40 8-46 27ZM24 453c-15-11-19-27-11-41 16 8 20 26 11 41Z" />
          <path
            d="M-12 211c32-2 63 0 94 6-4 46-26 65-53 64-29-1-41-28-41-70Z"
            fill="var(--game-canvas)"
          />
          <path d="M-13 216c35 8 68 8 96 3M9 272l-3 12h49l-3-12m-54-36c8-7 13-7 21 0s13 7 21 0 13-7 21 0 13 7 21 0" />
          <path d="M22 193c-17-18 17-26 0-44m28 47c-16-18 17-26 0-44" />
          <path d="M37 84c9-9 19-10 28-1m37 24c7-7 15-8 22-1" />
        </g>
      </svg>
      <svg className="village-margin village-margin-right" viewBox="0 0 240 620" fill="none">
        <path
          d="M261 612H94c11-69 18-118 56-152 28-26 66-30 111-22Z"
          fill="currentColor"
          opacity=".3"
        />
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M173 568V406c-32-23-46-55-33-77 22 11 35 36 33 77m1 19c32-6 53-29 47-56-27 2-47 27-47 56Zm1 53c-40-6-62-33-59-59 31 0 52 24 59 59Zm0 14c32 0 56-22 56-48-31-1-51 20-56 48Z" />
          <path
            d="M132 560h90l-12 48h-66Zm-4-8h99v10h-99Zm17 22h62m-57 15h49"
            fill="var(--game-canvas)"
          />
          <path d="M127 98v119m-3-114L75 180h49Zm9 18 40 65h-40Zm-70 76h126l-21 24H84Z" />
          <path d="M29 239c22-12 33-12 55 0s33 12 55 0 33-12 55 0 33 12 55 0M61 262c17-9 27-9 44 0s27 9 44 0 27-9 44 0 27 9 44 0M182 55c10-9 21-9 31 0" />
        </g>
      </svg>
    </div>
  )
}
