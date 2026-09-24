import { useId } from 'react'
import type { GrowthStage, SpeciesId } from '../../app/game/browserGame'
import { CompanionArt } from './CompanionArt'
import { KayaScenery } from './KayaScenery'
// oxlint-disable-next-line react/only-export-components -- Keep the companion art API in one place.
export { companionFormDescription } from './CompanionArt'

type PetMood = 'hungry' | 'happy' | 'sleepy' | 'eating'
type ArtProps = { className?: string }

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

/** A companion's anatomy changes at every growth stage; mood and clothing are independent. */
export function Pet({
  species = 'komugi',
  stage = 0,
  mood = 'hungry',
  hat = 'none',
  portrait = false,
  className = '',
}: ArtProps & {
  species?: SpeciesId
  stage?: GrowthStage
  mood?: PetMood
  hat?: string
  portrait?: boolean
}) {
  return (
    <CompanionArt
      species={species}
      stage={stage}
      mood={mood}
      hat={<Hat kind={hat} />}
      portrait={portrait}
      className={className}
    />
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
          <stop stopColor="var(--game-neutral-soft)" />
          <stop offset="1" stopColor="var(--game-line)" />
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="30" fill={`url(#${id}-dish)`} />
      <path
        d="M0 58h240M0 177h240M61 0v240M183 0v240"
        stroke="var(--game-surface)"
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
  return <KayaScenery variant={variant} className={className} />
}
