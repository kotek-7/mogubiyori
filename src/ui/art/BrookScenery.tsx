import { SceneryFrame } from './SceneryFrame'
import type { SceneryPresentation } from './SceneryFrame'

type BrookSceneryProps = { className?: string; presentation?: SceneryPresentation }

/** A low wooden footbridge crosses the brook beyond a quiet grassy bank. */
export function BrookScenery({ className = '', presentation = 'preview' }: BrookSceneryProps) {
  const cream = '#F3EEDA'
  const wood = '#AF9067'
  const line = '#6D654C'

  return (
    <SceneryFrame
      className={`gathering-scene gathering-brook ${className}`}
      presentation={presentation}
      palette={{
        kind: 'brook',
        sky: '#DEE5D7',
        ground: '#AABD8D',
        groundStart: 223,
        horizon: 181,
        light: '#D7E1CE',
        shade: '#94A77A',
        leaf: '#738D62',
        distant: [
          { y: 133, color: '#B6C7AC' },
          { y: 178, color: '#92A985' },
        ],
      }}
    >
      {presentation === 'preview' && <path d="M0 0h800v580H0Z" fill="#DEE5D7" />}
      <path
        d="M275 67c14-8 29-4 39-10 10-7 25-9 37 0 23-2 37 4 51 14-39 7-89 3-127 1Zm251 29c15-5 23-14 38-12 13 1 20 7 25 12 18-1 31 3 42 11-31 3-79 2-111-1Z"
        fill={cream}
      />
      <path
        d="M0 133c55-35 112-25 169 0 67-34 124-21 176 7 72-39 143-38 209-9 72-34 166-37 246 4v92H0Z"
        fill="#B6C7AC"
      />
      <path
        d="M0 178c57-33 113-14 152 3 45-38 99-40 148-5 58-23 99-14 151 8 68-40 126-24 172-11 69-28 122-15 177 3v117H0Z"
        fill="#92A985"
      />
      <path
        d="M0 223c106-10 176-16 267-23 83-7 116-22 171-17 104 8 187 18 362 4v393H0Z"
        fill="#AABD8D"
      />
      <path
        d="M426 181c-6 17-36 32-34 54 2 24 90 29 109 46 30 27 39 40 100 67 63 27 42 63 78 97 48 45 81 82 121 135H606c-19-63-11-113-53-144-39-29-73-49-111-76-52-36-128-47-121-94 5-40 92-56 89-85Z"
        fill="#718F89"
      />
      <path
        d="M422 182c-1 22-44 39-34 64 11 27 104 27 126 52 30 34 63 38 96 58 58 36 35 62 82 110 38 40 76 75 108 114H637c-19-52-12-94-43-134-34-43-77-57-122-88-40-28-116-45-119-78-4-37 85-67 76-97Z"
        fill="#9CBDB1"
      />
      <path
        d="M421 185c-2 20-41 34-34 58 6 23 100 31 125 51 40 32 74 45 97 59 62 39 40 74 85 112"
        stroke="#D5DDC6"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M397 226q-16 17 13 28m-43 29q13 16 39 21m80 16 31 16m26 37 33 18m48 60q12 17 13 36m-4-105q17 9 20 20m45 98 31 35"
        stroke="#D7E1CE"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="m493 288 21 5m-71 43 24 10m122 76 14 13m93 63 18 23"
        stroke="#6F9A91"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* The bridge remains in the central mobile crop, with water visible beneath it. */}
      <path d="M288 256q112-50 251 5l-7 19q-130-40-232-6Z" fill="#788C71" />
      <path d="M317 241v60l15 2 1-63m157 4 3 70 15 3-3-71" fill="#796C52" />
      <path d="m321 248 1 42m177-35 2 46" stroke="#B7A27C" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M292 227q116-48 255 1l-10 27q-136-37-239-1Z"
        fill={wood}
        stroke={line}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M298 254q105-39 239 1l-1 12q-132-37-234-1Z" fill="#8C7555" />
      <path d="M301 230q107-41 234 2" stroke="#D6C19A" strokeWidth="4" strokeLinecap="round" />
      <path
        d="m318 221 4 26m22-34 3 26m23-32 3 27m23-30 1 28m23-29-1 28m25-26-3 28m25-24-4 28m25-22-5 27m25-21-5 27"
        stroke="#8B7758"
        strokeWidth="2.5"
      />
      <path
        d="M297 238v-57l10-2 2 57m224 5 2-55 10 3-1 55"
        fill={wood}
        stroke={line}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M372 216v-57l10-1 1 56m75 3 1-57 10 2-1 57"
        fill={wood}
        stroke={line}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M299 184q113-52 243 6v11q-135-53-242-5Z"
        fill="#C5AA7F"
        stroke={line}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M305 187q102-48 230 7" stroke="#E1CAA0" strokeWidth="3" strokeLinecap="round" />
      <path d="m377 166 1 34m86-31-1 35" stroke="#D8C099" strokeWidth="2" strokeLinecap="round" />

      {/* A low willow and layered banks frame the water without filling the pet's space. */}
      <path
        d="M0 269c88-10 172-16 231-5 46 9 78 34 111 50 57 27 107 39 138 69 20 21 32 42 66 60 16 51 6 92 19 137H0Z"
        fill="#B6C79A"
      />
      <path
        d="M0 356c92-19 133-38 218-25 96 15 117 41 178 61 44 14 80 26 107 50l40 138H0Z"
        fill="#C0CCA2"
      />
      <path d="M0 483c99-14 157-4 226 21 74 27 188 18 319 5l20 71H0Z" fill="#AFBF90" />
      <path
        d="M51 580q77-51 151-45m-32-187q33-3 66 9"
        stroke="#A0B181"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M184 282c8-75-2-139-30-198l23-9c40 66 47 134 41 214Z" fill="#8C8061" />
      <path
        d="m191 211-31-47-4-34m44 30 33-35 11-40"
        stroke="#8C8061"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M188 104q25 69 18 162" stroke="#B3A581" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M-21 48c36-32 71-24 99-31 46-36 94-16 118 0 60-9 110 18 109 50 36 25 29 70-4 84-19-17-35-24-55-27-21 16-51 13-66-1-35 25-65 29-95 7-38 18-74 7-106-8Z"
        fill="#7F986F"
      />
      <path
        d="M-7 30c35-17 62-8 82-13 38-28 83-18 109 1 55-10 85 6 111 39-31 2-42-12-65-8-24 27-56 22-85 4-31 13-62 21-85 9-26 8-48-3-67-10Z"
        fill="#9FB28A"
      />
      <path
        d="M66 109q-21 31-20 66m65-58q-8 43-1 64m127-72q16 21 13 61m36-58q21 25 15 59"
        stroke="#6D8963"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M45 154q-13-10-17-25m20 26q15-4 20-18m44 24q-14-6-18-23m20 20q12-11 13-21m125 11q-13-8-19-22m66 26q12-8 18-25"
        stroke="#8BA47B"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M730 264c-2-52 9-87 22-124l16 4c-15 46-18 91-14 126Z" fill="#8D8265" />
      <path
        d="M677 67c24-31 61-42 91-29 28-22 56-17 70-4v153c-27 11-50 5-61-7-27 16-63 11-75-11-31 5-52-23-38-45-14-22-7-43 13-57Z"
        fill="#829A71"
      />
      <path
        d="M690 70c18-27 51-28 71-17 22-13 43-13 65-1v42c-27 7-48-4-60-15-24 16-50 19-76-9Z"
        fill="#A1B38A"
      />
      <path
        d="M716 158q-10 30-8 48m64-29q6 23 1 47"
        stroke="#718A64"
        strokeWidth="8"
        strokeLinecap="round"
      />

      <ellipse cx="294" cy="309" rx="44" ry="10" fill="#91A67D" />
      <path
        d="M255 308c-5-17 8-32 23-33 18-2 31 13 30 28 12-7 25-1 31 8-28 9-63 9-84-3Z"
        fill="#B0B6A0"
      />
      <path d="M262 294q15-19 36 1" stroke="#D6D8BE" strokeWidth="4" strokeLinecap="round" />
      <path d="M536 353c-4-15 7-27 19-26 17 0 26 13 28 25-13 8-33 10-47 1Z" fill="#8B9C8C" />
      <path d="M541 341q13-12 28 2" stroke="#C6D0B8" strokeWidth="3" strokeLinecap="round" />
      <path d="M626 369q14-17 32-4l5 13-26 3Z" fill="#96A592" />
      <path d="M648 545c-2-21 13-37 34-34 20 2 35 15 38 33-17 12-52 15-72 1Z" fill="#A6AD96" />
      <path d="M656 529q19-20 42 2" stroke="#D0D1B5" strokeWidth="4" strokeLinecap="round" />

      <g strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M255 326q1-24-9-44m9 44q-12-17-25-20m25 20q11-30 12-46"
          stroke="#738D62"
          strokeWidth="4"
        />
        <path
          d="M582 380q-5-35-21-55m21 55q5-32 17-50m-17 50q-24-20-34-21"
          stroke="#758C61"
          strokeWidth="5"
        />
        <path
          d="M730 494q-1-58-23-83m23 83q21-52 18-85m-18 85q-25-32-46-39m46 39q28-20 42-19"
          stroke="#728759"
          strokeWidth="5"
        />
        <path d="m747 416 1-22m-39 21-7-16" stroke="#8D7953" strokeWidth="7" />
        <path
          d="M82 437q4-39-11-62m11 62q18-33 31-39m-31 39q-16-25-32-29"
          stroke="#8B9F70"
          strokeWidth="5"
        />
      </g>
      <path d="M123 481q-18-17-33-11 8 22 33 20-2-24 16-33 10 22-10 35" fill="#8DA375" />
      <path d="M225 555q-18-16-36-7 11 17 34 14-6-24 13-36 12 23-7 38" fill="#849C6A" />
      <path d="M506 497q-10-11-19-6 5 13 19 13 0-17 12-24 6 16-8 27" fill="#8CA174" />
      <path
        d="m68 328 8-3m127 85 7-2m-41 99 6 1m283 38 10-1m211-244 8-3"
        stroke="#94A77A"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </SceneryFrame>
  )
}
