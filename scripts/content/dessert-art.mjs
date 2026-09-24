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

export function dessertArt(recipe) {
  const draw = art[recipe.id]
  if (!draw) return null
  const { family, body } = draw()
  const backdrop =
    r(0, 0, 480, 360, PAPER, 0, 'none', 0) +
    p('M0 314Q90 285 165 318T329 315T480 311V360H0Z', '#f0dfb6', 'none', 0)
  return {
    mode: `dessert-${family}`,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" role="img" aria-labelledby="title"><title id="title">${esc(recipe.name)}</title>${backdrop}${body}</svg>\n`,
  }
}
