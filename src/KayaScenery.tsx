import { useId } from 'react'

type KayaSceneryProps = { className?: string; variant?: string }

/** The open yard of Kaya's lower hearth, looking out toward the eastern bay. */
export function KayaScenery({ className = '', variant = 'plain' }: KayaSceneryProps) {
  const id = useId()
  const night = variant === 'night'
  const garden = variant === 'garden'
  const ink = '#372822'
  const cream = '#F9F6ED'
  const sand = night ? '#AAA496' : '#E5D9C1'
  const ochre = night ? '#A48D71' : '#CBB894'
  const roof = night ? '#916B61' : '#BB795C'
  const blue = night ? '#354F5B' : '#4D7389'
  const olive = night ? '#586351' : '#798562'
  const wood = night ? '#574A40' : '#796451'
  const line = night ? '#64574F' : '#78624F'
  const stone = night ? '#A4A193' : '#C8C4B8'

  return (
    <svg
      className={`gathering-scene gathering-${variant} ${className}`}
      viewBox="0 0 800 580"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={`${id}-house-roof`}>
          <path d="M-18 83 130 36q4-1 7 2l97 88q-89 5-168 1l-84 1Z" />
        </clipPath>
        <clipPath id={`${id}-hearth-roof`}>
          <path d="m580 196 85-79q3-3 8-1l127 20v69q-97-5-220-9Z" />
        </clipPath>
        <pattern id={`${id}-plaster`} width="51" height="43" patternUnits="userSpaceOnUse">
          <path d="m8 14 4-1m24 19 3 1" stroke={line} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="33" cy="9" r=".8" fill={cream} />
          <circle cx="17" cy="34" r="1.2" fill={cream} />
        </pattern>
      </defs>
      {/* Broad flat planes keep the companion separate from the distant village. */}
      <path d="M0 0h800v580H0z" fill={night ? '#344956' : '#E9E7E1'} />
      {night ? (
        <g fill={cream}>
          <path d="M429 29a38 38 0 1 0 39 52 36 36 0 0 1-39-52Z" />
          <path d="m306 72 3-9 3 9 9 3-9 3-3 9-3-9-9-3Zm260-18 2-6 2 6 6 2-6 2-2 6-2-6-6-2Z" />
          <circle cx="364" cy="120" r="2.5" />
          <circle cx="490" cy="114" r="2.5" />
          <circle cx="603" cy="26" r="2.5" />
        </g>
      ) : (
        <g>
          <path
            d="M415 30c23 0 39 18 38 40-1 24-17 38-39 38s-40-16-39-39c0-21 16-40 40-39Z"
            fill="#D3A548"
          />
          <path
            d="M237 89c5-8 17-5 25-8 5-3 4-13 17-13 10-1 17 7 20 13 10-4 20 0 25 7 9-1 18 3 20 10-30 3-76 2-109-1Zm270 38c6-7 15-4 21-8 3-4 6-10 14-10 8-1 12 5 17 11 11-3 26 2 30 9-21 4-62 3-82-2Z"
            fill={cream}
          />
          <path
            d="m481 55 7 4 7-4m-157 77 7 4 7-4"
            stroke={blue}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      <path d="M166 191q170-3 318 0 88-2 166-1v160H166Z" fill={night ? '#4D7389' : '#7F9BA9'} />
      <path
        d="M519 190c25-5 41-32 69-38 10-3 22 13 34 12 24-5 44 14 63 26Z"
        fill={night ? '#526765' : '#83958A'}
      />
      <path d="M539 190c18-4 24-16 37-19 11-1 27 10 38 19Z" fill={night ? '#637A75' : '#9EAD9C'} />
      <path
        d="M196 221q42-3 75 0m92 34q31-3 70-1m94-32q36-3 68 0m-291 17q19-2 41 0m123-36q23-2 46 0"
        stroke={night ? '#7A959B' : '#BCCAC9'}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <g transform="translate(453 216)">
        <path d="M-29 0q22 3 58 0l-12 10h-37Z" fill={wood} />
        <path d="M-1-59q-2 28 0 54h-26q14-23 26-54Z" fill={cream} />
        <path d="M4-43q4 24 22 38H4Z" fill={night ? '#B3A58C' : '#CBB894'} />
        <path
          d="m-20 3 5 4h25m-23-21 10-23"
          stroke={cream}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity=".7"
        />
        <path d="M0-62V0" stroke={blue} strokeWidth="3" strokeLinecap="round" />
      </g>
      <path
        d="M196 264c103 19 175 28 274 14 86-13 126-10 197 7l46 90H161Z"
        fill={night ? '#9D9C8E' : '#D4C5A6'}
      />
      <path
        d="M244 280c70 14 134 19 202 11 74-9 127-11 193-1"
        stroke={night ? '#BEBCAF' : '#F9F6ED'}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* An ochre house frames the village path on the left. */}
      <path d="M0 79h195l31 62q-4 105 0 228H0Z" fill={ochre} />
      <path d="M183 123h43q-4 105 0 246h-43q4-134 0-246Z" fill={night ? '#8E7C65' : '#BAA37E'} />
      <path d="M0 137h180v182H0Z" fill={`url(#${id}-plaster)`} opacity=".26" />
      <path
        d="m157 158 17 3 5 9-9 5-18-6Zm-143 144 12-7 11 4 2 8-12 4-15-4Zm153-43 10-5 6 9-6 7-12-3Z"
        fill={night ? '#B3A18A' : '#E0CEAD'}
      />
      <path
        d="M223 147q-2 49 0 78m0 28q-1 26 1 57"
        stroke={line}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M-18 83 130 36q4-1 7 2l97 88q-89 5-168 1l-84 1Z" fill={roof} />
      <path d="m134 36 99 90h-29L120 43Z" fill={night ? '#765C56' : '#9D604A'} />
      <g clipPath={`url(#${id}-house-roof)`} strokeLinecap="round" strokeLinejoin="round">
        <path
          d="m-9 104 156-47m-163 66 177-45m-76 46 92-25"
          stroke={night ? '#765C56' : '#9D604A'}
          strokeWidth="2.5"
        />
        <path
          d="m10 81 3 14q9 5 18-4l-3-17m25-7 4 17q8 4 16-4l-5-18m25-8 7 20q8 4 15-4l-8-19M2 108l2 17m29-27 5 22q9 4 18-5l-5-20m32-9 6 25q8 4 16-4l-8-25m31-9 10 28m-1 13 6 20m-31-15 3 10"
          stroke={night ? '#B08772' : '#D7AA8D'}
          strokeWidth="2"
        />
      </g>
      <path d="M0 128q108-3 226 0v12H0Z" fill={wood} />
      <path
        d="M3 127q113 3 224-1M-4 79 131 36l96 86"
        stroke={line}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M43 198v-15c1-26 18-46 44-45 29 0 42 21 43 46v14Z" fill={sand} />
      <path
        d="M45 174c6-22 22-34 42-33 21-1 35 12 40 33"
        stroke={line}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity=".7"
      />
      <path d="M52 179h70v103H52Z" fill={night ? '#DAC095' : '#372822'} />
      <path d="m30 181 33 1-1 103-31-1Zm84 0 34 2-1 101-33 1Z" fill={blue} />
      <path
        d="M37 194h18m-18 17h18m-18 17h18m-18 17h18m-18 17h18m66-68h19m-19 17h19m-19 17h19m-19 17h19m-19 17h19"
        stroke={night ? '#647981' : '#88A1AB'}
        strokeWidth="2.5"
      />
      <path
        d="m30 181 33 1-1 103m85-101-1 100-31 1"
        stroke={line}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path d="m37 186 3 88m101-86-2 86" stroke={cream} strokeWidth="1" opacity=".25" />
      <g fill={wood}>
        <circle cx="37" cy="188" r="1.6" />
        <circle cx="139" cy="188" r="1.6" />
        <circle cx="139" cy="276" r="1.6" />
      </g>
      <path d="M25 282q61 3 130 0l-1 11q-63 3-129 0Z" fill={cream} />
      <path d="M25 294q60 2 130-1" stroke={line} strokeWidth="2.3" strokeLinecap="round" />
      <path d="M0 321h226v56H0Z" fill={night ? '#8D8E80' : '#ACA997'} />
      <g stroke={night ? '#BBB7A6' : '#E1D7C3'} strokeWidth="3" strokeLinejoin="round" fill={stone}>
        <path d="M0 340c8-9 24-15 36-14l29 12q9 5 4 16l-3 15q-32 8-55 0Zm87-12q21-3 40 4l10 24q2 6-6 10l-31 9q-11-1-19-13l-5-14q-1-11 11-20Zm60 10q22-12 38-13 22 2 38 15 5 13-8 30-25 3-50-1-20-9-18-31Z" />
      </g>
      <path
        d="m22 338 11-3m66 7 7 3m74-7 11 2m-6 17 5-2"
        stroke={line}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity=".5"
      />

      {/* The lower hearth: red tiles, rounded stones, cooking pot and dry wood. */}
      <path d="M609 195h191v185H609Z" fill={stone} />
      <path d="M613 193h187v112H613Z" fill={night ? '#66675B' : '#9A9B84'} />
      <path
        d="M629 234h126m-106 2v-16m58 15v-14m42 14v-17"
        stroke={wood}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="m580 196 85-79q3-3 8-1l127 20v69q-97-5-220-9Z" fill={roof} />
      <g clipPath={`url(#${id}-hearth-roof)`} strokeLinecap="round" strokeLinejoin="round">
        <path
          d="m613 165 190 24m-166-45 166 23m-134-45 133 22"
          stroke={night ? '#765C56' : '#9D604A'}
          strokeWidth="2.4"
        />
        <path
          d="m663 123-50 65m92-60-35 60m76-54-24 54m60-48-13 48"
          stroke={night ? '#B08772' : '#D7AA8D'}
          strokeWidth="2.5"
        />
        <path
          d="m646 146 14 3 11-20m-34 23-14 20q4 6 14 2l11-20m-30 22-12 16q4 8 13 3l10-17m58-22 17 3 10-23m-36 25-13 22q5 6 16 1l9-22m42 0 14 3 7-25m-28 28-7 22q5 5 14 2l6-23m47 3-4 20q6 5 14 2l3-20"
          stroke={night ? '#765C56' : '#9D604A'}
          strokeWidth="1.7"
        />
      </g>
      <path d="M580 196q123 4 220 1v12q-112-1-220-3Z" fill={wood} />
      <path
        d="m581 194 85-78m-72 83q102 6 206 3"
        stroke={line}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="m602 208 12 1-1 137-11 1Zm171 0h12l-1 138h-11Z" fill={wood} />
      <path
        d="M606 219q-2 27 0 53m172-39 1 61"
        stroke={cream}
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity=".24"
      />
      <path d="M627 301q66 2 141 0v77H627Z" fill={night ? '#ADA593' : '#DCD0B9'} />
      <path d="M627 306h141v69H627Z" fill={`url(#${id}-plaster)`} opacity=".3" />
      <path
        d="M633 320q7-3 17-2l4 12-9 10-15-5Zm27-12 19 1 3 9-15 7-9-4Zm27 1 19-2 11 11-4 13-10 2-14-12Z"
        fill={stone}
        stroke={line}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M650 378v-33a27 27 0 0 1 54 0v33Z" fill={ink} />
      <path
        d="M648 361v-18c1-18 12-28 29-29 17-1 29 12 30 29v24"
        stroke={line}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M663 365c-7-15 9-19 7-33 17 14 11 15 18 23 6 10 0 17-11 17-7 0-12-2-14-7Z"
        fill="#B94732"
      />
      <path d="M673 368c-5-7 4-13 5-19 1 7 9 9 6 15-2 5-5 6-11 4Z" fill="#D3A548" />
      <path d="M621 294q73 3 150 0v12H621Z" fill={wood} />
      <path d="M648 272h73c-2 17-13 23-36 23-22 0-32-6-37-23Z" fill={ink} />
      <path
        d="M648 276c-15-8-12 10 6 9m65-9c15-8 12 10-6 9"
        stroke={ink}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M644 269q38-2 81 0v7h-81Z" fill={blue} />
      <path d="M656 266q29-20 59 0Z" fill={blue} />
      <path
        d="M661 264q23-12 45-1m-49 16 4 6"
        stroke={cream}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity=".58"
      />
      <path d="M680 252h12v7h-12Z" fill={ink} />
      <path
        d="M669 240c-9-9 9-12 1-23m24 24c-9-9 9-12 1-23"
        stroke={cream}
        strokeWidth="4"
        strokeLinecap="round"
        opacity=".8"
      />
      <path d="M727 323h31v47h-31Z" fill={night ? '#686451' : '#938A70'} />
      <path
        d="m734 354 17-11m-18-2 17-11m-15 33 17-11"
        stroke={night ? '#BAAB92' : '#D5C3A1'}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="m738 350 9-5m-10-8 9-5m-8 27 9-5"
        stroke={wood}
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* The clear earthen yard is the creature's stage. */}
      <path d="M0 375c151-13 201-36 320-40 207-8 287 50 480 37v208H0Z" fill={sand} />
      <path
        d="M0 375c83 0 138-19 221-28l-54 58-167 18Zm800-3c-57 5-95 1-142-9l39 45 103 14Z"
        fill={night ? '#949788' : '#CDBF9F'}
      />
      <path
        d="M228 580c32-65 111-143 139-188 16-27 10-43-10-57 78-1 103 18 100 45-5 54 85 105 123 200Z"
        fill={night ? '#BDB9AA' : '#F0E6D0'}
      />
      <path
        d="m11 477 32-3m-7 13 49-6m606 5 30 5m-8-22 26 5"
        stroke={night ? '#8D9384' : '#BCAF94'}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <g fill={night ? '#8D9384' : '#BCAF94'}>
        <ellipse cx="174" cy="474" rx="6" ry="3" />
        <ellipse cx="191" cy="487" rx="3" ry="2" />
        <ellipse cx="618" cy="479" rx="5" ry="3" />
        <ellipse cx="644" cy="517" rx="3" ry="2" />
      </g>
      <g fill={stone} stroke={line} strokeWidth="1.5" strokeLinejoin="round" opacity=".65">
        <path d="m143 429 7-5 9 2 4 6-16 1Zm481 22 6-6 10 3 2 5-17 1ZM21 534l12-4 8 6-2 4-16-1Zm738-20 11-4 8 5-3 4-15-1Z" />
      </g>

      {/* Low shelves and return bowls belong at the sides of the open path. */}
      <path d="M0 354q80-2 157 0v12H0Zm17 12h10l-1 63H17Zm97 0h10l2 63h-10Z" fill={wood} />
      <path
        d="M4 359q43-2 88 0m29 10 1 43"
        stroke={cream}
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity=".4"
      />
      <path
        d="M40 337q28-3 64 0c-5 17-12 19-32 19s-26-5-32-19Z"
        fill={cream}
        stroke={line}
        strokeWidth="2.3"
      />
      <path d="M48 330h50c-2 9-9 12-25 12s-22-2-25-12Z" fill={blue} />
      <path d="M55 329h36" stroke={cream} strokeWidth="4" strokeLinecap="round" />
      <g transform="translate(98 424)">
        <ellipse cy="15" rx="42" ry="9" fill={night ? '#929788' : '#BCAF94'} />
        <path
          d="M-20-60q19-2 40 0v12c0 8 19 17 19 38 0 24-77 24-77 0 0-21 18-30 18-38Z"
          fill={roof}
          stroke={line}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M-23-65q22-3 46 0v9q-22 2-46 0Z" fill={blue} stroke={line} strokeWidth="2" />
        <path d="M-34-15q36 3 68 0v9q-32 4-68 0Z" fill={cream} />
        <path
          d="M-28-10q7-6 14 0t14 0 14 0 14 0"
          stroke={roof}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M0-25v-20m0 11c-7 0-10-5-8-9 7 0 9 4 8 9Zm0 6c7-1 11-5 9-9-7 0-9 4-9 9Z"
          stroke={cream}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M-25-28q-7 9-6 14m7 17q15 6 33 3"
          stroke={night ? '#B08C79' : '#D7AA8D'}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(738 427)">
        <ellipse cy="19" rx="53" ry="10" fill={night ? '#929788' : '#BCAF94'} />
        <path
          d="M-43-8h85c-7 28-18 34-42 34S-36 20-43-8Z"
          fill={blue}
          stroke={line}
          strokeWidth="2.4"
        />
        <ellipse cy="-8" rx="43" ry="12" fill={cream} stroke={line} strokeWidth="2" />
        <ellipse cy="-8" rx="32" ry="6" fill={night ? '#718A95' : '#7F9BA9'} />
        <path
          d="M-29 9q7-7 14 0T0 9t15 0 14 0m-46 10q18 4 34 0"
          stroke={cream}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>

      <g fill={olive}>
        <path d="M0 342v-91c10-4 25 4 27 17 21-3 29 12 20 28 21-2 32 13 26 27 12 1 19 10 14 18Z" />
        <path d="M800 373v-78c-12-10-29-2-29 11-18-1-25 13-18 25-23-3-38 19-28 37Z" />
      </g>
      <g fill={night ? '#6A775D' : '#929D77'}>
        <path d="M14 292c-19-2-29-15-24-28 18-1 29 12 24 28Zm4 13c-2-19 10-34 24-31 1 18-10 30-24 31Zm13 20c4-19 20-27 32-20-5 18-20 23-32 20ZM789 336c-19 0-28-12-24-24 17 0 28 11 24 24Zm-10 22c-16 4-29-2-29-13 13-6 25-2 29 13Z" />
      </g>
      <path
        d="M19 337c1-21-5-43-16-58m15 31 15-22m-13 41 31-17m735 50c1-16-5-29-14-40m13 31-25-4"
        stroke={night ? '#A1A98E' : '#C0C3A5'}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        d="M25 268c18-3 28 9 23 25m27 32c9 1 15 8 12 15M753 332c-13-5-24 1-29 12"
        stroke={line}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity=".65"
      />
      <g transform="translate(0 463)">
        <path
          d="M5 40c1-31 4-50 14-69M9 40c9-24 20-36 38-47M2 37c-7-21-9-38-7-51"
          stroke={olive}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M16-18c-5-13-2-22 5-24 4 9 2 18-5 24Zm23 17c2-12 10-18 18-14-2 9-9 15-18 14Z"
          fill={olive}
        />
        <path
          d="m10 7 8 7m-8-17 7 6m12 6 4 8"
          stroke={olive}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      {garden && (
        <g>
          <path
            d="M185 339c5-44-7-98 0-166m0 121-23-28m23-22 22-25m-22-7-13-23M789 272q-5-31 0-59"
            stroke={olive}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <g fill={olive}>
            <path d="M184 280c-32 5-51-12-46-32 26-7 46 6 46 32Zm2-39c-3-29 15-46 36-39 5 25-9 41-36 39Zm-3-32c-30 1-41-16-32-34 22-1 35 11 32 34Zm606 50c-26 0-36-14-30-29 21-1 32 10 30 29Z" />
          </g>
          <path
            d="m147 257 29 17m20-42 18-20m-53-29 17 20m590 33 15 16"
            stroke={night ? '#A1A98E' : '#C0C3A5'}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <g fill={roof} stroke={line} strokeWidth="1.6">
            <path d="M152 255c-1-7 8-11 12-8 8-4 14 5 10 12-6 12-22 8-22-4Zm48-47c0-6 6-10 11-7 10-1 12 13 4 17-9 5-16-2-15-10Zm-30-30c0-7 8-10 13-5 10 4 5 17-4 17-7 0-10-5-9-12Z" />
          </g>
          <path
            d="m159 247 4 3 5-5m38-45 3 4 5-3m-37-29 2 4 5-3"
            stroke={olive}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M165 317h42l-6 35q-15 7-30 0Z" fill={blue} stroke={line} strokeWidth="2" />
          <path d="M164 315q22-2 44 0v8q-22 2-44 0Z" fill={cream} stroke={line} strokeWidth="1.7" />
          <path d="M175 334q6-5 12 0t12 0" stroke={cream} strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {night && (
        <g>
          <path d="M606 226v-13m-10 15h21" stroke={ink} strokeWidth="4" strokeLinecap="round" />
          <path d="m595 229-4 31h32l-4-31Z" fill="#DAC095" />
          <path d="M590 258h35v6h-35Zm3-34h29v7h-29Z" fill={ink} />
          <path d="M602 234v17" stroke={cream} strokeWidth="5" strokeLinecap="round" />
          <path d="m594 272-32 54h87l-32-54Z" fill="#DAC095" opacity=".14" />
        </g>
      )}
    </svg>
  )
}
