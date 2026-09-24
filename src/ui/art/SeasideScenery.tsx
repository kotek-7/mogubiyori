type SeasideSceneryProps = { className?: string }

/** The quiet beach below Kaya, with the evening sun over the open water. */
export function SeasideScenery({ className = '' }: SeasideSceneryProps) {
  const cream = '#F9F1DB'
  const sand = '#E5D1AC'
  const line = '#846C55'
  const water = '#809E9E'

  return (
    <svg
      className={`gathering-scene gathering-seaside ${className}`}
      viewBox="0 0 800 580"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <path d="M0 0h800v580H0Z" fill="#E8D2BF" />
      <path d="M0 114c124-8 211 13 355 5 174-11 323-5 445 7v88H0Z" fill="#EBDABF" />
      <path
        d="M384 159c0-31 24-55 54-55 31 0 56 23 56 54 0 33-23 57-55 57-31 0-55-24-55-56Z"
        fill="#DAB06B"
      />
      <path
        d="M121 65c15-4 28-1 39-7 9-5 15-11 29-10 17 1 19 10 31 12 18-4 37 1 51 10-47 5-112 3-150 0Zm405 26c17-6 33-4 45-9 12-6 25-4 34 3 26-1 40 3 54 11-41 5-94 2-133-1Z"
        fill={cream}
      />
      <path
        d="M0 164q60-13 122-7m464-25q50-4 82 1"
        stroke="#D1B9A4"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="m272 120 8 4 8-4m251-6 7 3 7-3"
        stroke="#9E8C78"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* The uninterrupted horizon and broad reflections define the beach at small sizes. */}
      <path d="M0 186q194-2 389 0 193-3 411-1v218H0Z" fill={water} />
      <path d="M0 188q98-38 151-10 25-5 48 8Z" fill="#9DA797" />
      <path d="M660 186c32-6 44-22 69-27 24-5 47 14 71 15v13Z" fill="#9DA797" />
      <path d="M0 188q213 2 373-1m135 0q77-2 151 0" stroke="#B3BDB0" strokeWidth="3" />
      <path
        d="M412 188h54l-9 8h-35Zm-14 16 76-1 11 7h-95Zm8 21 66-1 19 8-96 1Zm-20 21 89 1 21 9-129 1Zm-4 24 94-2 28 10-130 5Zm-10 27 120-3 19 8-149 6Z"
        fill="#DAC7A1"
      />
      <path
        d="m43 216 73-2m43 21 59-1m44-24 64 1m235 10 66-1m53 22 74-2m-510 30 51-1m-229-12 66-2m413 24 88-2m-414 20 79-3m300 5 77-2"
        stroke="#B6C5BB"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M-12 303c98 6 172-11 255-8 104 4 182 15 265 11 107-6 203-28 307-16v82H-12Z"
        fill="#91ACAA"
      />
      <path
        d="M-14 322c104 5 178-11 254-8 100 5 160 16 252 10 111-8 191-26 324-16"
        stroke="#D0D6C7"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M0 393c94-2 156-37 241-42 99-5 165 9 253-4 104-16 199-32 306-20v253H0Z"
        fill="#C3BB9F"
      />
      <path
        d="M0 410c93 0 161-40 249-43 94-4 168 10 252-3 106-17 194-34 299-18v234H0Z"
        fill={sand}
      />
      <path
        d="M-6 390c107-1 163-39 256-41 97-2 160 8 244-5 108-17 198-33 314-16"
        stroke={cream}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M29 410c64-4 98-19 143-28m94-23q59 0 98 4m198-20q53-10 92-10"
        stroke="#F0E5CD"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M0 492c106-26 186-24 253-5 99 30 210 17 299 9 106-11 174-5 248 14v70H0Z"
        fill="#DDC6A0"
      />
      <path
        d="M74 530q63-17 123-9m379 14q73-20 139-3"
        stroke="#CDB58F"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Rounded shore rocks and driftwood stay beside the companion's open sandy patch. */}
      <ellipse cx="665" cy="397" rx="71" ry="15" fill="#BCB298" />
      <path
        d="M606 393c-3-19 9-39 27-43 18-5 31 11 36 24 19-6 38 2 48 18-31 13-76 16-111 1Z"
        fill="#A5A795"
      />
      <path d="M610 382c2-14 11-26 23-29 11-3 21 3 28 14-19-2-35 3-51 15Z" fill="#C8C8B2" />
      <path
        d="M666 378q16 0 29 10m-66 7q13 2 25 0"
        stroke="#818A7D"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M716 418c-5-14 7-25 20-24 15 0 25 12 30 23-12 7-36 10-50 1Z" fill="#B1AF9A" />
      <path d="M721 408q12-14 29-1" stroke="#D4CFB8" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="139" cy="458" rx="87" ry="13" fill="#CAB992" />
      <path
        d="m64 443 34-8 24-23 9 5-12 19 66-12 21-15 7 8-11 16 21 3-2 14-119 16-39-8Z"
        fill="#B19770"
        stroke={line}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m76 446 36 2 64-14m-74 24 67-11m-47-25 5-7m59 23 22-1"
        stroke="#DFCAA2"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="m78 451 38 1m27-11 22-3" stroke="#957C5D" strokeWidth="2" strokeLinecap="round" />
      <path d="M205 457q8-15 21-2l-4 9-15 2Z" fill="#D4BB91" />

      <g strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M39 512q4-35-13-65m13 65q15-38 38-48m-38 48q-4-42 13-71"
          stroke="#87916B"
          strokeWidth="5"
        />
        <path
          d="M32 486q-16-7-27-4m43 3q21-1 31-12M48 465q12-5 17-16"
          stroke="#9AA17A"
          strokeWidth="5"
        />
        <path
          d="M777 504q-4-37-29-64m29 64q-1-46 18-71m-18 71q-20-22-37-27"
          stroke="#8A936E"
          strokeWidth="5"
        />
        <path d="M758 466q-20-10-32-6m52 16q16-15 28-18" stroke="#A0A780" strokeWidth="5" />
      </g>
      <path
        d="M566 443c0-11 10-21 20-19 12 3 16 12 14 22l-16 8Z"
        fill={cream}
        stroke="#AF9471"
        strokeWidth="1.8"
      />
      <path
        d="m584 449-9-17m11 16 1-18m1 20 7-13"
        stroke="#CEB68D"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M242 507q7-8 15-1l-3 6-11 1Z" fill="#BDAD8C" />
      <path d="M602 525q9-12 21-2l-1 8-19 1Z" fill="#B7AD92" />
      <path
        d="m174 390 4-1m63 67 5-1m-116 43 5 1m536-34 5-1m-66 78 6 1"
        stroke="#BFA983"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
