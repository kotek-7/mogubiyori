import { useId } from 'react'
import type { SpeciesId } from './game'

type PetMood = 'hungry' | 'happy' | 'sleepy' | 'eating'
type ArtProps = { className?: string }

const palette = {
  outline: '#6e4938',
  fur: '#f7d894',
  cream: '#fff2cc',
  blush: '#eeac91',
}

function Hat({ kind = 'none' }: { kind?: string }) {
  if (kind === 'beret')
    return (
      <g className="pet-hat">
        <path
          d="M78 72c-7-19 23-41 66-40 43 1 75 17 72 34-2 13-34 18-69 16-32-1-65 1-69-10Z"
          fill="#ac6d55"
          stroke="#79503d"
          strokeWidth="4"
        />
        <path d="M103 78c31 6 64 7 92-2l-4 11c-26 5-58 4-84-1Z" fill="#81503f" />
        <path d="m155 33 3-10" stroke="#79503d" strokeWidth="7" strokeLinecap="round" />
        <path d="M98 57c12-10 25-14 38-15" stroke="#c38b71" strokeWidth="6" strokeLinecap="round" />
      </g>
    )
  if (kind === 'sprout')
    return (
      <g className="pet-hat">
        <path
          d="M149 70c-2-19 4-33 9-44"
          fill="none"
          stroke="#769259"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M152 49c-26 1-40-12-37-27 23-3 40 7 37 27Z"
          fill="#a9bb79"
          stroke="#769259"
          strokeWidth="3"
        />
        <path
          d="M154 38c1-22 16-33 35-27 1 20-14 31-35 27Z"
          fill="#8ea869"
          stroke="#769259"
          strokeWidth="3"
        />
        <path
          d="m123 28 24 17m15-11 18-15"
          stroke="#cdd6a5"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    )
  if (kind === 'chef')
    return (
      <g className="pet-hat">
        <path
          d="M112 55c-19-3-23-30-6-40 10-6 20-3 26 4 8-21 36-19 41 1 24-14 44 17 27 32-6 5-13 7-21 6l-2 24h-60Z"
          fill="#fffdf4"
          stroke="#b7a688"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path d="M117 69c22-5 43-5 62-1l-2 14h-60Z" fill="#e9e4d3" />
        <path
          d="m135 47 2 13m21-17-1 15m15-11-3 13"
          stroke="#ded7c7"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    )
  return null
}

/** Original companion, Komugi. These drawings are decorative; UI owns the text. */
function KomugiAdult({
  mood = 'hungry',
  hat = 'none',
  className = '',
}: ArtProps & { mood?: PetMood; hat?: string }) {
  const id = useId()
  const happy = mood === 'happy' || mood === 'eating'
  const sleeping = mood === 'sleepy'
  return (
    <svg
      className={`pet-art pet-${mood} ${className}`}
      viewBox="0 0 300 300"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${id}-fur`} cx="40%" cy="28%" r="78%">
          <stop stopColor="#f7c544" />
          <stop offset="1" stopColor="#f7c544" />
        </radialGradient>
        <radialGradient id={`${id}-cheek`}>
          <stop stopColor="#edaa91" stopOpacity=".9" />
          <stop offset="1" stopColor="#edaa91" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="151" cy="273" rx="84" ry="13" fill="#795941" opacity=".12" />
      <g className="pet-body">
        <path
          d="M218 211c36-10 47 4 42 18-5 16-26 19-30 6-3-8 8-14 12-7"
          fill="#efd096"
          stroke="#202820"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <ellipse
          cx="110"
          cy="255"
          rx="26"
          ry="17"
          fill="#edc183"
          stroke="#202820"
          strokeWidth="3"
        />
        <ellipse
          cx="194"
          cy="255"
          rx="26"
          ry="17"
          fill="#edc183"
          stroke="#202820"
          strokeWidth="3"
        />
        <path
          d="M69 140C57 166 58 225 82 246c30 25 105 29 139-2 28-26 25-82 9-109Z"
          fill={`url(#${id}-fur)`}
          stroke="#202820"
          strokeWidth="3.5"
        />
        <ellipse cx="149" cy="223" rx="47" ry="34" fill={palette.cream} />
        <path
          d="M72 106c-28-1-36-28-22-43 17-18 44-8 43 16m115 22c28 0 39-24 25-40-16-17-39-8-38 14"
          fill="#efcd8f"
          stroke="#202820"
          strokeWidth="3.5"
        />
        <path
          d="M70 88c-12-1-16-13-8-19 7-5 15-1 17 6m135 8c11 0 16-11 9-16-6-5-14-1-16 7"
          stroke="#dfac87"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M53 142c-1-46 25-75 65-80 6-14 19-23 27-20 7 3 1 13-1 16 9-9 21-12 26-8 4 5-1 11-3 13 50 3 80 36 80 82 0 49-35 74-98 74-64 0-95-28-96-77Z"
          fill={`url(#${id}-fur)`}
          stroke="#202820"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M73 161c0-19 13-34 30-34 21 0 26 9 47 9s28-9 47-9c19 0 32 14 32 34 0 30-34 49-79 49s-77-17-77-49Z"
          fill={palette.cream}
        />
        <path
          d="m128 88 5 12m15-16 1 14m18-11-5 12"
          stroke="#ddb16f"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <ellipse cx="89" cy="165" rx="22" ry="15" fill={`url(#${id}-cheek)`} />
        <ellipse cx="211" cy="165" rx="22" ry="15" fill={`url(#${id}-cheek)`} />
        {happy ? (
          <g className="pet-eye" stroke={palette.outline} strokeWidth="5.5" strokeLinecap="round">
            <path d="M100 146q8-12 16 0m69 0q8-12 16 0" />
          </g>
        ) : sleeping ? (
          <g className="pet-eye" stroke={palette.outline} strokeWidth="4.5" strokeLinecap="round">
            <path d="M98 147q10 9 20 0m65 0q10 9 20 0" />
          </g>
        ) : (
          <g className="pet-eye">
            <ellipse cx="109" cy="146" rx="6.5" ry="9" fill={palette.outline} />
            <ellipse cx="192" cy="146" rx="6.5" ry="9" fill={palette.outline} />
            <circle cx="107" cy="143" r="1.8" fill="#fffdf0" />
            <circle cx="190" cy="143" r="1.8" fill="#fffdf0" />
            <path
              d="m99 131 11-3m81 0 11 3"
              stroke="#a77a51"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>
        )}
        <path d="M145 157q5-4 10 0l-5 5Z" fill={palette.outline} />
        {mood === 'happy' ? (
          <path
            d="M137 171q13 24 26 0Z"
            fill="#9b6250"
            stroke={palette.outline}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        ) : mood === 'eating' ? (
          <path
            d="M140 173q10 7 20 0m-36-7-3 5m54-5 3 5"
            stroke={palette.outline}
            strokeWidth="3"
            strokeLinecap="round"
          />
        ) : sleeping ? (
          <ellipse cx="150" cy="176" rx="4" ry="5" fill="#9b6250" />
        ) : (
          <path
            d="M141 176q9-8 18 0"
            stroke={palette.outline}
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
        <path
          className="pet-arm pet-arm-left"
          d={
            happy
              ? 'M80 204c-24-26-37-12-25 7 5 8 14 13 27 17'
              : 'M81 207c-16-1-24 10-15 20 5 6 14 7 23 5'
          }
          fill="#f8d999"
          stroke="#202820"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          className="pet-arm pet-arm-right"
          d={
            happy
              ? 'M221 204c24-26 37-12 25 7-5 8-14 13-27 17'
              : 'M220 207c16-1 24 10 15 20-5 6-14 7-23 5'
          }
          fill="#f8d999"
          stroke="#202820"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="m142 230 8 5 8-5"
          stroke="#d8b47d"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Hat kind={hat} />
      </g>
      {mood === 'happy' && (
        <g className="pet-sparkles" fill="#e8aa57">
          <path d="m44 116 3-10 3 10 10 3-10 3-3 10-3-10-10-3Zm207 37 3-9 3 9 9 3-9 3-3 9-3-9-9-3Z" />
          <circle cx="247" cy="101" r="3" />
          <circle cx="40" cy="167" r="3" />
        </g>
      )}
      {sleeping && (
        <g
          className="pet-sleep"
          stroke="#ac9978"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M247 107h13l-13 14h13m-1-40h16l-16 17h16" />
        </g>
      )}
      {mood === 'eating' && (
        <g fill="#cd9453">
          <circle cx="132" cy="185" r="2" />
          <circle cx="165" cy="187" r="2.5" />
          <circle cx="129" cy="194" r="1.5" />
        </g>
      )}
    </svg>
  )
}

export function Pet({
  species = 'komugi',
  stage = 2,
  mood = 'hungry',
  hat = 'none',
  className = '',
}: ArtProps & { species?: SpeciesId; stage?: 0 | 1 | 2; mood?: PetMood; hat?: string }) {
  if (species === 'komugi' && stage === 2)
    return <KomugiAdult mood={mood} hat={hat} className={`pet-komugi pet-stage-2 ${className}`} />
  return <GrowingPet species={species} stage={stage} mood={mood} hat={hat} className={className} />
}

function GrowingPet({
  species,
  stage,
  mood,
  hat,
  className,
}: {
  species: SpeciesId
  stage: 0 | 1 | 2
  mood: PetMood
  hat: string
  className: string
}) {
  const colors: Record<SpeciesId, { fur: string; shade: string; light: string; cheek: string }> = {
    komugi: { fur: '#f7c544', shade: '#202820', light: '#fff5de', cheek: '#df442d' },
    mame: { fur: '#498450', shade: '#202820', light: '#e5edbf', cheek: '#df442d' },
    shizuku: { fur: '#438dc7', shade: '#202820', light: '#fff5de', cheek: '#df442d' },
    yuzu: { fur: '#e78b25', shade: '#202820', light: '#fff5de', cheek: '#cf3b28' },
    momo: { fur: '#e46b67', shade: '#202820', light: '#fff5de', cheek: '#b83034' },
    goma: { fur: '#465c6a', shade: '#202820', light: '#fff5de', cheek: '#df442d' },
  }
  const color = colors[species]
  const happy = mood === 'happy' || mood === 'eating'
  const bird = species === 'shizuku' || species === 'goma'
  const scale = stage === 0 ? 0.75 : stage === 1 ? 0.89 : 1
  const translate = 273 * (1 - scale)
  const adult = stage === 2
  const eyeY = stage === 0 ? 155 : 147
  return (
    <svg
      className={`pet-art pet-${mood} pet-${species} pet-stage-${stage} ${className}`}
      viewBox="0 0 300 300"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="150" cy="274" rx={stage === 0 ? 59 : 78} ry="11" fill="#795941" opacity=".12" />
      <g
        className="pet-body"
        transform={`translate(${150 * (1 - scale)} ${translate}) scale(${scale})`}
      >
        {(species === 'yuzu' || species === 'momo' || species === 'komugi') && stage > 0 && (
          <g className="pet-tail">
            {species === 'yuzu' ? (
              <>
                <path
                  d={
                    adult
                      ? 'M204 225c45-3 65-43 63-72 27 46 3 99-51 89Z'
                      : 'M208 231c29-1 45-21 46-37 15 30-5 52-41 49Z'
                  }
                  fill={color.fur}
                  stroke={color.shade}
                  strokeWidth="3.5"
                />
                <path
                  d={
                    adult
                      ? 'M258 181q9-14 9-28c15 25 13 40 10 51l-11-3 1-10Z'
                      : 'M244 213q9-9 10-19c7 15 7 24 3 31Z'
                  }
                  fill={color.light}
                />
              </>
            ) : (
              <path
                d={
                  species === 'momo'
                    ? 'M209 239c39 21 61-6 47-22-10-11-27-1-18 10'
                    : 'M209 231c35-13 56 10 39 23-10 7-21-2-12-10'
                }
                stroke={color.shade}
                strokeWidth="17"
                strokeLinecap="round"
              />
            )}
            {(species === 'momo' || species === 'komugi') && (
              <path
                d={
                  species === 'momo'
                    ? 'M209 239c39 21 61-6 47-22-10-11-27-1-18 10'
                    : 'M209 231c35-13 56 10 39 23-10 7-21-2-12-10'
                }
                stroke={color.fur}
                strokeWidth="11"
                strokeLinecap="round"
              />
            )}
          </g>
        )}
        <ellipse
          cx="113"
          cy="257"
          rx={bird ? 24 : 23}
          ry="13"
          fill={bird ? '#ddaf78' : color.fur}
          stroke={bird ? '#b69369' : color.shade}
          strokeWidth="3"
        />
        <ellipse
          cx="187"
          cy="257"
          rx={bird ? 24 : 23}
          ry="13"
          fill={bird ? '#ddaf78' : color.fur}
          stroke={bird ? '#b69369' : color.shade}
          strokeWidth="3"
        />
        <ellipse
          cx="150"
          cy="206"
          rx={species === 'goma' ? 70 : 72}
          ry={stage === 0 ? 57 : 62}
          fill={color.fur}
          stroke={color.shade}
          strokeWidth="3.5"
        />
        <ellipse cx="150" cy="218" rx={bird ? 50 : 43} ry="39" fill={color.light} />
        {species === 'mame' && (
          <g>
            <path
              d={
                stage === 0
                  ? 'M102 104C74 66 103 56 115 99m69 5c26-33 0-45-14-8'
                  : adult
                    ? 'M96 98C62 23 85-1 110 26c11 13 14 44 12 65m70 6c42-80 6-105-14-68-10 19-12 41-9 61'
                    : 'M97 101C70 50 86 24 105 46c12 14 15 33 13 48m72 6c33-48 13-83-7-56-12 15-16 33-14 49'
              }
              fill={color.fur}
              stroke={color.shade}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {stage > 0 && (
              <path
                d={
                  adult
                    ? 'M104 80C99 53 89 26 92 24m91 53c1-22 15-50 17-52'
                    : 'M105 88c-4-14-14-34-13-34m88 32c3-17 11-26 13-28'
                }
                stroke="#e5dbb4"
                strokeWidth="9"
                strokeLinecap="round"
              />
            )}
          </g>
        )}
        {(species === 'yuzu' || species === 'momo') && (
          <g>
            <path
              d={
                stage === 0
                  ? 'M83 114 86 68q25 4 40 34m51 0q13-29 36-34l4 46'
                  : species === 'yuzu'
                    ? 'M78 115 72 37q41 11 61 65m35 0q21-54 62-65l-9 81'
                    : 'M76 117 84 49q30 7 44 49m45 0q22-44 44-49l8 68'
              }
              fill={color.fur}
              stroke={color.shade}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path
              d={
                stage === 0
                  ? 'm91 100 1-19 14 17m87 0 14-17 2 20'
                  : 'm88 91 3-25 19 25m80 0 17-25 5 25'
              }
              fill={species === 'momo' ? '#dca6ad' : '#d79575'}
            />
          </g>
        )}
        {species === 'komugi' && (
          <g>
            <circle
              cx="82"
              cy="96"
              r={stage === 0 ? 18 : 23}
              fill={color.fur}
              stroke={color.shade}
              strokeWidth="3.5"
            />
            <circle
              cx="218"
              cy="96"
              r={stage === 0 ? 18 : 23}
              fill={color.fur}
              stroke={color.shade}
              strokeWidth="3.5"
            />
            <circle cx="82" cy="96" r="10" fill="#e5b78c" />
            <circle cx="218" cy="96" r="10" fill="#e5b78c" />
          </g>
        )}
        {species === 'shizuku' && (
          <path
            d={
              stage === 0
                ? 'M141 89c-19-23-6-33 4-20 3-16 19-16 14 11'
                : adult
                  ? 'M127 91c-35-33-11-53 4-25-8-44 20-46 25-13 16-29 39-12 13 27'
                  : 'M135 88c-23-32-4-43 9-17 3-33 26-29 18 2'
            }
            fill={color.fur}
            stroke={color.shade}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}
        <path
          d={
            species === 'goma'
              ? 'M64 158c0-67 37-95 86-95s86 28 86 95c0 42-31 65-86 65s-86-23-86-65Z'
              : 'M56 150c0-48 32-81 94-81s94 33 94 81c0 46-33 71-94 71s-94-25-94-71Z'
          }
          fill={color.fur}
          stroke={color.shade}
          strokeWidth="3.5"
        />
        {species === 'goma' ? (
          <path
            d="M78 155c0-29 17-47 36-44 14 2 20 20 36 21 16-1 22-19 36-21 19-3 36 15 36 44 0 34-23 54-72 54s-72-20-72-54Z"
            fill={color.light}
          />
        ) : (
          <path
            d={
              species === 'yuzu'
                ? 'M72 145c21 4 29 30 78 27 45 1 55-25 79-29-6 44-35 64-79 64-48 0-69-23-78-62Z'
                : 'M76 161c0-23 15-36 33-34 17 2 23 13 41 13s24-11 41-13c18-2 33 11 33 34 0 31-29 49-74 49s-74-18-74-49Z'
            }
            fill={color.light}
          />
        )}
        {species === 'komugi' && (
          <path
            d="m130 98 5 11m15-15v13m20-9-5 11"
            stroke="#d4ac70"
            strokeWidth="5"
            strokeLinecap="round"
          />
        )}
        {species === 'mame' && adult && (
          <path
            d="M139 92q-5-14 10-13 14 0 12 13"
            stroke="#a7b480"
            strokeWidth="5"
            strokeLinecap="round"
          />
        )}
        {species === 'momo' && stage > 0 && (
          <path
            d="m133 92 5 11m12-12v11m16-10-5 11"
            stroke="#c896a2"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}
        {species === 'yuzu' && adult && (
          <path d="m120 201 9 15 11-7 10 12 10-12 11 7 9-15" fill={color.light} />
        )}
        {species === 'goma' && adult && (
          <path
            d="M144 76c-12-19-1-24 6-12 8-12 16-2 6 9"
            fill={color.fur}
            stroke={color.shade}
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
        <ellipse cx="88" cy="171" rx="15" ry="9" fill={color.cheek} opacity=".65" />
        <ellipse cx="212" cy="171" rx="15" ry="9" fill={color.cheek} opacity=".65" />
        {happy ? (
          <g className="pet-eye" stroke="#202820" strokeWidth="5" strokeLinecap="round">
            <path d={`M102 ${eyeY}q8-11 16 0m64 0q8-11 16 0`} />
          </g>
        ) : mood === 'sleepy' ? (
          <g className="pet-eye" stroke="#202820" strokeWidth="4" strokeLinecap="round">
            <path d={`M102 ${eyeY}q8 8 16 0m64 0q8 8 16 0`} />
          </g>
        ) : (
          <g className="pet-eye">
            <ellipse cx="111" cy={eyeY} rx={stage === 0 ? 7 : 6} ry="8" fill="#655047" />
            <ellipse cx="189" cy={eyeY} rx={stage === 0 ? 7 : 6} ry="8" fill="#655047" />
            <circle cx="109" cy={eyeY - 3} r="1.6" fill="#fff9e9" />
            <circle cx="187" cy={eyeY - 3} r="1.6" fill="#fff9e9" />
          </g>
        )}
        {bird ? (
          <path
            d="m138 167 12-7 12 7-12 10Z"
            fill="#ddb36b"
            stroke="#b68d55"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ) : (
          <>
            <path d="M145 161q5-4 10 0l-5 5Z" fill="#655047" />
            {happy ? (
              <path
                d="M139 175q11 19 22 0Z"
                fill="#a97260"
                stroke="#202820"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d={mood === 'sleepy' ? 'M147 177h6' : 'M143 177q7-6 14 0'}
                stroke="#202820"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            )}
          </>
        )}
        <path
          className="pet-arm pet-arm-left"
          d={
            bird && adult
              ? 'M78 200c-30-2-32 36-12 42 8-8 17-18 19-30'
              : happy
                ? 'M81 210c-26-21-34-3-20 12 6 6 14 7 22 5'
                : 'M82 213c-23-5-25 15-10 20l16-2'
          }
          fill={color.fur}
          stroke={color.shade}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          className="pet-arm pet-arm-right"
          d={
            bird && adult
              ? 'M222 200c30-2 32 36 12 42-8-8-17-18-19-30'
              : happy
                ? 'M219 210c26-21 34-3 20 12-6 6-14 7-22 5'
                : 'M218 213c23-5 25 15 10 20l-16-2'
          }
          fill={color.fur}
          stroke={color.shade}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {stage === 0 ? (
          <path
            d="M134 224q16 13 32 0"
            stroke={color.shade}
            strokeOpacity=".5"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="m142 237 8 4 8-4"
            stroke={color.shade}
            strokeOpacity=".45"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
        <Hat kind={hat} />
      </g>
      {happy && (
        <g className="pet-sparkles" fill="#d9ad67">
          <path d="m42 125 3-9 3 9 9 3-9 3-3 9-3-9-9-3Zm211 36 2-7 2 7 7 2-7 2-2 7-2-7-7-2Z" />
        </g>
      )}
    </svg>
  )
}

function Plant({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M0 0v-32m0 15-11-12m11 3 12-16"
        stroke="#738757"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M-2-25c-20 2-25-18-21-23 17 0 23 10 21 23M3-30c19 4 29-13 24-19C10-51 3-41 3-30"
        fill="#9fae76"
      />
      <path d="M-17-1h34L13 29h-26Z" fill="#ce9072" />
      <path d="M-19-1h38v7h-38Z" fill="#dda588" />
      <path d="M-9 13v8" stroke="#e8b89d" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

export function RoomScene({ variant = 'plain', className = '' }: ArtProps & { variant?: string }) {
  const id = useId()
  const night = variant === 'night'
  const garden = variant === 'garden'
  return (
    <svg
      className={`room-scene room-${variant} ${className}`}
      viewBox="0 0 800 580"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`${id}-wall`}
          x1="400"
          y1="0"
          x2="400"
          y2="580"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={night ? '#b6b1c6' : garden ? '#edf0d9' : '#f7edda'} />
          <stop offset="1" stopColor={night ? '#d8c9c7' : '#f3e5cc'} />
        </linearGradient>
        <linearGradient
          id={`${id}-sky`}
          x1="150"
          y1="86"
          x2="150"
          y2="271"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={night ? '#666c94' : '#c8dfd7'} />
          <stop offset="1" stopColor={night ? '#a39fb9' : '#edf0d2'} />
        </linearGradient>
        <linearGradient
          id={`${id}-floor`}
          x1="400"
          y1="343"
          x2="400"
          y2="580"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={night ? '#c4aa99' : '#e6c79e'} />
          <stop offset="1" stopColor={night ? '#dbc4b0' : '#f4ddba'} />
        </linearGradient>
        <clipPath id={`${id}-window`}>
          <path d="M109 259V134a79 79 0 0 1 158 0v125Z" />
        </clipPath>
        <pattern id={`${id}-paper`} width="44" height="44" patternUnits="userSpaceOnUse">
          <circle cx="22" cy="22" r="1.2" fill={night ? '#9e93ac' : '#d4c6ac'} opacity=".34" />
        </pattern>
      </defs>
      <path fill={`url(#${id}-wall)`} d="M0 0h800v580H0z" />
      <path fill={`url(#${id}-paper)`} d="M0 0h800v348H0z" />
      <path d="M0 344h800v236H0z" fill={`url(#${id}-floor)`} />
      <path d="M0 342h800v13H0z" fill={night ? '#b99c8a' : '#d8b991'} />
      <g stroke={night ? '#ad8c78' : '#cda779'} strokeWidth="1.4" opacity=".25">
        <path d="M0 394h800M0 461h800M0 546h800M153 355l-44 225m199-225-16 225m168-225 14 225m164-225 47 225M0 461l800 1M414 395v65M214 461l-9 84M604 461l20 84M40 394l-9 66M740 394l20 66" />
      </g>
      <path d="M93 271V135a95 95 0 0 1 190 0v136Z" fill={night ? '#c2abb1' : '#e5d2b4'} />
      <path d="M102 266V135a86 86 0 0 1 172 0v131Z" fill="#faf1db" />
      <g clipPath={`url(#${id}-window)`}>
        <path d="M105 49h169v216H105Z" fill={`url(#${id}-sky)`} />
        {night ? (
          <g>
            <path d="M222 81c-13 21-4 37 12 41-26 11-43-10-33-30 5-9 13-12 21-11Z" fill="#fff3cc" />
            <g fill="#f8ebcb">
              <circle cx="143" cy="97" r="2" />
              <circle cx="246" cy="161" r="2" />
              <circle cx="156" cy="164" r="1.6" />
              <path d="m182 123 1.5-5 1.5 5 5 1.5-5 1.5-1.5 5-1.5-5-5-1.5Z" />
            </g>
          </g>
        ) : (
          <g fill="#fffcf0">
            <path d="M101 133c0-10 13-16 21-10 3-13 23-15 28-2 17-6 28 7 22 16h-71Z" />
            <path d="M211 93c2-8 10-12 18-6 7-17 25-10 25 0 12 0 18 7 15 14h-58Z" />
          </g>
        )}
        <path d="M85 232q43-48 84-13 55-57 120 5v50H85Z" fill={night ? '#92997f' : '#bacb92'} />
        <path d="M80 252q62-26 105-7 64-33 116 7v28H80Z" fill={night ? '#78876f' : '#a5bb81'} />
        {garden && (
          <g>
            <path
              d="M249 281V175m-6 75-11-12m21-18 13-19m-26 19-19-23"
              stroke="#8ba073"
              strokeWidth="5"
            />
            <g fill="#e5baaa">
              <circle cx="232" cy="237" r="10" />
              <circle cx="251" cy="189" r="12" />
              <circle cx="221" cy="211" r="9" />
              <circle cx="264" cy="213" r="10" />
            </g>
          </g>
        )}
      </g>
      <path d="M187 57v207m-81-78h162" stroke="#fcf4e3" strokeWidth="8" />
      <path d="M94 264h188v12H94z" fill="#b89870" />
      <path d="M94 262h188v7H94z" fill="#d0b28c" />
      <path d="M63 49h38l1 137-13 12-20-5Z" fill={night ? '#aaa2b4' : '#e4d0ac'} />
      <path d="M67 188c3 30-3 55-11 75 18 6 31 5 44 0l1-78Z" fill={night ? '#b4acbd' : '#ebdbbd'} />
      <path d="M270 49h41l-8 144-20 5-13-12Z" fill={night ? '#aaa2b4' : '#e4d0ac'} />
      <path
        d="M272 188c-3 26 3 55 11 75 15 5 27 5 44 0-13-28-21-57-23-75Z"
        fill={night ? '#b4acbd' : '#ebdbbd'}
      />
      <path d="M74 189h25m176 0h27" stroke="#bca783" strokeWidth="6" strokeLinecap="round" />
      <path d="M56 46h263" stroke="#a38566" strokeWidth="6" strokeLinecap="round" />
      <g transform="translate(386 91)">
        <circle r="32" fill="#c5a784" />
        <circle r="27" fill="#fff7e4" />
        <path d="M0-16v17l12 8" stroke="#9b8265" strokeWidth="3" strokeLinecap="round" />
        <g fill="#bda587">
          <circle cy="-21" r="1.8" />
          <circle cy="21" r="1.8" />
          <circle cx="-21" r="1.8" />
          <circle cx="21" r="1.8" />
        </g>
      </g>
      <path d="M497 136h253v9H497z" fill="#b99a75" />
      <path d="M509 146v13m223-13v13" stroke="#b99a75" strokeWidth="5" strokeLinecap="round" />
      <Plant x={531} y={112} scale={0.67} />
      <g transform="translate(574 101)">
        <path d="M0 0h21v32H0z" fill="#e9d3b5" />
        <path d="M4 5h13v16H4z" fill="#fcf4df" />
        <path d="M1 0h19" stroke="#ab9276" strokeWidth="5" strokeLinecap="round" />
        <path d="M7 12h7m-7 4h5" stroke="#b59d7d" strokeWidth="2" />
      </g>
      <path d="M615 111h15v23h-15z" fill="#a6b79c" />
      <path d="M631 114h10v20h-10z" fill="#ca957b" />
      <path d="M643 107h15v27h-15z" fill="#d9bc7b" />
      <path d="m660 111 10-3 6 25-10 2Z" fill="#b8a9b7" />
      <g transform="translate(697 95)">
        <path d="M-15 20q-7-28 9-29 5 0 6 9 10-14 18-3 9 15-1 23Z" fill="#a0ab72" />
        <path d="M-17 15h37l-5 24h-27Z" fill="#dfc99f" />
      </g>
      <path d="M488 242h270v103H488Z" fill={night ? '#bbaaa0' : '#e6d7b7'} />
      <path d="M488 242h270v10H488Z" fill="#a88d70" />
      <path
        d="M501 260h71v75h-71Zm83 0h71v75h-71Zm83 0h77v75h-77Z"
        stroke="#bda987"
        strokeWidth="2"
      />
      <path
        d="M529 270h15m67 0h15m71 0h15"
        stroke="#a38b6d"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M483 235h280v10H483Z" fill="#d2b492" />
      <path d="M577 231c0-8 62-8 62 0v5h-62Z" fill="#9caa9b" />
      <path
        d="M599 229v-27q0-18 15-18 13 0 13 13"
        stroke="#acb1a0"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M500 214h28v19h-28Z" fill="#f6e9cb" />
      <path d="M528 217h5q8 7 0 12h-5" stroke="#f6e9cb" strokeWidth="4" />
      <path
        d="M507 205q-4-6 1-11m8 11q-4-6 1-11"
        stroke="#fff9e8"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".7"
      />
      <g transform="translate(681 202)">
        <path d="M0 0h34l-3 31H4Z" fill="#d1a485" />
        <path
          d="m9 6-4-36m14 35 7-39m-3 39 11-25"
          stroke="#a98768"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <ellipse cx="5" cy="-31" rx="5" ry="8" fill="#c1a080" />
        <ellipse cx="28" cy="-35" rx="5" ry="8" fill="#c1a080" />
      </g>
      <path d="M476 257h18v65h-18Z" fill="#f6edda" />
      <path d="M478 305h14m-14 6h14" stroke="#ccb08f" strokeWidth="2" />
      <ellipse
        cx="358"
        cy="466"
        rx="227"
        ry="70"
        fill={night ? '#adaaa0' : garden ? '#c6cdad' : '#e8d2ac'}
        opacity=".8"
      />
      <ellipse
        cx="358"
        cy="466"
        rx="208"
        ry="58"
        stroke={night ? '#c6c1b6' : '#f2e5c9'}
        strokeWidth="3"
        opacity=".8"
      />
      <path d="m101 348 10 53h-14l-5-53Zm34 0-9 53h14l7-53Z" fill="#af8e69" />
      <ellipse cx="120" cy="343" rx="42" ry="13" fill="#d0b28a" />
      <Plant x={117} y={315} scale={0.9} />
      {garden && (
        <g>
          <Plant x={50} y={360} scale={1.2} />
          <path d="M350 12c3 39 30 37 22 68-7 28 15 34 11 66" stroke="#96a776" strokeWidth="3" />
          <g fill="#a8b786">
            <ellipse cx="356" cy="35" rx="12" ry="6" transform="rotate(30 356 35)" />
            <ellipse cx="374" cy="66" rx="11" ry="6" transform="rotate(-45 374 66)" />
            <ellipse cx="373" cy="97" rx="11" ry="6" transform="rotate(30 373 97)" />
            <ellipse cx="383" cy="124" rx="10" ry="6" transform="rotate(-40 383 124)" />
          </g>
        </g>
      )}
      {night && (
        <g>
          <path d="M713 354v97m-21 0h42" stroke="#a38a76" strokeWidth="6" strokeLinecap="round" />
          <path d="M687 295h53l18 60h-89Z" fill="#f2dba9" />
          <ellipse cx="714" cy="355" rx="44" ry="8" fill="#ffebbc" />
          <ellipse cx="714" cy="377" rx="69" ry="31" fill="#ffe8b5" opacity=".16" />
        </g>
      )}
      <g className="room-table">
        <ellipse cx="654" cy="523" rx="107" ry="20" fill="#a27e59" opacity=".1" />
        <path
          d="m573 461-9 70h14l13-67m137-3 9 70h-14l-13-67"
          stroke="#a8815e"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse cx="651" cy="465" rx="106" ry="34" fill="#b68f63" />
        <ellipse cx="651" cy="457" rx="106" ry="34" fill="#d7b487" />
        <ellipse cx="649" cy="451" rx="43" ry="17" fill="#efe2c6" />
        <ellipse cx="649" cy="449" rx="42" ry="16" fill="#fff5df" />
        <ellipse cx="649" cy="449" rx="29" ry="10" stroke="#e9d8b8" strokeWidth="1.5" />
        <path
          d="m711 440 17 17m-12-20 17 17"
          stroke="#9f7e60"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      {!night && <path d="m114 276 126 1 139 188-247 3Z" fill="#fff9e6" opacity=".12" />}
    </svg>
  )
}

export function DishArt({ kind = 'rice', className = '' }: ArtProps & { kind?: string }) {
  const id = useId()
  return (
    <svg className={`dish-art ${className}`} viewBox="0 0 240 240" fill="none" aria-hidden="true">
      <defs>
        <linearGradient
          id={`${id}-dish`}
          x1="30"
          y1="30"
          x2="210"
          y2="230"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f8eacb" />
          <stop offset="1" stopColor="#e8d4b0" />
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="30" fill={`url(#${id}-dish)`} />
      <path
        d="M0 58h240M0 177h240M61 0v240M183 0v240"
        stroke="#fff7e4"
        strokeWidth="18"
        opacity=".4"
      />
      <ellipse cx="121" cy="150" rx="87" ry="64" fill="#bda383" opacity=".17" />
      {kind === 'curry' ? (
        <g>
          <ellipse cx="120" cy="133" rx="91" ry="73" fill="#b49d7b" opacity=".15" />
          <ellipse cx="120" cy="126" rx="91" ry="73" fill="#fff8e6" />
          <ellipse cx="120" cy="126" rx="77" ry="60" stroke="#e5d4b5" strokeWidth="2" />
          <path d="M66 118c-14-34 18-58 48-46 25 10 43 54 26 74-24 28-63 3-74-28Z" fill="#fffdf0" />
          <path
            d="M122 91c42-8 73 21 69 49-4 32-59 43-91 14-17-15 21-16 16-39-2-11-4-20 6-24Z"
            fill="#a86b3b"
          />
          <path d="M132 97c31-2 52 18 50 41-3 23-40 34-68 13" fill="#b98042" />
          <g fill="#d98c4f">
            <path d="m144 108 15 3-4 16-16-3Zm-23 32 13-7 9 13-13 8Z" />
          </g>
          <g fill="#e4bd72">
            <path d="m165 132 12 5-5 13-14-4Zm-35-27 6 9-10 7-8-11Z" />
          </g>
          <g stroke="#e4dbc8" strokeWidth="2.5" strokeLinecap="round">
            <path d="m84 91 5 1m8 19 4-2m-23 12 4 2m25 10 4 1m-9-43 4 2" />
          </g>
          <g fill="#91a367">
            <path d="m92 76 13 4-5 7-12-3Zm-5 10 7 2-2 6-8-1Z" />
          </g>
        </g>
      ) : kind === 'soup' ? (
        <g>
          <ellipse cx="120" cy="157" rx="80" ry="35" fill="#f4eee0" />
          <path d="M48 113c3 60 29 80 72 80s68-20 72-80Z" fill="#b1c0aa" />
          <path
            d="M54 136c-28-15-24 35 8 25m124-25c28-15 24 35-8 25"
            stroke="#9aaa95"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <ellipse cx="120" cy="113" rx="72" ry="42" fill="#e1e7d5" />
          <ellipse cx="120" cy="115" rx="64" ry="34" fill="#d79b5a" />
          <ellipse cx="120" cy="113" rx="59" ry="28" fill="#ebbb70" />
          <g fill="#e98553">
            <path d="m73 112 15-8 9 13-15 7Zm62-24 15 4-3 16-15-5Zm11 40 15-7 9 12-13 7Z" />
          </g>
          <g fill="#f9dfab">
            <path d="m106 100 14 3-3 16-16-2Zm7 28 13-6 10 14-18 5Z" />
          </g>
          <g fill="#7e9d62">
            <ellipse cx="100" cy="91" rx="11" ry="5" transform="rotate(-20 100 91)" />
            <ellipse cx="163" cy="109" rx="10" ry="5" transform="rotate(35 163 109)" />
            <path d="m78 130 14-5 4 8-14 4Z" />
          </g>
          <path
            d="M94 58c-12-13 10-14 1-27m27 25c-12-13 10-14 1-27m28 29c-12-13 10-14 1-27"
            stroke="#fff9e9"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      ) : kind === 'pasta' ? (
        <g>
          <ellipse cx="120" cy="127" rx="90" ry="77" fill="#fdf7e7" />
          <ellipse cx="120" cy="127" rx="74" ry="62" stroke="#e5d7bd" strokeWidth="2" />
          <path d="M68 114c7-36 88-38 105 2 31 27-3 61-48 62-53 0-82-34-57-64Z" fill="#d88a57" />
          <g stroke="#efd08b" strokeWidth="6" strokeLinecap="round">
            <path d="M73 128c-5-37 95-33 91 6-4 28-62 31-71 11-11-25 44-44 56-17 8 21-28 36-41 19" />
            <path d="M78 143c29 39 83 17 90-10m-95-12c31-33 76-23 80 6m-62 35c-38-44 47-65 47-31m-24-33c58-5 70 41 35 52" />
          </g>
          <g fill="#bd5d40">
            <path d="m81 107 12 2-4 10-12-1Zm59 42 13 3-6 10-11-4Zm3-43 13 1-2 11-13-2Z" />
          </g>
          <path
            d="M123 94c-20 7-23-9-18-14 13-6 21 1 18 14m0 0c1-20 18-18 22-12-2 12-10 16-22 12Z"
            fill="#7a9860"
          />
          <g fill="#fff1ca">
            <circle cx="105" cy="127" r="2" />
            <circle cx="157" cy="132" r="2" />
            <circle cx="121" cy="153" r="2" />
            <circle cx="91" cy="149" r="2" />
          </g>
        </g>
      ) : (
        <g>
          <ellipse cx="120" cy="128" rx="90" ry="77" fill="#fdf7e7" />
          <ellipse cx="120" cy="128" rx="75" ry="62" stroke="#e5d7bd" strokeWidth="2" />
          <path
            d="M67 122c-11-34 33-62 64-43 17 11 30 42 11 59-22 18-66 17-75-16Z"
            fill="#efe7d1"
          />
          <path
            d="M67 116c-11-34 33-62 64-43 17 11 30 42 11 59-22 18-66 17-75-16Z"
            fill="#fff9e9"
          />
          <g stroke="#e5dcc8" strokeWidth="2" strokeLinecap="round">
            <path d="m84 93 4-3m16-9 4 1m17 14 3 3m-31 7 4 2m12 13 4-2m-33 4 3 2m22-24 3 3" />
          </g>
          <path d="M109 140c-2-18 10-34 34-35 31-1 44 25 34 47-9 21-61 20-68-12Z" fill="#b7794e" />
          <path d="M115 134c-2-13 9-25 28-26 25-1 36 19 27 36-7 15-50 16-55-10Z" fill="#ce955d" />
          <path
            d="m124 123 30 24m-21-30 29 25m-14-25 17 17"
            stroke="#9f6745"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <g fill="#8ba568">
            <circle cx="77" cy="153" r="13" />
            <circle cx="86" cy="159" r="10" />
            <circle cx="76" cy="167" r="11" />
            <circle cx="95" cy="169" r="9" />
          </g>
          <circle cx="113" cy="176" r="11" fill="#d9825e" />
          <path d="m109 166 4 4 5-4" stroke="#7d9561" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}

export function ItemArt({ id, className = '' }: ArtProps & { id: string }) {
  if (id === 'none') return <Pet mood="happy" className={`item-illustration ${className}`} />
  if (id === 'plain' || id === 'garden' || id === 'night')
    return <GatheringScene variant={id} className={`item-illustration ${className}`} />
  return (
    <svg
      className={`item-illustration ${className}`}
      viewBox="0 0 160 140"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="80" cy="116" rx="48" ry="9" fill="#b69c78" opacity=".12" />
      <g transform="translate(-37 11) scale(.78)">
        <Hat kind={id} />
      </g>
      <path
        d="m29 41 2-6 2 6 6 2-6 2-2 6-2-6-6-2Zm105 48 2-5 2 5 5 2-5 2-2 5-2-5-5-2Z"
        fill="#d9b57f"
      />
    </svg>
  )
}

export function GatheringScene({
  className = '',
  variant = 'plain',
}: ArtProps & { variant?: string }) {
  const backgrounds: Record<string, string> = {
    plain: 'i-picnic-hill',
    garden: 'i-orchard-porch',
    night: 'i-rooftop-supper',
  }
  const background = backgrounds[variant] ?? backgrounds.plain
  return (
    <svg
      className={`gathering-scene gathering-${variant} ${className}`}
      viewBox="0 0 800 580"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <image
        href={`${import.meta.env.BASE_URL}expansion/assets/items/${background}.svg`}
        width="800"
        height="580"
        preserveAspectRatio="xMidYMid slice"
      />
    </svg>
  )
}
