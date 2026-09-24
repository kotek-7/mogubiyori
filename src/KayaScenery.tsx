type KayaSceneryProps = { className?: string; variant?: string }

/** The open yard of Kaya's lower hearth, looking out toward the eastern bay. */
export function KayaScenery({ className = '', variant = 'plain' }: KayaSceneryProps) {
  const night = variant === 'night'
  const garden = variant === 'garden'
  const ink = '#203c50'
  const cream = '#fff9eb'
  const sand = night ? '#b9b49e' : '#f3e6c9'
  const ochre = night ? '#b99961' : '#e3b55f'
  const roof = night ? '#ae5b50' : '#da6047'
  const blue = night ? '#203c50' : '#254e70'
  const olive = night ? '#465c50' : '#60754b'

  return (
    <svg
      className={`gathering-scene gathering-${variant} ${className}`}
      viewBox="0 0 800 580"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      {/* Broad flat planes keep the companion separate from the distant village. */}
      <path d="M0 0h800v580H0z" fill={night ? '#203c50' : '#cbe3df'} />
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
          <circle cx="414" cy="69" r="39" fill="#f5c547" />
          <path
            d="M242 80h29a16 16 0 0 1 32 0h25a9 9 0 0 1 0 18h-86a9 9 0 0 1 0-18Zm264 39h24a13 13 0 0 1 26 0h32a7 7 0 0 1 0 14h-82a7 7 0 0 1 0-14Z"
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

      <path d="M166 190h484v160H166z" fill={night ? '#477b88' : '#76bec6'} />
      <path d="m521 190 69-39 59 15 36 24Z" fill={night ? '#425a63' : '#729796'} />
      <path d="m539 190 37-19 38 19Z" fill={night ? '#526d72' : '#90b1a5'} />
      <path
        d="M196 221h97m70 34h70m94-33h68m-291 17h41m123-36h46"
        stroke={night ? '#6a97a0' : '#b4d9d5'}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <g transform="translate(453 216)">
        <path d="m-29 0 9 10h37L29 0Z" fill={blue} />
        <path d="M-1-59V-5h-26Z" fill={cream} />
        <path d="m4-43 22 38H4Z" fill={night ? '#d1b890' : '#e3b55f'} />
        <path d="M0-62V0" stroke={blue} strokeWidth="3" strokeLinecap="round" />
      </g>
      <path
        d="M196 264c103 19 175 28 274 14 86-13 126-10 197 7l46 90H161Z"
        fill={night ? '#a9ac99' : '#e5d4ad'}
      />
      <path
        d="M244 280c70 14 134 19 202 11 74-9 127-11 193-1"
        stroke={night ? '#c4c0a5' : '#fff9eb'}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* An ochre house frames the village path on the left. */}
      <path d="M0 79h195l31 62v228H0Z" fill={ochre} />
      <path d="M183 123h43v246h-43Z" fill={night ? '#947957' : '#c99d54'} />
      <path d="M-18 82 133 36l100 90H-18Z" fill={roof} />
      <path d="m134 36 99 90h-29L120 43Z" fill={night ? '#894b49' : '#bf4c3e'} />
      <path d="M0 128h226v12H0Z" fill={blue} />
      <path d="M44 198v-17a43 43 0 0 1 86 0v17Z" fill={sand} />
      <path d="M52 179h70v103H52Z" fill={night ? '#f5c547' : '#203c50'} />
      <path d="M30 181h33v104H30Zm84 0h34v104h-34Z" fill={blue} />
      <path
        d="M37 194h18m-18 17h18m-18 17h18m-18 17h18m-18 17h18m66-68h19m-19 17h19m-19 17h19m-19 17h19m-19 17h19"
        stroke={night ? '#365465' : '#507486'}
        strokeWidth="4"
      />
      <path d="M25 282h130v12H25Z" fill={cream} />
      <path d="M0 321h226v56H0Z" fill={night ? '#898d80' : '#aaa98b'} />
      <g stroke={night ? '#b1ad94' : '#d0c6a6'} strokeWidth="4" strokeLinejoin="round">
        <path d="m0 340 36-14 35 15-4 28H11Zm84-14 43 6 10 30-38 13-23-20Zm62 13 39-14 41 15-11 34-52-5Z" />
      </g>

      {/* The lower hearth: red tiles, rounded stones, cooking pot and dry wood. */}
      <path d="M609 195h191v185H609Z" fill={night ? '#9e9a87' : '#d9ceb0'} />
      <path d="M613 193h187v112H613Z" fill={night ? '#5d6257' : '#8b9472'} />
      <path d="m580 196 88-81 132 21v69H580Z" fill={roof} />
      <path
        d="m663 123-50 65m92-60-35 60m76-54-24 54m60-48-13 48"
        stroke={night ? '#c27a60' : '#f18d65'}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M580 196h220v13H580Z" fill={blue} />
      <path d="M602 208h12v138h-12Zm171 0h12v138h-12Z" fill={blue} />
      <path d="M627 301h141v77H627Z" fill={night ? '#b4ac93' : '#e4d5af'} />
      <path d="M650 378v-33a27 27 0 0 1 54 0v33Z" fill={ink} />
      <path
        d="M663 365c-7-15 9-19 7-33 17 14 11 15 18 23 6 10 0 17-11 17-7 0-12-2-14-7Z"
        fill="#da6047"
      />
      <path d="M673 368c-5-7 4-13 5-19 1 7 9 9 6 15-2 5-5 6-11 4Z" fill="#f5c547" />
      <path d="M621 294h150v12H621Z" fill={blue} />
      <path d="M648 272h73l-7 22h-58Z" fill={ink} />
      <path d="M644 269h81v7h-81Z" fill={blue} />
      <path d="M656 266q29-20 59 0Z" fill={blue} />
      <path d="M680 252h12v7h-12Z" fill={ink} />
      <path
        d="M669 240c-9-9 9-12 1-23m24 24c-9-9 9-12 1-23"
        stroke={cream}
        strokeWidth="4"
        strokeLinecap="round"
        opacity=".8"
      />
      <path d="M727 323h31v47h-31Z" fill={night ? '#737360' : '#a29a78'} />
      <path
        d="m734 354 17-11m-18-2 17-11m-15 33 17-11"
        stroke={night ? '#c5b389' : '#edcc8d'}
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* The clear earthen yard is the creature's stage. */}
      <path d="M0 375c151-13 201-36 320-40 207-8 287 50 480 37v208H0Z" fill={sand} />
      <path
        d="M0 375c83 0 138-19 221-28l-54 58-167 18Zm800-3c-57 5-95 1-142-9l39 45 103 14Z"
        fill={night ? '#a7a892' : '#e2d0a7'}
      />
      <path
        d="M228 580c32-65 111-143 139-188 16-27 10-43-10-57 78-1 103 18 100 45-5 54 85 105 123 200Z"
        fill={night ? '#c6c2aa' : '#fbf0d4'}
      />
      <path
        d="m11 477 59-6m-34 16 71-8m579 6 53 9m-42-26 51 8"
        stroke={night ? '#939983' : '#cbbb96'}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <g fill={night ? '#939983' : '#cbbb96'}>
        <ellipse cx="174" cy="474" rx="6" ry="3" />
        <ellipse cx="191" cy="487" rx="3" ry="2" />
        <ellipse cx="618" cy="479" rx="5" ry="3" />
        <ellipse cx="644" cy="517" rx="3" ry="2" />
      </g>

      {/* Low shelves and return bowls belong at the sides of the open path. */}
      <path d="M0 354h157v12H0Zm17 12h10v63H17Zm114 0h10v63h-10Z" fill={blue} />
      <path d="M40 337h64c-5 17-12 19-32 19s-26-5-32-19Z" fill={cream} />
      <path d="M48 330h50c-2 9-9 12-25 12s-22-2-25-12Z" fill={blue} />
      <path d="M55 329h36" stroke={cream} strokeWidth="4" strokeLinecap="round" />
      <g transform="translate(98 424)">
        <ellipse cy="15" rx="42" ry="9" fill={night ? '#979c85' : '#cbbb96'} />
        <path d="M-20-60h40v12c0 8 19 17 19 38 0 24-77 24-77 0 0-21 18-30 18-38Z" fill={roof} />
        <path d="M-23-65h46v9h-46Z" fill={blue} />
        <path d="M-35-15h70v9h-70Z" fill={cream} />
        <path
          d="m-22-15 8 9 8-9 8 9 8-9 8 9 8-9"
          stroke={roof}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </g>
      <g transform="translate(738 427)">
        <ellipse cy="19" rx="53" ry="10" fill={night ? '#979c85' : '#cbbb96'} />
        <path d="M-43-8h85c-7 28-18 34-42 34S-36 20-43-8Z" fill={blue} />
        <ellipse cy="-8" rx="43" ry="12" fill={cream} />
        <ellipse cy="-8" rx="32" ry="6" fill={night ? '#658e95' : '#76bec6'} />
        <path d="M-25 10h50" stroke={cream} strokeWidth="4" strokeLinecap="round" />
      </g>

      <g fill={olive}>
        <path d="M0 340v-95c28 2 51 23 44 53 28-5 47 16 40 42Z" />
        <path d="M800 373v-81c-24-5-44 14-39 37-27-5-39 16-36 39Z" />
      </g>
      <path
        d="M16 321v-42m0 27 14-14m-14 25 33-7m731 43v-38m0 24-13-9"
        stroke={night ? '#788465' : '#9cac6b'}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {garden && (
        <g>
          <path
            d="M185 339V173m0 121-23-28m23-22 22-25m-22-7-13-23M789 272v-59"
            stroke={olive}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <g fill={olive}>
            <path d="M184 280c-32 5-51-12-46-32 26-7 46 6 46 32Zm2-39c-3-29 15-46 36-39 5 25-9 41-36 39Zm-3-32c-30 1-41-16-32-34 22-1 35 11 32 34Zm606 50c-26 0-36-14-30-29 21-1 32 10 30 29Z" />
          </g>
          <g fill="#da6047">
            <circle cx="162" cy="256" r="11" />
            <circle cx="208" cy="210" r="10" />
            <circle cx="177" cy="180" r="10" />
          </g>
          <path d="M165 317h42l-6 39h-30Z" fill={blue} />
          <path d="M164 315h44v9h-44Z" fill={cream} />
        </g>
      )}
      {night && (
        <g>
          <path d="M606 226v-13m-10 15h21" stroke={ink} strokeWidth="4" strokeLinecap="round" />
          <path d="m595 229-4 31h32l-4-31Z" fill="#f5c547" />
          <path d="M590 258h35v6h-35Zm3-34h29v7h-29Z" fill={ink} />
          <path d="M602 234v17" stroke={cream} strokeWidth="5" strokeLinecap="round" />
          <path d="m594 272-32 54h87l-32-54Z" fill="#f5c547" opacity=".14" />
        </g>
      )}
    </svg>
  )
}
