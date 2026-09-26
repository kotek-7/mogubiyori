// Original dish-specific vector illustrations. No bitmap/network dependencies.
// Every coordinate is authored in a 480 × 360 card; details remain visible at 180 px.
const INK = '#202820',
  PAPER = '#fff5de',
  RED = '#df442d',
  BLUE = '#275bbb',
  GREEN = '#24624b'
const esc = (value) =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
const p = (d, fill, stroke = INK, width = 3) =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`
const e = (x, y, rx, ry, fill, stroke = INK, width = 3) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`
const r = (x, y, w, h, fill, radius = 8, stroke = INK, width = 3) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`
const g = (x, y, body, angle = 0, scale = 1) =>
  `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${body}</g>`
const line = (d, color = INK, width = 3) => p(d, 'none', color, width)
const spots = (points, fill, rx = 3, ry = 2) =>
  points.map(([x, y]) => e(x, y, rx, ry, fill, 'none', 0)).join('')
function plate(color = RED) {
  return (
    e(240, 239, 183, 72, '#d8c9a4', 'none', 0) +
    e(240, 211, 191, 98, color) +
    e(240, 207, 169, 80, PAPER) +
    e(240, 207, 151, 66, PAPER, '#dbc69b', 2)
  )
}
function bowl(liquid, color = BLUE) {
  return (
    e(240, 278, 119, 22, '#d8c9a4', 'none', 0) +
    p('M79 174Q88 290 240 297Q392 290 401 174Z', color) +
    e(240, 174, 161, 76, PAPER) +
    e(240, 174, 145, 62, liquid) +
    line('M116 247Q153 274 201 277', PAPER, 5)
  )
}
function tray() {
  return (
    r(63, 108, 355, 186, '#b8884b', 17) +
    r(77, 122, 327, 158, '#e1b879', 11) +
    line('M93 258H385M97 142H190', '#b17b3e', 2)
  )
}
function seed(x, y, angle = 0, fill = INK) {
  return g(x, y, e(0, 0, 1.7, 4, fill, 'none', 0), angle)
}
function berry(x, y, scale = 1) {
  return g(
    x,
    y,
    e(0, 0, 11, 10, '#485991') + p('M-4-2 0-5 4-2 2 3-2 3Z', '#7484b5', INK, 1),
    0,
    scale,
  )
}
function strawberry(x, y, scale = 1, angle = 0) {
  return g(
    x,
    y,
    p('M-20-14Q0-25 20-14Q22 3 0 24Q-22 3-20-14Z', RED) +
      p('M-18-15-8-20-3-14 3-21 8-15 18-16 4-9-5-10Z', GREEN) +
      spots(
        [
          [-8, -3],
          [7, -3],
          [-4, 8],
          [3, 15],
        ],
        '#f4d482',
        1.6,
        2.4,
      ),
    angle,
    scale,
  )
}
function banana(x, y, angle = 0, scale = 1) {
  return g(
    x,
    y,
    e(0, 0, 24, 16, '#f3db92') +
      e(0, 0, 15, 10, '#f7e7b8', '#d9b763', 1.5) +
      p('M-3-4 4-4 5 2 0 6-5 1Z', '#be9251', 'none', 0),
    angle,
    scale,
  )
}
function appleWedge(x, y, angle = 0, scale = 1) {
  return g(
    x,
    y,
    p('M-49-18Q-3-47 49-17Q30 20-16 25Q-41 22-49-18Z', '#bc4a2a') +
      p('M-43-16Q0-35 41-15Q23 13-15 17Q-35 15-43-16Z', '#edbd67') +
      line('M-32-12Q-7-24 18-17', '#ffe4a2', 3),
    angle,
    scale,
  )
}
function almond(x, y, angle = 0, scale = 1) {
  return g(
    x,
    y,
    p('M0-16Q17-4 0 17Q-15 3 0-16Z', '#ba793c') + line('M0-10Q4 0 0 11', '#794820', 2),
    angle,
    scale,
  )
}
function chickpea(x, y, scale = 1) {
  return g(
    x,
    y,
    p('M-12-5Q-10-16 2-14L9-9Q18-9 16 3Q14 16 0 14Q-16 13-12-5Z', '#dca143') +
      line('M-1-8Q-8 0-1 8', '#9d5c27', 2),
    0,
    scale,
  )
}
function flake(x, y, angle = 0) {
  return g(x, y, e(0, 0, 6, 3, '#d3ae6b', '#99783e', 1.2) + line('M-3 0H3', '#b28b49', 1), angle)
}
function cookie(x, y, angle = 0) {
  let out = e(0, 8, 53, 34, '#9f632c') + e(0, 0, 53, 34, '#c9954b')
  for (const [sx, sy, sa] of [
    [-28, -8, -20],
    [-11, -19, 20],
    [18, -16, 40],
    [31, 4, -20],
    [12, 19, 25],
    [-24, 16, -35],
    [-2, 0, 15],
  ])
    out += flake(sx, sy, sa)
  out += spots(
    [
      [-20, 0],
      [4, -16],
      [22, 6],
      [-1, 17],
    ],
    '#6d3e29',
    4,
    3,
  )
  return g(x, y, out, angle)
}
function cube(x, y, size = 36, fill = '#61402d', side = '#3d281f', top = '#855436', angle = 0) {
  return g(
    x,
    y,
    p(`M-${size} 0 0-${size * 0.42} ${size} 0 0 ${size * 0.48}Z`, top) +
      p(`M-${size} 0 0 ${size * 0.48} 0 ${size * 1.32}-${size} ${size * 0.84}Z`, fill) +
      p(`M0 ${size * 0.48} ${size} 0 ${size} ${size * 0.84} 0 ${size * 1.32}Z`, side),
    angle,
  )
}
function scoop(x, y, fill = '#ead2d4', scale = 1) {
  return g(
    x,
    y,
    p(
      'M-47 20Q-59-1-41-16Q-43-42-16-43Q1-59 23-41Q51-41 50-16Q70 2 47 22Q35 40 9 33Q-13 43-32 28Q-45 34-47 20Z',
      fill,
    ) +
      line('M-35-10Q-27-28-10-30M15-28Q33-27 38-12', '#f9e9df', 5) +
      spots(
        [
          [-20, 5],
          [12, -12],
          [28, 16],
        ],
        '#c65c68',
        4,
        3,
      ),
    0,
    scale,
  )
}
function porridgeSurface(fill, details) {
  return (
    bowl(fill, GREEN) +
    details +
    line('M376 202 422 135', '#a4763c', 13) +
    line('M378 200 422 135', '#e0b776', 8) +
    e(373, 207, 15, 9, '#e0b776')
  )
}

const art = {
  'r-mini-sweet-potato-cakes': () => {
    const boat = (x, y, a) =>
      g(
        x,
        y,
        p('M-70 8Q-70-18-29-34Q0-48 45-24Q68-14 70 8Q54 36 0 37Q-53 34-70 8Z', '#cc8f31') +
          p('M-65 0Q-52-31 0-36Q52-31 65 0Q50 23 0 26Q-51 23-65 0Z', '#e6bd52') +
          line('M-45-3Q-3-18 41-1M-44 6Q0-9 43 8M-26-18Q0-22 25-15', '#b7802c', 2.3) +
          [
            [0, -4],
            [-15, 1],
            [16, 3],
            [5, -14],
          ]
            .map(([sx, sy], i) => seed(sx, sy, i * 28))
            .join(''),
        a,
      )
    return {
      family: 'sweet-potato-boats',
      body: plate(BLUE) + boat(181, 161, -16) + boat(299, 168, 18) + boat(239, 226, -3),
    }
  },
  'r-pan-daigaku-imo': () => {
    const chunk = (x, y, a) =>
      g(
        x,
        y,
        p('M-29-15 9-29 33-8 17 23-19 26Z', '#e8ad3e') +
          p('M-29-15-18 11 17 23-19 26Z', '#9c4936') +
          line('M-13-11 9-18 20-8', '#ffe092', 4) +
          seed(1, 0, 25) +
          seed(15, 7, -30),
        a,
      )
    return {
      family: 'glazed-potato-chunks',
      body:
        plate(GREEN) +
        [
          [157, 164, -10],
          [222, 146, 9],
          [289, 157, 40],
          [330, 204, 70],
          [265, 217, -30],
          [189, 222, 25],
          [224, 186, -2],
        ]
          .map(([x, y, a]) => chunk(x, y, a))
          .join(''),
    }
  },
  'r-mini-dorayaki': () => {
    const sandwich = (x, y, a) =>
      g(
        x,
        y,
        e(0, 18, 81, 35, '#b57230') +
          p('M-78 2Q0 34 78 2L76 20Q0 50-76 20Z', '#5b302a') +
          line('M-65 16Q-34 31-16 28M6 31Q30 28 62 17', '#8c4c3c', 4) +
          e(0, -2, 82, 34, '#b97836') +
          e(0, -5, 72, 27, '#cb9045', '#a76a2f', 2) +
          spots(
            [
              [-35, -13],
              [18, -17],
              [43, 4],
              [-10, 11],
            ],
            '#e4b36b',
            2,
            1.6,
          ),
        a,
      )
    return {
      family: 'dorayaki-sandwiches',
      body: plate(RED) + sandwich(183, 163, -12) + sandwich(298, 219, 10),
    }
  },
  'r-cocoa-mug-cake': () => {
    let cake = p(
      'M146 128Q135 101 156 96Q156 68 185 72Q205 47 230 68Q260 43 282 68Q311 61 321 96Q349 102 329 128Z',
      '#573427',
    )
    cake +=
      spots(
        [
          [170, 96],
          [204, 77],
          [246, 76],
          [289, 87],
          [315, 106],
          [227, 110],
        ],
        '#30221c',
        6,
        5,
      ) + line('M178 109Q190 88 208 94M261 91Q273 82 287 101', '#98603b', 3)
    return {
      family: 'cocoa-mug',
      body:
        e(244, 291, 127, 25, '#d8c9a4', 'none', 0) +
        p(
          'M321 142Q386 123 388 179Q389 227 328 230L327 208Q360 207 360 180Q360 158 330 165Z',
          RED,
        ) +
        p('M137 124 146 252Q149 283 237 285Q322 284 327 252L337 124Z', RED) +
        cake +
        e(237, 128, 100, 20, '#38251d') +
        line('M155 154 161 244', PAPER, 6) +
        p('M213 193Q223 178 237 191Q251 176 261 193Q261 207 237 221Q211 207 213 193Z', PAPER),
    }
  },
  'r-black-sesame-steamed-bread': () => {
    const cup = (x, y, a) =>
      g(
        x,
        y,
        p('M-65 0-50 77Q0 95 50 77L65 0Z', '#fff1c9') +
          [-40, -20, 0, 20, 40]
            .map((cx) => line(`M${cx * 1.3} 8 ${cx} 75`, '#b8a06d', 2))
            .join('') +
          p('M-67 0Q-73-26-50-39Q-30-66 0-49Q32-65 55-34Q75-18 65 0Q0 24-67 0Z', '#9a907a') +
          line('M-32-27-8-39 7-27 26-40 40-26', '#615a4d', 3) +
          [
            [-40, -20],
            [-18, -34],
            [12, -36],
            [40, -19],
            [-11, -5],
            [24, -7],
          ]
            .map(([sx, sy], i) => seed(sx, sy, i * 40, INK))
            .join(''),
        a,
      )
    return {
      family: 'sesame-paper-cups',
      body: plate(GREEN) + cup(170, 168, -8) + cup(304, 180, 9),
    }
  },
  'r-tofu-mitarashi-dango': () => {
    let out = plate(BLUE)
    for (const [x, y, a] of [
      [160, 143, -24],
      [225, 150, -11],
      [291, 153, 6],
    ]) {
      let skewer = line('M0-27V146', '#94713e', 6)
      for (let j = 0; j < 3; j++)
        skewer +=
          e(0, j * 44, 28, 25, '#f3e5b8') +
          p(
            `M-26 ${j * 44 - 4}Q-12 ${j * 44 - 18} 8 ${j * 44 - 8}Q23 ${j * 44 - 16} 27 ${j * 44 - 1}L24 ${j * 44 + 10}Q5 ${j * 44 + 2}-11 ${j * 44 + 11}L-25 ${j * 44 + 5}Z`,
            '#a56923',
            INK,
            1.5,
          ) +
          line(`M-15 ${j * 44 - 4}Q-3 ${j * 44 - 10} 7 ${j * 44 - 3}`, '#e7b963', 2)
      out += g(x, y, skewer, a)
    }
    return { family: 'mitarashi-skewers', body: out }
  },
  'r-shiratama-zenzai': () => {
    let out = bowl('#813a31', RED)
    for (const [x, y] of [
      [149, 160],
      [198, 129],
      [275, 129],
      [331, 163],
      [297, 205],
      [210, 210],
      [174, 193],
      [250, 181],
      [283, 167],
      [225, 151],
    ])
      out += g(x, y, e(0, 0, 9, 6, '#9f5140', INK, 1.3) + line('M-3-3 2 2', '#5f2925', 1))
    for (const [x, y] of [
      [171, 151],
      [229, 131],
      [290, 146],
      [321, 181],
      [254, 194],
      [202, 185],
    ])
      out += e(x, y, 22, 18, '#fff1d3') + e(x + 1, y - 2, 8, 5, '#e6d6b5', '#d1bd94', 1)
    return { family: 'zenzai-bowl', body: out }
  },
  'r-coffee-jelly': () => {
    let out =
      e(240, 286, 107, 22, '#d8c9a4', 'none', 0) +
      p('M128 139 142 249Q156 285 240 286Q324 285 338 249L352 139Z', '#e8e0c6') +
      e(240, 141, 112, 48, '#b9bdab')
    out +=
      cube(186, 160, 34, '#563526', '#37241c', '#795036', -8) +
      cube(278, 151, 35, '#573425', '#34221a', '#7b5033', 7) +
      cube(223, 201, 35, '#4e3024', '#32221d', '#77503a', 1) +
      cube(296, 213, 28, '#563527', '#38231b', '#80543b', -8)
    out +=
      p(
        'M150 157Q168 133 192 143Q218 117 245 139Q270 129 291 149Q279 163 264 172Q253 182 246 170Q249 153 229 151Q210 154 206 177Q197 182 191 170Q176 152 150 157Z',
        '#fff1d4',
        INK,
        2,
      ) + line('M147 186 155 238', '#fffaf0', 5)
    return { family: 'coffee-jelly-glass', body: out }
  },
  'r-mandarin-kanten': () => {
    let out =
      plate(BLUE) +
      p('M136 149 240 112 350 150 347 237 240 270 138 234Z', '#e79a37') +
      p('M136 149 240 188 350 150 240 112Z', '#f6bc52') +
      line('M240 188V270', '#aa652a', 2)
    for (const [x, y, a, s] of [
      [202, 151, -10, 0.8],
      [279, 158, 10, 0.85],
      [185, 210, -15, 0.65],
      [295, 213, 15, 0.65],
    ])
      out += g(
        x,
        y,
        p('M-29-8Q0-26 31-6Q18 24-9 19Q-26 14-29-8Z', '#f17b22', INK, 2) +
          line('M-20-5 0 14M-6-12 0 14M10-12 0 14M23-5 0 14', '#ffd88c', 2),
        a,
        s,
      )
    out += line('M149 175 153 220M260 194 329 169', '#ffe5a2', 4)
    return { family: 'mandarin-jelly-block', body: out }
  },
  'r-vanilla-milk-pudding': () => {
    let out =
      e(239, 285, 106, 24, '#d8c9a4', 'none', 0) +
      p('M136 145 150 255Q170 282 241 283Q313 281 331 255L346 145Z', '#f5e8cf') +
      e(241, 145, 105, 43, '#fff6df') +
      line('M153 174 163 249', '#ffffff', 6)
    out +=
      p(
        'M198 129Q218 111 244 123Q272 113 293 132Q300 150 274 155Q268 178 248 165Q225 178 211 163Q184 160 198 129Z',
        '#c44435',
        INK,
        2,
      ) +
      spots(
        [
          [213, 137],
          [251, 137],
          [271, 145],
          [236, 154],
        ],
        '#ef9771',
        3,
        2,
      )
    return { family: 'milk-pudding-cup', body: out }
  },
  'r-steamed-custard-pudding': () => {
    let out =
      plate(RED) +
      e(240, 237, 109, 42, '#9e5927', INK, 2) +
      p('M176 134Q239 109 304 134L325 231Q295 267 240 270Q181 267 155 231Z', '#eecf83') +
      p(
        'M176 134Q238 109 304 134L309 158Q298 172 288 160Q276 154 273 178Q260 190 251 169Q244 157 224 170Q209 171 201 154Q189 166 173 149Z',
        '#8c4825',
        INK,
        2,
      ) +
      e(240, 135, 64, 25, '#aa602c') +
      line('M174 190 181 227', '#fff1bc', 7)
    return { family: 'caramel-flan', body: out }
  },
  'r-yogurt-cheesecake-cup': () => {
    let out =
      e(240, 289, 105, 21, '#d8c9a4', 'none', 0) +
      p('M140 139 151 265Q241 304 330 265L340 139Z', '#f3e6c7') +
      p('M149 238Q240 270 333 238L330 265Q241 304 151 265Z', '#bd914e') +
      line('M156 245Q239 277 326 245', '#d6ac68', 3) +
      e(240, 140, 100, 40, '#f6ebd2')
    for (const [x, y] of [
      [212, 128],
      [239, 116],
      [264, 129],
      [230, 146],
      [258, 150],
      [286, 140],
    ])
      out += berry(x, y, 0.85)
    out += line('M156 178 164 229', '#fffaf0', 5)
    return { family: 'cheesecake-cup', body: out }
  },
  'r-apple-crumble': () => {
    let out =
      p('M108 166Q77 150 70 176Q67 208 105 210M372 166Q406 152 411 176Q414 206 377 210', BLUE) +
      p('M101 167 121 252Q237 303 360 252L380 167Z', BLUE) +
      e(240, 167, 139, 62, PAPER) +
      e(240, 166, 125, 49, '#dbaa62')
    for (const [x, y, a, s] of [
      [161, 155, -10, 0.5],
      [240, 139, 7, 0.55],
      [313, 162, 30, 0.5],
      [254, 189, -5, 0.5],
    ])
      out += appleWedge(x, y, a, s)
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 9; col++) {
        const x = 135 + col * 25 + (row % 2) * 9,
          y = 140 + row * 18
        if (((x - 240) / 117) ** 2 + ((y - 164) / 45) ** 2 < 1)
          out += p(
            `M${x - 7} ${y + 4} ${x - 8} ${y - 3} ${x} ${y - 7} ${x + 8} ${y - 1} ${x + 6} ${y + 7}Z`,
            (row + col) % 3 ? '#d5a04d' : '#a97935',
            INK,
            1.2,
          )
      }
    out += line('M139 245Q199 266 253 268', PAPER, 5)
    return { family: 'apple-crumble-dish', body: out }
  },
  'r-banana-oat-cookies': () => ({
    family: 'oat-cookies',
    body:
      plate(GREEN) +
      cookie(172, 149, -11) +
      cookie(282, 145, 9) +
      cookie(327, 202, 25) +
      cookie(150, 218, -8) +
      cookie(249, 227, 5),
  }),
  'r-caramel-popcorn': () => {
    let out = p('M108 157 139 279Q240 311 341 279L373 157Z', RED) + e(240, 157, 132, 58, PAPER)
    const kernel = (x, y, s) =>
      g(
        x,
        y,
        p(
          'M-9 10Q-22 8-15-5Q-22-18-6-21Q5-30 11-15Q27-18 23-3Q34 6 19 14Q10 29-1 19Q-13 23-9 10Z',
          '#ecc77c',
          INK,
          1.8,
        ) +
          p('M-4-5Q7-14 12-3Q20 7 8 12Q-4 16-7 5Z', '#bd8031', 'none', 0) +
          line('M-11-9-4-13', '#fff1bc', 2),
        0,
        s,
      )
    for (const [x, y, s] of [
      [215, 87, 0.91],
      [247, 81, 0.88],
      [278, 96, 0.86],
      [181, 103, 0.9],
      [234, 111, 0.94],
      [310, 119, 0.84],
      [151, 126, 0.84],
      [188, 134, 0.94],
      [270, 126, 0.9],
      [294, 147, 0.92],
      [332, 148, 0.83],
      [135, 155, 0.87],
      [165, 165, 0.88],
      [218, 144, 0.94],
      [245, 157, 0.9],
      [194, 176, 0.96],
      [276, 177, 0.92],
      [315, 179, 0.93],
      [151, 196, 0.87],
      [227, 196, 0.93],
      [251, 215, 0.92],
      [187, 214, 0.89],
      [287, 214, 0.94],
      [332, 203, 0.87],
      [351, 175, 0.79],
      [209, 116, 0.73],
      [255, 94, 0.72],
      [176, 189, 0.68],
      [304, 205, 0.74],
    ])
      out += kernel(x, y, s)
    out +=
      line('M118 187Q240 225 364 187', PAPER, 4) +
      p('M209 237 224 237 229 226 235 237 251 237 239 247 243 261 229 253 217 261 221 246Z', PAPER)
    return { family: 'caramel-popcorn-bowl', body: out }
  },
  'r-cinnamon-apple-saute': () => {
    let out = plate(GREEN)
    for (const [x, y, a, s] of [
      [156, 164, -25, 0.95],
      [235, 146, -5, 0.95],
      [315, 162, 20, 0.95],
      [202, 205, -18, 1],
      [286, 216, 12, 1],
    ])
      out += appleWedge(x, y, a, s)
    out +=
      p(
        'M126 243Q116 220 141 211Q160 198 176 219Q204 216 207 239Q191 260 163 257Q136 268 126 243Z',
        '#f7ebd2',
      ) +
      spots(
        [
          [185, 155],
          [234, 160],
          [291, 213],
          [207, 218],
          [304, 152],
        ],
        '#82502d',
        1.6,
        1.4,
      )
    return { family: 'apple-wedges-yogurt', body: out }
  },
  'r-banana-chocolate-springroll': () => {
    const roll = (x, y, a) =>
      g(
        x,
        y,
        p('M-108-26Q-114 0-108 25L93 27Q114 18 113-5Q112-27 93-27Z', '#d9a149') +
          p('M-108-26-83-12-101 10-108 25Q-121 0-108-26Z', '#edc377') +
          line('M-74-21 61 22M-42-24 91 21', '#ac7538', 2) +
          line('M-71-17 78-18', '#f5d18c', 4) +
          spots(
            [
              [-53, 9],
              [-4, -3],
              [47, 3],
              [81, -8],
            ],
            '#b47a38',
            3,
            2,
          ),
        a,
      )
    let out = plate(BLUE) + roll(230, 158, -13) + roll(244, 222, 9)
    out += g(
      344,
      230,
      e(0, 0, 22, 28, '#e3b362') +
        e(0, 0, 16, 21, '#4b2d20') +
        e(0, 0, 11, 15, '#f0d38a') +
        spots(
          [
            [-3, -4],
            [4, 2],
            [0, 6],
          ],
          '#ae8748',
          2,
          1.5,
        ),
      9,
    )
    return { family: 'banana-chocolate-rolls', body: out }
  },
  'r-kinako-bread-rusks': () => {
    let out = tray()
    for (const [x, y, a, s] of [
      [126, 154, -8, 24],
      [201, 143, 2, 25],
      [280, 155, -10, 25],
      [345, 156, 6, 22],
      [156, 215, 8, 26],
      [231, 210, -3, 27],
      [313, 221, 9, 25],
    ]) {
      out +=
        cube(x, y, s, '#c69b58', '#a77535', '#e2bd7b', a) +
        g(
          x,
          y,
          spots(
            [
              [-12, 0],
              [-2, -4],
              [7, 2],
              [13, -1],
            ],
            '#b48843',
            2,
            1.3,
          ),
          a,
        )
    }
    return { family: 'kinako-rusk-cubes', body: out }
  },
  'r-cheese-potato-mochi': () => {
    const mochi = (x, y, a) =>
      g(
        x,
        y,
        e(0, 13, 66, 34, '#b98336') +
          e(0, 0, 66, 37, '#e2be71') +
          p(
            'M-44-10Q-35-25-17-21Q4-35 23-20Q43-22 45-4Q28 3 15-4Q1 6-14-2Q-27 8-44-10Z',
            '#b57630',
            'none',
            0,
          ) +
          spots(
            [
              [-30, 12],
              [24, 15],
              [46, 5],
            ],
            '#be873b',
            3,
            2,
          ),
        a,
      )
    let out = plate(RED) + mochi(172, 157, -9) + mochi(299, 160, 10)
    const half =
      p('M-55 10Q-57-17-29-28Q3-41 22-14L23 28Q-3 43-32 31Z', '#d7b069') +
      p('M-48 4Q-43-19-21-24Q0-29 17-9L19 7Q-15 21-48 4Z', '#ba8539', 'none', 0) +
      p('M22-14 39-1 38 31 23 28Z', '#f0dfaf') +
      p('M25-4 34 2 34 24 26 21Z', '#e7bf4c', 'none', 0)
    out +=
      g(195, 228, half, -10) +
      `<g transform="translate(292 233) rotate(9) scale(-.86 .86)">${half}</g>`
    return { family: 'potato-mochi-rounds', body: out }
  },
  'r-pumpkin-mini-scones': () => {
    const scone = (x, y, a) =>
      g(
        x,
        y,
        p('M-63 22 12-59 69 28 58 56-58 49Z', '#c18731') +
          p('M-63 22 12-59 69 28 4 43Z', '#dca440') +
          line('M-43 23-7 4 15 9 34-4 50 23', '#a16c26', 3) +
          line('M-44 37-17 38 3 49 33 39 55 42', '#e9bb65', 4) +
          spots(
            [
              [-18, -1],
              [16, -19],
              [24, 22],
            ],
            '#f0c573',
            4,
            2,
          ),
        a,
      )
    return {
      family: 'pumpkin-scone-triangles',
      body: plate(BLUE) + scone(163, 175, -16) + scone(295, 173, 15) + scone(237, 229, -4),
    }
  },
  'r-spiced-roasted-chickpeas': () => {
    let out = bowl('#ba873d', GREEN)
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 8; col++) {
        const x = 130 + col * 31 + (row % 2) * 9 + ((row * 7 + col * 3) % 9) - 4,
          y = 131 + row * 22 + ((col * 5 + row * 3) % 9) - 4
        if (((x - 240) / 131) ** 2 + ((y - 177) / 53) ** 2 < 1) out += chickpea(x, y, 0.74)
      }
    out += spots(
      [
        [168, 171],
        [267, 137],
        [287, 192],
        [220, 190],
        [312, 163],
      ],
      '#a14828',
      2,
      1.7,
    )
    return { family: 'roasted-chickpeas-bowl', body: out }
  },
  'r-nut-chocolate-bark': () => {
    let out = tray()
    const shard = (x, y, a) =>
      g(
        x,
        y,
        p('M-65-36-18-50 31-28 72-9 44 22 19 50-35 28-59 10Z', '#482c23') +
          line('M-50 5-27 17 13 35', '#79513a', 3) +
          almond(-27, -20, 35, 0.75) +
          almond(27, 0, -28, 0.75) +
          p('M-12 9-4 1 8 8 3 22-9 24Z', '#d9a361', INK, 1.3) +
          e(37, 20, 8, 6, '#a7423d', INK, 1.5) +
          e(-41, 3, 7, 5, '#a7423d', INK, 1.5),
        a,
      )
    return {
      family: 'nut-chocolate-shards',
      body: out + shard(161, 166, -8) + shard(287, 165, 14) + shard(235, 228, -4),
    }
  },
  'r-berry-frozen-yogurt': () => ({
    family: 'frozen-yogurt-scoops',
    body:
      bowl('#e6bdc9', BLUE) +
      scoop(200, 133, '#e9c8ce', 0.9) +
      scoop(284, 137, '#f0d8db', 0.88) +
      scoop(246, 194, '#e4bdca', 0.94),
  }),
  'r-brown-sugar-kuzumochi': () => {
    let out = plate(GREEN)
    for (const [x, y, a, s] of [
      [166, 148, -6, 35],
      [243, 135, 8, 35],
      [317, 164, -6, 33],
      [196, 212, 5, 35],
      [277, 217, -7, 36],
    ]) {
      out +=
        cube(x, y, s, '#91633f', '#6d472e', '#bd985d', a) +
        g(
          x,
          y,
          spots(
            [
              [-17, 0],
              [-9, -5],
              [0, 1],
              [10, -4],
              [20, 1],
              [-4, 9],
            ],
            '#d1b477',
            3,
            2,
          ),
          a,
        )
    }
    return { family: 'kinako-kuzu-cubes', body: out }
  },
  'r-sesame-rice-crackers': () => {
    const cracker = (x, y, a, s) =>
      g(
        x,
        y,
        p('M-81-16-50-40-16-47 35-35 74-6 70 24 37 43-6 49-48 32-76 12Z', '#d4a257') +
          line('M-64 10-23 28 22 23 56 5', '#efc984', 3) +
          [
            [0, -19],
            [-26, -16],
            [29, -7],
            [-49, 4],
            [-14, 3],
            [13, 12],
            [44, 15],
            [-24, 26],
          ]
            .map(([sx, sy], i) => seed(sx, sy, i * 32, '#805624'))
            .join('') +
          spots(
            [
              [-40, -7],
              [3, 0],
              [27, 24],
              [46, -5],
            ],
            '#a87836',
            3,
            2,
          ),
        a,
        s,
      )
    return {
      family: 'thin-sesame-crackers',
      body:
        tray() +
        cracker(177, 167, -17, 0.85) +
        cracker(296, 159, 13, 0.8) +
        cracker(248, 225, -1, 1),
    }
  },
  'r-apple-oat-porridge': () => {
    let details = ''
    for (const [x, y, a] of [
      [155, 170, -20],
      [196, 147, 5],
      [239, 199, -10],
      [296, 157, 15],
      [322, 187, -20],
      [171, 204, 15],
      [249, 152, 25],
    ])
      details += flake(x, y, a)
    for (const [x, y, a, s] of [
      [180, 167, -15, 0.52],
      [244, 139, 0, 0.5],
      [293, 192, 20, 0.55],
    ])
      details += appleWedge(x, y, a, s)
    details +=
      g(
        223,
        194,
        p('M-18-4-8-14 4-8 13-16 24-3 18 10 5 16-5 7-18 13Z', '#b88b49', INK, 2) +
          line('M-8-5 2 4 14-4', '#77502b', 2),
      ) +
      spots(
        [
          [207, 164],
          [274, 159],
          [251, 188],
        ],
        '#875329',
        1.5,
        1.3,
      )
    return { family: 'apple-oat-bowl', body: porridgeSurface('#dfc6a0', details) }
  },
  'r-tomato-oat-risotto': () => {
    let details = ''
    for (let i = 0; i < 20; i++) {
      const x = 139 + (i % 6) * 35,
        y = 140 + Math.floor(i / 6) * 20
      if (((x - 240) / 127) ** 2 + ((y - 174) / 50) ** 2 < 1)
        details += g(x, y, e(0, 0, 7, 3, '#dfb36e', '#ba7945', 1), i * 27)
    }
    details +=
      p('M157 161 180 151 191 169 175 183 158 177Z', RED, INK, 1.5) +
      p('M276 177 302 165 316 184 295 199 278 193Z', RED, INK, 1.5) +
      line('M208 139 222 147M239 151 252 145M201 186 213 180M259 207 273 202', '#f2d798', 4) +
      p('M233 169 226 158 234 151 241 159 250 155 255 164 247 174Z', GREEN, INK, 1.5)
    return { family: 'tomato-oat-bowl', body: porridgeSurface('#d47a46', details) }
  },
  'r-overnight-banana-oats': () => {
    let out =
      e(240, 291, 98, 20, '#d8c9a4', 'none', 0) +
      r(151, 103, 179, 174, '#dfceb0', 20) +
      e(240, 105, 89, 35, '#eee0c0') +
      line('M158 230Q240 253 325 230', '#b79f74', 3) +
      line('M167 146V240', '#fff4dc', 5)
    for (const [x, y, a] of [
      [194, 156, 20],
      [229, 186, -10],
      [288, 209, 20],
      [203, 226, 0],
      [288, 153, 40],
      [258, 251, -15],
    ])
      out += flake(x, y, a)
    out +=
      banana(204, 101, -12, 0.9) +
      banana(251, 115, 12, 0.9) +
      banana(285, 90, 20, 0.8) +
      g(239, 77, p('M-16-5-6-13 5-7 12-14 23-2 17 9 5 13-6 6-17 11Z', '#b88b49', INK, 2)) +
      line('M190 110Q238 81 293 105', '#bb812c', 4)
    return { family: 'overnight-oats-jar', body: out }
  },
  'r-berry-yogurt-granola': () => {
    let out = bowl('#f6ecd6', RED)
    out += p('M130 171Q151 131 206 124Q224 147 214 188Q171 209 139 198Z', '#b38a46', INK, 1.8)
    for (let i = 0; i < 17; i++) {
      const x = 146 + (i % 4) * 18,
        y = 143 + Math.floor(i / 4) * 14
      if (((x - 177) / 42) ** 2 + ((y - 171) / 43) ** 2 < 1) out += flake(x, y, i * 41)
    }
    out +=
      strawberry(247, 152, 0.85, -14) +
      strawberry(294, 183, 0.9, 18) +
      strawberry(307, 139, 0.75, 10) +
      berry(221, 205, 0.9) +
      berry(255, 207, 0.9) +
      berry(286, 219, 0.8) +
      almond(170, 193, 65, 0.6) +
      almond(192, 175, -30, 0.6)
    return { family: 'berry-yogurt-bowl', body: out }
  },
  'r-oat-cabbage-pancake': () => {
    let out = plate(RED) + e(240, 211, 136, 63, '#aa7230') + e(240, 197, 136, 63, '#c79a4c')
    out +=
      line(
        'M147 195 180 179 219 188 247 166M174 224 211 213 242 225 278 205M264 166 293 176 325 170',
        '#749048',
        5,
      ) +
      line('M149 182Q214 167 312 196M151 204Q229 181 325 219M174 226Q241 215 297 234', '#65412a', 9)
    for (const [x, y, a] of [
      [177, 181, -20],
      [221, 173, 10],
      [270, 192, 20],
      [237, 216, -10],
      [288, 217, 25],
    ])
      out += g(x, y, p('M-16-4Q-6-12 9-4L16 6Q2 0-9 9Z', '#c2a277', INK, 1), a)
    return { family: 'oat-cabbage-pancake', body: out }
  },
}

// New bakery IDs are opt-in: the original pack keeps its existing illustrations.
const bakeryIds = new Set([
  'r-butter-croissant',
  'r-plain-kettle-bagel',
  'r-cookie-crust-melonpan',
  'r-azuki-anpan',
  'r-custard-cream-pan',
  'r-baked-curry-pan',
  'r-salt-butter-roll',
  'r-mini-pullman-loaf',
  'r-mini-brioche',
  'r-small-baguette',
  'r-rustic-ciabatta',
  'r-rosemary-focaccia',
  'r-rye-small-boule',
  'r-yogurt-soda-bread',
  'r-baking-soda-pretzel',
  'r-pan-english-muffin',
  'r-puffed-pita-bread',
  'r-yogurt-skillet-naan',
  'r-pao-de-queijo',
  'r-skillet-cornbread',
  'r-classic-blt-sandwich',
  'r-chicken-club-sandwich',
  'r-pork-katsu-sandwich',
  'r-pork-banh-mi',
  'r-corned-beef-reuben',
  'r-pulled-pork-bun',
  'r-crispy-fish-burger',
  'r-baked-falafel-pita',
  'r-tuna-pan-bagnat',
  'r-classic-hot-dog',
  'r-butter-breakfast-waffles',
  'r-skillet-dutch-baby',
  'r-griddle-crumpets',
  'r-oven-maple-granola',
  'r-quinoa-milk-porridge',
  'r-creamy-breakfast-polenta',
  'r-cooked-egg-benedict',
  'r-egg-bean-breakfast-burrito',
  'r-tomato-pepper-menemen',
  'r-savory-bread-strata',
  'r-strawberry-shortcake',
  'r-vanilla-chiffon',
  'r-dark-gateau-chocolat',
  'r-mini-basque-cheesecake',
  'r-spiced-carrot-cake',
  'r-lemon-pound-cake',
  'r-cream-sponge-roll',
  'r-banana-bread-loaf',
  'r-walnut-chocolate-brownie',
  'r-browned-butter-financier',
  'r-shell-madeleine',
  'r-mini-vanilla-canele',
  'r-mini-tarte-tatin',
  'r-lemon-meringue-tart',
  'r-pear-almond-tart',
  'r-mini-pecan-pie',
  'r-custard-egg-tarts',
  'r-crisp-palmiers',
  'r-custard-millefeuille',
  'r-almond-galette-des-rois',
  'r-chocolate-chip-cookies',
  'r-butter-shortbread',
  'r-almond-snowball-cookies',
  'r-almond-biscotti',
  'r-langue-de-chat',
  'r-almond-florentines',
  'r-chocolate-ganache-macarons',
  'r-ginger-snap-biscuits',
  'r-crisp-meringue-kisses',
  'r-folded-fortune-cookies',
  'r-cream-panna-cotta',
  'r-mango-pudding-cup',
  'r-eggless-cup-tiramisu',
  'r-airy-chocolate-mousse',
  'r-caramel-creme-brulee',
  'r-lemon-granita',
  'r-vanilla-milk-icecream',
  'r-cinnamon-rice-pudding',
  'r-coconut-tapioca-dessert',
  'r-poached-pear-dessert',
  'r-azuki-daifuku',
  'r-kanto-sakura-mochi',
  'r-kinako-warabi-mochi',
  'r-fruit-anmitsu',
  'r-azuki-ohagi',
  'r-honey-castella',
  'r-azuki-taiyaki',
  'r-small-egg-boro',
  'r-brown-sugar-karinto',
  'r-azuki-mizu-yokan',
  'r-custard-cream-puffs',
  'r-cinnamon-churros',
  'r-old-fashioned-doughnuts',
  'r-pistachio-baklava',
  'r-sesame-halva',
  'r-tres-leches-cake',
  'r-berry-pavlova',
  'r-raisin-bread-pudding',
  'r-orange-crepes-suzette',
  'r-layered-mille-crepe',
])
const BREAD = '#d69a49',
  CRUST = '#a7652e',
  CRUMB = '#f4dca0'
function breadOval(x, y, w = 74, h = 41, color = BREAD) {
  return e(x, y + 9, w, h, CRUST) + e(x, y, w, h, color)
}
function crumbMarks(x, y, count = 11) {
  return Array.from({ length: count }, (_, i) =>
    e(x + ((i * 29) % 101) - 50, y + ((i * 17) % 43) - 21, 2.5, 1.5, '#b28b50', 'none', 0),
  ).join('')
}
function croissant(x, y, scale = 1) {
  return g(
    x,
    y,
    p(
      'M-121 31Q-131-3-101-36Q-64-72-5-72Q59-73 104-34Q132-6 120 32Q90 8 72 8Q51 29 0 32Q-49 30-73 7Q-95 8-121 31Z',
      BREAD,
    ) +
      p('M-49-60Q-11-82 27-65L42 17Q19 36-13 26Z', '#eac071') +
      line(
        'M-89-41Q-82-13-59 15M-61-57Q-60-18-37 24M-16-71Q-17-18 7 30M30-65Q31-20 48 19M66-53Q72-15 82 12',
        CRUST,
        4,
      ) +
      line('M-111 8Q-115-7-101-21M104-13Q117 4 117 17', '#f6d791', 4),
    -8,
    scale,
  )
}
function ringBread(x, y, scale = 1, fill = BREAD) {
  return g(
    x,
    y,
    e(0, 9, 93, 53, CRUST) +
      e(0, 0, 93, 53, fill) +
      e(0, 1, 31, 21, CRUST) +
      e(0, 6, 24, 14, PAPER) +
      line('M-64-23Q-46-39-19-40M34-35Q60-29 73-12', '#f2cf87', 4),
    0,
    scale,
  )
}
function loaf(x, y, scale = 1, color = BREAD) {
  return g(
    x,
    y,
    p('M-108 38V-34Q-110-83-73-84Q-39-96-3-80Q39-97 74-82Q108-72 108-31V36Q6 68-108 38Z', color) +
      line('M-43-77Q-33-41-37 48M36-80Q28-43 38 46', CRUST, 3),
    0,
    scale,
  )
}
function baguette(x, y, scale = 1) {
  return g(
    x,
    y,
    p('M-158 9Q-132-34-36-39Q82-42 152-9Q174 9 139 29Q31 57-92 39Q-146 33-158 9Z', BREAD) +
      [-95, -39, 17, 73]
        .map((k) =>
          p(`M${k - 10} 17Q${k - 1}-17 ${k + 28}-21Q${k + 13} 2 ${k + 4} 27Z`, CRUMB, CRUST, 2),
        )
        .join(''),
    -15,
    scale,
  )
}
function cakeSlice(x, y, fill = '#efd39a', frosting = null, layers = 1) {
  let out =
    p('M-99-18 37-70 117-15 109 69-95 58Z', fill) +
    p('M-99-18 37-70 117-15-10 25Z', frosting || fill) +
    line('M-10 25-9 78', '#b78045', 2)
  for (let i = 1; i < layers; i++)
    out += p(
      `M-96 ${-8 + (i * 61) / layers}-10 ${30 + (i * 48) / layers} 113 ${-6 + (i * 68) / layers}V${5 + (i * 68) / layers}L-10 ${39 + (i * 48) / layers}-96 ${1 + (i * 61) / layers}Z`,
      PAPER,
      'none',
      0,
    )
  if (frosting) out += p('M-99-18 37-70 117-15 112-1-10 39-97-5Z', frosting)
  return g(x, y, out)
}
function tart(x, y, fill = '#e6bd66', size = 1) {
  return g(
    x,
    y,
    e(0, 13, 107, 52, CRUST) +
      e(0, 0, 111, 49, BREAD) +
      e(0, -2, 92, 37, fill) +
      Array.from({ length: 17 }, (_, i) => {
        const t = (Math.PI * 2 * i) / 17
        return line(
          `M${Math.cos(t) * 104} ${Math.sin(t) * 44}l${Math.cos(t) * 7} ${Math.sin(t) * 5}`,
          '#8b5129',
          2,
        )
      }).join(''),
    0,
    size,
  )
}
function cookiePiece(x, y, fill = '#c99049', shape = 'round') {
  return g(x, y, shape === 'square' ? r(-38, -24, 76, 48, fill, 5) : e(0, 0, 46, 30, fill))
}
function dessertCup(fill, topping = '') {
  return (
    p('M136 133 164 284Q242 310 316 284L345 133Z', '#f6ebd2') +
    p('M147 164 170 273Q241 294 309 274L334 164Z', fill) +
    e(241, 166, 94, 40, fill) +
    line('M165 186 181 261', '#fff5de', 6) +
    topping +
    e(241, 133, 105, 43, 'none')
  )
}
function whipped(x, y, scale = 1, fill = PAPER) {
  return g(
    x,
    y,
    p(
      'M-47 20Q-50 6-30-3Q-34-19-14-24Q-17-39 7-45Q30-25 24-11Q48-8 42 10Q60 28 22 32Q-24 39-47 20Z',
      fill,
    ),
    0,
    scale,
  )
}
function walnut(x, y, angle = 0, scale = 1) {
  return g(
    x,
    y,
    p('M-20-10Q-24-26-7-22Q5-30 17-17Q31-10 22 3Q26 20 7 19Q-7 27-18 12Q-29 9-20-10Z', '#b48046') +
      line('M-9-15-4-7-12 0-4 10M8-14 3-6 13 2 5 13', '#704524', 2),
    angle,
    scale,
  )
}
function newBakeryArt(recipe) {
  if (!bakeryIds.has(recipe.id)) return null
  const id = recipe.id,
    a = recipe.art
  let out = plate(BLUE)
  if (id === 'r-butter-croissant') {
    out = tray() + croissant(233, 182, 1.07)
  } else if (id === 'r-plain-kettle-bagel') {
    out = tray() + ringBread(186, 156, 0.93) + ringBread(290, 223, 0.83)
  } else if (id === 'r-baking-soda-pretzel') {
    const shape =
      'M162 221C63 173 126 83 190 135L282 221C323 267 387 189 342 148C299 94 278 145 232 201C191 262 128 269 126 207C121 151 168 114 217 148L304 215'
    out = tray() + line(shape, INK, 34) + line(shape, '#9c5229', 27) + line(shape, '#c48237', 16)
    out += spots(
      [
        [150, 160],
        [174, 138],
        [197, 162],
        [251, 196],
        [288, 225],
        [335, 168],
        [298, 149],
        [169, 234],
      ],
      PAPER,
      3,
      2,
    )
  } else if (id === 'r-cookie-crust-melonpan') {
    out = tray()
    for (const [x, y] of [
      [168, 165],
      [301, 218],
    ])
      out +=
        breadOval(x, y, 83, 53, '#e6c879') +
        line(`M${x - 64} ${y - 26}l100 58m-69-85 103 62m-136-4 117-37m-96 72 127-39`, '#b78640', 3)
  } else if (id === 'r-azuki-anpan') {
    out = tray() + breadOval(179, 180, 87, 55) + breadOval(304, 215, 65, 43)
    for (let i = 0; i < 14; i++) out += seed(170 + ((i * 11) % 33), 164 + ((i * 7) % 20), i * 29)
    out +=
      p('M255 211Q302 172 353 209L344 246Q300 268 260 242Z', CRUMB) + e(303, 221, 31, 20, '#684032')
  } else if (id === 'r-custard-cream-pan') {
    out =
      tray() + p('M115 211Q95 119 191 105Q264 90 335 125Q382 158 354 222Q239 265 115 211Z', BREAD)
    out += line('M145 116 164 159M201 104 214 148M258 110 264 156M311 125 305 167', CRUST, 5)
    out += line('M139 199Q235 242 332 211', '#f2cf87', 4)
  } else if (id === 'r-baked-curry-pan') {
    out = tray() + breadOval(232, 181, 138, 68, '#b8762d')
    for (let i = 0; i < 65; i++) {
      const x = 124 + ((i * 47) % 220),
        y = 129 + ((i * 29) % 104)
      if (((x - 232) / 123) ** 2 + ((y - 181) / 54) ** 2 < 1)
        out += line(`M${x} ${y}l5-2`, i % 2 ? '#efbb61' : '#75411f', 2)
    }
  } else if (id === 'r-salt-butter-roll') {
    out = tray()
    for (const [x, y, angle] of [
      [177, 164, -20],
      [291, 218, 12],
    ])
      out += g(
        x,
        y,
        p('M-76 15Q-71-25-27-35Q11-57 47-22L76 16Q26 57-39 37Z', BREAD) +
          line('M-48-21Q-45 15-23 39M-16-38Q-15 10 8 43M21-37Q26 2 43 33', CRUST, 3) +
          spots(
            [
              [-31, 3],
              [-1, -10],
              [13, 18],
              [34, 4],
            ],
            PAPER,
            3,
            2,
          ),
        angle,
      )
  } else if (id === 'r-mini-pullman-loaf') {
    out =
      tray() +
      loaf(226, 180, 1.05) +
      g(
        326,
        227,
        p('M-39-45Q-39-64 0-58Q40-65 42-41V37H-40Z', CRUST) +
          p('M-29-39Q-29-49 1-47Q30-52 32-38V27H-30Z', CRUMB) +
          crumbMarks(0, 0, 5),
        8,
      )
  } else if (id === 'r-mini-brioche') {
    out = tray() + breadOval(185, 197, 77, 54) + breadOval(309, 210, 64, 46)
    out +=
      e(185, 134, 33, 28, '#dfa65a') +
      e(309, 157, 29, 23, '#dfa65a') +
      line('M137 177Q151 189 155 224M222 171Q210 186 215 225M274 193Q285 205 283 239', CRUST, 3)
  } else if (id === 'r-small-baguette') {
    out = tray() + baguette(240, 183, 1.05)
  } else if (id === 'r-rustic-ciabatta') {
    out =
      tray() +
      p('M106 144Q99 123 141 116L332 111Q363 118 367 150L352 226Q239 258 123 227Z', CRUST) +
      p('M107 142Q156 106 236 117Q332 101 365 145L351 205Q234 235 121 207Z', BREAD) +
      spots(
        [
          [144, 148],
          [195, 161],
          [235, 143],
          [282, 173],
          [324, 145],
          [163, 190],
          [260, 199],
        ],
        '#f4dfb2',
        8,
        3,
      )
  } else if (id === 'r-rosemary-focaccia') {
    out =
      tray() +
      r(104, 139, 278, 111, CRUST, 13) +
      p('M104 138 339 112 380 151 143 183Z', BREAD) +
      p('M143 183 380 151V232L143 260Z', '#e2b266')
    for (let i = 0; i < 16; i++) {
      const x = 131 + ((i * 59) % 212),
        y = 137 + ((i * 13) % 28)
      out += e(x, y, 6, 4, CRUST)
      out += line(`M${x + 3} ${y - 6}l9-7m-5 4-7-3`, GREEN, 2)
    }
  } else if (id === 'r-rye-small-boule' || id === 'r-yogurt-soda-bread') {
    const rye = id === 'r-rye-small-boule'
    out =
      tray() +
      breadOval(240, 190, 135, 78, rye ? '#9c733f' : '#bd914f') +
      p('M137 159Q234 153 351 181L334 192Q231 173 136 174Z', rye ? '#d6b777' : '#eee0b2') +
      p('M226 116 242 117 249 258 230 258Z', rye ? '#d6b777' : '#eee0b2') +
      crumbMarks(230, 196, 23)
  } else if (id === 'r-pan-english-muffin' || id === 'r-griddle-crumpets') {
    out = tray() + breadOval(175, 173, 86, 37, '#c8a365') + breadOval(291, 224, 82, 34, '#d9b777')
    if (id === 'r-griddle-crumpets')
      for (let i = 0; i < 47; i++)
        out += e(122 + ((i * 19) % 108), 152 + ((i * 11) % 35), 3, 4, '#8c632d', 'none', 0)
    else
      out +=
        line('M98 181Q175 205 249 182M215 231Q287 251 365 231', '#e9d2a5', 6) +
        crumbMarks(175, 167, 24)
  } else if (id === 'r-puffed-pita-bread') {
    out =
      tray() +
      breadOval(224, 174, 140, 58, '#e0bd76') +
      p('M120 205Q209 175 319 198Q275 271 127 251Z', '#d7b474') +
      p('M133 212Q216 183 309 204Q229 234 141 236Z', '#513724') +
      crumbMarks(230, 168, 23)
  } else if (id === 'r-yogurt-skillet-naan') {
    out =
      tray() +
      p('M121 220Q84 144 236 102Q279 85 295 117Q323 176 376 222Q278 287 121 220Z', '#e7ca88')
    out += spots(
      [
        [163, 180],
        [195, 138],
        [248, 149],
        [277, 199],
        [310, 232],
        [193, 226],
        [233, 199],
      ],
      '#93602d',
      13,
      6,
    )
  } else if (id === 'r-pao-de-queijo') {
    out = tray()
    for (const [x, y] of [
      [161, 160],
      [288, 150],
      [220, 220],
      [329, 225],
    ])
      out +=
        breadOval(x, y, 47, 37, '#edca7a') + line(`M${x - 23} ${y - 13}l17-7m3 21 18-2`, CRUST, 2)
  } else if (id === 'r-skillet-cornbread') {
    out = plate(RED) + cakeSlice(234, 186, '#e0bd62') + crumbMarks(228, 213, 20)
  } else if (
    [
      'r-classic-blt-sandwich',
      'r-chicken-club-sandwich',
      'r-pork-katsu-sandwich',
      'r-corned-beef-reuben',
    ].includes(id)
  ) {
    const meat =
      id === 'r-pork-katsu-sandwich'
        ? '#af712f'
        : id === 'r-corned-beef-reuben'
          ? '#9a6552'
          : '#c88769'
    const levels = id === 'r-chicken-club-sandwich' ? 3 : 2
    out = tray()
    for (const [x, y, angle] of [
      [169, 173, -10],
      [309, 211, 8],
    ]) {
      let piece = p('M-57-48 67 26-50 61Z', CRUST) + p('M-46-31 46 25-40 49Z', CRUMB)
      for (let k = 0; k < levels; k++)
        piece += line(
          `M${-47 + k * 4} ${-21 + k * 22}l${72 - k * 14} ${43 - k * 6}`,
          k === 0
            ? meat
            : k === 1
              ? id === 'r-corned-beef-reuben'
                ? '#e3d5a7'
                : GREEN
              : '#efc64d',
          10,
        )
      if (id === 'r-corned-beef-reuben') piece += line('M-40-5 17 29', '#e6c567', 6)
      else if (id !== 'r-pork-katsu-sandwich') piece += line('M-40-5 17 29', RED, 6)
      out += g(x, y, piece, angle)
    }
  } else if (['r-pork-banh-mi', 'r-classic-hot-dog'].includes(id)) {
    out =
      tray() +
      g(
        242,
        187,
        p('M-151-5Q-145-51-50-51L111-34Q166-22 147 22Q85 67-108 38Z', BREAD) +
          p('M-133-4Q-12-34 132-1Q52 41-115 20Z', CRUMB),
        -12,
      )
    if (id === 'r-classic-hot-dog')
      out += g(
        241,
        180,
        r(-122, -16, 244, 37, '#b95030', 20) +
          line('M-92-5Q-70 22-48-5T-4-5T40-5T84-5', '#e9bb35', 5),
        -12,
      )
    else
      out +=
        line('M121 193 347 148', GREEN, 13) +
        line('M131 204 343 159', '#b67a56', 19) +
        line('M153 179 308 156M144 200 276 177', '#eb8b37', 4)
  } else if (['r-pulled-pork-bun', 'r-crispy-fish-burger', 'r-tuna-pan-bagnat'].includes(id)) {
    out =
      plate(RED) +
      breadOval(240, 237, 131, 36) +
      p(
        'M105 205Q120 195 137 210L153 193 177 207 202 194 228 208 254 194 282 208 311 192 337 207 366 197L369 221H108Z',
        GREEN,
      )
    if (id === 'r-pulled-pork-bun') {
      out += e(240, 197, 126, 36, '#97562f')
      for (let i = 0; i < 29; i++)
        out += line(`M${124 + ((i * 37) % 224)} ${175 + ((i * 17) % 40)}l22-8`, '#d29b68', 3)
    } else if (id === 'r-crispy-fish-burger')
      out +=
        r(118, 172, 246, 40, '#ba7b32', 10) +
        spots(
          [
            [143, 182],
            [173, 194],
            [223, 181],
            [282, 190],
            [322, 184],
          ],
          '#edbf66',
          5,
          3,
        ) +
        line('M127 168Q229 204 350 167', PAPER, 12)
    else
      out +=
        line('M128 194 344 187', '#b08864', 16) +
        e(183, 177, 32, 17, PAPER) +
        e(183, 177, 14, 10, '#e8b635') +
        e(289, 183, 35, 15, RED)
    out +=
      p('M101 167Q106 94 238 87Q367 93 379 166Q240 204 101 167Z', BREAD) +
      line('M132 140Q165 111 212 110', '#f2d594', 6)
  } else if (id === 'r-baked-falafel-pita') {
    out =
      plate(RED) +
      p('M127 148Q236 64 353 147L333 262Q235 288 144 253Z', BREAD) +
      p('M143 155Q246 97 338 157L319 236 162 235Z', CRUMB) +
      line('M157 175 201 151 241 175 280 150 326 179', GREEN, 18)
    for (const [x, y] of [
      [186, 181],
      [267, 172],
      [239, 228],
    ])
      out += e(x, y, 35, 27, '#91632e') + crumbMarks(x, y, 4)
    out += line('M171 191Q240 171 302 212', PAPER, 8)
  } else if (id === 'r-egg-bean-breakfast-burrito') {
    out =
      tray() +
      g(
        230,
        184,
        p('M-112-42Q1-79 111-42L116 42Q4 78-113 42Z', '#e1c486') +
          e(107, 0, 24, 43, CRUMB) +
          e(111, 0, 17, 35, '#bf9659') +
          e(113, -12, 9, 10, '#e7bb35') +
          e(114, 14, 8, 8, '#744733') +
          line('M-74-28-46 36M-19-41 6 43', '#b18445', 3),
        -15,
      )
  } else if (id === 'r-butter-breakfast-waffles') {
    out = plate(RED)
    for (const [x, y, angle] of [
      [198, 178, -13],
      [288, 211, 14],
    ]) {
      let part = r(-72, -52, 144, 104, '#d39a3f', 9)
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 3; j++) part += r(-60 + i * 31, -40 + j * 29, 23, 21, '#f1c872', 2)
      out += g(x, y, part, angle)
    }
    out +=
      p('M228 167 264 156 280 174 242 187Z', '#f7df8e') +
      line('M155 202Q191 178 225 201T310 202', '#a36625', 5)
  } else if (id === 'r-skillet-dutch-baby') {
    out =
      e(239, 208, 150, 90, '#3d443c') +
      r(366, 186, 94, 26, '#3d443c', 9) +
      p(
        'M110 201Q112 112 155 145Q201 72 227 131Q281 69 304 133Q367 113 367 201Q237 286 110 201Z',
        BREAD,
      ) +
      e(240, 208, 108, 49, '#efcd77') +
      p('M266 194 321 169 310 215Z', '#f3d351')
    out += spots(
      [
        [168, 187],
        [213, 219],
        [256, 192],
        [290, 229],
        [315, 197],
      ],
      PAPER,
      3,
      2,
    )
  } else if (
    id === 'r-oven-maple-granola' ||
    id === 'r-quinoa-milk-porridge' ||
    id === 'r-creamy-breakfast-polenta' ||
    id === 'r-tomato-pepper-menemen'
  ) {
    out = bowl(
      id === 'r-tomato-pepper-menemen'
        ? '#c96937'
        : id === 'r-creamy-breakfast-polenta'
          ? '#edcc74'
          : PAPER,
      GREEN,
    )
    if (id === 'r-oven-maple-granola') {
      for (let i = 0; i < 45; i++)
        out += flake(128 + ((i * 47) % 220), 132 + ((i * 19) % 79), i * 32)
      for (const [x, y] of [
        [166, 150],
        [231, 182],
        [291, 145],
        [305, 198],
      ])
        out += almond(x, y, 25, 0.6)
    } else if (id === 'r-quinoa-milk-porridge') {
      for (let i = 0; i < 64; i++)
        out += e(127 + ((i * 31) % 220), 133 + ((i * 17) % 80), 2, 2, '#bd9b63', 'none', 0)
      out += p('M169 155 191 134 219 160 202 184Z', '#976f48') + walnut(276, 185, 40, 0.8)
    } else if (id === 'r-creamy-breakfast-polenta')
      out +=
        e(175, 163, 29, 19, RED) +
        e(298, 190, 27, 18, RED) +
        line('M196 205Q250 220 301 211', PAPER, 3)
    else
      out +=
        p(
          'M133 164Q148 139 179 155L200 139 222 171 242 148 282 170 316 156 340 183 303 211 261 195 220 220 181 203 142 211Z',
          '#ebbe4c',
        ) + line('M165 182 185 166M236 188 257 166M297 190 318 179', GREEN, 8)
  } else if (id === 'r-cooked-egg-benedict') {
    out =
      plate(RED) +
      breadOval(235, 229, 104, 32) +
      r(137, 190, 199, 27, '#c97e67', 5) +
      e(235, 186, 83, 36, PAPER) +
      p(
        'M166 184Q178 143 232 151Q296 142 309 189Q274 201 253 191Q228 216 210 195Q185 207 166 184Z',
        '#edd180',
      ) +
      line('M189 171Q219 160 245 164', PAPER, 4)
  } else if (id === 'r-savory-bread-strata' || id === 'r-raisin-bread-pudding') {
    out = bowl('#e4c082', BLUE)
    for (let i = 0; i < 9; i++) {
      const x = 144 + (i % 3) * 86,
        y = 142 + Math.floor(i / 3) * 31
      out += g(x, y, r(-32, -17, 65, 36, i % 2 ? '#c79142' : '#e1b66a', 5), i * 13)
    }
    if (id === 'r-savory-bread-strata')
      out +=
        line('M142 177 175 158M236 159 253 188M291 211 319 191', GREEN, 12) +
        r(198, 198, 28, 13, '#d19881', 2)
    else
      out += spots(
        [
          [153, 157],
          [218, 190],
          [294, 164],
          [330, 210],
          [240, 224],
        ],
        '#694535',
        7,
        4,
      )
  } else {
    return newSweetArt(recipe)
  }
  return { family: a.motif, body: out }
}
function newSweetArt(recipe) {
  const id = recipe.id,
    a = recipe.art
  let out = plate(RED)
  if (id === 'r-strawberry-shortcake') {
    out +=
      cakeSlice(231, 190, '#efd7a6', PAPER, 2) +
      strawberry(237, 125, 0.9, -10) +
      strawberry(180, 219, 0.5, 14) +
      strawberry(282, 219, 0.5, -13)
  } else if (id === 'r-vanilla-chiffon') {
    out +=
      p('M123 206 132 124 347 124 358 206Q243 271 123 206Z', '#e4c37c') +
      e(240, 124, 108, 53, '#b57e35') +
      e(240, 126, 39, 23, '#7f542b') +
      p('M207 127 211 186Q243 204 270 183L273 127Z', '#e9d19d') +
      e(240, 177, 29, 17, PAPER)
  } else if (id === 'r-dark-gateau-chocolat' || id === 'r-mini-basque-cheesecake') {
    const basque = id === 'r-mini-basque-cheesecake'
    out +=
      p('M128 169 141 228Q242 276 347 227L356 167Z', basque ? '#ead19c' : '#5c382a') +
      e(241, 166, 113, 51, basque ? '#643b22' : '#533124')
    out += basque
      ? line('M171 151Q219 133 263 147M278 174Q311 169 322 154', '#89532c', 8)
      : spots(
          [
            [174, 151],
            [228, 173],
            [293, 149],
            [254, 190],
            [321, 178],
          ],
          PAPER,
          3,
          2,
        )
  } else if (id === 'r-spiced-carrot-cake') {
    for (const [x, y] of [
      [174, 202],
      [303, 217],
    ])
      out += g(
        x,
        y,
        p('M-51-36 49-36 40 39Q1 57-40 39Z', '#b4783c') +
          e(0, -36, 52, 29, '#ca9754') +
          whipped(0, -46, 1.05) +
          line('M-26 7-14 17M5-9 16 4M18 20 29 24', '#eeab4e', 3),
      )
  } else if (
    [
      'r-lemon-pound-cake',
      'r-banana-bread-loaf',
      'r-honey-castella',
      'r-tres-leches-cake',
    ].includes(id)
  ) {
    if (id === 'r-honey-castella') out += cube(236, 160, 98, '#ecc477', '#c29851', '#81542c')
    else if (id === 'r-tres-leches-cake')
      out +=
        cakeSlice(233, 188, '#ead8b3', PAPER, 1) +
        whipped(265, 116, 0.6) +
        spots(
          [
            [188, 152],
            [236, 131],
            [282, 153],
          ],
          '#9d7348',
          2,
          1,
        )
    else {
      out = tray() + loaf(212, 178, 0.95, '#ba8644') + cakeSlice(308, 221, '#e6c78a', null, 1)
      out +=
        id === 'r-lemon-pound-cake'
          ? p(
              'M115 146Q180 111 242 133L302 151 283 172 269 154 250 184 231 157 207 167 179 152 155 175 146 157Z',
              PAPER,
            )
          : crumbMarks(292, 236, 12) + banana(203, 149, 15, 0.65)
    }
  } else if (id === 'r-cream-sponge-roll') {
    out += g(
      238,
      189,
      p('M-101-49Q-39-87 77-39L92 42Q-29 96-109 42Z', '#c08a3e') +
        e(82, 3, 54, 67, CRUMB) +
        e(82, 3, 39, 53, PAPER) +
        p('M70-31Q115-30 109 12Q100 51 67 26Q47 10 65-4Q86-21 92 6', 'none', '#d3ab68', 10) +
        line('M-82-24Q-15-49 33-17', PAPER, 5),
      -9,
    )
  } else if (id === 'r-walnut-chocolate-brownie') {
    out +=
      cube(181, 151, 68, '#583428', '#3f281f', '#805038') +
      cube(294, 213, 61, '#583428', '#3f281f', '#805038') +
      walnut(176, 147, 60, 0.9) +
      walnut(294, 213, -40, 0.9)
  } else if (id === 'r-browned-butter-financier') {
    out = tray()
    for (const [x, y, angle] of [
      [159, 169, -12],
      [254, 183, 9],
      [310, 228, -6],
    ])
      out += g(
        x,
        y,
        r(-59, -32, 118, 64, '#9f612c', 4) +
          r(-49, -23, 98, 46, '#e0b263', 3) +
          line('M-37-8Q-1-21 38-7', '#efd399', 2),
        angle,
      )
  } else if (id === 'r-shell-madeleine') {
    out = tray()
    for (const [x, y, angle] of [
      [169, 161, -12],
      [291, 176, 14],
      [229, 242, 4],
    ])
      out += g(
        x,
        y,
        p('M-63 18Q-67-35-30-41Q-14-65 7-45Q31-61 42-32Q70-20 61 19Q-4 59-63 18Z', BREAD) +
          line('M-39-25-11 35M-10-42 0 35M22-35 11 35M46-15 20 32', CRUST, 3),
        angle,
      )
  } else if (id === 'r-mini-vanilla-canele') {
    out = tray()
    for (const [x, y, scale] of [
      [173, 167, 0.85],
      [287, 163, 0.85],
      [238, 236, 0.95],
    ])
      out += g(
        x,
        y,
        p('M-49-40Q-48-55-30-51L-18-59 0-51 17-58 33-51Q49-55 51-36L60 36Q0 64-60 34Z', '#804526') +
          e(0, -39, 49, 23, '#5d3422') +
          line('M-36-30-42 29M-14-27-16 40M12-27 13 40M35-28 42 31', '#b57338', 7),
        0,
        scale,
      )
  } else if (id === 'r-mini-tarte-tatin') {
    out += tart(241, 196, '#a5642a')
    for (let i = 0; i < 7; i++) {
      const t = (i * Math.PI * 2) / 7
      out += appleWedge(240 + Math.cos(t) * 54, 190 + Math.sin(t) * 26, i * 51, 0.57)
    }
  } else if (
    [
      'r-lemon-meringue-tart',
      'r-pear-almond-tart',
      'r-mini-pecan-pie',
      'r-custard-egg-tarts',
      'r-almond-galette-des-rois',
    ].includes(id)
  ) {
    if (id === 'r-custard-egg-tarts')
      out +=
        tart(171, 173, '#f0c757', 0.75) +
        tart(300, 223, '#f0c757', 0.75) +
        spots(
          [
            [154, 167],
            [174, 184],
            [314, 218],
            [290, 230],
          ],
          '#9c602b',
          7,
          3,
        )
    else if (id === 'r-almond-galette-des-rois') {
      out += tart(240, 192, '#c58736', 1.17)
      for (let i = 0; i < 10; i++) {
        let t = (i * Math.PI * 2) / 10
        out += line(
          `M240 182Q${240 + Math.cos(t + 0.3) * 50} ${182 + Math.sin(t + 0.3) * 24} ${240 + Math.cos(t) * 114} ${182 + Math.sin(t) * 43}`,
          CRUST,
          3,
        )
      }
    } else {
      out += tart(240, 203, id === 'r-lemon-meringue-tart' ? '#edd064' : '#d6a254')
      if (id === 'r-lemon-meringue-tart')
        out +=
          whipped(181, 169, 0.8) +
          whipped(242, 135, 0.95) +
          whipped(296, 174, 0.8) +
          line('M170 148 181 159M230 106 247 118M292 150 302 159', '#b58244', 3)
      if (id === 'r-pear-almond-tart')
        for (let i = 0; i < 5; i++)
          out += g(
            193 + i * 20,
            174 + i * 5,
            p('M-33-15Q-14-48 25-30L38 21Q-4 35-33-15Z', '#e8d397') +
              line('M-22-14 27 19', '#c5a965', 2),
            -25 + i * 4,
            0.95,
          )
      if (id === 'r-mini-pecan-pie')
        for (const [x, y, angle] of [
          [162, 195, 25],
          [207, 178, -20],
          [254, 180, 25],
          [298, 194, -10],
          [213, 219, 20],
          [273, 220, -30],
        ])
          out += g(
            x,
            y,
            e(0, 0, 15, 24, '#955a2c') + line('M-5-15-3 14M5-14 5 13', '#d7a45e', 2),
            angle,
          )
    }
  } else if (id === 'r-crisp-palmiers') {
    out = tray()
    for (const [x, y, angle] of [
      [165, 158, -10],
      [303, 172, 10],
      [231, 240, 0],
    ])
      out += g(
        x,
        y,
        p('M0 39Q-80 14-56-27Q-24-53 0-10Q27-52 58-25Q79 12 0 39Z', BREAD) +
          line('M0 26Q-58 2-42-18Q-21-34-4 4M5 17Q58-3 42-20Q23-32 10-3', CRUST, 4),
        angle,
      )
  } else if (id === 'r-custard-millefeuille' || id === 'r-layered-mille-crepe') {
    const layers = id === 'r-layered-mille-crepe' ? 8 : 3
    out += p('M132 132 280 90 358 130 350 248 221 279 130 231Z', '#d5a754')
    for (let i = 0; i < layers; i++)
      out += p(
        `M132 ${137 + (i * 91) / layers} 221 ${177 + (i * 91) / layers} 354 ${137 + (i * 91) / layers}V${143 + (i * 91) / layers}L221 ${184 + (i * 91) / layers} 132 ${143 + (i * 91) / layers}Z`,
        PAPER,
        'none',
        0,
      )
    out +=
      p(
        'M132 132 280 90 358 130 221 174Z',
        id === 'r-layered-mille-crepe' ? '#e1b876' : '#bd7f37',
      ) +
      spots(
        [
          [188, 134],
          [235, 147],
          [270, 116],
          [302, 132],
        ],
        PAPER,
        4,
        2,
      )
  } else if (
    ['r-chocolate-chip-cookies', 'r-almond-snowball-cookies', 'r-small-egg-boro'].includes(id)
  ) {
    out = tray()
    const boro = id === 'r-small-egg-boro',
      snow = id === 'r-almond-snowball-cookies'
    const count = boro ? 18 : 5
    for (let i = 0; i < count; i++) {
      const x = boro ? 132 + (i % 6) * 42 : 151 + (i % 3) * 91,
        y = boro ? 147 + Math.floor(i / 6) * 48 : 158 + Math.floor(i / 3) * 70
      if (boro) out += e(x, y, 16, 12, '#f0d9a1')
      else if (snow)
        out += e(x, y, 42, 33, PAPER) + line(`M${x - 20} ${y + 6}q15 17 36 10`, '#e7d4af', 3)
      else {
        out += cookiePiece(x, y)
        for (let j = 0; j < 7; j++)
          out += r(x - 29 + ((j * 13) % 57), y - 17 + ((j * 11) % 32), 7, 6, '#5e3928', 1)
      }
    }
  } else if (
    [
      'r-butter-shortbread',
      'r-almond-biscotti',
      'r-langue-de-chat',
      'r-almond-florentines',
      'r-ginger-snap-biscuits',
    ].includes(id)
  ) {
    out = tray()
    for (let i = 0; i < 4; i++) {
      const x = 139 + (i % 2) * 153,
        y = 147 + Math.floor(i / 2) * 80
      if (id === 'r-ginger-snap-biscuits')
        out += g(
          x + 15,
          y,
          p('M0-37 13-13 41-11 23 9 27 36 0 23-28 36-23 9-40-11-13-13Z', '#b28044'),
          i * 17,
        )
      else if (id === 'r-langue-de-chat')
        out += g(
          x + 16,
          y,
          r(-66, -17, 132, 34, '#ac7234', 18) + r(-57, -12, 114, 24, '#efd49b', 13),
          i % 2 ? 18 : -13,
        )
      else if (id === 'r-almond-florentines') {
        out += cookiePiece(x + 15, y, '#a87031', 'square')
        for (let j = 0; j < 7; j++)
          out += almond(x - 7 + ((j * 11) % 46), y - 15 + ((j * 9) % 31), j * 20, 0.4)
      } else {
        out += g(
          x + 15,
          y,
          r(-61, -22, 122, 44, id === 'r-almond-biscotti' ? '#d1ad6c' : '#e4c58c', 5),
          i % 2 ? 12 : -12,
        )
        if (id === 'r-almond-biscotti')
          for (let j = 0; j < 5; j++)
            out += almond(x - 29 + j * 20, y - 7 + (j % 2) * 10, j * 25, 0.45)
        else
          out += spots(
            [
              [x - 27, y],
              [x - 5, y],
              [x + 18, y],
              [x + 41, y],
            ],
            '#b69355',
            2,
            2,
          )
      }
    }
  } else if (id === 'r-chocolate-ganache-macarons') {
    out = tray()
    for (const [x, y] of [
      [167, 164],
      [299, 175],
      [232, 242],
    ])
      out +=
        e(x, y + 11, 54, 26, '#d6b878') +
        r(x - 54, y - 9, 108, 22, '#65432f', 8) +
        e(x, y - 12, 54, 26, '#eed6a6') +
        line(`M${x - 45} ${y + 1}l8-5 9 4 9-4 8 4 9-4 8 4 9-4 9 4`, '#c8a465', 2)
  } else if (id === 'r-crisp-meringue-kisses') {
    out = tray()
    for (const [x, y] of [
      [139, 157],
      [238, 158],
      [331, 162],
      [177, 239],
      [290, 242],
    ])
      out += whipped(x, y, 0.88)
  } else if (id === 'r-folded-fortune-cookies') {
    out = tray()
    for (const [x, y, angle] of [
      [165, 167, -12],
      [301, 179, 13],
      [231, 246, -3],
    ])
      out += g(
        x,
        y,
        p('M-68-15Q-14-71 57-25Q82 9 24 28L3 1-22 36Q-67 22-68-15Z', '#dcad64') +
          line('M-60-11Q-4-13 57-25M3 1Q-5-13 4-29', '#a97135', 3),
        angle,
      )
  } else if (
    [
      'r-cream-panna-cotta',
      'r-mango-pudding-cup',
      'r-eggless-cup-tiramisu',
      'r-airy-chocolate-mousse',
    ].includes(id)
  ) {
    const fill =
      id === 'r-mango-pudding-cup'
        ? '#eab139'
        : id === 'r-airy-chocolate-mousse'
          ? '#82533e'
          : PAPER
    out = plate(BLUE) + dessertCup(fill)
    if (id === 'r-cream-panna-cotta') out += e(241, 161, 49, 22, '#b93c35')
    if (id === 'r-mango-pudding-cup')
      out +=
        cube(209, 145, 22, '#edbc45', '#cc8d28', '#f8d779') +
        cube(262, 155, 21, '#edbc45', '#cc8d28', '#f8d779')
    if (id === 'r-eggless-cup-tiramisu')
      out +=
        p('M159 213Q241 245 324 213L322 235Q243 263 162 235Z', '#8f684d') +
        e(241, 159, 85, 31, '#865c41') +
        spots(
          [
            [196, 152],
            [244, 165],
            [277, 149],
            [218, 176],
          ],
          '#593c2b',
          3,
          2,
        )
    if (id === 'r-airy-chocolate-mousse')
      out +=
        whipped(238, 133, 1.1, '#956447') +
        line('M211 117l30 12m-18-33 24 10m-27 30 37 7', '#4c3025', 4)
  } else if (id === 'r-caramel-creme-brulee') {
    out =
      plate(BLUE) +
      p('M104 174 122 258Q237 299 355 258L376 174Z', '#e4e5d7') +
      e(240, 174, 136, 57, PAPER) +
      e(240, 174, 116, 42, '#af682c') +
      spots(
        [
          [158, 169],
          [194, 190],
          [238, 158],
          [279, 183],
          [315, 161],
          [254, 205],
        ],
        '#754321',
        7,
        4,
      )
  } else if (id === 'r-lemon-granita') {
    out = plate(BLUE) + dessertCup('#f0de93')
    for (let i = 0; i < 25; i++)
      out += g(
        164 + ((i * 41) % 153),
        114 + ((i * 19) % 76),
        p('M-9 4-4-9 9-3 7 8Z', i % 2 ? '#fff1c8' : '#e8d591', '#c7b768', 1),
        i * 27,
      )
    out += p('M282 99 326 121 291 145Z', '#f3d351')
  } else if (id === 'r-vanilla-milk-icecream') {
    out = bowl('#e7d3a8', BLUE)
    for (const [x, y] of [
      [180, 167],
      [291, 170],
      [237, 121],
    ])
      out +=
        p(
          `M${x - 49} ${y + 14}Q${x - 65} ${y - 9} ${x - 39} ${y - 27}Q${x - 17} ${y - 65} ${x + 16} ${y - 38}Q${x + 60} ${y - 35} ${x + 48} ${y + 10}Q${x + 47} ${y + 39} ${x + 7} ${y + 30}Q${x - 18} ${y + 42} ${x - 49} ${y + 14}Z`,
          '#f4dfb7',
        ) + line(`M${x - 27} ${y - 12}q15-20 40-12`, '#fff1dc', 5)
  } else if (id === 'r-cinnamon-rice-pudding' || id === 'r-coconut-tapioca-dessert') {
    out = bowl(PAPER, BLUE)
    const tapioca = id === 'r-coconut-tapioca-dessert'
    for (let i = 0; i < 43; i++) {
      const x = 130 + ((i * 41) % 222),
        y = 137 + ((i * 23) % 78)
      out += e(x, y, tapioca ? 4 : 5, tapioca ? 4 : 1.8, '#f1e2bd', '#cabd9b', 1)
    }
    if (tapioca) out += banana(182, 162, -15, 0.7) + banana(280, 186, 20, 0.7)
    else
      out += spots(
        [
          [187, 161],
          [221, 178],
          [271, 158],
          [294, 187],
          [250, 204],
        ],
        '#9e7146',
        2,
        1,
      )
  } else if (id === 'r-poached-pear-dessert') {
    out +=
      e(240, 211, 125, 52, PAPER) +
      p(
        'M171 225Q131 176 195 143Q210 132 213 99Q228 82 244 99Q236 132 267 156Q311 199 268 239Q213 271 171 225Z',
        '#dfbb6b',
      ) +
      line('M220 105 225 80', '#724d2d', 5) +
      line('M181 187Q188 159 208 151', '#f6db9e', 4)
  } else if (id === 'r-azuki-daifuku') {
    out +=
      breadOval(181, 178, 75, 52, PAPER) +
      p('M255 160Q288 139 323 160L345 230Q295 260 243 229Z', PAPER) +
      e(294, 173, 40, 27, '#754637') +
      line('M261 167Q293 148 324 168', '#eadabe', 6)
  } else if (id === 'r-kanto-sakura-mochi') {
    for (const [x, y, angle] of [
      [167, 168, -12],
      [300, 216, 8],
    ])
      out += g(
        x,
        y,
        p('M-58-31Q8-62 62-29L67 24Q4 58-62 23Z', '#d99d9e') +
          p('M-68 12Q-27-76 55-48Q66 21 7 48Z', '#6e7941') +
          line('M-48 2 43-37M-26-10-20-40M-7-19 17 5M13-27 33-6', '#a1aa61', 2),
        angle,
      )
  } else if (id === 'r-kinako-warabi-mochi' || id === 'r-azuki-mizu-yokan') {
    const yokan = id === 'r-azuki-mizu-yokan'
    for (const [x, y] of [
      [169, 165],
      [292, 176],
      [230, 239],
    ])
      out += cube(
        x,
        y,
        48,
        yokan ? '#694635' : '#c4a16c',
        yokan ? '#483225' : '#9e7d4d',
        yokan ? '#98705a' : '#e0c594',
      )
    if (!yokan) out += line('M143 175Q236 207 329 190M198 241 272 257', '#684126', 5)
  } else if (id === 'r-fruit-anmitsu') {
    out = bowl('#f0dcad', BLUE)
    for (const [x, y] of [
      [148, 155],
      [225, 139],
      [310, 178],
      [214, 211],
    ])
      out += cube(x, y, 19, '#eadfba', '#c8bc99', '#fff1ce')
    out +=
      e(269, 172, 43, 26, '#714635') +
      spots(
        [
          [254, 162],
          [276, 166],
          [284, 179],
        ],
        '#9a6850',
        4,
        2,
      ) +
      p('M157 187Q182 165 207 189Q185 214 157 187Z', '#e9a83a') +
      p('M277 213 309 198 326 221 295 235Z', '#edb969')
  } else if (id === 'r-azuki-ohagi') {
    for (const [x, y] of [
      [177, 181],
      [302, 219],
    ]) {
      out += e(x, y, 72, 46, '#754937')
      for (let i = 0; i < 18; i++)
        out += e(x - 48 + ((i * 19) % 93), y - 24 + ((i * 11) % 47), 6, 4, '#98674e', '#63422f', 1)
    }
  } else if (id === 'r-azuki-taiyaki') {
    out = tray()
    for (const [x, y, angle] of [
      [194, 161, -12],
      [282, 232, 12],
    ]) {
      let fish =
        p('M-98-22-53-13Q-26-60 36-48Q87-43 99 0Q83 49 34 50Q-24 58-53 17L-97 29-84 0Z', BREAD) +
        e(63, -12, 5, 5, INK) +
        line('M42-35Q25-1 42 36M-71-13-60 10', CRUST, 3)
      for (let k = 0; k < 3; k++)
        for (let j = 0; j < 3; j++)
          fish += line(`M${-25 + k * 20} ${-23 + j * 20}q-10 10 0 17q10-7 0-17`, CRUST, 2)
      out += g(x, y, fish, angle)
    }
  } else if (id === 'r-brown-sugar-karinto') {
    out = tray()
    for (let i = 0; i < 13; i++)
      out += g(
        131 + ((i * 57) % 219),
        142 + ((i * 31) % 101),
        r(-9, -34, 18, 68, i % 2 ? '#633c27' : '#8c572d', 8) + line('M-2-24 2 25', '#b28552', 2),
        i * 31,
      )
  } else if (id === 'r-custard-cream-puffs') {
    for (const [x, y] of [
      [175, 185],
      [299, 226],
    ])
      out += g(
        x,
        y,
        p('M-70 5Q-63-39-29-34Q-4-59 22-33Q57-37 72 7L65 35Q-4 66-63 34Z', BREAD) +
          e(0, 7, 62, 25, '#efdc99') +
          p('M-70 5Q-63-39-29-34Q-4-59 22-33Q57-37 72 7Q11 27-70 5Z', '#d8a253') +
          line('M-30-27-15-2 1-18 25 3M40-12 49 3', CRUST, 3),
      )
  } else if (id === 'r-cinnamon-churros') {
    out = tray()
    for (const [x, y, angle] of [
      [161, 182, -25],
      [245, 185, 9],
      [319, 194, 24],
    ])
      out += g(
        x,
        y,
        r(-21, -78, 42, 156, '#b87932', 11) +
          line('M-10-66V67M2-69V67M13-63V65', '#ecc478', 4) +
          spots(
            [
              [-12, -42],
              [10, -22],
              [-8, 8],
              [8, 48],
            ],
            PAPER,
            2,
            1,
          ),
        angle,
      )
  } else if (id === 'r-old-fashioned-doughnuts') {
    out =
      tray() +
      ringBread(181, 168, 0.94, '#d3a461') +
      ringBread(290, 226, 0.85, '#c79450') +
      line('M112 164 131 148 144 163 163 145M259 215 275 197 286 212 307 195', '#91602e', 3)
  } else if (id === 'r-pistachio-baklava') {
    for (const [x, y] of [
      [168, 166],
      [292, 218],
    ]) {
      out += cube(x, y, 62, '#c69747', '#a37231', '#edc572')
      for (let i = 0; i < 5; i++)
        out += line(`M${x - 59} ${y + 9 + i * 9}l59 29 59-29`, '#ebd294', 2)
      out += spots(
        [
          [x - 18, y],
          [x + 5, y - 8],
          [x + 21, y + 3],
          [x, y + 13],
        ],
        '#7d8c3d',
        4,
        2,
      )
    }
  } else if (id === 'r-sesame-halva') {
    out +=
      cube(187, 156, 69, '#d6ba83', '#af925e', '#eddaad') +
      cube(300, 222, 52, '#d6ba83', '#af925e', '#eddaad') +
      spots(
        [
          [162, 157],
          [187, 141],
          [213, 154],
          [287, 220],
          [312, 225],
        ],
        '#7b8d45',
        5,
        3,
      )
  } else if (id === 'r-berry-pavlova') {
    out +=
      e(240, 221, 114, 47, '#e0d0ad') +
      whipped(240, 171, 2.08) +
      strawberry(190, 138, 0.85, -13) +
      strawberry(278, 135, 0.9, 13) +
      berry(239, 113, 0.95) +
      berry(280, 168, 0.85) +
      berry(211, 175, 0.85)
  } else if (id === 'r-orange-crepes-suzette') {
    out += e(240, 210, 137, 63, '#d99738')
    for (const [x, y, angle] of [
      [180, 178, -9],
      [278, 193, 13],
      [228, 237, 3],
    ])
      out += g(
        x,
        y,
        p('M-68 24Q-44-64 47-39L66 29Z', '#e0b664') +
          p('M-52 17 47-29 55 20Z', '#edc783') +
          line('M-25-7 13-18', '#b57d38', 2),
        angle,
      )
  } else return null
  return { family: a.motif, body: out }
}

export function dessertArt(recipe) {
  const drawing = art[recipe.id]?.() ?? newBakeryArt(recipe)
  if (!drawing) return null
  const { family, body } = drawing
  const backdrop =
    r(0, 0, 480, 360, PAPER, 0, 'none', 0) +
    p('M0 314Q90 285 165 318T329 315T480 311V360H0Z', '#f0dfb6', 'none', 0)
  return {
    mode: `dessert-${family}`,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" role="img" aria-labelledby="title"><title id="title">${esc(recipe.name)}</title>${backdrop}${body}</svg>\n`,
  }
}
