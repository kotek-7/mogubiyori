// Hand-composed whole dishes for the savory recipe collection.
// Shared drawing primitives, with explicit recipe IDs and ingredient-correct compositions.
const I = '#202820',
  C = '#fff5de',
  G = '#24624b',
  R = '#df442d',
  Y = '#e9ac25'
const P = (d, fill, stroke = I, width = 3) =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`
const E = (x, y, rx, ry, fill, stroke = I, width = 3) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`
const Q = (x, y, w, h, fill, radius = 5, stroke = I, width = 3) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`
const T = (x, y, body, rotation = 0, scale = 1) =>
  `<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale})">${body}</g>`
const lines = (ds, color = I, width = 2) => ds.map((d) => P(d, 'none', color, width)).join('')
const flecks = (x, y, w, h, n, color, salt = 0) =>
  Array.from({ length: n }, (_, j) => {
    const a = ((j * 37 + salt * 11) % 97) / 97,
      b = ((j * 53 + salt * 17) % 89) / 89
    return E(x + a * w, y + b * h, 1.7 + (j % 2), 1 + (j % 2), color, 'none', 0)
  }).join('')

function plate(color = '#286c97', bowl = false) {
  return (
    E(244, 278, 171, 19, '#d5b781', 'none', 0) +
    (bowl ? P('M48 178Q50 304 240 316Q431 305 432 178Z', color) : '') +
    E(240, 195, 198, 110, color, I, 4) +
    E(240, 190, 176, 89, C, I, 2) +
    P('M84 235Q155 297 316 271', 'none', '#b1d1d1', 2)
  )
}
function frame(body, color = '#286c97', bowl = false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"><rect width="480" height="360" fill="${C}"/>${plate(color, bowl)}${body}</svg>`
}
function leaf(x, y, rotation = 0, scale = 1) {
  return T(
    x,
    y,
    P('M0 19C-34 10-28-18 0-28C29-14 31 11 0 19Z', G) +
      lines(['M0 17 0-20', 'M0 3-14-8', 'M0 0 14-11'], '#78a350', 2),
    rotation,
    scale,
  )
}
function lettuce(x, y, scale = 1) {
  return T(
    x,
    y,
    P(
      'M-59 27Q-78 1-52-8Q-69-36-37-34Q-33-63-6-39Q19-63 32-34Q67-45 56-13Q81 4 53 22Q61 45 27 36Q5 62-13 37Q-46 57-59 27Z',
      '#729f49',
    ) +
      lines(
        ['M-40 19Q-19 8 4 33', 'M-35-17Q-4-12 4 33', 'M8-28Q15-1 4 33', 'M41-14Q26 0 4 33'],
        '#3c6533',
        2,
      ),
    0,
    scale,
  )
}
function cabbage(x, y, scale = 1) {
  let s = P(
    'M-63 17Q-74-7-50-21Q-44-44-18-34Q8-49 26-31Q56-38 61-11Q79 12 53 25Q26 42 1 30Q-33 45-63 17Z',
    '#d1d99d',
    '#60863e',
    1.8,
  )
  for (let j = 0; j < 27; j++) {
    const a = -51 + ((j * 29) % 84),
      b = -24 + ((j * 17) % 44)
    s += P(
      `M${a} ${b + 10}Q${a + 3} ${b - 7} ${a + 18} ${b + 2}Q${a + 31} ${b + 12} ${a + 34} ${b - 1}`,
      'none',
      j % 3 ? '#f0edbd' : '#7fa252',
      3,
    )
  }
  return T(x, y, s, -12, scale)
}
function lemon(x, y, rotation = 0, scale = 1) {
  return T(
    x,
    y,
    P('M-32 4Q0-35 32 4L0 26Z', Y) +
      P('M-23 4Q0-20 23 4L0 18Z', '#f7df75', I, 1.7) +
      lines(['M0 17 0-11', 'M0 17-14-1', 'M0 17 14-1'], C, 2),
    rotation,
    scale,
  )
}
function scallions(x, y, width = 100, count = 9) {
  return Array.from({ length: count }, (_, j) =>
    T(
      x + ((j * 31) % width),
      y + ((j * 13) % 32),
      E(0, 0, 5, 3.4, '#5d9446', I, 1.2) + E(0, 0, 2.4, 1.4, C, 'none', 0),
      j * 19,
    ),
  ).join('')
}
function sesame(x, y, width = 100, height = 45) {
  return Array.from({ length: 15 }, (_, j) =>
    T(
      x + ((j * 31) % width),
      y + ((j * 17) % height),
      E(0, 0, 2.5, 1, '#e6cc91', '#85562b', 0.6),
      j * 27,
    ),
  ).join('')
}
function tomato(x, y, scale = 1) {
  return T(
    x,
    y,
    E(0, 0, 21, 17, R) +
      P('M-10-9-1-4 10-10 5 0-7 1Z', G, I, 1.4) +
      P('M-13 4Q-8 11 0 12', 'none', '#ffac68', 2),
    0,
    scale,
  )
}
function broccoli(x, y, scale = 1) {
  return T(
    x,
    y,
    P('M-6 11-10 35 10 35 6 8Z', '#8fa957') +
      E(-13, 1, 18, 16, G) +
      E(14, 2, 18, 15, G) +
      E(0, -12, 21, 17, '#3b824d') +
      flecks(-18, -20, 36, 26, 14, '#7aa54c'),
    0,
    scale,
  )
}
function mushroom(x, y, scale = 1, rotation = 0) {
  return T(
    x,
    y,
    P('M-5 1-7 27Q0 32 7 25L5-1Z', '#d1b782') +
      P('M-27 2Q-25-30 0-27Q25-27 27 2Q0 13-27 2Z', '#895330') +
      P('M-17-4Q-2-16 14-8', 'none', '#c39153', 2),
    rotation,
    scale,
  )
}
function sauce(x, y, w, h, color = '#854327') {
  return T(
    x,
    y,
    P(
      `M${-w / 2} 0C${-w / 2 - 8} ${-h} ${w / 3} ${-h} ${w / 2} -4C${w / 2 + 21} ${h} ${-w / 3} ${h} ${-w / 2} 0Z`,
      color,
      '#633c28',
      2,
    ),
  )
}

// Slices stay aligned in the silhouette of one cooked fillet.
function slicedMeat(style) {
  const breaded = style !== 'teriyaki',
    nanban = style === 'nanban'
  let body = cabbage(324, 152, 0.93)
  body += T(
    148,
    166,
    P('M-42-20Q-16-48 20-25L16 58Q-18 74-39 43Z', breaded ? '#b97c29' : '#854327'),
  )
  for (let j = 0; j < 6; j++) {
    const x = 139 + j * 26,
      y = 151 + j * 6,
      h = 82 - Math.abs(j - 2.5) * 8
    body += T(
      x,
      y,
      P(`M-10-11Q3-22 16-10L17 ${h - 9}Q1 ${h + 6}-12 ${h - 5}Z`, breaded ? '#d5942d' : '#9a542c') +
        P(
          `M-5 2Q4-3 10 1L10 ${h - 13}Q3 ${h - 7}-5 ${h - 10}Z`,
          breaded ? '#e6c18c' : '#d9a068',
          '#653e28',
          1.5,
        ) +
        (breaded
          ? flecks(-12, -10, 28, h, 20, '#a36624', j)
          : P(`M-7 9Q5 2 14 13M-7 37Q5 32 14 39`, 'none', '#f0bd69', 2)),
      -14,
    )
  }
  if (style === 'teriyaki')
    body += sauce(220, 257, 151, 8) + P('M132 187Q214 154 292 205', 'none', '#6f381e', 5)
  if (style === 'katsu')
    body += E(346, 239, 36, 22, '#694028') + P('M324 234Q345 225 364 234', 'none', '#b7753e', 3)
  if (nanban) {
    body += P(
      'M139 163Q150 142 171 153Q184 134 204 153Q225 138 241 161Q271 146 283 170Q313 168 308 185Q292 209 267 195Q246 215 224 192Q207 207 184 187Q160 201 149 181Q129 177 139 163Z',
      '#f3e1ac',
      I,
      2.5,
    )
    body += flecks(146, 157, 151, 30, 33, '#e6b03b') + flecks(150, 157, 144, 28, 19, '#b6996b', 4)
  }
  return frame(body, nanban ? '#bd4830' : '#286c97')
}
function hamburg() {
  return frame(
    sauce(221, 227, 223, 31) +
      P(
        'M99 189C99 126 177 112 255 134C304 147 316 191 285 223C245 254 128 246 106 211Z',
        '#895030',
      ) +
      P(
        'M109 181C122 132 220 135 274 161C296 174 291 192 275 201C222 223 126 209 109 181Z',
        '#a55d31',
        I,
        2,
      ) +
      lines(['M135 163 179 202', 'M172 151 220 209', 'M213 151 255 202'], '#653822', 5) +
      sauce(207, 178, 156, 15, '#673822') +
      P('M165 165Q187 154 218 165', 'none', '#ca8448', 3) +
      tomato(349, 194, 0.96) +
      tomato(322, 236, 0.8),
    '#bd4830',
  )
}
function cabbageRolls() {
  let s = sauce(235, 203, 292, 62, R)
  for (const [x, y, a] of [
    [198, 162, -15],
    [273, 221, -15],
  ]) {
    s += T(
      x,
      y,
      P('M-80-13Q-85-48-48-47L55-38Q87-33 83 6Q84 43 46 46L-53 40Q-82 37-80-13Z', '#94a951') +
        P('M-57-45Q-31-6-55 39M45-39Q23 5 50 45', 'none', '#536f38', 3) +
        lines(['M-50-27Q0 3 54-21', 'M-53 8Q-7 24 52 10', 'M-11-36Q5-8-7 21'], '#d0cc79', 2) +
        P('M-76-8Q-77-22-60-18L-57 15Q-77 20-76-8Z', '#6b803e', I, 1.5),
      a,
    )
  }
  return frame(s + flecks(124, 150, 212, 87, 20, G), '#286c97', true)
}
function pepperBoats(zucchini = false) {
  let s = ''
  const positions = zucchini
    ? [
        [192, 181, -26],
        [289, 205, -26],
      ]
    : [
        [157, 165, -24],
        [258, 153, 11],
        [205, 237, -15],
        [319, 221, 18],
      ]
  for (const [x, y, a] of positions) {
    const shell = zucchini
      ? 'M-37-79Q-35-99 1-91Q39-88 40-59L31 69Q25 91-6 85Q-40 85-40 55Z'
      : 'M-45-38Q-24-62 0-45Q34-65 50-29L41 34Q13 58-19 45Q-53 37-45-38Z'
    s += T(
      x,
      y,
      P(shell, G) +
        P(
          zucchini
            ? 'M-27-66Q-14-83 21-67L20 62Q0 79-27 59Z'
            : 'M-32-27Q-12-42 7-30Q30-43 34-17L26 25Q0 42-33 26Z',
          zucchini ? '#bca856' : '#a46739',
          I,
          2,
        ) +
        (zucchini
          ? flecks(-22, -60, 43, 110, 25, R) +
            flecks(-23, -57, 44, 107, 16, '#6b3b23') +
            lines(['M-24-52 18-44M-23-30 19-21M-25-5 20 4M-24 20 19 27M-21 43 19 52'], Y, 8)
          : flecks(-25, -26, 50, 50, 30, '#693d29') +
            flecks(-23, -25, 44, 48, 14, '#d8b171') +
            P('M-23-7Q0 8 23-4', 'none', R, 7)),
      a,
      zucchini ? 0.82 : 0.94,
    )
  }
  return frame(s, zucchini ? '#bd4830' : '#286c97')
}
function tofuCube(x, y, scale = 1, color = '#f2dda6') {
  return T(
    x,
    y,
    P('M-24-12 5-25 33-9 29 20-1 34-28 17Z', color) +
      P('M-24-12 2 3 33-9M2 3-1 34', 'none', '#9e7a46', 2) +
      flecks(-17, -7, 36, 24, 6, '#b99a63'),
    0,
    scale,
  )
}
function mapo() {
  let s = E(240, 194, 163, 79, '#bd4229', '#6f3623', 3)
  s += flecks(100, 157, 271, 83, 110, '#633824')
  for (const [x, y, scale] of [
    [142, 162, 0.84],
    [209, 143, 0.87],
    [278, 156, 0.96],
    [340, 191, 0.84],
    [274, 223, 0.94],
    [197, 224, 1.05],
    [133, 210, 0.86],
    [218, 184, 0.87],
  ])
    s += tofuCube(x, y, scale)
  s += scallions(126, 150, 211, 19)
  return frame(s, '#bd4830', true)
}
function tofuSteak(agedashi = false) {
  let s = agedashi
    ? E(240, 200, 155, 67, '#af7835', '#774329', 2)
    : sauce(240, 216, 283, 42, '#996132')
  if (agedashi) {
    for (const [x, y] of [
      [167, 184],
      [254, 153],
      [294, 219],
    ])
      s += tofuCube(x, y, 1.35, '#d8a84f')
    s +=
      T(214, 163, P('M-35 5Q-37-14-17-13Q-11-35 7-22Q34-28 32-9Q52 4 29 17Q0 31-27 20Z', C, I, 2)) +
      scallions(203, 140, 51, 10)
    s += T(247, 180, P('M-10 2Q-18-12-4-13Q11-19 14-3Q20 8 0 11Z', '#d5b077', I, 1.5))
  } else {
    for (const [x, y, a] of [
      [207, 176, -17],
      [263, 228, -17],
    ]) {
      s += T(
        x,
        y,
        P('M-80-38 73-39 83 19 69 42-74 38-85 16Z', '#b87c2b') +
          P('M-73-30 67-31 70 12-71 12Z', '#e1be76', '#85502a', 2) +
          flecks(-64, -25, 121, 34, 27, '#9d662b'),
        a,
      )
    }
    for (const [x, y, a] of [
      [146, 165, -25],
      [202, 176, 18],
      [267, 181, -15],
      [292, 224, 20],
    ])
      s += mushroom(x, y, 0.66, a)
    s +=
      lines(
        ['M160 223Q221 180 279 236', 'M158 236Q224 194 302 243', 'M172 247Q210 210 266 251'],
        '#c9b383',
        4,
      ) + scallions(156, 168, 170, 12)
  }
  return frame(s, agedashi ? G : '#286c97', agedashi)
}
function salmonFillet(x = 240, y = 190, scale = 1, rotation = -12) {
  let s =
    P('M-123-30Q-78-53 36-45L111-27Q134-1 111 36Q65 56-76 44L-116 29Z', '#ce6634') +
    P('M-116 23Q-12 55 109 27L111 39Q10 65-112 37Z', '#53665e', I, 2)
  for (let j = 0; j < 7; j++) {
    const x = -93 + j * 29
    s += P(`M${x} -32Q${x + 19} -2 ${x + 3} 32`, 'none', '#f4bd7a', 4)
    s += P(`M${x + 7} -33Q${x + 23} -1 ${x + 10} 30`, 'none', '#9b4328', 1.5)
  }
  return T(x, y, s + flecks(-102, -27, 185, 53, 27, '#813f25'), rotation, scale)
}
function salmon(kind) {
  let s = ''
  if (kind === 'foil') {
    s += P(
      'M70 186 93 96 153 111 201 79 249 105 323 79 374 120 417 158 398 239 350 275 269 261 213 291 143 272 86 248Z',
      '#b8c1b9',
      I,
      3,
    )
    s += lines(
      [
        'M93 112 127 155',
        'M108 238 144 216',
        'M328 107 310 146',
        'M385 153 350 177',
        'M227 276 236 243',
        'M370 242 331 224',
      ],
      '#6d807b',
      3,
    )
    s += lines(
      ['M128 169Q191 124 296 152', 'M131 184Q184 149 310 166', 'M147 203Q208 165 327 191'],
      '#c4ac7b',
      8,
    )
    s += lines(['M140 169 187 229', 'M174 155 217 225', 'M212 148 254 221'], '#e5782c', 5)
    s +=
      salmonFillet(243, 201, 0.87, -12) +
      mushroom(334, 162, 0.79, 25) +
      mushroom(310, 134, 0.67, -13) +
      lemon(247, 173, -7, 0.85)
  } else if (kind === 'miso') {
    s += broccoli(341, 193, 0.9) + broccoli(321, 239, 0.68) + salmonFillet(220, 186, 0.92, -16)
    s += T(
      220,
      176,
      P('M-106-21Q-55-43 54-26L101-9Q106 13 78 22Q-4 38-95 11Z', '#d9ad44', '#8f582b', 2),
      -16,
    )
    s += sesame(123, 160, 180, 48) + flecks(140, 152, 146, 43, 33, '#92602b')
  } else {
    s += leaf(342, 182, 30, 0.95) + leaf(327, 215, 71, 0.8) + leaf(359, 223, -17, 0.7)
    s +=
      sauce(221, 237, 215, 18, '#d39b34') +
      salmonFillet(215, 183, 0.97, -14) +
      lemon(323, 257, 16, 0.9)
  }
  return frame(s, kind === 'miso' ? '#bd4830' : '#286c97')
}
function fishFillet(x, y, color = '#c9bd8b', scale = 1, a = -10, skin = true) {
  return T(
    x,
    y,
    P('M-113 15Q-117-18-72-36Q11-60 105-11L118 17Q50 50-39 39Q-88 34-113 15Z', color) +
      (skin ? P('M-105 17Q-16 51 111 15L111 26Q-8 57-105 28Z', '#526e71', I, 2) : '') +
      lines(
        ['M-73-19Q-43 1-66 21', 'M-35-31Q-2 1-28 31', 'M6-31Q37 1 15 31', 'M46-23Q69 1 57 26'],
        '#936332',
        3,
      ) +
      flecks(-84, -17, 156, 39, 22, '#ad8549'),
    a,
    scale,
  )
}
function fish(kind) {
  let s = ''
  if (kind === 'mackerel') {
    s += sauce(241, 210, 300, 56, '#986132') + fishFillet(224, 181, '#697f7c', 1.02, -14)
    s +=
      sauce(224, 182, 182, 19, '#a76b31') +
      lines(['M155 171 175 155', 'M176 184 194 163', 'M195 194 214 172'], '#d7b775', 5)
    s += T(
      334,
      220,
      Q(-12, -35, 24, 76, '#c2c480', 5) + lines(['M-3-30-3 33', 'M5-28 5 32'], '#62813d', 2),
      25,
    )
  } else if (kind === 'lemon') {
    s += cabbage(230, 213, 1.6) + fishFillet(227, 185, '#e3d09a', 1.0, -12, false)
    s += lemon(172, 180, -20, 0.8) + lemon(258, 178, -20, 0.8)
    s += Array.from({ length: 9 }, (_, j) =>
      E(132 + ((j * 47) % 205), 158 + ((j * 23) % 68), 5, 4, '#637f36', I, 1.4),
    ).join('')
  } else if (kind === 'aqua') {
    s +=
      E(240, 202, 159, 70, '#dbc185', '#a47a42', 2) +
      fishFillet(225, 184, '#e2cc92', 0.86, -18, false)
    for (const [x, y, a] of [
      [137, 153, -30],
      [318, 155, 40],
      [336, 223, 14],
      [183, 250, -25],
    ]) {
      s += T(
        x,
        y,
        P('M-22 10Q-34-26 0-31Q35-21 23 11L0 23Z', '#73766c') +
          lines(['M0 21-13-19', 'M0 21 1-24', 'M0 21 15-17'], '#b4b397', 2) +
          P('M-22 10Q0-1 23 11L0 23Z', '#ccb375', I, 2),
        a,
      )
    }
    s +=
      tomato(121, 215, 0.7) +
      tomato(288, 249, 0.7) +
      tomato(285, 140, 0.6) +
      flecks(153, 158, 172, 84, 24, G)
  } else if (kind === 'swordfish') {
    s += fishFillet(225, 189, '#b77c36', 1, -10, false) + sauce(227, 196, 180, 10, '#8a4723')
    for (let j = 0; j < 4; j++)
      s += T(
        329 + j * 8,
        159 + j * 20,
        P('M-13-25Q12-30 10 12L-3 34Q-18 17-13-25Z', G) + P('M-1-26 1-35', 'none', I, 3),
        22 + j * 8,
      )
  } else if (kind === 'cod-tofu') {
    s += E(240, 207, 156, 58, '#bc9b58', '#927340', 2)
    for (const x of [143, 224, 305]) s += tofuCube(x, 216, 1.08)
    s += fishFillet(231, 171, '#e2d1a3', 0.96, -12, false)
    s +=
      lines(
        ['M165 151Q215 128 294 155', 'M176 162Q234 137 303 168', 'M178 173Q231 149 306 177'],
        '#d8bb75',
        4,
      ) + scallions(169, 147, 142, 13)
  }
  return frame(s, kind === 'mackerel' ? G : '#286c97', ['aqua', 'cod-tofu'].includes(kind))
}
function sardines() {
  let s = sauce(240, 217, 304, 53, '#8f562b')
  for (const [x, y, a] of [
    [211, 157, -8],
    [264, 224, -8],
  ]) {
    s += T(
      x,
      y,
      P('M-103-23Q-41-45 20-30L86-8 119-24 111 9 121 26 84 14Q-10 50-101 24Z', '#648084') +
        P('M-101 9Q-23 37 86 14Q-3 51-101 24Z', '#b7b290', I, 1.6) +
        E(-101, 0, 8, 23, '#b39068', I, 2) +
        E(-101, 2, 3, 12, '#72583f', 'none', 0) +
        P('M-71-24Q-52-2-65 20M-41-22 55-3M-38-13 43 8', 'none', '#354d50', 2.5),
      a,
    )
  }
  s +=
    lines(['M153 175 183 153', 'M178 189 208 166', 'M199 182 221 166'], '#e2bf7f', 5) +
    E(331, 148, 18, 16, '#a33f37')
  return frame(s, G, true)
}
function gyoza() {
  let s = ''
  for (let j = 0; j < 5; j++) {
    s += T(
      132 + j * 51,
      174 + j * 12,
      P('M-36 14Q-40-30-2-42Q30-39 42 10Q7 43-36 14Z', '#e5c58a') +
        P('M-36 14Q-6 33 42 10L34 29Q1 51-30 30Z', '#bc7b27', I, 2) +
        lines(['M-23-17-15 12', 'M-10-32-5 15', 'M4-32 9 13', 'M19-20 22 10'], '#9b652f', 2.5) +
        flecks(-25, 17, 54, 10, 12, '#774329', j),
      -19,
    )
  }
  s += E(318, 125, 40, 21, '#dfebda', I, 2.5) + E(318, 125, 29, 13, '#bba96c', '#776938', 1.5)
  return frame(s, '#286c97')
}
function shumai() {
  let s = E(240, 199, 165, 81, '#a96e33') + E(240, 190, 155, 72, '#cf9b55', I, 2)
  s += lines(
    [
      'M113 163 356 228',
      'M104 186 327 247',
      'M150 137 374 200',
      'M153 239 251 123',
      'M200 253 294 132',
      'M247 258 335 153',
    ],
    '#87542c',
    3,
  )
  s += cabbage(240, 192, 1.8)
  for (const [x, y] of [
    [154, 165],
    [240, 149],
    [322, 168],
    [189, 224],
    [284, 226],
  ]) {
    s += T(
      x,
      y,
      P('M-31-12-25 29Q0 45 26 26L33-15Z', '#e0bb79') +
        E(0, -13, 32, 20, '#d1a169', I, 2) +
        flecks(-23, -24, 47, 21, 18, '#94633b') +
        lines(['M-26-5-18 28', 'M-12 4-8 34', 'M5 5 7 34', 'M24-4 20 28'], '#aa824b', 2) +
        E(1, -15, 7, 6, '#638c37', I, 1.5),
    )
  }
  return frame(s, '#b67537')
}
function skewers() {
  let s = ''
  for (let j = 0; j < 3; j++) {
    let item = P('M0-110 0 105', 'none', '#a27135', 7) + P('M0-110 0 105', 'none', '#e1be7c', 3)
    for (let k = 0; k < 3; k++) {
      const y = -72 + k * 53
      item +=
        Q(-23, y, 45, 33, '#a26535', 8) +
        lines([`M-15 ${y + 7} 14 ${y + 15}`, `M-15 ${y + 18} 11 ${y + 27}`], '#633922', 3)
      if (k < 2)
        item +=
          Q(-24, y + 34, 47, 19, '#c7bd79', 3) +
          lines([`M-15 ${y + 38} 15 ${y + 38}`, `M-15 ${y + 45} 15 ${y + 45}`], '#8f9152', 2)
    }
    s += T(173 + j * 69, 196 + j * 11, item, -31)
  }
  return frame(s + lemon(341, 139, 25, 0.9), '#bd4830')
}
function rolls(asparagus = false) {
  let s = asparagus ? sauce(229, 225, 258, 33) : ''
  if (!asparagus) {
    for (let j = 0; j < 5; j++)
      s += T(336, 150 + j * 19, E(0, 0, 23, 10, G) + E(0, 0, 17, 6, '#a7bd67', I, 1), -25)
  }
  for (const [x, y, a] of [
    [150, 173, -23],
    [218, 178, -23],
    [285, 184, -23],
    [213, 239, -23],
  ]) {
    const meat = asparagus ? '#8d502d' : '#bc8a5a'
    s += T(
      x,
      y,
      P('M-22-41Q2-58 26-34L25 36Q2 60-25 34Z', meat) +
        E(0, -37, 24, 15, meat, I, 2) +
        lines(['M-22-10Q0 7 25-7', 'M-23 9Q0 26 24 10'], '#784329', 3) +
        (asparagus
          ? E(0, -37, 10, 9, '#76a347', I, 2) + P('M-6-47-5-60 1-67 7-58 7-46Z', G, I, 2)
          : E(0, -37, 13, 10, G, I, 1.6) + E(0, -37, 7, 5, '#b94d43', I, 1.2)),
      a,
    )
  }
  return frame(s, asparagus ? '#286c97' : G)
}
function tsukune() {
  let s = leaf(173, 213, -54, 1.8)
  for (const [x, y, a] of [
    [172, 161, -26],
    [274, 162, -26],
    [210, 232, -26],
    [312, 231, -26],
  ]) {
    s += T(
      x,
      y,
      E(0, 0, 46, 30, '#8c4b26') +
        E(-1, -5, 40, 24, '#b07432', I, 1.5) +
        P('M-28-10Q-3-25 22-12M-32 2Q-5 17 30 2', 'none', '#e1a752', 3) +
        flecks(-29, -17, 54, 26, 10, G),
      a,
    )
  }
  return frame(s, '#bd4830')
}
function eggplant() {
  let s = leaf(252, 204, 38, 2.2)
  for (const [x, y, a] of [
    [170, 182, -25],
    [271, 213, -25],
  ]) {
    s += T(
      x,
      y,
      P('M-30-79Q-6-91 24-72Q57-13 36 60Q18 94-19 78Q-54 52-45-7Z', '#4b3159') +
        P('M-24-64Q-1-78 18-62Q41-6 23 56Q10 74-13 63Q-36 42-31-9Z', '#b08c41', I, 2) +
        P('M-22-55Q0-69 15-50L20 41Q10 62-12 48L-28-2Z', '#79421f', I, 2) +
        sesame(-23, -48, 43, 96),
      a,
    )
  }
  return frame(s, '#286c97')
}
function omelet() {
  let s = P(
    'M103 190C119 118 220 112 304 165Q354 183 363 221Q277 268 165 248Q113 236 103 190Z',
    '#e7ac2c',
  )
  s += P('M112 188Q208 215 352 213Q304 255 166 245Q123 230 112 188Z', '#c57f22', I, 2.5)
  s += P('M128 204Q212 241 326 222', 'none', '#f7ce64', 6)
  s += lines(['M133 176Q147 153 181 148', 'M178 148Q207 136 234 144'], '#f8d474', 4)
  s += mushroom(275, 232, 0.6, 75) + mushroom(310, 213, 0.62, 57) + flecks(139, 155, 183, 42, 22, G)
  return frame(s, '#bd4830')
}
function savoryPancake(seafood = false) {
  let s = E(240, 206, 145, 72, '#9d6128') + E(240, 190, 146, 75, seafood ? '#cba34b' : '#b17a32')
  if (seafood) {
    s += lines(
      [
        'M124 178 318 229',
        'M148 148 359 201',
        'M206 122 165 241',
        'M267 127 227 259',
        'M324 151 287 250',
      ],
      '#6b4425',
      5,
    )
    s += lines(
      [
        'M125 183 162 190',
        'M176 143 211 158',
        'M222 213 258 229',
        'M291 151 321 165',
        'M293 217 326 230',
      ],
      G,
      6,
    )
    s +=
      shrimp(194, 189, 0.66, 16) + shrimp(293, 179, 0.64, 48) + E(265, 227, 16, 10, C, '#805f3a', 3)
  } else {
    s += E(240, 187, 128, 59, '#753d24', I, 2)
    s += lines(
      ['M135 158Q230 221 343 162', 'M125 182Q235 240 351 188', 'M134 207Q242 250 338 216'],
      '#f3ddb1',
      7,
    )
    s += flecks(128, 143, 223, 83, 60, G)
    for (let j = 0; j < 9; j++)
      s += T(
        160 + ((j * 31) % 172),
        154 + ((j * 17) % 62),
        P('M-15 0Q-7-10 15-4L7 6-12 9Z', '#b68550', '#6f4a2c', 1),
        j * 37,
      )
  }
  return frame(s, '#286c97')
}
function shrimp(x, y, scale = 1, a = 0) {
  return T(
    x,
    y,
    P('M20-18C-4-42-35-20-30 5C-26 33 13 40 26 16L11 2C-1 20-17 1-6-9Q1-15 8-4Z', '#db733c') +
      P('M12-9 37-23 31 0 22 9Z', '#c54e2e') +
      lines(['M-23-14-11-6', 'M-29 0-15 2', 'M-21 16-9 10', 'M-6 24 0 12'], '#f3bd79', 3),
    a,
    scale,
  )
}
function chiliShrimp() {
  let s = lettuce(168, 176, 1.45) + lettuce(315, 197, 1.15) + sauce(242, 221, 264, 50, '#be3e26')
  for (const [x, y, a] of [
    [157, 160, -15],
    [235, 142, 15],
    [305, 164, 65],
    [184, 224, -20],
    [267, 225, 32],
    [327, 220, 85],
  ])
    s += shrimp(x, y, 0.95, a)
  return frame(s + scallions(152, 163, 167, 13), '#bd4830', true)
}
function scallops() {
  let s = ''
  for (const [x, y, a] of [
    [144, 165, -20],
    [207, 192, 34],
    [309, 190, -60],
    [281, 235, 29],
  ])
    s += leaf(x, y, a, 1.2)
  s += lines(['M136 227Q223 250 347 199', 'M129 217Q218 237 336 188'], '#567b39', 8)
  for (const [x, y] of [
    [156, 178],
    [244, 149],
    [322, 190],
    [242, 237],
  ]) {
    s += T(
      x,
      y,
      P('M-29-8-29 14Q0 37 30 14L30-8Z', '#caa76b') +
        E(0, -9, 30, 23, '#d19a45') +
        E(0, -10, 21, 16, '#b8762c', '#8a5327', 1.4) +
        flecks(-17, -21, 32, 22, 14, '#6e4325'),
    )
  }
  return frame(s, '#286c97')
}
function meatballs() {
  let s = sauce(240, 208, 276, 55, '#b44324')
  for (const [x, y] of [
    [146, 180],
    [225, 152],
    [306, 172],
    [193, 232],
    [281, 232],
  ]) {
    s +=
      E(x, y + 7, 35, 31, '#7c4226') +
      E(x - 2, y - 3, 32, 26, '#ab552c', I, 2) +
      P(`M${x - 20} ${y - 6}Q${x - 9} ${y - 24} ${x + 11} ${y - 14}`, 'none', '#e6a057', 4)
  }
  s +=
    lines(['M121 202Q102 165 135 145', 'M340 191Q373 213 334 243'], '#d0b56f', 9) +
    sesame(127, 157, 206, 88)
  return frame(s, G, true)
}
function hasselback() {
  let s = ''
  for (const [x, y, a] of [
    [192, 171, -25],
    [289, 225, -25],
  ]) {
    let p = E(0, 0, 83, 48, '#a76c26')
    for (let j = 0; j < 10; j++) {
      const x = -62 + j * 14,
        h = 41 - Math.abs(j - 4.5) * 3
      p += E(x, -4, 10, h, '#dca83b', '#764725', 2)
      p += P(`M${x - 3} ${-h + 3}Q${x + 8} -15 ${x + 5} 15`, 'none', '#f4cf6d', 2)
    }
    s += T(x, y, p + flecks(-60, -28, 120, 50, 17, '#59452a'), a)
  }
  s += lines(
    ['M321 167 355 127', 'M328 156 327 141M333 150 345 150M339 143 338 129M344 138 358 137'],
    G,
    3,
  )
  return frame(s, '#bd4830')
}
function dashimaki() {
  let s = ''
  for (let j = 0; j < 4; j++) {
    s += T(
      154 + j * 48,
      174 + j * 10,
      P('M-29-31Q0-42 32-26L34 29Q1 43-31 28Z', '#e4a82d') +
        P('M-28 1Q2-13 33 4L33 29Q2 44-29 28Z', '#f0cb65', I, 2) +
        P('M-20 17Q-6 7 18 16Q22 28-1 25Q-17 23-13 17Q-6 12 8 17', 'none', '#b87825', 2.3),
      -12,
    )
  }
  s += T(349, 157, P('M-27 13Q-32-11-15-11Q-9-28 8-17Q29-20 28 0Q39 21 6 23Z', C, I, 2))
  return frame(s, G)
}

// New everyday dishes have their own silhouettes; the existing collection stays unchanged.
function everydayRice(x = 240, y = 187, scale = 1) {
  return T(x, y, E(0, 0, 147, 74, C) + flecks(-117, -45, 233, 90, 110, '#d8c48e'), 0, scale)
}
function nigiriSushi(kind) {
  let s = ''
  for (const [x, y] of [
    [142, 149],
    [239, 134],
    [332, 161],
    [149, 218],
    [247, 208],
    [337, 229],
  ]) {
    let piece = Q(-39, -2, 78, 37, C, 16) + flecks(-33, 3, 63, 25, 21, '#d6bd89')
    if (kind === 'egg') {
      piece +=
        Q(-43, -24, 86, 34, '#e8b944', 7) +
        P('M-40-7H40L40 9H-40Z', '#d29230', I, 1.8) +
        Q(-9, -24, 18, 58, '#2d4937', 1) +
        P('M-4-21V29', 'none', '#5b7351', 2)
    } else {
      piece +=
        P('M-44-7Q-37-35 21-21L39-8 53-17 52 1 59 12 40 8Q5 22-37 9Z', '#edb687') +
        P('M-38-5Q-14-22 26-12Q9 10-35 6Z', '#f5dac0', '#ae684e', 1.5) +
        lines(['M-26-17-24 8', 'M-11-22-9 10', 'M5-22 6 10', 'M20-18 21 5'], '#c66045', 3)
    }
    s += T(x, y, piece, -15, 0.95)
  }
  return frame(s, kind === 'egg' ? G : '#286c97')
}
function temakiSushi() {
  let s = ''
  for (const [x, y, a] of [
    [157, 184, -28],
    [248, 186, 1],
    [327, 197, 29],
  ]) {
    s += T(
      x,
      y,
      P('M-43-49Q0-70 46-45L14 92Q-3 101-13 77Z', '#2b4534') +
        P('M-38-39Q-7-14 12 76L-7 74Z', '#425b3c', I, 1.5) +
        E(0, -45, 43, 22, C) +
        flecks(-34, -61, 67, 31, 27, '#cbb683') +
        Q(-20, -79, 17, 43, '#e4b943', 3) +
        Q(10, -77, 15, 45, '#6d9b4d', 3) +
        P('M15-72V-36', 'none', '#b4c16c', 3) +
        P('M-20-30Q-32-48-12-52Q-2-65 8-49Q29-52 28-35Q7-19-20-30Z', '#c4a270', I, 2) +
        flecks(-15, -49, 38, 25, 15, '#9e744e'),
      a,
      0.92,
    )
  }
  return frame(s, '#bd4830')
}
function pressedSushi() {
  let s = ''
  for (const [x, y, a] of [
    [148, 162, -10],
    [243, 145, -10],
    [328, 187, -10],
    [224, 235, -10],
  ]) {
    s += T(
      x,
      y,
      P('M-41-5 29-20 48-1 47 40-22 52-43 29Z', C) +
        P('M-41-5-20 11 48-1M-20 11-22 52', 'none', '#b69f70', 2) +
        flecks(-31, 16, 64, 28, 30, '#d5c18a') +
        P('M-42-12 29-26 50-9 48 6-23 19-44 7Z', G, I, 2) +
        P('M-43-24 28-39 50-22 49-8-22 7-44-8Z', '#cbb88b') +
        P('M-43-24 28-39 48-23-23-8Z', '#60716a', I, 2) +
        lines(['M-29-23-13-12', 'M-9-28 6-18', 'M10-33 25-22'], '#354c4d', 3) +
        P('M-42-8-23 6 47-8', 'none', '#ad763d', 3),
      a,
    )
  }
  return frame(s, '#286c97')
}
function takoyaki() {
  let s = ''
  for (const [x, y] of [
    [156, 150],
    [240, 136],
    [324, 161],
    [161, 227],
    [246, 214],
    [329, 238],
  ]) {
    s += T(
      x,
      y,
      E(0, 5, 39, 34, '#a56a29') +
        E(-2, -3, 36, 30, '#d6a240', I, 2) +
        flecks(-29, -22, 58, 42, 21, '#965529') +
        P('M-31-9Q-8-31 25-12Q34 4 11 8Q-12 22-31-9Z', '#77452b', I, 1.6) +
        lines(['M-27-8Q-6 6 23-9', 'M-26 3Q-3 17 26 2'], '#f0dcb2', 3) +
        P('M-14-20Q0-31 19-22L11-14Q-1-24-14-14Z', '#bd935d', '#835d39', 1) +
        flecks(-26, -15, 50, 32, 14, G),
    )
  }
  return frame(s, '#bd4830')
}
function monjayaki() {
  let s =
    Q(64, 96, 352, 220, '#303a34', 25, I, 4) +
    Q(28, 167, 39, 64, '#525d52', 9) +
    Q(413, 167, 39, 64, '#525d52', 9) +
    P(
      'M94 180Q78 135 123 143Q152 107 187 124Q224 98 252 125Q299 110 319 132Q373 130 365 161Q409 183 379 209Q388 245 350 247Q321 284 282 266Q241 292 212 270Q154 284 139 253Q95 252 110 222Q71 206 94 180Z',
      '#b99151',
      '#795631',
      2,
    )
  for (let j = 0; j < 44; j++) {
    const x = 116 + ((j * 47) % 243),
      y = 140 + ((j * 29) % 105)
    s += T(x, y, P('M-12-4 11-7 14 2-10 7Z', j % 4 ? '#d8cb91' : '#b57c53', '#957645', 1), j * 41)
  }
  s += flecks(111, 142, 255, 115, 70, '#745131') + flecks(131, 148, 221, 102, 33, G)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"><rect width="480" height="360" fill="${C}"/>${s}</svg>`
}
function stuffedSquid() {
  let s =
    P('M111 137Q159 101 270 134L339 175 301 202Q166 210 119 174Z', '#a75f3c') +
    P('M280 138 320 112 347 147 327 162Z', '#bc7650') +
    P('M299 183 335 194 319 230 289 204Z', '#bc7650') +
    lines(['M139 133Q203 131 268 157', 'M143 149Q203 147 275 172'], '#dfad7c', 3)
  for (const [x, y, a] of [
    [142, 194, -17],
    [211, 222, -17],
    [286, 240, -17],
  ]) {
    s += T(
      x,
      y,
      P('M-39-9Q-45-36 0-40Q47-34 43-4L39 23Q0 51-40 22Z', '#a85f3b') +
        E(1, -6, 41, 30, '#d68f5b') +
        E(1, -6, 32, 22, '#e7cd96', I, 2) +
        flecks(-25, -20, 53, 31, 36, '#b4925d'),
      a,
    )
  }
  return frame(s, G)
}
function goheiMochi() {
  let s = ''
  for (const [x, y] of [
    [181, 172],
    [292, 220],
  ]) {
    s += T(
      x,
      y,
      P('M-53-50Q0-79 52-48L56 34Q30 74-26 67Q-65 52-59 12Z', '#cfaa65') +
        P('M-43-41Q0-66 42-39L44 31Q22 57-20 52Q-53 37-46 4Z', '#8c4c28', I, 2) +
        flecks(-41, -38, 76, 78, 42, '#bc8644') +
        sesame(-32, -31, 61, 71),
      -28,
    )
  }
  return frame(s, '#bd4830')
}
function soboroDon() {
  let s = everydayRice()
  s +=
    P('M100 169Q111 122 209 118L276 243Q128 260 101 203Z', '#9b673b') +
    P('M211 118Q324 109 375 169L278 243Z', '#e3ba3f') +
    P('M375 173Q398 232 280 254L251 201Z', '#599045')
  s += flecks(125, 149, 76, 63, 65, '#6d472e') + flecks(208, 144, 104, 42, 65, '#f7d96e')
  for (let j = 0; j < 16; j++) {
    const x = 285 + ((j * 29) % 61),
      y = 198 + ((j * 19) % 39)
    s += T(x, y, Q(-13, -5, 27, 10, '#6f9e4c', 3, '#345937', 1.5), -28)
  }
  return frame(s, '#286c97', true)
}
function katsudon() {
  let s = everydayRice()
  for (let j = 0; j < 5; j++) {
    s += T(
      142 + j * 42,
      169 + j * 7,
      P('M-19-40Q1-54 21-33L20 40Q-1 55-23 35Z', '#c58d35') +
        P('M-10-26Q1-33 11-24L10 30Q-1 37-11 29Z', '#e6c99e', I, 1.4) +
        flecks(-18, -32, 37, 61, 17, '#9c6429', j),
      -23,
    )
  }
  s +=
    P(
      'M103 202Q129 181 151 202Q177 180 196 204Q221 187 241 209Q267 190 287 211Q328 196 358 220Q326 247 295 233Q258 260 234 239Q197 256 171 234Q125 241 103 202Z',
      '#edc968',
      '#ab813e',
      1.8,
    ) +
    lines(
      ['M132 153Q120 191 158 219', 'M204 137Q188 170 218 189', 'M315 172Q305 207 333 216'],
      '#dcc598',
      5,
    )
  return frame(s, G, true)
}
function kabayakiRice(anago = false) {
  let s = everydayRice()
  const pieces = anago
    ? [
        [134, 158],
        [206, 155],
        [278, 154],
        [167, 218],
        [239, 219],
        [310, 213],
      ]
    : [
        [192, 158],
        [266, 218],
      ]
  for (const [x, y] of pieces) {
    const w = anago ? 57 : 167,
      h = anago ? 38 : 57
    s += T(
      x,
      y,
      Q(-w / 2, -h / 2, w, h, '#a76631', 9) +
        P(`M${-w / 2 + 5} ${h / 2 - 8}H${w / 2 - 5}`, 'none', '#643c27', 5) +
        Array.from({ length: anago ? 3 : 7 }, (_, j) => {
          const dx = -w / 2 + 10 + (j * (w - 20)) / (anago ? 2 : 6)
          return P(`M${dx} ${-h / 2 + 7}Q${dx - 7} 0 ${dx} ${h / 2 - 7}`, 'none', '#683b24', 4)
        }).join('') +
        P(`M${-w / 2 + 8} ${-h / 2 + 7}H${w / 2 - 9}`, 'none', '#d5984b', 3),
      -15,
    )
  }
  if (anago)
    s += lines(
      ['M152 173 181 155', 'M210 211 240 193', 'M282 166 309 150', 'M270 229 300 215'],
      '#304437',
      4,
    )
  else s += flecks(176, 140, 145, 76, 20, '#658146')
  return frame(s, anago ? '#bd4830' : G, true)
}
function friedShrimpPiece(x, y, rotation = 0, scale = 1, tempura = false) {
  let s =
    P('M-18-65Q4-79 23-52L19 32Q4 55-16 36Q-24 4-18-65Z', tempura ? '#e7c784' : '#d4a048') +
    P('M-15 36 0 67 5 47 20 65 23 29Q2 42-15 36Z', '#c86639') +
    flecks(-15, -55, 32, 84, 38, tempura ? '#bd9247' : '#936027') +
    P('M-6-57Q7-58 8-31', 'none', '#f4d992', 4)
  if (tempura)
    for (let j = 0; j < 9; j++)
      s += E(j % 2 ? -19 : 21, -48 + j * 9, 6, 5, '#e7c784', '#b68d46', 1.3)
  return T(x, y, s, rotation, scale)
}
function breadedPlate(kind) {
  let s = cabbage(339, 169, 0.85)
  if (kind === 'shrimp') {
    for (const [x, y] of [
      [153, 171],
      [222, 184],
      [288, 198],
    ])
      s += friedShrimpPiece(x, y, -29, 0.97)
  } else if (kind === 'aji') {
    s += T(
      218,
      195,
      P(
        'M0-76Q-17-49-41-44Q-95-20-100 36Q-65 70-15 52L0 41 15 53Q67 67 102 32Q94-25 37-44Q14-48 0-76Z',
        '#c99437',
      ) +
        P('M-17-58-27-97 0-82 25-100 16-57Z', '#a87035') +
        P('M0-49Q-8-8 0 41', 'none', '#81512b', 5) +
        flecks(-71, -30, 140, 69, 90, '#94612b') +
        lines(['M-48-22-19 26', 'M38-26 18 28'], '#e6bb6a', 5),
      -13,
    )
  } else if (kind === 'chicken') {
    for (let j = 0; j < 5; j++)
      s += T(
        128 + j * 41,
        177 + j * 8,
        Q(-20, -39, 40, 85, '#c28c32', 10) +
          Q(-12, -29, 24, 64, '#ecd0a4', 6) +
          flecks(-18, -35, 37, 76, 30, '#946025', j),
        -22,
      )
    s += sauce(223, 249, 158, 9, '#70442b')
  } else {
    const positions =
      kind === 'oyster'
        ? [
            [144, 161],
            [214, 151],
            [276, 190],
            [181, 231],
          ]
        : kind === 'cream'
          ? [
              [148, 161],
              [228, 188],
              [302, 218],
            ]
          : [
              [173, 181],
              [273, 221],
            ]
    for (const [x, y] of positions) {
      let piece =
        kind === 'cream'
          ? Q(-32, -48, 64, 97, '#d5a345', 25)
          : E(0, 0, kind === 'oyster' ? 35 : 58, kind === 'oyster' ? 30 : 43, '#c58c32')
      piece +=
        flecks(-27, -23, 54, 48, 37, '#906027') + P('M-21-16Q-6-28 12-21', 'none', '#eac47e', 4)
      s += T(x, y, piece, -24)
    }
  }
  if (kind === 'shrimp' || kind === 'oyster' || kind === 'aji') s += lemon(353, 245, 20, 0.82)
  return frame(s, kind === 'aji' || kind === 'oyster' ? G : '#286c97')
}
function shrimpTempura() {
  let s = ''
  for (const [x, y] of [
    [144, 169],
    [205, 181],
    [266, 190],
    [326, 205],
  ])
    s += friedShrimpPiece(x, y, -30, 0.94, true)
  s += T(141, 262, P('M-22 5Q-29-14-9-13Q2-30 16-13Q39-12 30 10Q5 27-22 5Z', C, I, 2))
  s += T(175, 265, E(0, 0, 14, 8, '#ccad78', I, 1.5))
  return frame(s, G)
}
function everydayDatemaki() {
  let s = ''
  for (const [x, y] of [
    [137, 181],
    [197, 159],
    [257, 181],
    [317, 211],
    [229, 242],
  ]) {
    s += T(
      x,
      y,
      P(
        'M-29-24-17-36-3-34 12-40 25-28 35-19 33-3 39 12 26 25 18 37 2 34-13 39-25 27-38 15-34-1-39-14Z',
        '#cf9133',
      ) +
        E(0, -1, 29, 29, '#ebc352', I, 1.5) +
        P(
          'M-20 9C-38-22 15-37 22-4C29 23-13 27-12 7C-10-8 12-6 10 6Q7 14 0 8',
          'none',
          '#ad6d27',
          3,
        ),
      -13,
    )
  }
  return frame(s, '#bd4830')
}
function chilledTofu(egg = false) {
  let s =
    E(240, 220, 119, 48, '#d7ba72', '#a17e48', 1.5) +
    T(
      232,
      180,
      P('M-83-26 46-43 90-12 84 58-45 76-87 43Z', egg ? '#e6c866' : '#e1d1aa') +
        P('M-83-26-41 4 90-12M-41 4-45 76', 'none', egg ? '#bc993f' : '#b5a17b', 2) +
        P('M-75-27 43-41 82-15-40 2Z', egg ? '#f1dc91' : '#efe2c1', I, 1.5),
    )
  if (egg) s += leaf(225, 159, -56, 0.45) + leaf(244, 152, 16, 0.42) + leaf(246, 170, 87, 0.38)
  else s += T(330, 230, P('M-16 8-11-4-2-6 2-18 11-5 17-1 21 10Z', '#779451', I, 1.8))
  return frame(s, egg ? '#286c97' : G)
}

const DRAWINGS = {
  'r-tamago-nigiri': ['egg-nigiri', () => nigiriSushi('egg')],
  'r-ebi-nigiri': ['shrimp-nigiri', () => nigiriSushi('shrimp')],
  'r-cooked-temaki-zushi': ['temaki-sushi', temakiSushi],
  'r-grilled-saba-oshizushi': ['pressed-mackerel-sushi', pressedSushi],
  'r-takoyaki': ['takoyaki', takoyaki],
  'r-monjayaki': ['monjayaki-griddle', monjayaki],
  'r-ika-meshi': ['stuffed-squid-rice', stuffedSquid],
  'r-gohei-mochi': ['gohei-mochi', goheiMochi],
  'r-three-color-soboro-don': ['three-color-soboro', soboroDon],
  'r-katsudon': ['egg-katsu-don', katsudon],
  'r-unadon': ['eel-rice-bowl', () => kabayakiRice(false)],
  'r-anago-meshi': ['anago-rice', () => kabayakiRice(true)],
  'r-aji-fry': ['breaded-aji', () => breadedPlate('aji')],
  'r-ebi-fry': ['breaded-shrimp', () => breadedPlate('shrimp')],
  'r-kaki-fry': ['breaded-oysters', () => breadedPlate('oyster')],
  'r-chicken-katsu': ['breaded-chicken', () => breadedPlate('chicken')],
  'r-menchi-katsu': ['menchi-katsu', () => breadedPlate('menchi')],
  'r-kani-cream-croquette': ['crab-cream-croquette', () => breadedPlate('cream')],
  'r-shrimp-tempura': ['shrimp-tempura', shrimpTempura],
  'r-datemaki': ['datemaki', everydayDatemaki],
  'r-goma-dofu': ['sesame-tofu', () => chilledTofu(false)],
  'r-tamago-dofu': ['egg-tofu', () => chilledTofu(true)],
  'r-chicken-teriyaki': ['sliced-teriyaki', () => slicedMeat('teriyaki')],
  'r-chicken-nanban-tartar': ['tartar-chicken', () => slicedMeat('nanban')],
  'r-small-pan-tonkatsu': ['breaded-pork-cutlet', () => slicedMeat('katsu')],
  'r-onion-hamburg-steak': ['hamburg-steak', hamburg],
  'r-tomato-cabbage-rolls': ['cabbage-rolls', cabbageRolls],
  'r-stuffed-green-peppers': ['stuffed-peppers', () => pepperBoats(false)],
  'r-zucchini-lentil-boats': ['zucchini-boats', () => pepperBoats(true)],
  'r-mild-mapo-tofu': ['mapo-tofu', mapo],
  'r-tofu-steak-mushroom': ['tofu-steak', () => tofuSteak(false)],
  'r-agedashi-tofu-daikon': ['agedashi-tofu', () => tofuSteak(true)],
  'r-salmon-mushroom-foil': ['salmon-foil', () => salmon('foil')],
  'r-salmon-miso-mayo': ['miso-salmon', () => salmon('miso')],
  'r-salmon-lemon-meuniere': ['salmon-meuniere', () => salmon('lemon')],
  'r-mackerel-miso-simmer': ['miso-mackerel', () => fish('mackerel')],
  'r-cod-lemon-caper-steam': ['lemon-cod', () => fish('lemon')],
  'r-whitefish-acqua-pazza': ['acqua-pazza', () => fish('aqua')],
  'r-swordfish-teriyaki': ['swordfish-steak', () => fish('swordfish')],
  'r-cod-tofu-ginger-steam': ['cod-tofu', () => fish('cod-tofu')],
  'r-sardine-ginger-simmer': ['headless-sardines', sardines],
  'r-cabbage-pork-gyoza': ['gyoza', gyoza],
  'r-pork-shumai': ['shumai-basket', shumai],
  'r-pork-onion-skewers': ['pork-onion-skewers', skewers],
  'r-pork-plum-shiso-rolls': ['plum-shiso-rolls', () => rolls(false)],
  'r-asparagus-beef-rolls': ['asparagus-beef-rolls', () => rolls(true)],
  'r-shiso-chicken-tsukune': ['tsukune-patties', tsukune],
  'r-eggplant-dengaku': ['eggplant-dengaku', eggplant],
  'r-mushroom-cheese-omelet': ['folded-omelet', omelet],
  'r-pork-cabbage-okonomiyaki': ['okonomiyaki', () => savoryPancake(false)],
  'r-seafood-chive-pancake': ['seafood-chijimi', () => savoryPancake(true)],
  'r-shrimp-chili-sauce': ['chili-shrimp', chiliShrimp],
  'r-scallop-spinach-saute': ['seared-scallops', scallops],
  'r-sweet-sour-meatballs': ['sweet-sour-meatballs', meatballs],
  'r-hasselback-herb-potato': ['hasselback-potato', hasselback],
  'r-dashimaki-omelet': ['rolled-dashimaki', dashimaki],
}

export function savoryArt(recipe) {
  const match = DRAWINGS[recipe.id]
  return match ? { mode: `savory-${match[0]}`, svg: match[1]() } : null
}
