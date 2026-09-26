// Original vector compositions for dishes whose shape is not captured by generic toppings.
const INK = '#202820'
const CREAM = '#fff5de'
const GREEN = '#39764b'
const GOLD = '#dfaa43'
const RED = '#c94f35'
const path = (d, fill, stroke = INK, width = 3) =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`
const ellipse = (x, y, rx, ry, fill, stroke = INK, width = 3) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`
const rect = (x, y, w, h, fill, r = 5) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${INK}" stroke-width="3"/>`
const group = (x, y, body, rotation = 0, scale = 1) =>
  `<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale})">${body}</g>`
const specks = (x, y, w, h, color, count = 25) =>
  Array.from({ length: count }, (_, n) =>
    ellipse(x + ((n * 37) % w), y + ((n * 29) % h), 2 + (n % 3), 1.3, color, 'none', 0),
  ).join('')
function frame(body, bowl = false, rim = '#286c97') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"><rect width="480" height="360" fill="${CREAM}"/>${ellipse(245, 286, 170, 17, '#d5b781', 'none', 0)}${bowl ? path('M49 174Q67 304 240 312Q418 302 431 174Z', rim) : ''}${ellipse(240, 190, 194, 107, rim)}${ellipse(240, 185, 178, 91, CREAM)}${body}</svg>`
}
const herb = (x, y, scale = 1) =>
  group(
    x,
    y,
    path('M0 16Q-23 7-14-9Q-4-20 0-4Q13-26 20-11Q29 2 7 5L0 16Z', GREEN, INK, 1.7),
    0,
    scale,
  )
const lemon = (x, y, scale = 1) =>
  group(
    x,
    y,
    path('M-26 2Q0-29 26 2L0 25Z', '#e7c142') +
      path('M-18 3H18L0 18Z', '#f6dea0', INK, 1.3) +
      path('M0 17V3M0 17-10 3M0 17 10 3', 'none', CREAM, 1.5),
    0,
    scale,
  )
const dipping = (x, y, color, scale = 1) =>
  group(
    x,
    y,
    ellipse(0, 6, 38, 23, '#286c97') +
      ellipse(0, 0, 34, 19, CREAM) +
      ellipse(0, 0, 28, 14, color, INK, 1.5) +
      herb(0, -1, 0.35),
    0,
    scale,
  )
const chicken = (x, y, color = '#b67135', rotation = 0, scale = 1) =>
  group(
    x,
    y,
    path('M-24-9Q-21-28 2-20L25-5Q33 10 13 22L-13 17Z', color) +
      path('M-13-8 11 4M-7 7 6 10', 'none', '#774329', 2),
    rotation,
    scale,
  )
const bean = (x, y, color = '#c8a357') => ellipse(x, y, 10, 7, color, INK, 1.5)
function shrimp(x, y, scale = 1, rotation = 0) {
  return group(
    x,
    y,
    path('M16-17C-12-31-35-5-24 20Q-12 39 8 23L3 10Q-14 15-13 1Q-10-10 4-5L15 3Z', '#e88c57') +
      path('M14-10 28-20 28-2ZM-17-10-5-4M-25 1-13 4M-22 14-9 11M-10 24-5 14', 'none', INK, 2),
    rotation,
    scale,
  )
}
function dosa() {
  let body = path(
    'M92 140Q121 98 173 115L380 205Q405 220 381 242Q356 260 331 239L110 169Z',
    '#d2a052',
  )
  body += path('M101 142Q113 119 132 125Q148 134 130 158Q114 176 104 160Z', '#9b632f')
  body += path('M112 145Q119 133 127 139Q133 146 122 154Z', '#edc777', INK, 1.5)
  body += path('M143 133 364 229M151 143 355 233', 'none', '#f1cc7b', 3)
  body += group(238, 180, specks(-85, -20, 164, 39, '#95652d', 45), 23)
  body += dipping(113, 230, '#ece7cb', 0.85) + dipping(203, 257, RED, 0.8)
  return frame(body)
}
function idli() {
  let body = ''
  for (const [x, y, s] of [
    [169, 147, 0.95],
    [269, 143, 0.95],
    [124, 196, 1],
    [226, 200, 1.03],
    [324, 192, 0.96],
  ]) {
    body += group(
      x,
      y,
      path('M-49 4Q-45-41 0-40Q44-38 49 4Q38 33-1 33Q-40 32-49 4Z', '#fcf9e9') +
        ellipse(0, 4, 47, 26, '#fffdf2', '#d9cfac', 1) +
        specks(-29, -14, 56, 32, '#dfd5b6', 16),
      0,
      s,
    )
  }
  body += dipping(157, 265, '#d4732e', 0.78) + dipping(315, 251, '#edf0cf', 0.8)
  return frame(body)
}
function samosa() {
  let body = ''
  for (const [x, y, rotation] of [
    [149, 192, -12],
    [249, 159, 5],
    [331, 215, 14],
  ]) {
    body += group(
      x,
      y,
      path('M-51 37-15-64Q-8-75 0-61L54 37Q4 65-51 37Z', GOLD) +
        path('M-10-54 3 36 46 34M3 36-43 33', 'none', '#a87333', 3) +
        specks(-21, -16, 42, 43, '#ad7836', 16),
      rotation,
    )
  }
  body += dipping(110, 257, GREEN, 0.75)
  return frame(body)
}
function riceDish(paella = false) {
  let body = ellipse(240, 185, 152, 70, paella ? '#d8a83e' : '#f0dab0')
  for (let n = 0; n < 250; n++) {
    const x = 103 + ((n * 41) % 274),
      y = 123 + ((n * 31) % 124)
    if (((x - 240) / 145) ** 2 + ((y - 185) / 66) ** 2 < 1) {
      body += group(
        x,
        y,
        ellipse(0, 0, 5, 1.7, n % 3 ? '#edbd55' : '#fff0cc', 'none', 0),
        n % 2 ? 25 : -25,
      )
    }
  }
  if (paella) {
    body += shrimp(163, 176, 1.2, -20) + shrimp(296, 209, 1.2, 25)
    for (const [x, y, r] of [
      [289, 138, -20],
      [196, 227, 20],
      [358, 179, 25],
    ]) {
      body += group(
        x,
        y,
        ellipse(0, 0, 26, 15, '#443d38') +
          ellipse(0, -2, 17, 8, '#dfb277', INK, 1.5) +
          path('M-20 0 16 0', 'none', '#ead8a8', 2),
        r,
      )
    }
    body +=
      path('M207 148 243 159M128 214 152 227M286 173 322 184', 'none', RED, 8) +
      lemon(106, 222, 0.9)
  } else {
    body +=
      chicken(157, 158, '#b36c30', -16, 1.1) +
      chicken(283, 214, '#ba7635', 15, 1.2) +
      chicken(320, 150, '#aa622d', 5)
    body += path(
      'M139 206Q158 182 180 199M203 145Q226 123 245 147M232 238Q251 215 273 234M330 190Q351 176 366 191',
      'none',
      '#885632',
      4,
    )
    body += herb(203, 214, 0.7) + herb(260, 151, 0.7) + lemon(104, 242, 0.8)
  }
  return frame(body, true)
}
function curry(kind) {
  const colors = {
    butter: '#d9793c',
    green: '#99ac6f',
    massaman: '#b97739',
    saag: '#538150',
    chana: '#a35f32',
    dal: '#d8ac3e',
    vindaloo: '#b54830',
  }
  let body = ellipse(240, 180, 153, 72, colors[kind])
  if (kind === 'butter' || kind === 'green' || kind === 'massaman' || kind === 'vindaloo') {
    for (const [x, y, r] of [
      [151, 159, -10],
      [258, 148, 15],
      [330, 194, -20],
      [233, 228, 20],
    ])
      body += chicken(x, y, kind === 'green' ? '#e4d3a5' : '#b87336', r)
  }
  if (kind === 'butter')
    body += path('M145 199Q182 166 227 196T326 168M166 225Q226 208 288 233', 'none', '#f7e7c7', 5)
  if (kind === 'green') {
    body += group(
      175,
      217,
      ellipse(0, 0, 22, 13, '#77914c') + path('M-13 0 13 0', 'none', CREAM, 2),
      -20,
    )
    body += group(
      290,
      200,
      ellipse(0, 0, 24, 15, '#b4c68d') + path('M-14 0 14 0', 'none', CREAM, 2),
      15,
    )
    body += path('M185 125 199 152M308 127 321 152', 'none', '#e7d6a7', 8)
  }
  if (kind === 'massaman') {
    body += path('M173 190 199 175 220 201 197 226 173 213Z', '#dfb855')
    for (const [x, y] of [
      [139, 220],
      [209, 132],
      [289, 195],
      [324, 233],
    ])
      body += bean(x, y, '#cba15c')
  }
  if (kind === 'saag') {
    for (const [x, y, r] of [
      [158, 160, -15],
      [247, 140, 10],
      [324, 182, 25],
      [201, 222, -5],
      [290, 224, 10],
    ])
      body += group(
        x,
        y,
        path('M-19-15 17-17 25 12-15 19Z', '#f4e8bd') + path('M-10-8 11-9', 'none', '#cfb878', 2),
        r,
      )
    body += path('M129 195Q173 179 213 193M269 170Q291 154 321 159', 'none', '#e8ddaf', 3)
  }
  if (kind === 'chana' || kind === 'dal') {
    const n = kind === 'dal' ? 50 : 26
    for (let j = 0; j < n; j++) {
      const x = 122 + ((j * 47) % 238),
        y = 138 + ((j * 29) % 98)
      if (((x - 240) / 137) ** 2 + ((y - 183) / 60) ** 2 < 1)
        body += ellipse(
          x,
          y,
          kind === 'dal' ? 5 : 12,
          kind === 'dal' ? 3 : 8,
          kind === 'dal' ? '#e8c561' : '#dbac66',
          INK,
          kind === 'dal' ? 0.8 : 1.3,
        )
    }
    if (kind === 'dal')
      body += path('M157 173Q185 184 195 161M237 211Q255 226 290 208', 'none', '#9f6637', 5)
  }
  body += herb(kind === 'green' ? 231 : 243, kind === 'chana' ? 178 : 190, 0.8)
  return frame(body, true)
}
function noodlePasta(kind) {
  const colors = {
    ink: '#343c38',
    pesto: '#709252',
    tomato: '#c6683c',
    bolognese: '#b36c39',
    cream: '#eed7a0',
    mentaiko: '#d9aa82',
    cheese: '#eee0b3',
    meatballs: '#cd7850',
    seafood: '#ce7650',
    puttanesca: '#cb7047',
    jajang: '#d9c28a',
  }
  let body = ''
  for (let n = 0; n < 27; n++) {
    const dx = (n * 7) % 33,
      dy = (n * 9) % 39
    const line = `M${112 + dx} ${166 + dy}C${107 + dx} ${93 + dy} ${326 - dx} ${92 + dy} ${355 - dx} ${151 + dy}S${184 + dx} ${273 - dy} ${147 + dx} ${209 - dy}S${321 - dx} ${120 + dy} ${332 - dx} ${186 + dy}`
    body += path(line, 'none', INK, 7) + path(line, 'none', colors[kind], 4.5)
  }
  if (kind === 'ink' || kind === 'seafood') {
    for (const [x, y, r] of [
      [147, 162, -15],
      [255, 133, 15],
      [284, 225, -10],
    ])
      body += group(
        x,
        y,
        ellipse(0, 0, 23, 14, '#f1dec1') + ellipse(0, 0, 14, 7, colors[kind], INK, 1.5),
        r,
      )
  }
  if (kind === 'pesto')
    body +=
      herb(156, 170) +
      herb(306, 201) +
      path('M204 143 239 158M216 233 248 246', 'none', '#f7ecbf', 6)
  if (kind === 'cream') {
    for (const [x, y, r] of [
      [157, 156, 20],
      [253, 137, -15],
      [313, 201, 10],
      [210, 226, -20],
    ])
      body += group(
        x,
        y,
        rect(-18, -8, 36, 16, '#b46d4f', 3) + path('M-12 0H11', 'none', '#e4bea0', 2),
        r,
      )
  }
  if (kind === 'mentaiko') {
    body += specks(119, 139, 229, 97, '#b96551', 70)
    body +=
      path(
        'M184 153 219 194M219 145 248 190M255 155 278 190M185 181 246 203',
        'none',
        '#273f32',
        4,
      ) + herb(328, 153, 0.8)
  }
  if (kind === 'cheese' || kind === 'cream') body += specks(115, 127, 228, 109, '#4b4938', 48)
  if (kind === 'bolognese' || kind === 'jajang') {
    body += ellipse(243, 165, 90, 38, kind === 'jajang' ? '#70442d' : '#a65431', INK, 2)
    for (let n = 0; n < 23; n++)
      body += ellipse(173 + ((n * 27) % 136), 143 + ((n * 17) % 42), 7, 5, '#b17a47', INK, 1)
    if (kind === 'jajang')
      for (let n = 0; n < 9; n++)
        body += path(
          `M${127 + n * 5} ${179 + n * 3}l42 32`,
          'none',
          n % 2 ? '#8ea760' : '#c1ce89',
          4,
        )
  }
  if (kind === 'meatballs')
    for (const [x, y] of [
      [149, 160],
      [254, 141],
      [312, 218],
    ])
      body +=
        ellipse(x, y, 33, 26, '#96502f') +
        path(`M${x - 20} ${y - 7}q17-13 35 2`, 'none', '#c77747', 4)
  if (kind === 'seafood')
    body += shrimp(193, 203, 1) + shrimp(325, 158, 0.9, 25) + ellipse(137, 227, 24, 14, '#554b3d')
  if (kind === 'puttanesca')
    for (const [x, y] of [
      [160, 163],
      [257, 137],
      [313, 211],
      [211, 231],
    ])
      body += ellipse(x, y, 13, 10, '#484639') + ellipse(x, y, 5, 3, '#bda772', INK, 1)
  if (kind !== 'mentaiko' && kind !== 'jajang') body += herb(253, 181, 0.65)
  return frame(body)
}
function stuffedPasta(kind) {
  let body = ''
  for (const [x, y, r] of [
    [146, 149, -15],
    [250, 134, 10],
    [339, 164, 20],
    [119, 213, -5],
    [221, 212, 15],
    [307, 238, -10],
  ]) {
    if (kind === 'ravioli') {
      let square =
        path('M-35-25 29-27 37 23-30 27Z', '#e5c97d') +
        ellipse(0, 0, 23, 15, '#f0dba0', '#bda366', 1.5)
      for (let n = 0; n < 7; n++)
        square += path(`M${-26 + n * 8}-24v6M${-25 + n * 8}20v5`, 'none', '#a98743', 1.5)
      body += group(x, y, square, r)
    } else {
      body += group(
        x,
        y,
        path('M-31 0Q-27-27 4-23Q32-24 33-1Q28 25-6 23Q-34 24-31 0Z', '#ebd497') +
          path('M-15-16Q-3 0-17 15M-3-19Q8 0-2 18M9-18Q20 0 12 15', 'none', '#b79d66', 2),
        r,
      )
    }
  }
  body += herb(193, 172, 0.7) + herb(298, 192, 0.7)
  return frame(body)
}
function layers(kind) {
  const potato = kind === 'shepherd' || kind === 'fish'
  let body = path('M104 151 321 119 377 208 157 250 104 213Z', '#b5753d')
  body += path(
    'M105 166 321 137 366 217 157 246 106 211Z',
    kind === 'fish' ? '#e4ca92' : potato ? '#875a34' : '#a94f30',
  )
  if (kind === 'fish')
    body +=
      path('M127 196 155 201 174 227 151 225ZM220 200 246 194 268 216 242 222Z', '#d78c61') +
      path('M177 204 205 201 216 222 192 229Z', '#f5e6ba')
  body += path('M119 190 334 157 348 176 139 215Z', kind === 'moussaka' ? '#56452f' : '#e5c48a')
  body += path('M104 151 320 115 377 207 157 239Z', potato ? '#ebd7a4' : '#e6c071')
  if (potato) {
    for (let n = 0; n < 14; n++)
      body += path(
        `M${115 + n * 13} ${156 - n * 2}l45 65`,
        'none',
        n % 2 ? '#d3b577' : '#f8e9bb',
        4,
      )
  } else {
    body += path(
      'M134 166Q168 133 204 151T283 148Q323 151 343 189Q302 199 273 182T204 194Q160 201 134 166Z',
      '#f1d17d',
      '#bd9447',
      2,
    )
    body += specks(153, 151, 160, 40, '#a06430', 30)
  }
  body += herb(340, 252, 0.9)
  return frame(body)
}
function cannelloni() {
  let body = ellipse(240, 185, 151, 70, RED)
  for (const [x, y, r] of [
    [151, 159, -20],
    [230, 177, -20],
    [310, 196, -20],
  ]) {
    body += group(
      x,
      y,
      path('M-27-63Q0-76 29-59L28 61Q-1 76-29 61Z', '#dfb65f') +
        ellipse(0, 60, 27, 13, '#e9c785') +
        ellipse(0, 60, 17, 7, '#6e8b50', INK, 1.5) +
        path('M-12-48Q13-24-2 4T13 46', 'none', '#f4dfa0', 7),
      r,
    )
  }
  return frame(body)
}
function dumplings(soup = false) {
  let body = ''
  for (const [x, y, r] of [
    [141, 160, -15],
    [244, 142, 5],
    [340, 178, 20],
    [190, 225, -10],
    [295, 240, 8],
  ]) {
    if (soup) {
      body += group(
        x,
        y,
        path('M-41 14Q-43-5-26-22L-8-43Q0-49 10-42L30-21Q48-1 41 17Q0 45-41 14Z', '#eee0b8') +
          path(
            'M-8-38Q-31-8-26 16M0-40Q-9-6-5 22M8-37Q18-4 18 21M14-33Q33-6 32 13',
            'none',
            '#b99b65',
            2,
          ) +
          ellipse(2, -40, 9, 4, '#bda278', INK, 1.5),
        r,
      )
    } else {
      body += group(
        x,
        y,
        path('M-42 12Q-29-40 12-31Q38-22 42 12Q3 42-42 12Z', '#eee4c9') +
          path('M-32 6-22-8-14 7-5-16 4 4 14-14 24 7 33-2', 'none', '#ad9565', 2),
        r,
      )
    }
  }
  return frame(body, false, soup ? '#c38d48' : '#286c97')
}
function rolls(fresh) {
  let body = ''
  for (const [x, y, r] of [
    [147, 170, -27],
    [241, 184, -27],
    [331, 206, -27],
  ]) {
    body += group(
      x,
      y,
      path('M-27-67Q3-80 31-65L32 65Q3 79-29 63Z', fresh ? '#ebe5c4' : '#d5a24c') +
        (fresh
          ? shrimp(0, -28, 0.63) +
            shrimp(0, 18, 0.63) +
            path('M-19-51V44M22-39V48', 'none', GREEN, 5)
          : specks(-20, -46, 40, 80, '#aa7737', 28)) +
        ellipse(1, 64, 29, 11, fresh ? '#9cab68' : '#ebc16c', INK, 2),
      r,
    )
  }
  body += dipping(107, 249, RED, 0.8)
  return frame(body)
}
function tortilla(kind) {
  let body = ''
  if (kind === 'burrito') {
    for (const [x, y, r] of [
      [186, 166, 43],
      [290, 216, -25],
    ]) {
      body += group(
        x,
        y,
        path('M-48-59Q0-79 48-54L47 52Q6 75-47 55Z', '#e8cf92') +
          path('M-41-37Q3-62 42-36M-41 27Q5 45 40 20', 'none', '#b99961', 2) +
          ellipse(0, 55, 45, 25, '#efddac') +
          ellipse(0, 54, 32, 17, '#825734') +
          bean(-15, 51, '#853f35') +
          bean(12, 58, '#853f35') +
          path('M-16 42 14 46M-19 60 4 65', 'none', '#ede2b5', 4) +
          herb(18, 41, 0.4),
        r,
      )
    }
  } else if (kind === 'tacos') {
    for (const [x, y, r] of [
      [143, 172, -12],
      [243, 184, -7],
      [332, 198, 5],
    ]) {
      body += group(
        x,
        y,
        path('M-47 38Q-52-65 0-62Q51-67 49 34Z', '#dcaf56') +
          path('M-39 7Q-16-9 10-6Q36-19 45 9L36 36-37 37Z', '#885733') +
          rect(-27, -9, 19, 16, RED, 2) +
          rect(10, -4, 17, 17, RED, 2) +
          herb(-4, -1, 0.5) +
          path('M-47 38Q-43-5-1-8Q42-8 49 34Q4 57-47 38Z', '#e8c271') +
          specks(-28, 8, 56, 25, '#b18a43', 12),
        r,
      )
    }
    body += lemon(121, 254, 0.9)
  } else {
    const triangles = [
      [182, 174, -17],
      [282, 167, 12],
      [255, 231, 7],
    ]
    for (const [x, y, r] of triangles)
      body += group(
        x,
        y,
        path('M-57 31 15-54 59 35Z', '#ba8540') +
          path('M-53 25 15-56 54 29Z', '#e4c276') +
          path('M-48 30 48 35', 'none', '#efda8a', 6) +
          specks(-24, -7, 56, 30, '#ac7b3c', 15),
        r,
      )
    body += dipping(110, 241, RED, 0.75)
  }
  return frame(body)
}
function fishAndChips() {
  let body = ''
  for (let n = 0; n < 16; n++)
    body += group(
      139 + ((n * 19) % 81),
      153 + ((n * 23) % 92),
      rect(-7, -34, 14, 69, '#e9c563', 3) + path('M-3-25V25', 'none', '#f7dea0', 2),
      -22 + ((n * 13) % 48),
    )
  body += group(
    292,
    195,
    path('M-62-18Q-47-66-12-62L58-16Q83 9 53 43Q29 64-5 33L-47 18Z', '#c39243') +
      path('M-42-20Q-18-39 3-22T46 13', 'none', '#efc664', 9) +
      specks(-33, -21, 71, 43, '#8d6331', 48),
    -15,
  )
  body += lemon(348, 126, 1) + dipping(340, 266, '#ecdfb8', 0.7)
  return frame(body)
}
function ribs() {
  let body = ''
  for (let n = 0; n < 4; n++)
    body += group(
      150 + n * 57,
      175 + n * 10,
      path('M-8-78 8-78 8 71-8 71Z', '#eadbb7') +
        ellipse(0, -78, 13, 8, '#efdfba') +
        path('M-29-51Q-11-64 23-44L28 48Q-2 65-30 47Z', '#97502d') +
        path('M-16-39Q6-46 18-29M-16-8 15 4M-15 25 16 34', 'none', '#bf7940', 5),
      14,
    )
  body += herb(349, 242, 0.9)
  return frame(body)
}
function pizza() {
  let body = ellipse(240, 181, 157, 86, '#bd8139')
  body += ellipse(240, 174, 152, 82, '#e3b567') + ellipse(240, 174, 130, 65, '#c95738', INK, 2)
  for (const [x, y, r] of [
    [164, 149, -10],
    [243, 132, 15],
    [317, 155, -20],
    [172, 202, 10],
    [260, 206, -5],
    [326, 200, 25],
  ]) {
    body += group(
      x,
      y,
      path(
        'M-24-9Q-24-22-9-20Q7-28 22-14Q31 2 15 12Q0 23-16 15Q-31 12-24-9Z',
        '#f2e5b8',
        '#9d5935',
        1.5,
      ),
      r,
    )
  }
  body += herb(198, 165, 0.85) + herb(285, 175, 0.9) + herb(224, 219, 0.75) + herb(297, 130, 0.7)
  body += path(
    'M108 163 122 169M146 112 155 125M217 96 222 110M315 112 308 126M362 151 350 157M359 214 345 208M270 250 267 235M160 242 165 229',
    'none',
    '#a66e37',
    3,
  )
  return frame(body)
}
function burger() {
  let body = path('M119 229Q118 277 240 279Q358 278 363 229Z', '#d6a151')
  body += ellipse(241, 232, 123, 35, '#edc27a')
  body += path(
    'M116 207Q129 191 151 196Q180 177 208 193Q233 178 261 190Q294 180 315 194Q347 184 364 205L355 228Q330 240 306 229Q278 242 253 230Q221 243 195 230Q165 240 138 228L116 207Z',
    '#577c37',
  )
  body +=
    ellipse(240, 208, 116, 30, '#814b2f') + path('M140 207Q218 228 337 206', 'none', '#b7793e', 5)
  body += ellipse(239, 183, 117, 23, '#bf432f') + ellipse(239, 178, 114, 19, '#db7152')
  body += path('M135 174Q161 166 182 174T224 175T267 172T308 174T345 173', 'none', '#f1dfb6', 8)
  body +=
    ellipse(184, 159, 27, 8, '#7c9c51', INK, 1.5) + ellipse(283, 159, 28, 8, '#7c9c51', INK, 1.5)
  body += path('M116 159Q116 76 237 78Q361 73 365 159Q253 197 116 159Z', '#dba44e')
  body += path('M135 139Q146 91 229 93', 'none', '#f1cf83', 8)
  for (const [x, y, r] of [
    [169, 125, -25],
    [207, 108, 20],
    [250, 118, -15],
    [295, 113, 25],
    [326, 140, -15],
    [218, 145, -25],
    [278, 150, 30],
  ])
    body += group(x, y, ellipse(0, 0, 2, 5, '#f8edc5', '#a4783f', 0.8), r)
  return frame(body)
}
const DRAWINGS = {
  'r-margherita-pizza': ['margherita', pizza],
  'r-classic-beef-burger': ['beef-burger', burger],
  'r-plain-dosa': ['dosa', dosa],
  'r-steamed-idli': ['idli', idli],
  'r-potato-samosa': ['samosa', samosa],
  'r-chicken-biryani': ['biryani', () => riceDish(false)],
  'r-seafood-paella': ['paella', () => riceDish(true)],
  'r-butter-chicken-curry': ['butter-chicken', () => curry('butter')],
  'r-thai-green-curry': ['green-curry', () => curry('green')],
  'r-massaman-curry': ['massaman', () => curry('massaman')],
  'r-saag-paneer': ['saag-paneer', () => curry('saag')],
  'r-chana-masala': ['chana-masala', () => curry('chana')],
  'r-dal-tadka': ['dal-tadka', () => curry('dal')],
  'r-pork-vindaloo': ['vindaloo', () => curry('vindaloo')],
  'r-squid-ink-spaghetti': ['squid-ink', () => noodlePasta('ink')],
  'r-pesto-genovese': ['pesto', () => noodlePasta('pesto')],
  'r-carbonara': ['carbonara', () => noodlePasta('cream')],
  'r-mentaiko-spaghetti': ['mentaiko', () => noodlePasta('mentaiko')],
  'r-cacio-e-pepe': ['cacio-e-pepe', () => noodlePasta('cheese')],
  'r-bolognese-tagliatelle': ['bolognese', () => noodlePasta('bolognese')],
  'r-pescatore': ['pescatore', () => noodlePasta('seafood')],
  'r-puttanesca': ['puttanesca', () => noodlePasta('puttanesca')],
  'r-spaghetti-meatballs': ['meatballs-pasta', () => noodlePasta('meatballs')],
  'r-zhajiang-noodles': ['zhajiang', () => noodlePasta('jajang')],
  'r-ricotta-ravioli': ['ravioli', () => stuffedPasta('ravioli')],
  'r-potato-gnocchi': ['gnocchi', () => stuffedPasta('gnocchi')],
  'r-lasagna': ['lasagna', () => layers('lasagna')],
  'r-moussaka': ['moussaka', () => layers('moussaka')],
  'r-shepherds-pie': ['shepherds-pie', () => layers('shepherd')],
  'r-fish-pie': ['fish-pie', () => layers('fish')],
  'r-spinach-cannelloni': ['cannelloni', cannelloni],
  'r-boiled-pork-dumplings': ['water-dumplings', () => dumplings(false)],
  'r-steamed-soup-dumplings': ['soup-dumplings', () => dumplings(true)],
  'r-vietnamese-fresh-rolls': ['fresh-rolls', () => rolls(true)],
  'r-savory-spring-rolls': ['spring-rolls', () => rolls(false)],
  'r-bean-beef-burrito': ['burrito', () => tortilla('burrito')],
  'r-beef-tacos': ['tacos', () => tortilla('tacos')],
  'r-cheese-quesadilla': ['quesadilla', () => tortilla('quesadilla')],
  'r-fish-and-chips': ['fish-chips', fishAndChips],
  'r-barbecue-spare-ribs': ['ribs', ribs],
}
export function globalArt(recipe) {
  const drawing = DRAWINGS[recipe.id]
  return drawing ? { mode: `global-${drawing[0]}`, svg: drawing[1]() } : null
}
