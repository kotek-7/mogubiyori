// Original deterministic vector art. Shared illustration grammar; dish-specific composition.
import { dessertArt } from './dessert-art.mjs'
import { savoryArt } from './savory-art.mjs'
import { globalArt } from './global-art.mjs'

const ink = '#202820',
  cream = '#fff5de',
  green = '#24624b',
  red = '#df442d',
  gold = '#e9ac25'
const esc = (value) =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
function hash(s) {
  return [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 0)
}
const path = (d, fill, stroke = ink, w = 3) =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`
const ellipse = (x, y, rx, ry, fill, stroke = ink, w = 3) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`
const rect = (x, y, w, h, fill, r = 5) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${ink}" stroke-width="3"/>`
const group = (x, y, scale, body, rotation = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale})">${body}</g>`
function ingredient(kind, color) {
  if (/strips|shredded|julienne/.test(kind) && !/chicken|pork|beef/.test(kind)) {
    const fill = /carrot/.test(kind)
      ? '#e86527'
      : /cabbage|cucumber/.test(kind)
        ? '#9dbf63'
        : '#ab783e'
    return (
      path('M-22-18 15 10M-14-22 23 6M-25-5 8 21M-8-12 22 19', 'none', ink, 6) +
      path('M-22-18 15 10M-14-22 23 6M-25-5 8 21M-8-12 22 19', 'none', fill, 3)
    )
  }
  if (/fried-tofu/.test(kind))
    return (
      path('M-27-21 22-20 29 21-24 22Z', '#d7a33f') +
      path('M-17-10 14-10M-17 2 18 2M-15 13 15 13', 'none', '#a4712e', 2)
    )
  if (/grated-daikon|yogurt|crumbled/.test(kind))
    return (
      ellipse(-12, 4, 12, 8, cream, ink, 1) +
      ellipse(8, 6, 13, 8, cream, ink, 1) +
      ellipse(0, -5, 13, 10, cream, ink, 1)
    )
  if (/parmesan|cheese/.test(kind))
    return (
      path('M-19-3 10-17 22 10-15 15Z', '#f0cf62') +
      ellipse(3, 0, 3, 2, '#c09035', 'none', 0) +
      ellipse(-6, 8, 2, 2, '#c09035', 'none', 0)
    )
  if (/garlic|ginger/.test(kind))
    return (
      ellipse(-9, 0, 11, 7, /pickled/.test(kind) ? '#cf6255' : '#e3c799') +
      ellipse(11, 7, 11, 7, /pickled/.test(kind) ? '#cf6255' : '#e3c799')
    )
  if (/honey|ketchup/.test(kind))
    return path(
      'M-24-9Q10-26 24-7Q0 3-20 8Q-2 18 23 10',
      'none',
      /ketchup/.test(kind) ? red : '#ce8f1f',
      4,
    )
  if (/wakame|hijiki|komatsuna/.test(kind))
    return path('M-19-10-11-19 0-6 15-19 24-9 10 7 16 20 0 15-11 24-17 9-25 0Z', green)
  if (/pepper/.test(kind) && !/black/.test(kind))
    return (
      path(
        'M-17-16Q-5-26 0-14Q15-25 22-9L17 14 7 21-8 17-19 6Z',
        /green/.test(kind) ? green : red,
      ) + path('M-9-9 1-4 12-9 9 9-5 9Z', cream)
    )
  if (/ham/.test(kind))
    return path('M-24-17 23-17 25 18-23 18Z', '#c77b60') + path('M-17-10 15-10', 'none', cream, 2)
  if (/fish-cake/.test(kind))
    return (
      ellipse(0, 0, 20, 14, cream) + path('M-10 0Q-9-8 0-6Q12-2 3 6Q-5 8-6 2', 'none', '#d66a6a', 3)
    )
  if (/egg-ribbons/.test(kind))
    return path(
      'M-27-8Q-23-20-10-11Q2-27 11-12Q30-14 25 0Q33 17 12 13Q-2 27-12 11Q-35 16-27-8Z',
      gold,
      '#b17524',
      2,
    )
  if (/tuna/.test(kind))
    return (
      path('M-21-8 3-15 14 0-7 5ZM-8 7 19 2 24 15 5 20Z', '#b08462', ink, 2) +
      path('M-12-5 6-6M4 10 18 9', 'none', cream, 2)
    )
  if (/lotus|れんこん/.test(kind)) {
    let piece = ellipse(0, 0, 22, 17, '#ddc38f')
    for (let j = 0; j < 6; j++) {
      const t = (j * Math.PI) / 3
      piece += ellipse(Math.cos(t) * 12, Math.sin(t) * 9, 4, 3, cream, ink, 1)
    }
    return piece
  }
  if (/daikon|radish|大根/.test(kind))
    return path('M-21-15 18-15 23 14-18 20Z', cream) + path('M-12-10 10-10', 'none', '#d7be86', 2)
  if (/glaze|sauce|syrup/.test(kind))
    return path(
      'M-24-10Q-5-22 19-7Q30 0 8 8Q-13 13-24 5',
      'none',
      /tomato|chili/.test(kind) ? red : '#855237',
      4,
    )
  if (/peanut|almond|walnut|ナッツ/.test(kind))
    return (
      ellipse(-7, 0, 8, 15, '#be813a') +
      ellipse(9, 7, 8, 13, '#d9a84b') +
      path('M-7-9V9M9-1V15', 'none', '#774329', 1)
    )
  if (/chickpea|soybean|lentil|kidney|red-bean|black-bean/.test(kind))
    return (
      ellipse(-9, -4, 9, 7, /red|kidney|black/.test(kind) ? '#774329' : '#d7b360') +
      ellipse(9, 8, 9, 7, /red|kidney|black/.test(kind) ? '#774329' : '#d7b360')
    )
  if (/blueberry/.test(kind))
    return (
      ellipse(-7, 0, 9, 9, '#404d84') +
      ellipse(9, 7, 9, 9, '#404d84') +
      path('M-9-3-4 1M7 5 12 9', 'none', cream, 1)
    )
  if (/sausage/.test(kind))
    return rect(-11, -25, 22, 50, '#b95e31', 10) + path('M-6-11 6-6M-6 3 6 8', 'none', '#713d2a', 2)
  if (/tomato|トマト/.test(kind))
    return ellipse(0, 0, 19, 16, red) + path('M-12 0 12 0M0-10 0 10', 'none', cream, 2)
  if (/egg|卵|tamago/.test(kind) && !/eggplant/.test(kind))
    return ellipse(0, 0, 22, 16, cream) + ellipse(0, 0, 9, 8, gold, ink, 2)
  if (/tofu|豆腐/.test(kind))
    return (
      path('M-18-12 10-17 23-3 20 18-12 20-20 6Z', cream) +
      path('M-18-12-3 2 23-3M-3 2-12 20', 'none', ink, 2)
    )
  if (/broccoli|ブロッコリー/.test(kind))
    return (
      path('M-4 0-5 19 6 19 7 0', green) +
      ellipse(-10, -4, 12, 10, green) +
      ellipse(10, -4, 12, 10, green) +
      ellipse(0, -11, 12, 10, green)
    )
  if (/carrot|にんじん|人参/.test(kind))
    return path('M-18-12 16-8 6 17-8 14Z', '#e86527') + path('M-8-3 5 0M-4 7 7 8', 'none', ink, 2)
  if (/mushroom|shiitake|shimeji|enoki|しめじ|きのこ|しいたけ/.test(kind))
    return (
      rect(-4, 0, 8, 20, cream, 2) +
      path('M-22 2Q-20-23 0-21Q22-20 22 2Z', '#855237') +
      path('M-13-5 12-5', 'none', cream, 2)
    )
  if (/sprout|もやし/.test(kind))
    return (
      path('M-17-15Q-20 5 1 17M-3-19Q-4 0 15 13M10-13Q5 4 23 16', 'none', '#e4cda0', 5) +
      ellipse(-17, -15, 4, 3, gold, ink, 1)
    )
  if (/onion|scallion|ねぎ/.test(kind))
    return (
      ellipse(0, 0, 16, 11, /scallion/.test(kind) ? green : '#e4cda0') +
      ellipse(0, 0, 10, 6, cream, ink, 2)
    )
  if (/gyoza|dumpling/.test(kind))
    return (
      path('M-25 8Q-21-25 0-22Q22-19 25 8Q0 22-25 8Z', '#e4cda0') +
      path('M-14-8-9 6M-2-15 0 6M12-9 9 6', 'none', '#9d5d23', 2)
    )
  if (/chocolate|choco/.test(kind))
    return rect(-17, -13, 34, 26, '#653a26', 1) + path('M0-12V12M-16 0H16', 'none', '#ae7648', 2)
  if (/apple|りんご/.test(kind))
    return path('M-21-5Q0-26 21-5Q11 22-10 22Z', red) + path('M-14-3Q0-14 14-3L0 15Z', cream)
  if (/pea|edamame|bean|豆|枝豆/.test(kind))
    return (
      path('M-24 4Q-12-19 24-6Q18 18-7 18Z', green) +
      ellipse(-9, 3, 6, 7, '#79a847', ink, 1) +
      ellipse(8, 0, 6, 7, '#79a847', ink, 1)
    )
  if (/shrimp|prawn|えび|エビ/.test(kind))
    return (
      path('M18-12C-15-26-29 11-8 19L3 11C-10 3-3-9 9-1L18 3Z', '#e7744e') +
      path('M15-5 29-12 29 6ZM-13-4-3 0M-16 6-5 8', 'none', ink, 2)
    )
  if (/fish|salmon|鮭|さば|さけ|tuna/.test(kind))
    return (
      path('M-24-12 20-17 27 5 14 19-25 14Z', /salmon|鮭|さけ/.test(kind) ? '#e88448' : '#8eaaae') +
      path('M-13-7-10 12M0-9 3 12M12-9 15 9', 'none', cream, 3)
    )
  if (/potato|じゃが|芋|pumpkin|かぼちゃ/.test(kind))
    return path(
      'M-15-13 9-18 24 3 12 20-13 17-22 0Z',
      /pumpkin|かぼちゃ/.test(kind) ? '#e89e22' : '#e4c169',
    )
  if (/cucumber|きゅうり/.test(kind))
    return (
      ellipse(0, 0, 16, 13, green) +
      ellipse(0, 0, 11, 9, '#abc573', ink, 1) +
      path('M-5 0 5 0M0-5 0 5', 'none', green, 2)
    )
  if (/eggplant|なす|茄子/.test(kind))
    return (
      path('M-15-17Q20-24 19 5Q15 25-10 20Q-23 12-15-17Z', '#493e71') +
      path('M-15-17 2-13 9-22', 'none', green, 6)
    )
  if (
    /leaf|spinach|cabbage|lettuce|green|小松|ほうれん|ねぎ|キャベツ|leek|nori|seaweed|shiso|basil|cilantro|mint|parsley/.test(
      kind,
    )
  )
    return (
      path('M-24 7Q-27-9-11-16L-3-10 9-20Q24-15 23 0L15 13 0 17Z', green) +
      path('M-19 7 17-9', 'none', '#8cba5e', 2)
    )
  if (/corn|コーン/.test(kind)) return rect(-8, -9, 16, 18, gold, 5)
  if (/chicken|pork|beef|meat|肉|鶏|豚|牛/.test(kind))
    return (
      path(
        'M-19-11-1-18 18-9 23 8 7 19-15 14-24 2Z',
        /beef|牛/.test(kind) ? '#774329' : /pork|豚/.test(kind) ? '#b76c43' : '#c58a49',
      ) + path('M-12-4 9-4M-8 5 12 4', 'none', '#663a28', 3)
    )
  if (/lemon|レモン/.test(kind))
    return (
      path('M-23-7 23-7A25 25 0 0 1-23-7Z', '#f7c544') + path('M-13-2 0 11 11-2', 'none', cream, 2)
    )
  if (/berry|strawberry|いちご/.test(kind))
    return (
      path('M-16-9Q0-20 16-9Q19 6 0 24Q-19 6-16-9Z', red) +
      path('M-12-10 0-15 13-10', 'none', green, 4)
    )
  if (/banana|バナナ/.test(kind))
    return ellipse(0, 0, 16, 12, '#f4d367') + ellipse(0, 0, 4, 3, '#86582f', ink, 1)
  if (/sesame|ごま/.test(kind))
    return (
      ellipse(-5, 0, 2, 4, /black/.test(kind) ? ink : cream, ink, 1) +
      ellipse(5, 5, 2, 4, /black/.test(kind) ? ink : cream, ink, 1)
    )
  return (
    path('M-17-8-4-15 18-8 22 7 4 15-17 9Z', color || gold) + path('M-9-3 10 2', 'none', ink, 2)
  )
}
export function recipeArt(recipe) {
  const dedicated = dessertArt(recipe) ?? savoryArt(recipe) ?? globalArt(recipe)
  if (dedicated) return dedicated
  const a = recipe.art,
    seed = hash(recipe.id),
    c = a.colors,
    name = recipe.name,
    motif = a.motif.toLowerCase()
  const words = `${name} ${motif}`
  let out = '',
    mode = 'composed'
  // Deliberately solid backgrounds and two-colour pottery, no gradients.
  const accent = ['#275bbb', '#df442d', '#24624b'][seed % 3]
  out += `<rect width="480" height="360" fill="${cream}"/>`
  out += path('M0 319H480M34 0V360', 'none', accent, 2)
  out += ellipse(251, 274, 161, 17, ink, 'none', 0)
  if (a.vessel === 'glass') {
    mode = 'glass'
    out += path('M161 78H320L299 285H183Z', cream) + path('M171 128H310L293 278H190Z', c[0])
  } else if (a.vessel === 'board') {
    out +=
      rect(62, 86, 357, 211, '#d69a4a', 20) +
      path('M82 112H390M82 259H390', 'none', '#a56528', 3) +
      ellipse(86, 190, 7, 7, cream)
  } else if (a.vessel === 'basket') {
    out += ellipse(240, 190, 185, 108, '#bb7c35') + ellipse(240, 180, 168, 88, cream)
    for (let j = 0; j < 10; j++) out += path(`M${84 + j * 33} 257l10 16`, 'none', '#744b24', 3)
  } else if (a.vessel === 'bowl' || a.vessel === 'deep-plate') {
    out +=
      path('M65 173Q82 291 240 297Q398 291 415 173Z', accent) +
      ellipse(240, 173, 175, 89, cream) +
      ellipse(240, 173, 156, 73, a.base === 'soup' ? c[0] : '#f3d69a')
    out += path('M139 257Q237 286 343 254', 'none', cream, 5)
  } else {
    out +=
      ellipse(240, 190, 186, 112, accent) +
      ellipse(240, 184, 171, 100, cream) +
      ellipse(240, 184, 152, 83, cream, accent, 3)
    for (let j = 0; j < 12; j++) {
      let t = (j * Math.PI) / 6
      out += ellipse(240 + 164 * Math.cos(t), 184 + 92 * Math.sin(t), 3, 3, accent, 'none', 0)
    }
  }
  const base = a.base
  if (
    (base === 'rice' || /rice|ごはん|丼|ピラフ|リゾット/.test(words)) &&
    !/onigiri|おにぎり|おむすび|sushi-roll|巻き寿司|手巻き/.test(words)
  ) {
    out += ellipse(236, 176, 132, 65, cream, ink, 2)
    for (let j = 0; j < 80; j++) {
      let x = 132 + ((j * 41 + seed) % 211),
        y = 135 + ((j * 23 + seed) % 85)
      if (((x - 236) / 127) ** 2 + ((y - 176) / 54) ** 2 < 1)
        out += ellipse(x, y, 3, 1.5, '#d4b67c', 'none', 0)
    }
  }
  if (/yogurt-bowl|overnight-oats|cheesecake-cup/.test(words)) {
    mode = 'cream-bowl'
    out += ellipse(240, 173, 142, 65, cream)
    for (let j = 0; j < 18; j++)
      out += ellipse(143 + ((j * 37) % 190), 143 + ((j * 17) % 60), 4, 2, '#ae7938', 'none', 0)
  } else if (/frozen-yogurt-scoops/.test(words)) {
    mode = 'frozen-scoops'
    out +=
      ellipse(180, 178, 52, 48, cream) +
      ellipse(273, 181, 54, 46, '#eaa7ac') +
      ellipse(234, 132, 53, 46, cream)
    out += path('M199 115Q241 95 264 129M146 175Q174 155 201 176', 'none', red, 5)
  } else if (/popcorn/.test(words)) {
    mode = 'popcorn'
    for (let j = 0; j < 23; j++)
      out += group(
        133 + ((j * 59) % 207),
        120 + ((j * 31) % 116),
        0.7,
        path(
          'M-21-8Q-23-27-5-19Q8-30 17-15Q35-10 23 6Q27 22 9 21Q-8 34-17 18Q-33 14-21-8Z',
          '#e3b869',
        ),
      )
  } else if (/chocolate-bark|cracker-shards|mochi-cubes|rusk-cubes/.test(words)) {
    mode = 'bites'
    for (let j = 0; j < 6; j++)
      out += group(
        143 + (j % 3) * 89,
        145 + Math.floor(j / 3) * 70,
        1.5,
        path(
          'M-29-17 7-25 30-3 18 23-26 12Z',
          /chocolate/.test(words) ? '#673a25' : /mochi/.test(words) ? '#b47d44' : '#d59c4d',
        ),
        j * 11,
      )
  } else if (/inari-pouches/.test(words)) {
    mode = 'inari'
    for (let j = 0; j < 3; j++)
      out += group(
        146 + j * 90,
        180,
        1,
        path('M-37-26Q-43-61 0-58Q44-59 39-26L35 42Q1 67-36 39Z', '#b97a32') +
          ellipse(0, -21, 31, 29, cream) +
          path('M-17-36 0-23 18-35', 'none', '#d9b776', 2),
      )
  } else if (/onigirazu/.test(words)) {
    mode = 'rice-sandwich'
    for (let j = 0; j < 2; j++)
      out += group(
        174 + j * 131,
        180,
        1,
        path('M-49-66 59-56 55 61-59 54Z', green) +
          path('M-39-47 42-39 39 44-41 40Z', cream) +
          path('M-39-18 40-10M-40 12 40 20', 'none', gold, 15),
      )
  } else if (/dango/.test(words)) {
    mode = 'sweet-dango'
    for (let j = 0; j < 3; j++) {
      out += path(`M${136 + j * 88} 266V103`, 'none', '#855237', 4)
      for (let k = 0; k < 3; k++) out += ellipse(136 + j * 88, 126 + k * 40, 25, 22, '#e2ba79')
    }
  } else if (/galette|crepe/.test(words)) {
    mode = 'crepe'
    out +=
      path('M130 94 347 104 353 237 125 231Z', '#ae7134') +
      path('M149 113 328 120 327 218 147 214Z', '#e6bd66') +
      group(236, 169, 1.9, ingredient('egg'))
  } else if (/onigiri|おにぎり|焼きおむすび/.test(words)) {
    mode = 'onigiri'
    for (let j = 0; j < 2; j++)
      out += group(
        175 + j * 123,
        172,
        1,
        path(
          'M-63 38Q-79 33-57 0L-14-73Q0-86 14-70L61 5Q84 41 52 45Z',
          /焼/.test(name) ? '#cf922f' : cream,
        ) + path('M-23-2H20L25 47H-23Z', green),
      )
  } else if (/sushi-roll|kimbap|巻き寿司|キンパ/.test(words)) {
    mode = 'sushi-rolls'
    for (let j = 0; j < 5; j++) {
      const x = 145 + (j % 3) * 93,
        y = 135 + Math.floor(j / 3) * 84
      out +=
        ellipse(x, y, 36, 31, green) +
        ellipse(x, y - 4, 29, 22, cream) +
        rect(x - 10, y - 16, 17, 17, red, 1) +
        rect(x + 7, y - 6, 12, 13, gold, 1)
    }
  } else if (/gyoza|餃子|しゅうまい|焼売/.test(words)) {
    mode = 'dumplings'
    for (let j = 0; j < 5; j++)
      out += group(132 + j * 51, 169 + (j % 2) * 27, 1.3, ingredient('gyoza'), -15)
  } else if (/skewer|串|焼き鳥/.test(words)) {
    mode = 'skewers'
    const meat = a.toppings.find((t) => /pork|beef|chicken/.test(t)) || 'chicken'
    const vegetable = a.toppings.find((t) => /onion|scallion|pepper/.test(t)) || 'onion'
    for (let j = 0; j < 3; j++) {
      out += path(`M${130 + j * 87} 250L${158 + j * 87} 92`, 'none', '#855237', 5)
      for (let k = 0; k < 3; k++)
        out += group(
          155 + j * 85 - k * 7,
          121 + k * 40,
          1.1,
          ingredient(k === 1 ? vegetable : meat, '#ad6334'),
          j * 10,
        )
    }
  } else if (/cookie|クッキー|ビスケット/.test(words)) {
    mode = 'cookies'
    for (let j = 0; j < 5; j++) {
      const x = 137 + (j % 3) * 91,
        y = 146 + Math.floor(j / 3) * 70
      out += ellipse(x, y, 39, 27, '#be8338')
      for (let k = 0; k < 4; k++)
        out += ellipse(
          x - 19 + (k % 2) * 26,
          y - 10 + Math.floor(k / 2) * 17,
          3,
          3,
          '#593c25',
          'none',
          0,
        )
    }
  } else if (/jelly|ゼリー|寒天/.test(words)) {
    mode = 'jelly'
    out +=
      path('M155 232 170 116 310 116 328 232Q240 263 155 232Z', c[0]) +
      ellipse(240, 116, 70, 24, c[1] || '#eaa339') +
      path('M181 139 172 207', 'none', cream, 7)
  } else if (
    /omelet|omelette|tamagoyaki|卵焼き|だし巻|オムレツ/.test(words) &&
    !/sandwich|サンド/.test(words)
  ) {
    mode = 'omelet'
    out +=
      path('M105 197Q100 92 264 105Q352 106 366 171Q309 252 105 197Z', gold) +
      path(
        'M118 193Q168 179 188 116M174 205Q217 185 233 111M229 207Q266 178 274 113M282 198Q313 163 315 127',
        'none',
        '#9d5d23',
        3,
      )
  } else if (
    /grilled-fish|cod-fillet|salmon-fillet|mackerel|魚|鮭|さば|サバ|ぶり|鯛|あじ|ほっけ/.test(
      words,
    ) &&
    base === 'main'
  ) {
    mode = 'fish'
    out += group(231, 175, 3, ingredient(/鮭|salmon/.test(words) ? 'salmon' : 'fish', c[0]), -12)
  } else if (/sandwich|サンド/.test(words)) {
    mode = 'sandwich'
    for (let j = 0; j < 2; j++)
      out += group(
        167 + j * 139,
        180,
        1,
        path('M-53 58-60-68 65 41Z', '#bf7b37') +
          path('M-43 35-47-48 44 24Z', cream) +
          path('M-46-34 35 31', 'none', green, 10) +
          path('M-44-13 18 35', 'none', red, 9),
      )
  } else if (base === 'toast' || /toast|トースト|ピザ/.test(words)) {
    mode = 'toast'
    out +=
      path(
        'M116 231V143Q78 123 111 92Q134 75 163 85Q239 61 319 86Q356 75 368 105Q381 129 350 142V231Z',
        '#bd7d36',
      ) +
      path(
        'M130 217V132Q109 115 134 99Q165 111 169 97Q243 81 309 99Q338 94 346 111L334 132V217Z',
        cream,
      )
  } else if (/pancake|ホットケーキ|パンケーキ/.test(words)) {
    mode = 'pancake'
    for (let j = 0; j < 3; j++) out += ellipse(238, 211 - j * 23, 115, 40, '#c78531')
    out += ellipse(238, 157, 114, 38, '#e4b448') + rect(219, 132, 40, 22, '#f7d77b')
  } else if (/rolled|roll|春巻|生春巻|ロール/.test(words)) {
    mode = 'roll'
    for (let j = 0; j < 3; j++)
      out +=
        group(151 + j * 91, 182, 1, path('M-31-57Q0-71 33-54L31 60Q0 72-32 55Z', c[0]), 23) +
        ellipse(151 + j * 91, 129, 23, 10, c[1])
  } else if (/hamburg|croquette|ハンバーグ|コロッケ|つくね|団子/.test(words) && base !== 'soup') {
    mode = 'patties'
    for (let j = 0; j < 3; j++)
      out +=
        ellipse(153 + j * 88, 165 + (j % 2) * 34, 48, 32, c[0]) +
        path(`M${122 + j * 88} ${158 + (j % 2) * 34}l41 12m-33-25 39 14`, 'none', '#754024', 3)
  } else if (
    base === 'noodles' ||
    /noodle|spaghetti|pasta|うどん|そば|パスタ|そうめん|焼きそば|ラーメン/.test(words)
  ) {
    mode = 'noodles'
    const nc =
      /soba/.test(motif) && !/yakisoba/.test(motif)
        ? '#a28c60'
        : /udon|somen|nyumen|pho|bifun|glass-noodle/.test(motif)
          ? '#f4e6bd'
          : /yakisoba/.test(motif)
            ? '#b5874d'
            : '#e9c46c'
    const thick = /udon/.test(motif)
    for (let j = 0; j < (thick ? 11 : 19); j++) {
      const bend = 7 * (j % 4),
        dy = (j * 11) % 35
      const d = `M${137 + bend} ${155 + dy}C${106 + bend} ${102 + dy} ${315 - bend} ${97 + dy} ${338 - bend} ${147 + dy}S${170 + bend} ${245 - dy} ${137 + bend} ${186 - dy}S${282 - bend} ${129 + dy} ${305 - bend} ${189 + dy}`
      out += path(d, 'none', ink, thick ? 10 : 6) + path(d, 'none', nc, thick ? 7 : 3.5)
    }
  } else if (base === 'curry' || /カレー|curry/.test(words)) {
    mode = 'curry'
    out += path(
      'M205 103Q286 76 359 124Q411 157 369 220Q323 257 228 233Q182 212 207 172Q234 148 205 103Z',
      c[0],
    )
  } else if (base === 'cake' || /cake|ケーキ|プリン|ゼリー|蒸しパン/.test(words)) {
    mode = 'cake'
    out +=
      path('M155 231 166 112 309 112 329 231Q245 272 155 231Z', c[0]) +
      ellipse(238, 112, 72, 26, c[1] || gold) +
      path('M174 157Q247 180 316 157', 'none', cream, 6)
  } else if (base === 'soup') {
    mode = 'soup'
    out += ellipse(240, 167, 147, 67, c[0])
  } else if (base === 'salad') {
    mode = 'salad'
  }
  const toppings = a.toppings?.length ? a.toppings : a.garnish
  const positions = [
    [165, 156],
    [293, 141],
    [242, 200],
    [322, 201],
    [193, 210],
    [228, 133],
    [124, 183],
    [279, 228],
    [150, 215],
    [339, 168],
    [212, 171],
    [279, 177],
  ]
  // Whole-dish forms keep their structure legible; mixed dishes expose every ingredient type.
  const n = [
    'onigiri',
    'sandwich',
    'pancake',
    'fish',
    'omelet',
    'roll',
    'dumplings',
    'cookies',
    'skewers',
    'jelly',
    'sushi-rolls',
    'rice-sandwich',
    'inari',
    'sweet-dango',
    'crepe',
    'bites',
    'popcorn',
    'frozen-scoops',
  ].includes(mode)
    ? Math.min(toppings.length, 2)
    : mode === 'noodles'
      ? 6
      : mode === 'soup'
        ? 7
        : 12
  const count = /potage|puree-soup/.test(motif) ? 0 : n
  for (let j = 0; j < count; j++) {
    const p = positions[j],
      t = toppings[j % toppings.length] || 'sesame'
    const visibleKind =
      t === 'egg' && /don|zosui|scrambled|egg-soup|fried-rice/.test(motif) ? 'egg-ribbons' : t
    out += group(
      p[0],
      p[1],
      ['soup', 'noodles', 'cream-bowl'].includes(mode)
        ? 1.05
        : mode === 'composed' || mode === 'salad'
          ? 1.4
          : 1,
      ingredient(visibleKind, c[(j + 1) % c.length]),
      ((seed + j * 37) % 37) - 18,
    )
  }
  for (let j = 0; j < Math.min(4, a.garnish.length); j++)
    out += group(205 + j * 28, 120 + (j % 2) * 23, 0.48, ingredient(a.garnish[j], green), j * 31)
  return {
    mode,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" role="img" aria-labelledby="title"><title id="title">${esc(recipe.name)}</title>${out}</svg>\n`,
  }
}
