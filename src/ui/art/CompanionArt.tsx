import type { ReactNode } from 'react'
import type { GrowthStage, SpeciesId } from '../../app/game/browserGame'

export type CompanionMood = 'hungry' | 'happy' | 'sleepy' | 'eating'

const ink = '#354b4c'
const cream = '#fff4d6'
const colors: Record<SpeciesId, { body: string; shade: string; light: string; blush: string }> = {
  komugi: { body: '#f3c34d', shade: '#cc9230', light: cream, blush: '#e98768' },
  mame: { body: '#65a064', shade: '#3f7651', light: '#e8edbd', blush: '#e99579' },
  shizuku: { body: '#579cce', shade: '#3478ae', light: '#e8f6f1', blush: '#ed9c81' },
  yuzu: { body: '#ed993d', shade: '#cb6d2d', light: cream, blush: '#df7958' },
  momo: { body: '#ed9293', shade: '#cb6d7c', light: '#fff0df', blush: '#d76d77' },
  goma: { body: '#61747e', shade: '#425660', light: '#f1e5c7', blush: '#d99077' },
}

type Pose = { face: [number, number, number]; hat: [number, number, number]; shadow: number }

// Only facial features and hats are scaled. Each growth stage has its own anatomy below.
const poses: Record<SpeciesId, readonly Pose[]> = {
  komugi: [
    { face: [150, 201, 0.66], hat: [150, 157, 0.48], shadow: 51 },
    { face: [150, 169, 0.86], hat: [150, 123, 0.67], shadow: 65 },
    { face: [147, 150, 1.02], hat: [147, 91, 0.8], shadow: 89 },
    { face: [147, 129, 0.95], hat: [147, 71, 0.82], shadow: 82 },
    { face: [143, 127, 0.99], hat: [143, 68, 0.78], shadow: 112 },
  ],
  mame: [
    { face: [146, 204, 0.62], hat: [145, 159, 0.45], shadow: 46 },
    { face: [148, 176, 0.8], hat: [148, 136, 0.59], shadow: 60 },
    { face: [144, 159, 0.88], hat: [144, 111, 0.7], shadow: 85 },
    { face: [146, 131, 0.83], hat: [146, 87, 0.78], shadow: 65 },
    { face: [144, 132, 0.84], hat: [144, 85, 0.74], shadow: 103 },
  ],
  shizuku: [
    { face: [149, 204, 0.63], hat: [150, 146, 0.43], shadow: 46 },
    { face: [149, 173, 0.79], hat: [149, 126, 0.61], shadow: 62 },
    { face: [148, 139, 0.87], hat: [148, 90, 0.76], shadow: 83 },
    { face: [153, 100, 0.79], hat: [153, 62, 0.68], shadow: 75 },
    { face: [147, 108, 0.84], hat: [148, 67, 0.7], shadow: 112 },
  ],
  yuzu: [
    { face: [150, 206, 0.63], hat: [150, 161, 0.46], shadow: 49 },
    { face: [147, 173, 0.84], hat: [147, 124, 0.64], shadow: 69 },
    { face: [143, 145, 0.9], hat: [143, 96, 0.77], shadow: 95 },
    { face: [136, 122, 0.84], hat: [136, 76, 0.77], shadow: 97 },
    { face: [137, 125, 0.9], hat: [137, 75, 0.77], shadow: 114 },
  ],
  momo: [
    { face: [151, 207, 0.62], hat: [151, 162, 0.46], shadow: 50 },
    { face: [149, 174, 0.82], hat: [149, 124, 0.65], shadow: 65 },
    { face: [132, 152, 0.91], hat: [132, 100, 0.73], shadow: 92 },
    { face: [142, 117, 0.87], hat: [142, 72, 0.75], shadow: 82 },
    { face: [135, 122, 0.94], hat: [135, 72, 0.75], shadow: 109 },
  ],
  goma: [
    { face: [150, 205, 0.64], hat: [150, 159, 0.47], shadow: 47 },
    { face: [150, 170, 0.89], hat: [150, 119, 0.7], shadow: 65 },
    { face: [150, 132, 1.03], hat: [150, 77, 0.82], shadow: 85 },
    { face: [149, 110, 1.01], hat: [149, 60, 0.67], shadow: 81 },
    { face: [150, 112, 1.04], hat: [150, 68, 0.76], shadow: 111 },
  ],
}

const descriptions: Record<SpeciesId, readonly string[]> = {
  komugi: [
    '麦粒のような丸い体に小さな手足と耳がついています。',
    '丸い耳と短い手足を持ち、おなかはパンのようにふくらんでいます。',
    '頬と前足が大きくなり、しっぽの先には麦の穂がついています。',
    '胸を張って立つ体に麦色の胸毛と太いしっぽがあります。',
    '麦の穂が連なるたてがみと大きなしっぽを持ち、四肢も太くなっています。',
  ],
  mame: [
    'そら豆のような体をしていて、背中に小さなすじがあります。',
    '小さな葉の形の耳と丸い後ろ足を持ち、豆のようなおなかをしています。',
    '耳が二枚の長い葉の形になり、後ろ足も大きくなっています。',
    '脚と胴体が長く伸び、首元と耳が葉の形になっています。',
    '枝分かれした葉の耳と葉の形の胸毛を持ち、豆房のようなしっぽが伸びています。',
  ],
  shizuku: [
    'しずくのような青い体に小さなくちばしがついています。',
    '丸い頭とおなかを持ち、小さな翼と水かきのある足がついています。',
    '翼と三つに分かれた尾羽が伸び、胸元には白い波の模様があります。',
    '首と脚が長く伸び、翼を体に沿ってたたんでいます。',
    '水しぶきのような冠と扇形の尾羽を持ち、大きな翼が波形に広がっています。',
  ],
  yuzu: [
    'ゆずの実のような丸い体をしていて、頭に小さな葉が一枚ついています。',
    '三角の耳と短いしっぽを持ち、手足は小さく丸い形をしています。',
    '耳としっぽが長く伸び、細い顔と白い尾先が特徴です。',
    '脚と鼻先が長くなり、太いしっぽが背中まで巻き上がっています。',
    '三つに分かれたしっぽがゆずの房のように広がり、頬と胸の毛も大きくなっています。',
  ],
  momo: [
    '桃まんじゅうのように二つの山がある体をしていて、手足はまだ見えません。',
    '小さな猫耳と手足を持ち、短いしっぽの先が丸く曲がっています。',
    '丸い腰と大きな前足を持ち、しっぽを上に伸ばしています。',
    '脚と胴体が長く伸び、胸と巻いたしっぽの毛が厚くなっています。',
    '大きなしっぽが桃の花びらの形になり、頬と胸の毛が幾重にも広がっています。',
  ],
  goma: [
    '黒ごまのような丸い体の前面に小さな白い顔があります。',
    '丸い頭と小さな翼を持ち、短い足で立っています。',
    '耳羽と幅広い顔を持ち、顔の白い部分がハート形になっています。',
    '背の高い体に長い翼をたたんでいて、胸にはごま粒の模様があります。',
    '耳羽が大きくなり、扇形に広がる翼と白ごまの模様がついた胸を持っています。',
  ],
}

// oxlint-disable-next-line react/only-export-components -- Descriptions are authored alongside each silhouette.
export function companionFormDescription(species: SpeciesId, stage: GrowthStage): string {
  return descriptions[species][stage]
}

function Komugi({ stage }: { stage: GrowthStage }) {
  const c = colors.komugi
  switch (stage) {
    case 0:
      return (
        <>
          <path
            d="M107 179c3-16 17-25 32-22 13-10 34-4 40 11 24 6 32 30 24 55-8 25-26 39-53 39-34 0-57-19-57-46 0-16 4-28 14-37Z"
            fill={c.body}
          />
          <path
            d="M114 235c14-15 59-17 73 1-11 17-24 22-40 21-16 0-26-8-33-22Z"
            fill={cream}
            stroke="none"
          />
          <path
            d="M143 162c-6 9-6 19-1 25m8-29c-2 9 1 15 6 20"
            fill="none"
            stroke={c.shade}
            strokeWidth="3"
          />
          <path
            d="M104 227c-4 5-5 12-1 16m92-16c5 6 5 11 1 16"
            fill="none"
            stroke={c.shade}
            strokeWidth="3"
          />
        </>
      )
    case 1:
      return (
        <>
          <path d="M201 221c26-11 35 8 24 21-5 6-18 9-27 3" fill={c.shade} />
          <path
            d="M100 143c-20 0-24-29-7-38 17-9 33 2 32 22m51 4c-3-19 12-31 29-24 18 8 16 34-2 39"
            fill={c.body}
          />
          <path
            d="M94 126c-6-10 7-16 14-8m83 3c7-11 20-3 14 6"
            fill="none"
            stroke="#d88d52"
            strokeWidth="7"
          />
          <path
            d="M107 219c-19 5-26 33-9 39 10 4 23-2 29-14m46 0c6 15 19 18 28 13 15-9 5-32-10-37"
            fill={c.body}
          />
          <path
            d="M100 180c-9 15-15 36-8 57 7 20 27 27 58 27s53-8 59-29c5-20 1-40-10-57Z"
            fill={c.body}
          />
          <ellipse cx="150" cy="225" rx="35" ry="29" fill={cream} stroke="none" />
          <path
            d="M86 165c0-34 24-50 64-48 36-2 65 17 65 49 0 34-25 48-65 48-39 0-64-16-64-49Z"
            fill={c.body}
          />
          <path
            d="M121 126c7-6 14-9 22-9l-4 10 17-9"
            fill="none"
            stroke={c.shade}
            strokeWidth="3"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M99 206c-18 1-20 21-7 24 9 2 16-6 18-13"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M202 205c17 3 18 23 5 25-9 1-15-7-17-14"
            fill={c.body}
          />
        </>
      )
    case 2:
      return (
        <>
          <path
            d="M202 228c25 1 42-9 41-28-1-12-13-16-14-30 21 2 34 21 29 39-5 24-27 41-52 39Z"
            fill={c.shade}
          />
          <path d="M230 179c-11-15-5-29 1-35 3 10 10 10 14 15l8-10c7 17 5 30-6 40Z" fill={c.body} />
          <path
            d="M93 178c-21 11-32 35-27 58 6 29 34 30 55 19h57c23 13 48 7 52-15 4-22-6-48-29-61Z"
            fill={c.body}
          />
          <path d="M108 199c7-15 68-16 81 1l-6 49h-65Z" fill={cream} stroke="none" />
          <path
            d="M94 115c-19-3-27-26-14-40 14-14 35-8 40 12m55 1c8-18 29-22 41-7 12 15 4 34-16 36"
            fill={c.body}
          />
          <path
            d="M86 91c0-10 15-12 21-2m82 2c5-10 18-7 18 2"
            fill="none"
            stroke="#d99050"
            strokeWidth="8"
          />
          <path
            d="M93 108c14-21 38-25 55-20 28-6 51 4 60 25 9 18 10 30 8 45l12 11-15 2 9 13c-18 20-46 20-72 20-30 0-61-4-80-24l11-12-11-5 12-10c-2-18 0-33 11-45Z"
            fill={c.body}
          />
          <path d="m128 91 11 12 9-16 11 14 9-10" fill={c.shade} stroke="none" />
          <path
            d="M105 168c12-9 28-5 43 5 15-10 30-14 42-4-3 22-24 31-42 31-20 0-38-11-43-32Z"
            fill={cream}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M111 202c-14 9-20 28-18 49 1 11 33 12 35 1l4-38"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M181 202c14 9 20 29 18 50-1 10-32 11-34 0l-4-38"
            fill={c.body}
          />
          <path d="m102 250 0 7m12-7 0 8m61-8 0 8m12-8 0 7" stroke={c.shade} strokeWidth="2.5" />
        </>
      )
    case 3:
      return (
        <>
          <path
            d="M192 235c30 3 56-16 51-44-2-15-12-19-15-32 33 5 43 33 32 59-11 24-35 36-65 32Z"
            fill={c.shade}
          />
          <path
            d="M230 178c-13-15-14-35-7-48l11 11 4-18 11 15 11-5c6 22 0 42-18 52Z"
            fill={c.body}
          />
          <path
            d="M99 213c-6 18-9 36-7 48 1 9 32 10 35 1l8-36m27 0 5 36c3 10 36 9 36-1 2-18-1-34-8-49"
            fill={c.shade}
          />
          <path
            d="M112 147c-20 7-37 29-39 56l8 25 14-8c11 24 36 32 56 31 27-1 47-9 56-32l13 9 6-25c-4-28-20-48-40-57Z"
            fill={c.body}
          />
          <path
            d="m105 172 10 1 0-12 30 13 28-14 1 12 14-3-11 20 10 3-17 16 7 7-28 14-24-13 4-9-18-15 8-4Z"
            fill={cream}
            stroke="none"
          />
          <path
            d="M95 91c-19-6-24-30-10-42 17-14 35-6 39 14m51 2c6-19 28-22 39-6 10 15 3 32-13 35"
            fill={c.body}
          />
          <path
            d="M91 70c3-9 14-8 20-1m77 2c4-9 15-6 18 1"
            fill="none"
            stroke="#d68b47"
            strokeWidth="8"
          />
          <path
            d="M100 86c10-18 31-23 46-17 27-8 52 6 59 31 5 17 7 35 1 48l9 9-15 4 3 12c-31 24-85 21-116-4l7-9-14-6 11-12c-4-17-1-40 9-56Z"
            fill={c.body}
          />
          <path d="m123 78 8 10 14-20 9 16 17-10-5 22" fill={c.shade} stroke="none" />
          <path
            d="M113 145c10-7 24-4 33 2 12-8 23-8 34-2 2 17-16 29-33 29-17 0-35-12-34-29Z"
            fill={cream}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M87 183c-10 9-13 27-7 40 5 9 20 5 22-6l3-22"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M213 182c10 9 12 28 6 41-5 8-19 5-21-6l-3-23"
            fill={c.body}
          />
        </>
      )
    case 4:
      return (
        <>
          <path
            d="M189 221c34 16 65-2 64-31-1-15-14-29-11-42 31 12 42 48 25 74-14 23-49 30-78 17Z"
            fill={c.shade}
          />
          <path
            d="M246 172c-27-16-29-43-17-63l10 12 4-28 15 19 12-14 4 25 11-1c4 24-9 45-27 53Z"
            fill={c.body}
          />
          <path
            d="m249 164 6-44m-5 25-12-10m15 3 12-13m-12 28 18-10"
            fill="none"
            stroke={c.shade}
            strokeWidth="3"
          />
          <path
            d="M85 170c-27 13-39 42-31 67 5 19 22 20 43 13l18 4 59-2c29 12 54 4 57-16 4-30-12-56-31-65Z"
            fill={c.body}
          />
          <path
            d="M64 225c-9 6-12 28-6 34 6 6 25 7 31 0l8-28m98 0 4 28c4 7 28 6 32-1 5-12-2-28-8-34"
            fill={c.shade}
          />
          <path
            d="m139 49 12 12 24-14 6 20 26-3-1 23 26 8-9 20 24 17-16 18 18 22-25 13 9 29-31-1-8 23-23-11-16 24-21-18-23 19-13-25-29 7-4-26-26-6 9-24-22-15 18-20-12-24 25-10 0-23 24 1 9-23 20 9Z"
            fill={c.shade}
          />
          <path
            d="m139 58 5 23m-36-14 8 22m-36 1 15 15m-30 15 17 8m-20 27 22 0m-16 28 23-9m3 40 12-21m21 32 4-27m30 27-5-24m38 5-17-18m38-2-26-8m30-25-26 0m16-32-24 12m-1-35-13 22m-16-39-9 25"
            fill="none"
            stroke="#f7d26b"
            strokeWidth="6"
          />
          <path
            d="M96 91c-20-1-23-25-9-35 15-11 31-1 33 15m49 1c3-16 20-23 33-13 13 12 7 32-9 33"
            fill={c.body}
          />
          <path
            d="M94 75c3-6 11-6 17 0m69 1c6-6 14-4 16 2"
            fill="none"
            stroke="#d99148"
            strokeWidth="7"
          />
          <path
            d="M97 90c11-18 26-26 46-20 28-5 48 7 55 32 4 15 5 26 2 41l13 8-16 9 3 10c-13 16-36 23-58 20-22 2-46-7-57-21l6-12-14-6 12-11c-4-18-1-35 8-50Z"
            fill={c.body}
          />
          <path d="m121 78 10 13 13-20 10 17 15-11-5 23" fill={c.shade} stroke="none" />
          <path
            d="M108 143c12-9 23-5 35 2 12-8 24-9 37-2 2 18-17 32-37 32s-38-15-35-32Z"
            fill={cream}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M101 204c-10 11-12 32-12 53 2 10 35 11 38 0l5-47"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M181 204c12 12 15 32 13 53-2 10-34 11-37 0l-5-47"
            fill={c.body}
          />
          <path d="m101 253 0 8m12-8 0 8m56-8 0 8m12-8 0 8" stroke={c.shade} strokeWidth="2.5" />
        </>
      )
  }
}

function Mame({ stage }: { stage: GrowthStage }) {
  const c = colors.mame
  switch (stage) {
    case 0:
      return (
        <>
          <path
            d="M139 157c-26-5-44 16-40 42 2 12-6 15-5 31 1 23 23 34 49 32 36-2 58-21 57-53-1-23-18-48-36-49-11-1-12 7-25-3Z"
            fill={c.body}
          />
          <path d="M139 162c-13 8-17 18-13 29" fill="none" stroke={c.shade} strokeWidth="4" />
          <path
            d="M110 233c13-10 49-11 66 0-7 17-20 25-34 25-16 0-26-8-32-25Z"
            fill={c.light}
            stroke="none"
          />
          <path d="M162 168c9 1 15 7 17 13" fill="none" stroke="#91bc7e" strokeWidth="6" />
        </>
      )
    case 1:
      return (
        <>
          <circle cx="202" cy="233" r="16" fill={c.light} />
          <path
            d="M111 149c-19-13-23-45-12-60 20 6 30 26 27 48m39 0c2-24 15-43 31-44 9 17 4 44-16 58"
            fill={c.body}
          />
          <path d="m105 108 11 28m70-24-12 26" fill="none" stroke={c.light} strokeWidth="8" />
          <path
            d="M109 199c-17 10-28 33-20 52 5 11 20 13 39 7m41 1c21 8 39 0 40-12 2-18-8-37-23-47"
            fill={c.body}
          />
          <path d="M119 193c-19 20-23 57-5 66 16 8 54 8 68-1 17-11 12-46-7-65Z" fill={c.body} />
          <ellipse cx="147" cy="234" rx="24" ry="26" fill={c.light} stroke="none" />
          <path
            d="M94 169c0-29 20-40 53-37 34-1 54 14 54 43 0 25-20 41-54 41-34 0-53-18-53-47Z"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-left"
            d="M112 213c-10 4-13 17-6 22 7 6 14-2 16-12"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M181 213c10 4 12 17 5 22-7 6-14-2-16-12"
            fill={c.body}
          />
        </>
      )
    case 2:
      return (
        <>
          <path d="M202 219c10-18 28-20 41-9-7 14-22 24-35 21" fill={c.light} />
          <path
            d="M105 126C79 99 77 59 94 37c27 21 37 52 32 82m32-1c0-40 16-73 39-81 13 27 1 64-25 91"
            fill={c.body}
          />
          <path
            d="M99 57c13 19 19 39 17 59m72-59c-12 18-18 38-18 59"
            fill="none"
            stroke={c.light}
            strokeWidth="10"
          />
          <path
            d="M96 198c-26 8-36 28-30 47 4 12 18 18 42 9m73-57c24 3 48 23 45 40-3 20-28 24-48 12"
            fill={c.body}
          />
          <path d="M112 180c-20 22-19 53-5 66 11 11 53 12 69-1 17-14 21-43 5-66Z" fill={c.body} />
          <path
            d="M129 196c-14 9-19 31-10 44 8 12 32 12 42-1 10-14 5-34-9-42Z"
            fill={c.light}
            stroke="none"
          />
          <path
            d="M96 128c11-18 31-21 49-16 28-6 47 9 51 34l7 19-10-1 5 13c-24 23-74 29-101 4l-9-13 9-4-8-8c0-13 1-20 7-28Z"
            fill={c.body}
          />
          <path d="m127 117 14 14 14-17" fill={c.shade} stroke="none" />
          <path
            className="pet-arm pet-arm-left"
            d="M112 202c-10 9-19 23-23 43-2 10 19 17 25 7l16-31"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M166 200c13-1 31-8 41-21 7-8 21 2 16 11-7 15-21 27-41 30"
            fill={c.body}
          />
          <path d="m72 249 28-2m96 0 23-5" fill="none" stroke={c.shade} strokeWidth="3" />
        </>
      )
    case 3:
      return (
        <>
          <path d="M191 217c8-18 23-23 34-20-1 23-18 36-35 31" fill={c.light} />
          <path
            d="M113 107C89 83 77 46 91 16c29 15 41 46 35 77m31-3c7-35 24-60 50-63 6 26-11 63-36 80"
            fill={c.body}
          />
          <path
            d="M96 34c16 23 23 45 22 60m76-50c-17 11-25 31-28 48"
            fill="none"
            stroke={c.light}
            strokeWidth="9"
          />
          <path
            d="M118 209c-7 13-7 28-10 44l-14 3c-6 3-6 12 2 13h28c5-1 7-7 8-15l9-33m11 0 5 33c1 9 4 15 9 15h28c8-1 8-10 1-13l-14-4c-1-15-3-31-10-44"
            fill={c.body}
          />
          <path
            d="M130 150c-13 12-18 23-17 42-10 10-14 22-9 33 13 24 70 24 84-1 5-11-2-26-10-32 2-19-5-33-17-43Z"
            fill={c.body}
          />
          <path
            d="M137 169c-11 14-12 42-7 55 7 13 25 13 32 0 5-14 2-44-8-54Z"
            fill={c.light}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M116 173c-11 9-21 28-26 43-3 11 9 17 16 9l21-34"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M177 173c11 9 21 28 26 43 3 11-9 17-16 9l-20-34"
            fill={c.body}
          />
          <path
            d="M128 153c-14-5-27-1-35 9 13 11 30 11 45 2l9 15 12-14c17 8 29 7 40-6-15-9-24-9-39-6"
            fill={c.shade}
          />
          <path
            d="M104 105c10-17 27-21 42-15 24-6 42 5 47 28 5 22-4 48-45 49-38 0-54-29-44-62Z"
            fill={c.body}
          />
          <path
            d="M119 145c8-9 18-7 27-1 9-7 20-7 28 0-3 13-13 20-27 20-14 0-25-7-28-19Z"
            fill={c.light}
            stroke="none"
          />
        </>
      )
    case 4:
      return (
        <>
          <path
            d="M188 226c38 14 70-5 67-37-2-19-27-29-30-12-2 9 8 15 14 9"
            fill="none"
            stroke={c.shade}
            strokeWidth="10"
          />
          <path d="M244 217c24-9 33 0 33 11-1 19-20 25-44 16-10-4-12-17 11-27Z" fill={c.body} />
          <path
            d="M244 221c11-3 17-1 19 5m-26 9c13 4 23 4 30-3"
            fill="none"
            stroke={c.light}
            strokeWidth="4"
          />
          <path
            d="M219 196c-16-1-26-14-24-27 17-1 29 10 24 27m36-7c0-15 10-27 25-29 1 17-8 30-25 29"
            fill={c.shade}
          />
          <path
            d="M109 104C90 92 71 62 77 32c15 1 25 10 30 23l-4-38c27 9 40 43 26 77m33 1c-1-37 13-65 35-73l-1 35c11-15 23-21 36-18 0 29-23 61-50 69"
            fill={c.body}
          />
          <path
            d="m94 54 24 37m-1-47 5 46m64-40-15 42m40-33-32 36"
            fill="none"
            stroke={c.light}
            strokeWidth="6"
          />
          <path
            d="M115 215c-10 11-14 28-17 40-19 2-24 12-11 15h33c7-1 10-7 11-16l9-25m12 1 5 25c1 10 5 14 11 15h31c13-4 7-14-10-15-2-17-4-28-14-40"
            fill={c.body}
          />
          <path
            d="M119 160c-27 15-35 46-22 66-6 7-13 14-23 17 21 13 44 9 57-3 10 8 23 8 32 0 18 15 38 12 58 0-16-9-21-19-21-31 2-22-10-39-30-49Z"
            fill={c.body}
          />
          <path
            d="m116 169-19 13 17 7-16 14 25 0-5 20 24-12 13 17 7-25 25 8-12-23 18-6-29-20Z"
            fill={c.light}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M103 183c-18 11-30 26-36 44-2 9 8 14 16 9l36-32"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M183 183c18 11 30 26 36 44 2 9-8 14-16 9l-36-32"
            fill={c.body}
          />
          <path
            d="M110 98c10-13 24-16 36-10 21-6 40 4 47 26 5 17 1 31-7 39l7 9-20 2-4 10-23-11-22 10-7-11-18-4 7-12c-8-17-8-32 4-48Z"
            fill={c.body}
          />
          <path
            d="M119 145c10-8 18-6 26 0 10-7 19-8 28-1-2 13-13 21-28 21-13 0-24-7-26-20Z"
            fill={c.light}
            stroke="none"
          />
        </>
      )
  }
}

function Shizuku({ stage }: { stage: GrowthStage }) {
  const c = colors.shizuku
  switch (stage) {
    case 0:
      return (
        <>
          <path
            d="M153 139c1 26 40 33 44 70 4 31-17 52-48 52-32 0-54-22-49-52 3-23 20-37 35-45 10-6 15-14 18-25Z"
            fill={c.body}
          />
          <path
            d="M113 234c9-11 57-13 72 0-8 16-20 23-36 23-17 0-29-8-36-23Z"
            fill={c.light}
            stroke="none"
          />
          <path d="M128 177c-8 5-14 12-16 20" fill="none" stroke="#a7d7e9" strokeWidth="7" />
        </>
      )
    case 1:
      return (
        <>
          <path d="M185 219c11-14 22-18 34-11l-6 9 13 2c-7 19-23 27-39 23" fill={c.shade} />
          <path d="m117 247-13 15 15 0 8 6 8-15m28-1 7 15 9-6 16 1-17-16" fill="#e7b54d" />
          <path
            d="M120 192c-24 7-39 25-34 44 5 22 30 29 61 28 30-1 52-13 57-30 7-20-7-37-31-43Z"
            fill={c.body}
          />
          <ellipse cx="148" cy="234" rx="37" ry="26" fill={c.light} stroke="none" />
          <path
            d="M115 136c-7-11-3-25 5-28l14 21c2-18 14-28 27-26l-5 24c35-2 55 16 53 43-1 30-25 47-60 45-33 0-57-17-57-43 0-18 8-29 23-36Z"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-left"
            d="M99 211c-13-6-18 7-9 17 7 9 15 12 23 10"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M193 211c13-5 17 9 7 19-6 6-13 9-20 7"
            fill={c.body}
          />
        </>
      )
    case 2:
      return (
        <>
          <path
            d="M195 205c10-22 28-26 48-21l-12 14 20 0-16 15 18 3c-8 20-30 30-56 19"
            fill={c.shade}
          />
          <path
            d="m113 238-4 20-16 7 23 2 15-7 1-21m32 0 1 21 15 7 23-2-17-7-3-19"
            fill="#e7b54d"
          />
          <path
            d="M119 168c-24 12-37 29-38 52 0 26 28 42 65 42 38 0 66-17 67-46 1-24-21-44-41-49Z"
            fill={c.body}
          />
          <path
            d="M117 185c12 3 20 0 30-6 11 8 22 9 32 6 13 18 15 37 9 51-12 21-63 22-77 3-10-14-8-35 6-54Z"
            fill={c.light}
            stroke="none"
          />
          <path
            d="M117 96c-12-15-10-31-2-41 10 4 17 14 20 29 6-25 24-33 36-28l-15 28c34-3 56 18 54 48-1 29-23 52-60 52-32 0-56-17-57-46-1-19 6-34 24-42Z"
            fill={c.body}
          />
          <path
            d="M110 159c18-6 28 0 39 8 13-10 24-12 41-6-7 13-23 21-40 21-19 0-32-8-40-23Z"
            fill={c.light}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M95 188c-22 1-39 20-36 40l15-2 0 13c18-3 31-15 40-30"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M193 186c24-9 34-2 32 9-2 18-17 35-30 41l-3-14-10 3 1-25"
            fill={c.body}
          />
          <path d="m69 224 22-15m111 7 13-19" fill="none" stroke={c.shade} strokeWidth="3" />
        </>
      )
    case 3:
      return (
        <>
          <path
            d="M197 191c21-14 35-12 51-4l-17 12 13 7-22 10 13 9c-19 16-40 12-57-1"
            fill={c.shade}
          />
          <path d="m126 226-1 31-15 9 23 0 8-7 1-33m23-2 5 33-8 10 26-1-9-10-2-31" fill="#dfb654" />
          <path
            d="M127 143c-1 20-11 30-26 40-17 12-24 34-11 49 16 21 71 26 102 4 27-18 25-47 6-61-19-14-29-27-25-50Z"
            fill={c.body}
          />
          <path
            d="M141 143c-1 28-14 46-24 60-13 20-4 42 17 44 18 1 43-4 52-12-15-17-34-41-32-73Z"
            fill={c.light}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M109 180c-23 14-34 40-19 59 4 6 13 9 19 7-4-14-1-27 9-41"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M177 175c26 7 39 25 32 45-5 15-19 22-32 19l8-12-13 0 9-11-12-2 7-12-12-3"
            fill={c.body}
          />
          <path
            d="M133 70c-13-13-12-30-4-43 14 3 19 13 22 27 10-20 26-25 39-15l-21 18c20 6 30 20 27 41-3 25-22 43-45 40-27-2-46-20-43-43 1-14 9-22 25-25Z"
            fill={c.body}
          />
          <path
            d="M121 120c8-9 18-11 32-2 12-8 20-7 30-2-7 15-17 22-31 22-12 0-23-6-31-18Z"
            fill={c.light}
            stroke="none"
          />
        </>
      )
    case 4:
      return (
        <>
          <path
            d="M111 202c-31-10-62 1-74 24 21 9 40 5 55-2-19 13-25 27-21 43 23-1 37-16 47-27-4 18 1 32 14 40 14-7 24-18 26-34 13 17 31 25 48 22 0-18-9-32-23-42 23 8 44 5 59-9-20-19-47-25-71-15Z"
            fill={c.shade}
          />
          <path
            d="m57 226 55-16m-27 45 36-27m14 36 8-31m48 21-28-27m58-9-44-9"
            fill="none"
            stroke="#8cc9df"
            strokeWidth="4"
          />
          <path
            d="m125 239-2 23-18 7 25 1 9-10 0-22m20 0 3 22 11 10 24-1-20-8-4-23"
            fill="#e6bc55"
          />
          <path
            d="M127 142c1 27-9 44-21 57-21 24-8 50 35 52 43 1 60-29 42-50-20-24-22-39-17-59Z"
            fill={c.body}
          />
          <path
            d="M139 145c1 28-8 47-15 59-11 17-3 36 18 41 17-3 29-10 33-23-18-18-25-39-20-66Z"
            fill={c.light}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M115 176C84 165 59 148 43 121c-13 12-10 32 0 48l-19-12c-1 22 14 42 32 50l-17 0c13 21 38 26 64 13l20-25"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M174 176c33-12 59-29 77-56 14 14 9 33-2 49l19-13c0 25-15 43-34 52l18-1c-13 23-39 26-64 12l-20-24"
            fill={c.body}
          />
          <path
            d="M47 158c19 24 35 34 57 37m-42 7 39 4m144-49c-20 24-37 35-61 39m46 8-43 3"
            fill="none"
            stroke="#b2dfeb"
            strokeWidth="5"
          />
          <path
            d="M117 80c-18-10-26-31-17-48 16 4 26 16 29 30-3-19 2-38 18-49 15 14 15 34 10 51 11-17 26-24 44-19-1 21-14 34-31 40Z"
            fill={c.body}
          />
          <path
            d="m110 49 17 23m20-40-2 35m38-9-20 16"
            fill="none"
            stroke="#b2dfeb"
            strokeWidth="5"
          />
          <path
            d="M108 90c9-22 42-31 65-15 20 13 25 42 9 62l5 10-17-1c-14 13-34 13-47 0l-19 0 7-11c-12-16-13-30-3-45Z"
            fill={c.body}
          />
          <path
            d="M116 126c11-8 21-7 31 0 11-8 22-8 32-1-4 16-17 23-32 23-13 0-26-9-31-22Z"
            fill={c.light}
            stroke="none"
          />
        </>
      )
  }
}

function Yuzu({ stage }: { stage: GrowthStage }) {
  const c = colors.yuzu
  switch (stage) {
    case 0:
      return (
        <>
          <path
            d="M127 162c-19 3-34 19-35 47-1 30 22 54 57 54s59-22 59-52c-1-30-18-48-39-49l-19 4Z"
            fill={c.body}
          />
          <path d="M149 165c-3-17 8-26 24-23-2 16-12 22-24 23Z" fill="#6b9555" />
          <path
            d="M115 236c18-8 51-7 70 0-8 15-20 23-36 23-16 0-28-9-34-23Z"
            fill={cream}
            stroke="none"
          />
          <path d="m111 188 1 1m8-9 1 1m65 44 1 1m3 9 1 1" stroke="#c57b35" strokeWidth="3" />
        </>
      )
    case 1:
      return (
        <>
          <path d="M193 238c18-21 31-27 45-23 2 22-17 38-44 35Z" fill={c.body} />
          <path d="M218 219c7-4 13-5 20-4 1 12-3 20-9 25l-9-4Z" fill={cream} stroke="none" />
          <path
            d="M119 195c-26 14-32 54-15 66 10 7 22 3 30-2h30c10 7 24 7 30-2 11-15 1-49-21-62Z"
            fill={c.body}
          />
          <ellipse cx="147" cy="235" rx="28" ry="25" fill={cream} stroke="none" />
          <path d="m101 151-8-55c24 0 37 21 37 33m34 0c1-13 16-30 36-32l-7 55" fill={c.body} />
          <path d="m104 112 6 30 12-10m68-19-8 29-9-10" fill="#cf7450" stroke="none" />
          <path
            d="M101 147c19-24 70-28 93 0 15 17 13 41-1 53-10 9-30 16-46 18-17-2-37-9-47-19-15-15-11-36 1-52Z"
            fill={c.body}
          />
          <path
            d="M101 177c16-4 31 4 46 18 14-15 32-23 49-18-6 20-26 34-49 38-25-5-41-17-46-38Z"
            fill={cream}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M109 218c-9 12-9 24-1 28 9 4 16-8 17-19"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M185 218c9 12 9 24 1 28-9 4-16-8-17-19"
            fill={c.body}
          />
        </>
      )
    case 2:
      return (
        <>
          <path
            d="M175 232c21-25 50-23 62-47 6-12 5-27-1-37 37 11 51 53 26 83-21 25-54 35-80 19Z"
            fill={c.body}
          />
          <path
            d="M237 148c21 6 35 26 36 44l-13-5-10 11-7-12c5-17 0-29-6-38Z"
            fill={cream}
            stroke="none"
          />
          <path
            d="M109 182c-19 23-27 52-22 73 2 12 28 13 33 3l8-18h29l8 18c5 11 30 8 32-3 4-23-5-50-25-71Z"
            fill={c.body}
          />
          <path d="m109 190 34 12 33-14-9 34-22 23-23-18Z" fill={cream} stroke="none" />
          <path
            d="M105 117c-24-9-27-44-20-67 28 5 45 27 45 50m29-1c5-28 25-45 53-42 1 30-10 55-29 65"
            fill={c.body}
          />
          <path d="m93 70 7 37 20-7m81-25-17 36-14-9" fill="#bc653d" stroke="none" />
          <path
            d="M102 113c15-15 28-20 43-13 23-8 42 6 53 25l17 29-15 0 7 15-27 10-36 25-34-25-28-7 8-15-14-2Z"
            fill={c.body}
          />
          <path d="m87 159 22-8 33 28 39-29 20 9-22 18-35 25-36-26Z" fill={cream} stroke="none" />
          <path
            className="pet-arm pet-arm-left"
            d="M117 213c-5 13-9 31-7 43 1 10 20 10 23 0l4-35"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M164 212c6 13 8 31 6 43-1 10-20 11-22 1l-2-36"
            fill={c.body}
          />
        </>
      )
    case 3:
      return (
        <>
          <path
            d="M176 229c26-15 49-10 61-34 12-25-3-42-3-59 0-17 9-30 21-36-3 18 13 34 19 53 14 41-8 82-42 95-21 8-41 8-60 0Z"
            fill={c.body}
          />
          <path
            d="M255 100c-4 19 14 39 20 59l-16-6-12 8-11-13c-7-18-1-38 19-48Z"
            fill={cream}
            stroke="none"
          />
          <path
            d="M111 181c-22 13-33 47-27 70 2 10 24 14 30 2l16-30 14 0 13 30c6 11 29 11 32 1 7-26-5-58-26-72Z"
            fill={c.shade}
          />
          <path d="M121 146c-20 20-25 52-16 68 13 24 51 26 66 2 11-18 7-45-13-68Z" fill={c.body} />
          <path
            d="m111 158 23 10 27-13 10 24-13 2 7 16-24 23-23-19 5-17-13-4Z"
            fill={cream}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M113 194c-6 20-8 44-6 66 1 10 22 11 25 0l6-51"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M159 192c8 22 10 43 8 67-1 11-23 12-25 1l-1-52"
            fill={c.body}
          />
          <path
            d="M97 102c-22-17-29-51-23-76 28 7 47 27 49 53m27-2c8-28 28-43 55-41 2 29-9 55-31 69"
            fill={c.body}
          />
          <path d="m85 47 10 43 16-11m82-26-23 40-12-13" fill="#bc653d" stroke="none" />
          <path
            d="M101 95c15-19 29-22 41-15 18-6 39 9 47 28l18 26-16 2 8 13-25 6-38 27-31-26-26-6 10-14-12-2Z"
            fill={c.body}
          />
          <path d="m87 135 19-6 28 29 34-28 28 6-22 19-38 26-29-25Z" fill={cream} stroke="none" />
        </>
      )
    case 4:
      return (
        <>
          <path
            d="M182 231c20-19 21-44 6-64-13-19-12-38-2-52 25 6 45 28 45 59 18-26 11-49 8-69-3-21 6-37 19-48 26 35 30 81 9 118 17-11 27-9 29-9-2 44-41 92-99 90Z"
            fill={c.body}
          />
          <path
            d="M186 115c23 5 39 23 43 44l-15-7-12 9c-21-19-26-31-16-46m72-58c17 23 26 54 20 80l-16-13-17 8c1-26-19-51 13-75m38 109c0 22-13 46-30 60l-2-18-13-7c17-22 32-35 45-35"
            fill={cream}
            stroke="none"
          />
          <path
            d="M219 169c2 25-7 50-19 66m59-87c-2 34-18 58-45 88m46-24-38 31"
            fill="none"
            stroke={c.shade}
            strokeWidth="3"
          />
          <path
            d="M102 182c-26 18-33 50-24 72 5 11 27 11 33 0l12-24h28l16 24c8 10 30 7 32-5 4-30-8-55-30-71Z"
            fill={c.body}
          />
          <path
            d="m113 151-18 20 13 1-16 22 24-4-4 18 26 28 25-25-2-19 19 5-11-23 13-3-23-20Z"
            fill={cream}
          />
          <path
            className="pet-arm pet-arm-left"
            d="M107 207c-7 16-10 34-7 55 2 9 23 9 26-1l8-43"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M160 207c10 18 13 34 10 54-1 10-24 10-27 0l-4-44"
            fill={c.body}
          />
          <path
            d="M94 106c-26-20-29-57-18-85 29 13 46 32 47 58m28 0c5-31 27-53 57-55 5 31-5 61-31 83"
            fill={c.body}
          />
          <path d="m84 41 10 50 18-13m84-35-23 48-11-12" fill="#bd673e" stroke="none" />
          <path
            d="M104 93c14-15 23-20 35-13 22-4 38 8 50 30l23 20-15 4 16 16-22 0 7 15-24 1-36 28-33-27-26-2 10-13-23-3 21-17-13-4Z"
            fill={c.body}
          />
          <path d="m82 141 27-12 27 29 36-27 28 11-23 23-39 29-32-27Z" fill={cream} stroke="none" />
          <path d="m129 84 8 11 12-16" fill={c.shade} stroke="none" />
        </>
      )
  }
}

function Momo({ stage }: { stage: GrowthStage }) {
  const c = colors.momo
  switch (stage) {
    case 0:
      return (
        <>
          <path
            d="M149 170c-23-19-47-9-55 14-12 36 12 69 57 80 42-9 66-40 56-74-7-26-33-39-58-20Z"
            fill={c.body}
          />
          <path d="M149 171c7 7 10 16 8 25" fill="none" stroke={c.shade} strokeWidth="3" />
          <path
            d="M113 237c20-10 48-10 75 0-9 11-24 20-37 23-15-3-29-11-38-23Z"
            fill={c.light}
            stroke="none"
          />
          <path d="M115 180c7-7 14-8 21-6" fill="none" stroke="#f8bec0" strokeWidth="6" />
        </>
      )
    case 1:
      return (
        <>
          <path
            d="M194 239c24 4 37-6 34-20-2-11-14-13-20-6"
            fill="none"
            stroke={ink}
            strokeWidth="18"
          />
          <path
            d="M194 239c24 4 37-6 34-20-2-11-14-13-20-6"
            fill="none"
            stroke={c.body}
            strokeWidth="11"
          />
          <path
            d="M119 198c-18 10-30 46-20 59 8 11 23 10 32 3h32c10 7 26 7 32-4 8-16-4-46-21-57Z"
            fill={c.body}
          />
          <ellipse cx="149" cy="237" rx="28" ry="24" fill={c.light} stroke="none" />
          <path d="m99 151-1-49c24 2 36 22 36 30m29 0c5-14 20-23 36-24l-2 44" fill={c.body} />
          <path d="m108 119 3 24 15-9m63-10-4 22-14-10" fill={c.shade} stroke="none" />
          <path
            d="M101 148c15-20 76-26 95 0 10 14 14 34 4 48-17 23-84 24-103 0-11-14-8-32 4-48Z"
            fill={c.body}
          />
          <path
            d="M121 193c8-9 18-8 28-1 10-7 20-7 30 1-4 12-16 18-30 18-13 0-24-5-28-18Z"
            fill={c.light}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M112 215c-9 7-10 21-3 26 8 5 16-4 18-15"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M184 215c9 7 10 21 3 26-8 5-16-4-18-15"
            fill={c.body}
          />
        </>
      )
    case 2:
      return (
        <>
          <path
            d="M202 222c25-13 40-33 38-65-2-24-18-31-27-23-7 6-3 16 6 16"
            fill="none"
            stroke={ink}
            strokeWidth="24"
          />
          <path
            d="M202 222c25-13 40-33 38-65-2-24-18-31-27-23-7 6-3 16 6 16"
            fill="none"
            stroke={c.body}
            strokeWidth="17"
          />
          <path
            d="M111 199c25-25 66-28 91-4 17 16 24 49 8 60-10 7-26 4-41-2-34 11-65 3-78-13Z"
            fill={c.body}
          />
          <path
            d="M178 213c22-5 34 9 25 25l-19 4 19 7"
            fill="none"
            stroke={c.shade}
            strokeWidth="3"
          />
          <path
            d="M94 124c-11-19-12-44-7-60 23 6 39 21 41 39m23 0c7-22 22-31 45-32 3 22-6 40-15 53"
            fill={c.body}
          />
          <path d="m96 83 5 28 17-8m66-16-12 27-13-10" fill={c.shade} stroke="none" />
          <path
            d="M91 118c15-18 32-19 44-14 24-7 42 4 51 26l10 24-12-1 4 16c-24 27-73 27-101 6l4-16-13 0 10-20Z"
            fill={c.body}
          />
          <path
            d="M105 174c8-9 18-8 28-2 10-6 22-5 29 1-3 14-14 21-29 21-14 0-25-7-28-20Z"
            fill={c.light}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M103 199c-10 10-20 30-25 45-3 11 20 20 27 10l19-31"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M154 200c-1 13-9 29-17 42-7 10 14 23 24 12l22-31"
            fill={c.body}
          />
          <path d="m85 249 5 5m8-3 4 5m41-7 7 6m6-9 6 6" stroke={c.shade} strokeWidth="2.5" />
        </>
      )
    case 3:
      return (
        <>
          <path
            d="M190 240c24-20 49-33 47-66-2-27-23-41-34-29-8 9-2 22 7 19"
            fill="none"
            stroke={ink}
            strokeWidth="22"
          />
          <path
            d="M190 240c24-20 49-33 47-66-2-27-23-41-34-29-8 9-2 22 7 19"
            fill="none"
            stroke={c.body}
            strokeWidth="15"
          />
          <path
            d="M122 154c-25 29-32 64-20 84l-3 22c2 11 21 11 25 0l9-20 17 0 9 20c4 11 26 11 26 0l-6-22c13-26 6-58-17-85Z"
            fill={c.body}
          />
          <path
            d="m122 155 20 13 21-13 9 24-12-1 9 16-25 25-25-23 8-17-12 0Z"
            fill={c.light}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M119 199c-7 17-10 42-9 62 2 10 23 10 25 0l5-49"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M161 199c8 18 10 43 8 62-1 10-22 11-24 0l-1-49"
            fill={c.body}
          />
          <path
            d="M99 100c-12-24-12-50-5-72 23 5 43 28 43 48m13 0c8-24 27-36 50-34 1 25-9 47-23 58"
            fill={c.body}
          />
          <path d="m103 47 7 34 17-7m63-17-18 27-13-9" fill={c.shade} stroke="none" />
          <path
            d="M104 88c12-16 27-19 40-13 23-5 40 9 48 32l7 18-12 0 3 15-21 7-25 15-26-14-25-9 5-15-12 0Z"
            fill={c.body}
          />
          <path
            d="M118 133c8-6 16-5 25 1 9-6 19-7 27-1-3 15-14 24-27 24-14 0-24-9-25-24Z"
            fill={c.light}
            stroke="none"
          />
        </>
      )
    case 4:
      return (
        <>
          <path
            d="M181 238c21-19 26-39 22-58-4-21 5-40 22-48 7 11 10 22 9 33 9-36 32-49 48-43 2 26-10 49-25 65l27-12c9 30-21 67-65 79l-33-1Z"
            fill={c.body}
          />
          <path
            d="M216 228c28-29 24-63 57-96m-55 95c4-28-5-42 5-78m-6 91c21-21 37-19 53-48"
            fill="none"
            stroke="#f8c5be"
            strokeWidth="6"
          />
          <path
            d="M108 177c-24 20-32 50-26 68l-5 16c2 11 24 11 29 1l13-24 25 1 15 24c5 10 28 9 29-2l-7-22c11-21 3-47-20-62Z"
            fill={c.body}
          />
          <path
            d="m109 151-24 24 17 0-17 27 26-5-6 22 28 23 29-24-5-21 27 2-18-24 15-2-22-24Z"
            fill={c.light}
          />
          <path
            className="pet-arm pet-arm-left"
            d="M106 214c-10 15-11 33-9 48 2 10 24 10 27-1l7-39"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M153 213c10 16 13 35 10 49-2 10-24 9-26-1l-1-39"
            fill={c.body}
          />
          <path
            d="M93 104C78 84 79 47 89 26l13 9 5-14c20 12 28 37 26 57m15 0c5-26 19-44 43-49l4 14 13-4c6 27-5 51-23 67"
            fill={c.body}
          />
          <path d="m100 49 7 38 17-11m72-22-20 36-17-14" fill={c.shade} stroke="none" />
          <path
            d="M95 93c12-17 24-22 41-15 22-5 42 4 52 26l13 18-12 4 16 16-19 2 7 17-26 1-31 20-30-19-28 1 10-17-20-2 18-18-12-3Z"
            fill={c.body}
          />
          <path
            d="M106 140c9-10 18-6 29 0 11-8 22-10 32-2 0 18-13 31-32 31-17 0-30-12-29-29Z"
            fill={c.light}
            stroke="none"
          />
          <path d="m124 85 9 12 12-14" fill={c.shade} stroke="none" />
        </>
      )
  }
}

function Goma({ stage }: { stage: GrowthStage }) {
  const c = colors.goma
  switch (stage) {
    case 0:
      return (
        <>
          <path
            d="M152 156c26 0 43 16 48 41 8 37-11 66-49 66-35 0-56-25-50-57 5-27 18-50 51-50Z"
            fill={c.body}
          />
          <path
            d="M151 188c-19-16-37-4-37 17 0 23 22 32 37 38 15-6 36-17 36-38 0-22-18-32-36-17Z"
            fill={c.light}
            stroke="none"
          />
          <path d="m145 168 4 5m10-7 2 6" stroke="#a1b1b3" strokeWidth="4" />
        </>
      )
    case 1:
      return (
        <>
          <path d="m121 247-10 16 17-3 10 5 1-16m24 0 1 16 10-5 17 3-12-16" fill="#d3ae67" />
          <path
            d="M106 181c-18 12-26 42-13 62 11 18 38 22 58 20 29 0 52-13 55-33 2-21-4-39-22-51Z"
            fill={c.body}
          />
          <ellipse cx="150" cy="223" rx="37" ry="33" fill={c.light} stroke="none" />
          <path
            d="M88 163c0-28 23-48 63-47 39 0 62 21 61 49-1 28-20 45-63 45-38 0-60-16-61-47Z"
            fill={c.body}
          />
          <path
            d="M149 147c-20-25-51-7-48 20 2 20 24 31 49 35 26-5 48-17 48-39-1-24-29-36-49-16Z"
            fill={c.light}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M100 203c-16 1-19 21-5 32l14-12"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M199 203c16 1 19 21 5 32l-14-12"
            fill={c.body}
          />
          <path d="m139 234 3 5m16-5-2 6" stroke={c.shade} strokeWidth="3" />
        </>
      )
    case 2:
      return (
        <>
          <path d="m109 238-6 25 14-4 14 6 1-25m35 0 1 25 14-6 14 4-6-25" fill="#d3ae67" />
          <path
            d="M112 166c-24 17-33 49-21 73 10 19 38 25 60 25 30 0 54-10 62-31 9-23-2-51-25-68Z"
            fill={c.body}
          />
          <path
            d="M121 179c-11 21-12 45-5 61 14 21 59 21 72-2 6-18 0-44-10-59Z"
            fill={c.light}
            stroke="none"
          />
          <path
            d="M91 104c-14-13-17-33-10-49l37 28c20-9 45-9 65-1l34-25c7 18 1 35-7 49 6 14 8 33 2 48-9 22-36 32-63 32-28 0-55-11-64-34-5-15-2-33 6-48Z"
            fill={c.body}
          />
          <path
            d="M149 107c-18-27-49-20-53 7-4 29 25 50 54 62 28-11 56-35 50-62-5-25-36-33-51-7Z"
            fill={c.light}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M96 182c-19 5-32 23-30 45l13-5 0 14 21-10 9-23"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M201 181c21 7 30 26 28 47l-13-6 0 13-21-10-9-22"
            fill={c.body}
          />
          <path d="m134 210 4 7m25-7-4 7m-11 10 0 8" stroke={c.shade} strokeWidth="4" />
        </>
      )
    case 3:
      return (
        <>
          <path
            d="m111 235-6 27-14 6 20 1 15-4 7 3 2-29m30 0 2 29 8-3 16 4 18-1-16-6-5-27"
            fill="#d3ae67"
          />
          <path
            d="M107 145c-21 27-31 57-21 86 9 28 30 33 64 33 29 0 54-12 63-35 10-27-4-61-27-84Z"
            fill={c.body}
          />
          <path
            d="M120 153c-15 26-17 53-10 77 8 28 65 32 78 2 7-20 1-53-15-78Z"
            fill={c.light}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M99 155c-28 14-29 54-19 83l17-9 5 10c14-23 16-48 8-67"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M196 155c27 16 30 56 18 85l-15-11-6 10c-13-23-16-48-8-67"
            fill={c.body}
          />
          <path
            d="m87 207 13-21m-9 33 12-17m101 5-12-21m8 34-10-18"
            fill="none"
            stroke={c.shade}
            strokeWidth="3"
          />
          <path
            d="M95 87C81 71 79 44 87 22l31 39c19-6 42-7 62-1l31-35c9 24 5 45-8 64 5 15 5 30-2 42-11 21-30 31-52 32-28-1-53-16-59-39-4-14-2-27 5-37Z"
            fill={c.body}
          />
          <path
            d="M149 87c-18-27-44-19-49 4-6 28 21 51 49 65 29-15 55-39 48-66-6-24-32-31-48-3Z"
            fill={c.light}
            stroke="none"
          />
          <path
            d="m127 187 4 8m21-14 0 9m20-3-4 8m-28 13 3 9m18-8-2 8m-7 13 0 8"
            stroke={c.shade}
            strokeWidth="4"
          />
        </>
      )
    case 4:
      return (
        <>
          <path
            d="m107 234-6 28-20 6 26 4 16-6 8 5 6-34m28 0 4 34 8-5 18 6 24-4-20-6-7-28"
            fill="#d3ae67"
          />
          <path d="m119 222-13 30 20-2 11 22 15-21 19 20 7-23 20 3-15-29" fill={c.shade} />
          <path
            d="M110 145c-25 19-41 53-27 81 10 20 36 33 68 33 34 0 61-13 70-36 11-27-5-61-32-79Z"
            fill={c.body}
          />
          <path
            d="M121 151c-19 24-21 56-10 79 12 24 65 25 80-2 11-23 5-57-14-78Z"
            fill={c.light}
            stroke="none"
          />
          <path
            className="pet-arm pet-arm-left"
            d="M104 158c-24-6-51-4-68 10l12 11-24 11 18 15-20 10 20 9-8 14 23 0 1 14c33-4 52-29 54-57"
            fill={c.body}
          />
          <path
            className="pet-arm pet-arm-right"
            d="M195 158c24-6 51-4 68 10l-12 11 24 11-18 15 20 10-20 9 8 14-23 0-1 14c-33-4-52-29-54-57"
            fill={c.body}
          />
          <path
            d="m54 183 34 7m-40 15 37-4m-34 23 32-15m-14 28 21-23m155-31-34 7m40 15-37-4m34 23-32-15m14 28-21-23"
            fill="none"
            stroke="#a6b8b7"
            strokeWidth="4"
          />
          <path
            d="M88 94C69 77 64 46 73 20l14 15 7-18 27 51c19-7 37-7 56 0l27-51 7 18 16-15c8 27 3 56-15 74l9 20-13 0 4 21c-18 24-41 38-62 40-26-4-51-21-65-41l7-20-14 0Z"
            fill={c.body}
          />
          <path d="m85 48 23 38m107-38-23 38" fill="none" stroke="#a6b8b7" strokeWidth="6" />
          <path
            d="M150 92c-18-24-46-21-52 3-8 27 20 53 52 72 31-18 59-44 51-72-7-24-33-27-51-3Z"
            fill={c.light}
            stroke="none"
          />
          <path
            d="m125 189 5 10m20-18 0 11m26-3-5 10m-36 12 4 10m26-10-4 10m-11 11 0 9"
            stroke={c.shade}
            strokeWidth="5"
          />
          <path d="m119 223 4 8m55-8-4 8" stroke="#fffaf0" strokeWidth="4" />
        </>
      )
  }
}

function Face({
  species,
  stage,
  mood,
}: {
  species: SpeciesId
  stage: GrowthStage
  mood: CompanionMood
}) {
  const [x, y, scale] = poses[species][stage].face
  const happy = mood === 'happy' || mood === 'eating'
  const sleepy = mood === 'sleepy'
  const bird = species === 'shizuku' || species === 'goma'
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      stroke={ink}
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse
        cx="-35"
        cy="13"
        rx="10"
        ry="6"
        fill={colors[species].blush}
        opacity=".8"
        stroke="none"
      />
      <ellipse
        cx="35"
        cy="13"
        rx="10"
        ry="6"
        fill={colors[species].blush}
        opacity=".8"
        stroke="none"
      />
      {sleepy ? (
        <g className="pet-eye" fill="none">
          <path d="M-28 0q7 8 14 0m28 0q7 8 14 0" />
          <path d="m-25 4-3 3m52-3 3 3" strokeWidth="2.5" />
        </g>
      ) : happy ? (
        <g className="pet-eye" fill="none">
          <path d="M-29 3q8-12 16 0m26 0q8-12 16 0" />
        </g>
      ) : (
        <g className="pet-eye" fill={ink} stroke="none">
          <ellipse cx="-21" cy="0" rx={stage === 0 ? 4.6 : 5.1} ry={stage === 0 ? 5.5 : 7} />
          <ellipse cx="21" cy="0" rx={stage === 0 ? 4.6 : 5.1} ry={stage === 0 ? 5.5 : 7} />
          <circle cx="-22.5" cy="-2.5" r="1.7" fill="white" />
          <circle cx="19.5" cy="-2.5" r="1.7" fill="white" />
        </g>
      )}
      {bird ? (
        <>
          <path
            d={happy ? 'M-11 14 0 8 11 14 0 29Z' : 'M-11 14 0 8 11 14 0 24Z'}
            fill="#edbd50"
            strokeWidth="2.5"
          />
          {happy && <path d="m-9 15 9 5 9-5" fill="none" strokeWidth="2" />}
        </>
      ) : (
        <>
          <path
            d="M-5 10q5-4 10 0l-5 5Z"
            fill={species === 'momo' ? '#b95e70' : ink}
            stroke="none"
          />
          {mood === 'eating' ? (
            <>
              <path d="M-10 22q10 15 20 0" fill="#a35249" strokeWidth="2.5" />
              <path d="M-29 21q-5 4-1 9m59-9q5 4 1 9" fill="none" strokeWidth="2.5" />
            </>
          ) : happy ? (
            <path d="M-10 21q10 15 20 0" fill="#c77568" strokeWidth="2.5" />
          ) : (
            <path d="M0 16v3q-5 9-11 3m11-3q5 9 11 3" fill="none" strokeWidth="2.5" />
          )}
        </>
      )}
      {(species === 'momo' || (species === 'yuzu' && stage > 1)) && stage > 0 && (
        <g strokeWidth="2" opacity=".7">
          <path d="m-39 19-13-3m13 10-13 3m91-10 13-3m-13 10 13 3" />
        </g>
      )}
      {mood === 'eating' && (
        <g fill="#bb8748" stroke="none">
          <circle cx="-15" cy="31" r="2.3" />
          <circle cx="20" cy="28" r="2" />
          <circle cx="14" cy="36" r="1.6" />
        </g>
      )}
    </g>
  )
}

const drawings = {
  komugi: Komugi,
  mame: Mame,
  shizuku: Shizuku,
  yuzu: Yuzu,
  momo: Momo,
  goma: Goma,
}

export function CompanionArt({
  species,
  stage,
  mood,
  hat,
  portrait = false,
  className = '',
}: {
  species: SpeciesId
  stage: GrowthStage
  mood: CompanionMood
  hat?: ReactNode
  portrait?: boolean
  className?: string
}) {
  const pose = poses[species][stage]
  const Drawing = drawings[species]
  const [hatX, hatY, hatScale] = pose.hat
  const [faceX, faceY, faceScale] = pose.face
  // Small badges frame the face, independent of the full-body growth silhouette.
  const portraitSize = 200 * faceScale
  return (
    <svg
      className={`pet-art pet-${mood} pet-${species} pet-stage-${stage} ${className}`}
      viewBox={
        portrait
          ? `${faceX - portraitSize / 2} ${faceY - portraitSize / 2} ${portraitSize} ${portraitSize}`
          : '0 0 300 300'
      }
      fill="none"
      aria-hidden="true"
    >
      {!portrait && (
        <ellipse cx="150" cy="272" rx={pose.shadow} ry="10" fill="#456c63" opacity=".13" />
      )}
      <g
        className="pet-body"
        stroke={ink}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Drawing stage={stage} />
        <Face species={species} stage={stage} mood={mood} />
        <g transform={`translate(${hatX} ${hatY}) scale(${hatScale}) translate(-150 -80)`}>{hat}</g>
      </g>
      {!portrait && (mood === 'happy' || mood === 'eating') && (
        <g className="pet-sparkles" fill="#edbc48">
          <path d="m40 106 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" />
          <path d="m257 79 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
          <circle cx="263" cy="133" r="3.5" />
        </g>
      )}
      {mood === 'sleepy' && (
        <g className="pet-sleep" fill="none" stroke="#8bacb0" strokeWidth="3" strokeLinecap="round">
          <path d="m236 91 9-1-8 12 10-1m3-32 12-1-10 15 13-1" />
          <ellipse
            cx={faceX + 10 * faceScale}
            cy={faceY + 29 * faceScale}
            rx={7 * faceScale}
            ry={9 * faceScale}
            fill="#e3f5ee"
            fillOpacity=".8"
            strokeWidth="2"
          />
        </g>
      )}
    </svg>
  )
}
