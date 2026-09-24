const ink = '#514b40'
const cream = '#fff2d5'

/** Neck accessories are anchored at the front of the collar, just below the chin. */
export function Neckwear({ kind }: { kind: string }) {
  if (kind === 'neck-none') return null
  const drawing = (() => {
    switch (kind) {
      case 'neck-bandana':
        return (
          <>
            <path d="M-37 0q36 12 74 0l-2 12q-34 12-69 0Z" fill="#c96650" />
            <path d="M-26 9q25 8 49 0L3 42q-18-9-29-33Z" fill="#d5795d" />
            <path d="m-15 18 17 16 13-16" fill="none" stroke={cream} strokeWidth="2" />
            <path d="m-32 7-17-8 2 16 17-4" fill="#b85546" />
            <path d="M-33 3q9 0 9 7-4 8-12 3Z" fill="#e59973" />
            <path d="m-31 6 2 4m11 2 9 7" fill="none" stroke="#f3bb8c" strokeWidth="2" />
          </>
        )
      case 'neck-bow':
        return (
          <>
            <path d="M-33 2q33 11 66 0l-1 8q-31 10-64 0Z" fill="#a896a6" />
            <path d="m-8 18-9 23-7-8-11 1 14-23m28 7 10 23 7-8 11 1-15-23" fill="#947589" />
            <path
              d="M-7 15c-10-12-23-20-32-16-7 10-6 23 1 31 12 1 21-4 32-11m12-4c10-12 24-20 32-16 7 10 6 23-1 31-12 1-21-4-32-11"
              fill="#a18199"
            />
            <path
              d="m-27 8 18 8-19 5m55-13-18 8 19 5"
              fill="none"
              stroke="#d5b6c6"
              strokeWidth="2.5"
            />
            <path d="M-7 8q7-3 14 0l1 17q-8 4-16 0Z" fill="#ecd5b9" />
            <path d="M-2 12v10" stroke={cream} strokeWidth="2" />
          </>
        )
      case 'neck-scarf':
        return (
          <>
            <path d="m15 6 19 3 6 43-19 3Z" fill="#7d9d99" />
            <path d="m18 25 18-3 2 9-19 4m2 11 18-4 1 10-19 3" fill={cream} stroke="none" />
            <path d="m24 55 1 7m6-8 1 7m6-9 1 7" stroke="#6a8681" strokeWidth="3" />
            <path d="M-38 0q38 12 76 0l-2 17q-38 10-72-1Z" fill="#789a96" />
            <path d="m-24 4 2 15m15-12 1 15M13 8l-1 14m17-16-2 13" stroke={cream} strokeWidth="7" />
            <path d="M-34 12q36 10 66 1" fill="none" stroke="#567c79" strokeWidth="2" />
          </>
        )
      case 'neck-shell':
        return (
          <>
            <path d="M-32 0Q-25 17 0 24 25 17 32 0" fill="none" stroke="#6e918b" strokeWidth="5" />
            <path
              d="M-32 0Q-25 17 0 24 25 17 32 0"
              fill="none"
              stroke="#bdd2b8"
              strokeWidth="1.5"
            />
            <circle cx="0" cy="24" r="4" fill="#c3a264" />
            <path
              d="M0 31c-5-10-16-9-20-1-6 10 2 17 17 23h6c15-6 23-13 17-23-4-8-15-9-20 1Z"
              fill="#f4dfb4"
            />
            <path
              d="m-13 32 11 17m2-16v16m13-17L3 49"
              fill="none"
              stroke="#c6a674"
              strokeWidth="2"
            />
            <path d="m-4 51 1 5h6l1-5" fill="#dec38f" />
          </>
        )
      default:
        return null
    }
  })()
  if (!drawing) return null
  return (
    <g
      className="pet-neck"
      data-item={kind}
      fill="none"
      stroke={ink}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {drawing}
    </g>
  )
}

/** The shared shoulder point puts every pouch on the companion's right hip. */
export function ShoulderBag({ kind }: { kind: string }) {
  if (kind === 'bag-none') return null
  const drawing = (() => {
    switch (kind) {
      case 'bag-satchel':
        return (
          <>
            <path d="M17 38q24-4 47 1l-2 38q-21 10-44 0Z" fill="#ba8258" />
            <path
              d="m22 44 1 29q18 7 34 0l2-29"
              fill="none"
              stroke="#edbf8a"
              strokeWidth="2"
              strokeDasharray="3 4"
            />
            <path d="M16 38q25-7 49 0l-3 18q-21 9-43 0Z" fill="#d9a371" />
            <path d="M39 48h9v17h-9Z" fill="#9a6849" />
            <rect x="38" y="55" width="11" height="9" rx="2" fill="#e5c07b" />
            <path d="m43 58 0 4" stroke="#8e714a" strokeWidth="2" />
            <path d="m24 43 10-1" stroke="#f1c992" strokeWidth="2.5" />
          </>
        )
      case 'bag-basket':
        return (
          <>
            <path d="M24 45c-3-31 34-34 37 0" fill="none" stroke="#7e6a45" strokeWidth="7" />
            <path d="M24 45c-3-31 34-34 37 0" fill="none" stroke="#d9b675" strokeWidth="3" />
            <path d="m14 46 9 33q22 8 41-1l7-32Z" fill="#c7a16a" />
            <path
              d="m18 56 49-1m-46 11 44-1m-39 12 35-2m-32-25 5 29m8-30 1 31m10-31-2 31m12-31-5 29"
              fill="none"
              stroke="#9f7f54"
              strokeWidth="2"
            />
            <path d="m26 42 25 2 4 22-12-7-10 7Z" fill="#f4e5c6" />
            <path d="m31 45 3 15m10-15 3 16m-17-10 21 1" stroke="#c9755e" strokeWidth="3" />
            <path d="M15 46q27 5 55 0" stroke="#efd09a" strokeWidth="7" />
            <path d="M15 46q27 5 55 0" stroke="#8b7452" strokeWidth="1.5" />
          </>
        )
      case 'bag-acorn':
        return (
          <>
            <path d="M19 45c-3 19 5 32 24 41 20-10 27-24 22-41Z" fill="#cb995c" />
            <path d="M27 53c0 12 5 19 12 24" fill="none" stroke="#f3c782" strokeWidth="4" />
            <path d="M18 46c0-15 14-23 28-21 15 1 26 9 23 23-16 6-36 6-51-2Z" fill="#8a7650" />
            <path
              d="m26 33 8 7 9-9 9 10 8-7m-34 8 8 7 9-8 9 9 10-7"
              fill="none"
              stroke="#b9a175"
              strokeWidth="2"
            />
            <path d="M44 26q-4-10 2-15" fill="none" stroke="#6a7653" strokeWidth="5" />
            <path d="M47 19q4-17 19-15-2 15-19 15Z" fill="#93a16b" />
            <circle cx="43" cy="53" r="3" fill="#f2d593" />
          </>
        )
      case 'bag-star':
        return (
          <>
            <path d="M18 36q25-6 47 0l4 37q-26 15-54 1Z" fill="#65717e" />
            <path d="M19 37q23-8 45 0l1 15q-24 8-48 0Z" fill="#8290a1" />
            <path
              d="m41 51 4 8 9 1-6 6 1 9-8-4-8 4 1-9-6-6 9-1Z"
              fill="#f0d596"
              stroke="#d1b878"
              strokeWidth="1.5"
            />
            <circle cx="26" cy="44" r="2" fill={cream} stroke="none" />
            <circle cx="56" cy="68" r="2" fill={cream} stroke="none" />
            <path d="m54 39 1 4 4 1-4 1-1 4-1-4-4-1 4-1Z" fill={cream} stroke="none" />
            <path d="M21 72q9 4 17 3" fill="none" stroke="#a3b1b9" strokeWidth="2" />
          </>
        )
      default:
        return null
    }
  })()
  if (!drawing) return null
  const strap = kind === 'bag-star' ? '#7c8796' : '#b39268'
  return (
    <g
      className="pet-bag"
      data-item={kind}
      fill="none"
      stroke={ink}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M-32 3q30 26 76 45" stroke={ink} strokeWidth="8" />
      <path d="M-32 3q30 26 76 45" stroke={strap} strokeWidth="4.5" />
      <path d="m-12 18 12 9" stroke={cream} strokeWidth="1.5" />
      {drawing}
    </g>
  )
}

export function WardrobeThumbnail({ id, className = '' }: { id: string; className?: string }) {
  const neck = id.startsWith('neck-')
  return (
    <svg
      className={`item-illustration ${className}`}
      viewBox="0 0 160 140"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="80" cy="122" rx="44" ry="7" fill="#b69c78" opacity=".12" />
      {neck ? (
        <g transform="translate(80 36) scale(1.3)">
          <Neckwear kind={id} />
        </g>
      ) : (
        <g transform="translate(56 14) scale(1.24)">
          <ShoulderBag kind={id} />
        </g>
      )}
    </svg>
  )
}
