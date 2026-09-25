#!/usr/bin/env node
/** Arrange the exported canonical drawings and real screenshots without redrawing their art. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { chromium } from '@playwright/test'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const kit = path.resolve(root, process.env.PRESENTATION_KIT_DIR ?? 'artifacts/presentation-kit')
const output = path.join(kit, '06-layouts')
const catalog = JSON.parse(await fs.readFile(path.join(kit, 'assets-manifest.json'), 'utf8')).assets
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim()
const species = [
  ['komugi', 'こむぎ'],
  ['mame', 'まめ'],
  ['shizuku', 'しずく'],
  ['yuzu', 'ゆず'],
  ['momo', 'もも'],
  ['goma', 'ごま'],
]
const stages = ['うまれたて', 'ちびっこ', 'わんぱく', 'おとな', 'とっておき']
const ink = '#1b1c33'
const paper = '#fffdf8'
const cache = new Map()
const manifest = []
let instance = 0

async function read(relative) {
  if (!cache.has(relative)) cache.set(relative, await fs.readFile(path.join(kit, relative), 'utf8'))
  return cache.get(relative)
}

function core(id, stage = 2) {
  return `03-assets/companions-core/${id}-stage-${stage}.svg`
}
function expression(id, mood) {
  return `03-assets/companions-expressions/${id}-${mood}.svg`
}
function outfit(id, style) {
  return `03-assets/companions-outfits/${id}-${style}.svg`
}
const food = catalog.filter((entry) => entry.category.startsWith('recipes-cutout/')).slice(0, 14)
const curry = '03-assets/recipes-cutout/main/r-chickpea-spinach-dry-curry-cutout.svg'

async function drawing(file, x, y, width, height = width) {
  let svg = await read(file)
  const prefix = `placed-${instance++}-`
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
  for (const id of ids) {
    svg = svg
      .replaceAll(`id="${id}"`, `id="${prefix}${id}"`)
      .replaceAll(`url(#${id})`, `url(#${prefix}${id})`)
      .replaceAll(`href="#${id}"`, `href="#${prefix}${id}"`)
  }
  // Only the placement box and ID namespace change. Original paths, colors and proportions stay intact.
  return svg.replace(
    /<svg([^>]*)>/,
    (_, attributes) =>
      `<svg${attributes.replace(/\s(?:width|height|x|y)="[^"]*"/g, '')} x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet">`,
  )
}

async function screen(file, x, y, width, height) {
  const png = await fs.readFile(path.join(kit, file))
  const intrinsicWidth = png.readUInt32BE(16)
  const intrinsicHeight = png.readUInt32BE(20)
  const scale = Math.min(width / intrinsicWidth, height / intrinsicHeight)
  const w = intrinsicWidth * scale,
    h = intrinsicHeight * scale
  const px = x + (width - w) / 2,
    py = y + (height - h) / 2
  return `<rect x="${px - 2}" y="${py - 2}" width="${w + 4}" height="${h + 4}" rx="4" fill="#d7d2c7"/><image x="${px}" y="${py}" width="${w}" height="${h}" href="data:image/png;base64,${png.toString('base64')}"/>`
}

function label(text, x, y, size = 36, anchor = 'middle') {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${ink}" font-family="Noto Sans JP Variable" font-size="${size}" font-weight="700">${text}</text>`
}

async function embeddedFont(text) {
  const fontDir = path.join(root, 'node_modules/@fontsource-variable/noto-sans-jp')
  const css = await fs.readFile(path.join(fontDir, 'index.css'), 'utf8')
  const blocks = []
  for (const block of css.match(/@font-face\s*\{[^}]+\}/g)) {
    const ranges = block.match(/unicode-range:([^;]+)/)?.[1].split(',') ?? []
    const used = [...text].some((letter) =>
      ranges.some((range) => {
        const [start, end] = range
          .trim()
          .replace('U+', '')
          .split('-')
          .map((v) => parseInt(v, 16))
        return letter.codePointAt(0) >= start && letter.codePointAt(0) <= (end ?? start)
      }),
    )
    if (!used) continue
    const file = block.match(/url\(([^)]+)\)/)[1].replace(/['"]/g, '')
    const data = await fs.readFile(path.join(fontDir, file))
    blocks.push(
      block.replace(/url\([^)]+\)/, `url(data:font/woff2;base64,${data.toString('base64')})`),
    )
  }
  return blocks.join('\n')
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ deviceScaleFactor: 1 })
await fs.mkdir(output, { recursive: true })

async function compose({
  id,
  title,
  width = 1920,
  height = 1080,
  background,
  pieces,
  sources,
  description,
  text = '',
}) {
  const fragments = await Promise.all(pieces)
  const fonts = text ? `<style>${await embeddedFont(text)}</style>` : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${fonts}${background ? `<rect width="${width}" height="${height}" fill="${background}"/>` : ''}${fragments.join('')}</svg>`
  if (/(?:href|src)="(?:https?:|\/)/.test(svg)) throw new Error(`External reference in ${id}`)
  await fs.writeFile(path.join(output, `${id}.svg`), svg)
  await page.setViewportSize({ width, height })
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;line-height:0">${svg}</body></html>`,
  )
  await page.evaluate(async (letters) => {
    if (letters) await document.fonts.load('700 36px "Noto Sans JP Variable"', letters)
    await document.fonts.ready
    await Promise.all(
      [...document.querySelectorAll('image')].map(async (element) => {
        const image = new Image()
        image.src = element.getAttribute('href')
        await image.decode()
      }),
    )
  }, text)
  const png = await page.screenshot({ omitBackground: true, path: path.join(output, `${id}.png`) })
  const alpha = await page.evaluate(async (data) => {
    const img = new Image()
    img.src = `data:image/png;base64,${data}`
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const context = canvas.getContext('2d')
    context.drawImage(img, 0, 0)
    const rgba = context.getImageData(0, 0, img.width, img.height).data
    let visible = 0,
      clear = 0,
      varied = 0
    for (let i = 0; i < rgba.length; i += 4) {
      if (rgba[i + 3]) visible++
      else clear++
      if (
        rgba[i + 3] &&
        (rgba[i] !== rgba[0] || rgba[i + 1] !== rgba[1] || rgba[i + 2] !== rgba[2])
      )
        varied++
    }
    return { visible, clear, varied }
  }, png.toString('base64'))
  if (!alpha.visible || !alpha.varied) throw new Error(`Empty composition: ${id}`)
  if (!background && !alpha.clear) throw new Error(`Expected transparency: ${id}`)
  if (background && alpha.clear) throw new Error(`Background has transparent pixels: ${id}`)
  manifest.push({
    id,
    title,
    category: '組み合わせレイアウト',
    svg: `06-layouts/${id}.svg`,
    png: `06-layouts/${id}.png`,
    width,
    height,
    transparent: alpha.clear > 0,
    description,
    availability: 'presentation-layout',
    sourceCommit,
    sources: [...new Set(sources)],
    generated: false,
    containsScreenshots: sources.some((file) => file.endsWith('.png')),
  })
  console.log(`Composed ${manifest.length}: ${id}`)
}

try {
  const coreFiles = species.map(([id]) => core(id))
  await compose({
    id: '01-six-companions-line',
    title: '6種類のもぐ・横一列',
    height: 640,
    sources: coreFiles,
    pieces: coreFiles.map((file, i) => drawing(file, i * 320, 125, 320)),
    description: '6種類のわんぱくの姿を横一列に並べた背景透過素材。',
  })
  await compose({
    id: '02-six-companions-square',
    title: '6種類のもぐ・正方形集合',
    width: 1080,
    height: 1080,
    sources: coreFiles,
    pieces: coreFiles.map((file, i) =>
      drawing(file, 30 + (i % 3) * 340, 150 + Math.floor(i / 3) * 390, 340),
    ),
    description: '6種類を2段に配置した正方形の背景透過素材。',
  })
  await compose({
    id: '03-six-companions-footer',
    title: '6種類のもぐ・スライド下端',
    sources: coreFiles,
    pieces: coreFiles.map((file, i) => drawing(file, 195 + i * 255, 760, 255)),
    description: 'スライド上部を広く空け、下端に6種類のもぐを配置。背景透過。',
  })
  for (const [index, [id, name]] of species.entries()) {
    const files = stages.map((_, stage) => core(id, stage))
    const arrows = stages
      .slice(0, 4)
      .map(
        (_, i) =>
          `<path d="M${424 + i * 348} 330h35m-12-12 12 12-12 12" fill="none" stroke="#b6b9b4" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
      )
    await compose({
      id: `${String(index + 4).padStart(2, '0')}-growth-${id}`,
      title: `${name}・5段階の成長`,
      height: 640,
      sources: files,
      text: name + stages.join(''),
      pieces: [
        label(name, 100, 86, 44, 'start'),
        ...files.map((file, i) => drawing(file, 108 + i * 348, 138, 310)),
        ...stages.map((stage, i) => label(stage, 263 + i * 348, 544, 34)),
        ...arrows,
      ],
      description: `${name}の5段階を同じ表示枠で比較。種族名と成長名のフォントを埋め込み、背景は透過。`,
    })
  }
  await compose({
    id: '10-komugi-bottom-right',
    title: 'こむぎ・右下の余白背景',
    background: paper,
    sources: [core('komugi')],
    pieces: [drawing(core('komugi'), 1450, 610, 410)],
    description: '文字や図を左側・上部へ置くための16:9背景。',
  })
  await compose({
    id: '11-komugi-bottom-left',
    title: 'こむぎ・左下の余白背景',
    background: '#ffffff',
    sources: [expression('komugi', 'curious')],
    pieces: [drawing(expression('komugi', 'curious'), 60, 610, 410)],
    description: '文字や図を右側・上部へ置くための白い16:9背景。',
  })
  await compose({
    id: '12-komugi-top-right',
    title: 'こむぎ・右上の余白背景',
    background: paper,
    sources: [expression('komugi', 'playful')],
    pieces: [drawing(expression('komugi', 'playful'), 1540, 20, 310)],
    description: '右上に小さなこむぎを配置した、本文用の16:9背景。',
  })
  await compose({
    id: '13-two-companions-bottom',
    title: 'こむぎとまめ・両下隅の余白背景',
    background: '#ffffff',
    sources: [core('komugi'), core('mame')],
    pieces: [drawing(core('komugi'), 35, 725, 285), drawing(core('mame'), 1600, 725, 285)],
    description: '両下隅に2匹を配置し、中央の説明スペースを空けた16:9背景。',
  })
  await compose({
    id: '14-food-border',
    title: '12種類の料理・上下の縁飾り',
    background: paper,
    sources: food.slice(0, 12).map((entry) => entry.svg),
    pieces: food
      .slice(0, 12)
      .map((entry, i) => drawing(entry.svg, 95 + (i % 6) * 295, i < 6 ? 20 : 850, 210)),
    description: '中央に広い余白を残し、12種類の料理を上下に配置した16:9背景。',
  })
  await compose({
    id: '15-food-footer-transparent',
    title: '料理の行進・背景透過',
    sources: food.slice(0, 12).map((entry) => entry.svg),
    pieces: food
      .slice(0, 12)
      .map((entry, i) => drawing(entry.svg, 20 + i * 158, 875 + (i % 2) * 28, 140)),
    description: '12種類の料理をスライド下部に並べた、背景透過の飾り。',
  })
  for (const entry of [
    {
      id: '16-three-main-pages',
      title: 'ひろば・ずかん・おみせの比較',
      files: ['10-plaza-plain', '36-recipe-cards-focus', '40-shop-hats'],
    },
    {
      id: '17-three-feeding-steps',
      title: '料理写真からごはんをあげるまで',
      files: ['73-photo-recognition', '74-photo-table', '81-reward-xp'],
    },
    {
      id: '18-three-growth-rewards',
      title: '成長・料理カード・新しい出会い',
      files: ['81-reward-growth', '81-reward-card', '81-reward-arrivals'],
    },
  ]) {
    const files = entry.files.map((file) => `01-screenshots/mobile/${file}.png`)
    await compose({
      id: entry.id,
      title: entry.title,
      background: paper,
      sources: files,
      pieces: files.map((file, i) => screen(file, 194 + i * 590, 68, 350, 944)),
      description:
        '実アプリのスマホ画面3枚を元の縦横比のまま配置。発表用デモデータで撮影した画面。',
    })
  }
  await compose({
    id: '19-komugi-and-curry',
    title: 'こむぎとドライカレー・説明用の組み素材',
    width: 1440,
    height: 900,
    sources: [outfit('komugi', 'chef'), curry],
    pieces: [drawing(outfit('komugi', 'chef'), 55, 170, 600), drawing(curry, 800, 325, 465)],
    description: 'コック帽のこむぎとドライカレーを左右に配置した背景透過素材。',
  })
  await compose({
    id: '20-friends-and-meals',
    title: 'まめとしずく・料理を囲む組み素材',
    width: 1440,
    height: 900,
    sources: [core('mame'), core('shizuku'), food[3].svg, food[4].svg],
    pieces: [
      drawing(core('mame'), 30, 90, 520),
      drawing(core('shizuku'), 890, 90, 520),
      drawing(food[3].svg, 300, 580, 340),
      drawing(food[4].svg, 800, 580, 340),
    ],
    description: '2匹のもぐと副菜・汁ものを組み合わせた背景透過素材。',
  })
  await compose({
    id: '21-komugi-three-outfits',
    title: 'こむぎ・3種類の着せ替え',
    width: 1600,
    height: 720,
    sources: ['picnic', 'chef', 'stargazing'].map((style) => outfit('komugi', style)),
    pieces: ['picnic', 'chef', 'stargazing'].map((style, i) =>
      drawing(outfit('komugi', style), 70 + i * 510, 105, 440),
    ),
    description: 'ピクニック・お料理・星空のおさんぽの3種類を並べた背景透過素材。',
  })
  const matrixSources = species.flatMap(([id]) => stages.map((_, stage) => core(id, stage)))
  await compose({
    id: '22-thirty-growth-forms',
    title: '6種類・全30の成長姿',
    sources: matrixSources,
    text: species.map(([, name]) => name).join('') + stages.join(''),
    pieces: [
      ...stages.map((name, i) => label(name, 360 + i * 340, 58, 28)),
      ...species.flatMap(([id, name], row) => [
        label(name, 55, 169 + row * 160, 30, 'start'),
        ...stages.map((_, col) => drawing(core(id, col), 270 + col * 340, 71 + row * 160, 180)),
      ]),
    ],
    description: '各種族の5段階を一覧で比べる、背景透過の30体早見表。文字フォント埋め込み済み。',
  })
  const pairFiles = ['12-plaza-outfit', '34-companion-collection'].map(
    (file) => `01-screenshots/mobile/${file}.png`,
  )
  await compose({
    id: '23-two-screens-with-notes-space',
    title: 'ひろばとなかま・右側に説明用余白',
    background: '#ffffff',
    sources: pairFiles,
    pieces: pairFiles.map((file, i) => screen(file, 95 + i * 430, 105, 345, 870)),
    description: '画面2枚を左に置き、右側約半分を説明用に空けた16:9背景。',
  })
  await compose({
    id: '24-portrait-komugi-and-food',
    title: 'こむぎと料理・縦長の余白背景',
    width: 1080,
    height: 1920,
    background: paper,
    sources: [core('komugi'), curry, food[3].svg, food[4].svg],
    pieces: [
      drawing(core('komugi'), 340, 1330, 410),
      drawing(curry, 70, 1630, 260),
      drawing(food[3].svg, 410, 1640, 260),
      drawing(food[4].svg, 750, 1630, 260),
    ],
    description: '上部に広い余白を残した9:16の縦長背景。',
  })
  await compose({
    id: '25-six-companions-four-three',
    title: '6種類のもぐ・4:3の余白背景',
    width: 1440,
    height: 1080,
    background: '#ffffff',
    sources: coreFiles,
    pieces: coreFiles.map((file, i) => drawing(file, 40 + i * 228, 760, 220)),
    description: '4:3スライドの下端に6種類を配置した白い背景。',
  })
  await fs.writeFile(
    path.join(kit, 'layouts-manifest.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        source: 'canonical-art-and-actual-screenshot-arrangement',
        command: 'node scripts/presentation/compose-layouts.mjs',
        total: manifest.length,
        note: '原画を描き直さず配置した発表用素材。SVGは外部参照なし。実画面を含む素材ではデモ保存データと生成料理写真を使用。',
        layouts: manifest,
      },
      null,
      2,
    ) + '\n',
  )
  console.log(`Finished: ${manifest.length} layouts, each supplied as SVG and PNG`)
} finally {
  await browser.close()
}
