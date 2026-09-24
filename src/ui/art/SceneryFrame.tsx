import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export type SceneryPresentation = 'preview' | 'field'

type FieldPalette = {
  kind: 'yard' | 'grove' | 'seaside' | 'brook' | 'greenhouse'
  sky: string
  ground: string
  groundStart: number
  horizon: number
  stageGround?: number
  light: string
  shade: string
  leaf: string
  distant?: { y: number; color: string }[]
}

/** Keep the landmarks in frame; extend the world instead of enlarging a phone crop. */
export function SceneryFrame({
  className,
  presentation = 'preview',
  palette,
  children,
}: {
  className: string
  presentation?: SceneryPresentation
  palette: FieldPalette
  children: ReactNode
}) {
  const frame = useRef<SVGSVGElement>(null)
  const [aspect, setAspect] = useState(800 / 580)
  const field = presentation === 'field'

  useLayoutEffect(() => {
    if (!field || !frame.current) return
    const element = frame.current
    const measure = () => {
      const { width, height } = element.getBoundingClientRect()
      if (width > 0 && height > 0) setAspect(width / height)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [field])

  const width = 800
  const height = width / aspect
  const left = 0
  const top = Math.max(palette.horizon - height * 0.3, (palette.stageGround ?? 335) - height * 0.62)
  const bottom = top + height

  return (
    <svg
      ref={frame}
      className={className}
      data-presentation={presentation}
      viewBox={field ? `${left} ${top} ${width} ${height}` : '0 0 800 580'}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      {field && (
        <g>
          <path d="M-1200-2400h3200v5400h-3200Z" fill={palette.sky} />
          {palette.kind === 'grove' && (
            <g>
              <path
                d="M-1200-2400H40C200-1200 184-350 316-110q39 62 55 120H-1200Zm3200 0H760C600-1200 616-350 484-110q-39 62-55 120h1571Z"
                fill="#637653"
              />
              <path
                d="M-1200-2400H-30C130-1200 138-340 266-98q36 61 54 108H-1200Zm3200 0H830C670-1200 662-340 534-98q-30 61-44 108h1510Z"
                fill="#7D8C62"
              />
            </g>
          )}
          {palette.distant?.map(({ y, color }) => (
            <path key={y} d={`M-1200 ${y}h3200v2600h-3200Z`} fill={color} />
          ))}
          <path d={`M-1200 ${palette.groundStart}h3200v2600h-3200Z`} fill={palette.ground} />
          <FieldGround palette={palette} bottom={bottom} />
        </g>
      )}
      {children}
      {field && <FieldForeground palette={palette} left={left} bottom={bottom} />}
    </svg>
  )
}

function FieldGround({ palette, bottom }: { palette: FieldPalette; bottom: number }) {
  const end = Math.max(610, bottom + 80)
  if (palette.kind === 'yard') {
    return (
      <path
        d={`M228 579C181 680 72 ${end - 210} -70 ${end}H925C760 ${end - 260} 624 679 580 579Z`}
        fill={palette.light}
      />
    )
  }
  if (palette.kind === 'brook') {
    return (
      <g>
        <path d={`M606 579C633 667 555 ${end - 260} 654 ${end}H1200V579Z`} fill="#718F89" />
        <path d={`M637 579C670 690 601 ${end - 235} 698 ${end}H1200V579Z`} fill="#9CBDB1" />
        <path d={`M674 589C711 712 653 ${end - 235} 738 ${end}`} stroke="#D5DDC6" strokeWidth="5" />
      </g>
    )
  }
  if (palette.kind === 'greenhouse') {
    const rows = []
    for (let y = 659, step = 116; y < end; y += step, step += 24) rows.push(y)
    const floorX = (x: number, y: number) => 400 + ((x - 400) * (y - 200)) / 377
    return (
      <g>
        <path d={`M173 579 0 ${end}H800L628 579Z`} fill="#ECE2CB" />
        <g stroke="#C5B99F" strokeWidth="2.5">
          {[0, 173, 400, 628, 800].map((x) => (
            <path key={x} d={`M${x} 579 ${floorX(x, end)} ${end}`} />
          ))}
          {rows.map((y) => (
            <path key={y} d={`M-1200 ${y}H2000`} />
          ))}
        </g>
        <path d={`M-75 579h74l410 ${end - 579}h-150Z`} fill={palette.light} opacity=".28" />
      </g>
    )
  }
  return null
}

/** Near-edge marks give the enlarged ground a scale without filling the play area. */
function FieldForeground({
  palette,
  left,
  bottom,
}: {
  palette: FieldPalette
  left: number
  bottom: number
}) {
  const right = 800 - left
  const nearY = Math.max(635, bottom - 85)
  const middleY = 580 + Math.max(0, bottom - 580) * 0.42
  return (
    <g>
      {bottom > 700 && (
        <g fill={palette.shade} opacity=".45">
          <path d={`m${left + 94} ${middleY} 36-9 32 8-11 7-49 1Z`} />
          <path d={`m${right - 125} ${middleY + 92} 24-5 33 7-20 5-32-1Z`} />
          <path d={`m${left + 142} ${nearY - 74} 15-4 14 5-13 4Z`} />
        </g>
      )}
      {palette.kind === 'seaside' ? (
        <g>
          <path
            d={`M${left - 40} ${nearY + 68}q112-34 214-16m${right - 165} ${nearY - 32}q88-22 196 0`}
            stroke={palette.shade}
            strokeWidth="4"
            strokeLinecap="round"
            opacity=".5"
          />
          <g transform={`translate(${left + 55} ${nearY + 8}) rotate(-12)`}>
            <path d="M-50 9q56-20 116-12l8 14q-61 9-121 15Z" fill="#AF9067" />
            <path d="m-29 12 62-7m-14 10 32-5" stroke="#DFCAA2" strokeWidth="3" />
            <path d="m25 5 10-18 14-2-8 18" fill="#AF9067" />
          </g>
          <g transform={`translate(${right - 86} ${nearY + 31})`}>
            <path d="M-22 4c-8-24 5-43 23-43 21 0 34 21 24 43L2 16Z" fill={palette.light} />
            <path d="M0 9-9-27m11 35 4-34m-1 37 13-26" stroke={palette.shade} strokeWidth="2.5" />
          </g>
        </g>
      ) : palette.kind === 'greenhouse' ? (
        <g fill={palette.shade} opacity=".2">
          <path d={`M${left} 600 400 ${nearY + 20}l-90 25L${left} 680Z`} />
          <path d={`M${right} 590 580 ${nearY + 40}l70 25L${right} 670Z`} />
        </g>
      ) : (
        <g>
          <GroundLeaves x={left + 13} y={nearY} color={palette.leaf} light={palette.light} />
          <GroundLeaves
            x={right - 7}
            y={nearY + 43}
            color={palette.leaf}
            light={palette.light}
            mirrored
          />
          {palette.kind === 'grove' && (
            <path
              d={`M${left + 172} ${middleY + 91}q86-39 170-17-57 33-150 34Zm${right - 300} ${nearY - 70}q94-32 161 1-74 21-161-1Z`}
              fill={palette.light}
              opacity=".65"
            />
          )}
        </g>
      )}
    </g>
  )
}

function GroundLeaves({
  x,
  y,
  color,
  light,
  mirrored = false,
}: {
  x: number
  y: number
  color: string
  light: string
  mirrored?: boolean
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${mirrored ? -1 : 1} 1)`}>
      <g fill={color}>
        <path d="M-24 84C9 43 9 2-2-47c28 14 36 43 25 75 24-36 58-55 88-48-7 30-34 55-68 64 35-14 64-5 76 14-33 21-73 27-112 24Z" />
        <path d="M10 18C-23 0-38-34-24-60 4-48 17-21 10 18Z" />
      </g>
      <path
        d="M-7 76Q29 35 79 5M4 60Q17 8 3-28m19 68 50 17"
        stroke={light}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity=".32"
      />
    </g>
  )
}
