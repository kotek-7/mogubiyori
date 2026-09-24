import { useId } from 'react'
import type { Recipe } from './domain'

export function Flame({ className = '', happy = true }: { className?: string; happy?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 120 140" fill="none" aria-hidden="true">
      <ellipse cx="61" cy="131" rx="31" ry="6" fill="#512b1812" />
      <path d="M43 120l-4 11M78 121l6 10" stroke="#70482F" strokeWidth="5" strokeLinecap="round" />
      <path
        d="M61 7C68 32 97 37 100 69C106 100 84 123 59 123C27 123 13 103 16 77C18 58 35 43 36 30C43 35 46 43 45 51C57 37 60 22 61 7Z"
        fill="#EB7B3D"
      />
      <path
        d="M61 45C63 66 83 67 84 88C86 109 74 121 59 121C39 121 28 107 34 90C38 79 49 74 48 65C55 67 56 73 56 76C62 67 61 55 61 45Z"
        fill="#FFD47A"
      />
      <ellipse cx="42" cy="86" rx="3.2" ry="4.4" fill="#493A28" />
      <ellipse cx="77" cy="86" rx="3.2" ry="4.4" fill="#493A28" />
      <ellipse cx="33" cy="95" rx="6" ry="3" fill="#EC9869" />
      <ellipse cx="85" cy="95" rx="6" ry="3" fill="#EC9869" />
      {happy ? (
        <path d="M52 95Q59 103 66 95" stroke="#70482F" strokeWidth="3" strokeLinecap="round" />
      ) : (
        <path d="M55 98h10" stroke="#70482F" strokeWidth="3" strokeLinecap="round" />
      )}
      <path
        d="M17 87Q5 90 8 78M100 85Q114 79 111 70"
        stroke="#EB7B3D"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function FoodArt({ recipe, className = '' }: { recipe: Recipe; className?: string }) {
  const id = useId().replace(/:/g, '')
  const isRice = recipe.art === 'rice'
  const isPasta = recipe.art === 'pasta' || recipe.art === 'noodle'
  return (
    <svg
      className={`food-art ${className}`}
      viewBox="0 0 440 310"
      role="img"
      aria-label={`${recipe.name}のイラスト`}
    >
      <defs>
        <radialGradient id={`plate${id}`}>
          <stop offset="0" stopColor="#FFFDF2" />
          <stop offset=".75" stopColor="#FCFBF3" />
          <stop offset="1" stopColor="#E9E6D9" />
        </radialGradient>
        <linearGradient id={`rice${id}`} x2="0.8" y2="1">
          <stop stopColor="#F0D37D" />
          <stop offset="1" stopColor="#D8B65F" />
        </linearGradient>
        <linearGradient id={`soup${id}`} x2="0.7" y2="1">
          <stop stopColor="#D8B667" />
          <stop offset="1" stopColor="#B58247" />
        </linearGradient>
        <filter id={`shadow${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="9" stdDeviation="7" floodColor="#534524" floodOpacity=".14" />
        </filter>
      </defs>
      <g transform="rotate(-13 220 150)">
        <rect x="53" y="40" width="319" height="237" rx="11" fill="#fff" opacity=".32" />
        {[75, 94, 113, 132, 151, 170, 189, 208, 227, 246].map((y) => (
          <path key={y} d={`M53 ${y}H372`} stroke="#fff" strokeWidth="1" opacity=".35" />
        ))}
      </g>
      <g transform="rotate(16 369 154)" strokeLinecap="round">
        <path d="M370 57v178" stroke="#966341" strokeWidth="5" />
        <path d="M382 57l-4 178" stroke="#B98453" strokeWidth="5" />
      </g>
      <g filter={`url(#shadow${id})`}>
        <ellipse cx="213" cy="164" rx="136" ry="111" fill="#D5D2BD" />
        <ellipse cx="213" cy="153" rx="138" ry="111" fill={`url(#plate${id})`} />
        <ellipse cx="213" cy="153" rx="116" ry="92" fill="none" stroke="#DADAC7" strokeWidth="2" />
        {isRice ? (
          <g>
            <ellipse cx="211" cy="154" rx="92" ry="68" fill={`url(#rice${id})`} />
            {Array.from({ length: 95 }, (_, i) => {
              const angle = i * 2.39996,
                radius = Math.sqrt((i + 0.5) / 95)
              const x = 211 + Math.cos(angle) * radius * 85,
                y = 152 + Math.sin(angle) * radius * 62
              return (
                <ellipse
                  key={i}
                  cx={x}
                  cy={y}
                  rx="7"
                  ry="3.4"
                  fill={['#FFF1B8', '#E7C776', '#F9E6A0', '#CFAD63'][i % 4]}
                  transform={`rotate(${i * 47} ${x} ${y})`}
                />
              )
            })}
            {Array.from({ length: 17 }, (_, i) => {
              const x = 215 + Math.cos(i * 2.4) * (20 + i * 3.5),
                y = 150 + Math.sin(i * 2.4) * (12 + i * 2.4)
              return (
                <g key={i} transform={`translate(${x} ${y}) rotate(${i * 30})`}>
                  <path d="M-7-4l13-2 2 9-12 2z" fill={i % 3 === 0 ? '#CF7748' : '#77945A'} />
                  <path d="M-4-2l7-1" stroke="#ffffff60" strokeWidth="2" />
                </g>
              )
            })}
            <path
              d="M179 135Q195 113 228 130Q249 141 230 158Q204 171 183 155Q173 145 179 135"
              fill="#FFF4C9"
            />
            <ellipse cx="210" cy="143" rx="17" ry="12" fill="#EAB440" />
            <path d="M199 140q6-7 13-5" stroke="#F5D76C" strokeWidth="4" strokeLinecap="round" />
          </g>
        ) : isPasta ? (
          <g>
            <ellipse
              cx="211"
              cy="153"
              rx="99"
              ry="72"
              fill={recipe.art === 'pasta' ? '#C6693E' : '#DDC694'}
            />
            {Array.from({ length: 13 }, (_, i) => (
              <path
                key={i}
                d={`M${140 + i * 3} ${108 + i * 6}C${290 - i * 5} ${60 + i * 10} ${310 - i * 4} ${234 - i * 5} ${170 + i * 3} ${205 - i * 4}S${100 + i * 5} ${130 + i * 2} ${262 - i * 4} ${112 + i * 7}`}
                stroke={i % 2 ? '#F4D390' : '#EABB72'}
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
              />
            ))}
            {[0, 1, 2, 3, 4].map((i) => (
              <ellipse
                key={i}
                cx={170 + i * 24}
                cy={136 + Math.sin(i * 3) * 37}
                rx="13"
                ry="8"
                fill={recipe.art === 'pasta' ? '#D9603A' : '#F6E1A1'}
                transform={`rotate(${i * 45} 210 150)`}
              />
            ))}
          </g>
        ) : (
          <g>
            <ellipse
              cx="213"
              cy="154"
              rx="105"
              ry="81"
              fill={recipe.art === 'soup' ? `url(#soup${id})` : '#F1D78D'}
            />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <g
                key={i}
                transform={`translate(${157 + (i % 3) * 42} ${117 + Math.floor(i / 3) * 50}) rotate(${i * 19 - 20})`}
              >
                <path d="M0 0l32-4 5 28-32 6z" fill="#E4D9B9" />
                <path d="M0 0l32-4 3 21-32 6z" fill="#FAF0D6" />
              </g>
            ))}
            {recipe.art === 'soup' &&
              [0, 1, 2].map((i) => (
                <g
                  key={i}
                  transform={`translate(${157 + i * 51} ${181 - i * 30}) rotate(${i * 37})`}
                >
                  <path d="M0 0v23" stroke="#DDC8A2" strokeWidth="9" />
                  <path d="M-18 0Q0-26 18 0Z" fill="#8D6C48" />
                </g>
              ))}
            {recipe.id === 'cabbage-pork' &&
              [0, 1, 2, 3, 4, 5, 6].map((i) => (
                <g
                  key={i}
                  transform={`translate(${145 + (i % 3) * 47} ${118 + Math.floor(i / 3) * 35}) rotate(${i * 39})`}
                >
                  <path
                    d="M-10-4Q15-30 39 0Q44 26 12 28Q-12 14-10-4"
                    fill={i % 2 ? '#A5B776' : '#C1CA8F'}
                  />
                  <path
                    d="M-2 6Q18-2 37 12"
                    stroke="#DBCCAD"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0 7Q18 0 35 12"
                    stroke="#B89B7F"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
              ))}
          </g>
        )}
        {Array.from({ length: 11 }, (_, i) => (
          <g
            key={i}
            transform={`translate(${178 + Math.sin(i * 9) * 43 + i * 5} ${115 + Math.cos(i * 5) * 30 + i * 4}) rotate(${i * 52})`}
          >
            <ellipse rx="4" ry="7" fill="#537B43" />
            <path d="M0-4V4" stroke="#A7B975" strokeWidth="1" />
          </g>
        ))}
      </g>
      <g transform="translate(74 53) rotate(-25)">
        <path
          d="M0 12Q-23-14-7-20Q4-22 6 0Q10-28 24-20Q37-8 9 10Q32 0 34 13Q30 29 7 15"
          fill="#6F8B59"
        />
        <path d="M5 26V0" stroke="#476541" strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx="329" cy="249" r="3" fill="#A2926A" />
      <circle cx="337" cy="244" r="2" fill="#A2926A" />
    </svg>
  )
}
