import { SceneryFrame } from './SceneryFrame'
import type { SceneryPresentation } from './SceneryFrame'

/** A glass house at the edge of Kaya, with a clear tiled space for the companion. */
export function GreenhouseScenery({
  className = '',
  presentation = 'preview',
}: {
  className?: string
  presentation?: SceneryPresentation
}) {
  const frame = '#607B70'
  const frameLight = '#A9B9A0'
  const leaf = '#637E57'
  const leafLight = '#92A779'
  const ink = '#6F6550'
  const cream = '#F9F6ED'
  const pot = '#BD8061'

  return (
    <SceneryFrame
      className={`gathering-scene gathering-greenhouse ${className}`}
      presentation={presentation}
      palette={{
        kind: 'greenhouse',
        sky: '#DCE7D9',
        ground: '#E5D8BA',
        groundStart: 377,
        horizon: 243,
        stageGround: 377,
        light: '#F9F6ED',
        shade: '#C5B99F',
        leaf: '#637E57',
        distant: [
          { y: 158, color: '#C5D8CB' },
          { y: 330, color: '#C4BA99' },
        ],
      }}
    >
      {presentation === 'preview' && <path d="M0 0h800v580H0Z" fill="#DCE7D9" />}
      {/* The entire roof, rather than an edge ornament, identifies this scene when cropped. */}
      <path d="M0 158 400-22l400 180v183H0Z" fill="#C5D8CB" />
      <path d="m400-22-160 180H0Zm0 0 160 180h240Z" fill="#E6EAD9" />
      <path d="m244 154 156-176 154 176Z" fill="#F0F0DA" />
      <path
        d="M0 291q82-88 153-36 44-88 115-28 70-101 142-33 63-54 124-12 80-40 136 27 89-32 130 52v92H0Z"
        fill="#B6C5A1"
      />
      <path
        d="M0 313q111-70 194-24 70-37 151-7 82-42 177-11 72-38 143 0 87-15 135 22v79H0Z"
        fill="#99B291"
      />
      <g fill={cream} opacity=".58">
        <path d="m54 166 40-2 101 162h-43Zm272 0h26l62 163h-31Zm269 0h46L527 328h-35Z" />
        <path d="m149 83 18-7 53 46-17 11Zm296-61 23 11 56 72-22-9Z" />
      </g>

      {/* Mint-painted ribs form a broad, readable architectural silhouette. */}
      <g stroke={frame} strokeWidth="10" strokeLinejoin="round">
        <path d="M-8 157 400-22 808 157M0 157h800M400-22v358M244 157v178M556 157v178M83 157v188M717 157v188" />
        <path d="m400-22-156 179m156-179 156 179M0 243h800" strokeWidth="7" />
      </g>
      <g stroke={frameLight} strokeWidth="2.5">
        <path d="M9 151 398-17l395 168M6 163h788M250 167v165M562 167v165M406 1v330" />
      </g>
      <path d="M0 330h800v48H0Z" fill="#C4BA99" />
      <path
        d="M0 336h800M0 360h800M82 338v20m131-20v20m131-20v20m131-20v20m131-20v20m131-20v20M29 363v16m131-16v16m131-16v16m131-16v16m131-16v16m131-16v16"
        stroke="#A69F83"
        strokeWidth="2"
      />
      <path d="M0 377h800v203H0Z" fill="#E5D8BA" />
      <path d="m294 377-121 203h455L507 377Z" fill="#ECE2CB" />
      <g stroke="#C5B99F" strokeWidth="2">
        <path d="M0 416h800M0 476h800M0 557h800M294 377 173 580m334-203 121 203M400 377v203M201 377 0 566m598-189 202 189" />
        <path d="M349 416v59m103 1 14 81" />
      </g>
      <path d="m251 380 68 0-100 145-82 0Zm167 0h51l79 145h-69Z" fill={cream} opacity=".62" />

      {/* Hanging planters sit in the upper corners and leave the central roof open. */}
      <g stroke={ink} strokeWidth="2.5" strokeLinecap="round">
        <path d="M181 126v40m0 0-28 53m28-53 29 53M622 120v41m0 0-26 59m26-59 28 59" />
      </g>
      <path
        d="M150 212h63l-9 35q-21 13-45 0Zm443 0h60l-8 33q-21 13-45 0Z"
        fill={pot}
        stroke={ink}
        strokeWidth="2"
      />
      <path d="M149 212q33 7 65 0m378 0q31 7 62 0" stroke="#DAAB85" strokeWidth="6" />
      <g fill={leaf}>
        <path d="M180 214c-29 2-51-14-40-30 16-8 38 6 40 30Zm2-4c-10-30 4-49 19-40 13 13 0 31-19 40Zm3 4c25-28 48-18 41-1-9 12-30 12-41 1Z" />
        <path d="M620 214c-34-5-39-31-23-35 18 1 26 18 23 35Zm5-1c-1-35 20-52 32-37 6 21-14 37-32 37Z" />
      </g>
      <g stroke={leaf} strokeWidth="3" strokeLinecap="round">
        <path d="M159 210q-31 11-20 48t-8 34m71-82q29 27 13 67M603 211q-24 28-10 65m44-65q23 17 12 39" />
      </g>
      <g fill={leafLight}>
        <path d="M140 252c-21-4-25-19-14-23 11 0 18 9 14 23Zm-5 30c-2-20 10-30 20-22-1 13-9 21-20 22Zm83-23c-1-21 10-28 19-19-2 12-8 19-19 19ZM594 255c-20-6-24-20-12-25 13 4 16 14 12 25Zm57-12c-1-19 12-27 19-16-3 10-8 14-19 16Z" />
      </g>

      {/* Low potting benches and broad leaves frame the companion's uncluttered floor. */}
      <path d="M0 342h254v17H0Zm573 0h227v17H573Z" fill="#9E8565" stroke={ink} strokeWidth="2" />
      <path d="M0 342h254v6H0Zm573 0h227v6H573Z" fill="#C4A67F" />
      <path
        d="M37 359h13v75H37Zm174 0h13v47h-13Zm383 0h13v47h-13Zm156 0h13v75h-13Z"
        fill="#8A775F"
      />
      <path d="M40 391h177m384 0h151" stroke="#A78D6A" strokeWidth="6" />

      <g stroke={leaf} strokeWidth="4" strokeLinecap="round">
        <path d="M95 311v-54m0 36-22-22m22 10 24-37M200 313v-53m0 38 18-19M662 311v-67m0 41-23-28m23 13 17-29M747 313v-56" />
      </g>
      <g fill={leaf}>
        <path d="M94 269c-29-2-38-24-25-35 17 3 29 15 25 35Zm4 16c-2-28 15-46 31-38 0 23-13 36-31 38Zm-1-27c-14-23-4-44 11-39 11 15 7 29-11 39Z" />
        <path d="M659 268c-32-2-43-24-30-37 20 4 33 17 30 37Zm7 7c-3-29 13-46 29-40 3 22-9 36-29 40ZM745 278c-24 2-33-18-23-26 16 0 27 12 23 26Zm4 18c1-29 21-43 33-30-5 20-16 28-33 30Z" />
      </g>
      <g fill={leafLight}>
        <path d="M197 293c-27 1-37-20-25-29 17 2 26 12 25 29Zm4-21c-12-22-5-39 10-36 11 13 5 27-10 36Zm0 24c-1-24 16-36 28-25-3 15-15 22-28 25Z" />
        <path d="M659 252c-12-25-2-41 12-37 10 16 4 29-12 37ZM745 265c-10-18-6-34 8-33 9 12 5 25-8 33Z" />
      </g>
      <g fill={pot} stroke={ink} strokeWidth="2">
        <path d="M68 308h58l-8 32H76Zm106 4h51l-7 28h-36Zm457-5h61l-8 33h-45Z" />
      </g>
      <g stroke="#D5A183" strokeWidth="5">
        <path d="M67 308h60m46 4h53m404-5h64" />
      </g>
      <path d="M724 311h48l-6 30h-35Z" fill="#C9BE91" stroke={ink} strokeWidth="2" />
      <path d="M725 315h46" stroke={cream} strokeWidth="4" />

      <g>
        <path
          d="M59 505c11-30 14-71 7-123m3 69-43-34m44 11 43-58M729 501c-10-48-10-80 8-131m-16 77-34-35m40-1 43-34"
          stroke={leaf}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <g fill={leaf}>
          <path d="M63 420c-48-3-69-36-48-56 30 1 52 24 48 56Zm8 8c-2-43 22-78 50-66 7 33-14 56-50 66Zm-3-34c-33-22-36-54-13-63 28 18 31 39 13 63ZM729 429c-50-5-68-36-46-55 29 4 47 24 46 55Zm2-18c-2-44 21-75 49-61 5 31-14 56-49 61Z" />
        </g>
        <g fill={leafLight}>
          <path d="M65 471c-50-1-67-29-50-49 29 0 49 16 50 49Zm4-2c5-39 31-58 48-41-4 30-22 41-48 41ZM724 476c-38-1-53-25-38-43 24 0 42 20 38 43Zm5-6c3-35 30-54 47-38-2 23-23 37-47 38Z" />
        </g>
        <path
          d="m61 406-28-26m44 33 26-31m621 33-24-25m38 9 25-31M66 457l-33-21m47 17 23-15m619 27-23-16m40 12 25-17"
          stroke="#B4C4A0"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M30 489h72l-10 64q-27 10-51 0Zm661 0h74l-10 64q-26 10-54 0Z"
          fill={pot}
          stroke={ink}
          strokeWidth="2.5"
        />
        <path
          d="M27 487q37-4 78 0v12q-39 5-78 0Zm661 0q39-4 80 0v12q-41 5-80 0Z"
          fill="#D9A581"
          stroke={ink}
          strokeWidth="2"
        />
        <path d="M52 511v26m660-26v26" stroke="#E8B894" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* A small watering can gives the garden a lived-in purpose. */}
      <g transform="translate(175 410)">
        <path d="M8 8C4-18 42-17 40 7" stroke={frame} strokeWidth="7" />
        <path
          d="M2 5h44l5 34q-22 12-50 0Zm43 10 23-17 7 7-28 28Z"
          fill="#7C9D97"
          stroke={frame}
          strokeWidth="2"
        />
        <path d="m68-3 10 9" stroke={frame} strokeWidth="5" strokeLinecap="round" />
        <path d="M9 14v20m6-26h23" stroke="#B4C9BD" strokeWidth="3" strokeLinecap="round" />
      </g>
    </SceneryFrame>
  )
}
