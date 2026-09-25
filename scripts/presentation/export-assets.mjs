#!/usr/bin/env node
/** Export the game's authored SVGs without starting the game or touching saved data. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { chromium } from '@playwright/test'
import * as icons from 'lucide-react'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const kit = path.resolve(root, process.env.PRESENTATION_KIT_DIR ?? 'artifacts/presentation-kit')
const output = path.join(kit, '03-assets')
const coreOnly = process.argv.includes('--core-only')
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim()
const manifest = []
const moods = {
  happy: 'うれしい',
  hungry: 'おなかがすいた',
  sleepy: 'ねむい',
  eating: 'もぐもぐ',
  curious: 'きになる',
  delighted: '大よろこび',
  relaxed: 'のんびり',
  surprised: 'びっくり',
  playful: 'ごきげん',
}
const server = await createServer({
  root,
  configFile: false,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
  cacheDir: path.join(root, 'node_modules/.vite-presentation-export'),
})
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

async function standalone(raw) {
  let svg = raw.replace(/^.*?(?=<svg)/s, '')
  if (!svg.includes('xmlns=')) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  svg = svg
    .replace(/var\(--game-surface\)/g, '#ffffff')
    .replace(/var\(--game-canvas\)/g, '#ffffff')
    .replace(/var\(--game-neutral-soft\)/g, '#f1f1f1')
    .replace(/var\(--game-line\)/g, '#d7d7d7')
    .replace(/var\(--sign-accent, currentColor\)/g, '#d32734')
    .replace(/currentColor/g, '#1b1c33')
  for (const match of [...svg.matchAll(/(?:href|xlink:href)="(\/[^"#]+)"/g)]) {
    const file = path.join(root, 'public', match[1])
    const buffer = await fs.readFile(file)
    const mime = file.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
    svg = svg.replaceAll(match[1], `data:${mime};base64,${buffer.toString('base64')}`)
  }
  if (svg.includes('var('))
    throw new Error('A game theme variable was not resolved in the exported SVG')
  return svg
}

async function exportAsset({
  id,
  name,
  category,
  source,
  raw,
  width = 1024,
  height,
  transparent = true,
  ...detail
}) {
  let svg = await standalone(raw)
  const viewBox = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/)
  height ??= viewBox ? Math.round((width * Number(viewBox[4])) / Number(viewBox[3])) : width
  svg = svg.replace(
    /<svg([^>]*)>/,
    (_, attributes) =>
      `<svg${attributes.replace(/\s(?:width|height)="[^"]*"/g, '')} width="${width}" height="${height}">`,
  )
  const base = path.join(output, category, id)
  await fs.mkdir(path.dirname(base), { recursive: true })
  await fs.writeFile(`${base}.svg`, svg)
  const result = await page.evaluate(
    async ({ svg, width, height }) => {
      const image = new Image()
      image.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0, width, height)
      const rgba = ctx.getImageData(0, 0, width, height).data
      let visible = 0
      let clear = 0
      for (let i = 3; i < rgba.length; i += 4) {
        if (rgba[i] > 0) visible++
        if (rgba[i] === 0) clear++
      }
      return { data: canvas.toDataURL('image/png').split(',')[1], visible, clear }
    },
    { svg, width, height },
  )
  if (result.visible === 0) throw new Error(`Empty image: ${id}`)
  if (transparent && result.clear === 0) throw new Error(`Transparency missing: ${id}`)
  await fs.writeFile(`${base}.png`, Buffer.from(result.data, 'base64'))
  const relative = path.relative(kit, base).split(path.sep).join('/')
  manifest.push({
    id,
    title: name,
    name,
    category,
    source,
    sourceCommit,
    width,
    height,
    transparent: result.clear > 0,
    png: `${relative}.png`,
    svg: `${relative}.svg`,
    ...detail,
  })
  if (manifest.length % 50 === 0) console.log(`Exported ${manifest.length} assets`)
  return { svg, ...manifest.at(-1) }
}

function cropSvg(svg, { x = 0, y = 0, width, height }) {
  return svg.replace(/viewBox="[^"]+"/, `viewBox="${x} ${y} ${width} ${height}"`)
}

async function embeddedBrandFont() {
  const fontDirectory = path.join(root, 'node_modules/@fontsource-variable/noto-sans-jp')
  const css = await fs.readFile(path.join(fontDirectory, 'index.css'), 'utf8')
  const matches = []
  for (const block of css.match(/@font-face\s*\{[^}]+\}/g)) {
    const ranges = block.match(/unicode-range:([^;]+)/)?.[1].split(',') ?? []
    const used = [...'もぐ日和'].some((letter) =>
      ranges.some((range) => {
        const [start, end] = range
          .trim()
          .replace('U+', '')
          .split('-')
          .map((value) => parseInt(value, 16))
        return letter.codePointAt(0) >= start && letter.codePointAt(0) <= (end ?? start)
      }),
    )
    if (!used) continue
    const file = block.match(/url\(([^)]+)\)/)[1].replace(/['"]/g, '')
    const buffer = await fs.readFile(path.join(fontDirectory, file))
    matches.push(
      block.replace(/url\([^)]+\)/, `url(data:font/woff2;base64,${buffer.toString('base64')})`),
    )
  }
  return matches.join('\n')
}

try {
  const { Pet, ItemArt, GatheringScene, RoomScene, DishArt } =
    await server.ssrLoadModule('/src/ui/art/GameArt.tsx')
  const { MoguMark, VillageSign, VillageBackdrop } = await server.ssrLoadModule(
    '/src/ui/art/GameMotifs.tsx',
  )
  const { species, growthStages, items, legacyRecipes } = await server.ssrLoadModule(
    '/shared/content/catalog.ts',
  )
  const render = (Component, props = {}) =>
    renderToStaticMarkup(React.createElement(Component, props))

  // Render the six reference poses first, so illustration work can proceed immediately.
  for (const companion of species) {
    await exportAsset({
      id: `${companion.id}-stage-2`,
      name: `${companion.name}・わんぱく`,
      category: 'companions-core',
      source: 'src/ui/art/CompanionArt.tsx',
      raw: render(Pet, { species: companion.id, stage: 2, mood: 'happy' }),
      speciesId: companion.id,
      stage: 2,
      mood: 'happy',
      availability: 'game',
    })
  }
  console.log('Six core reference PNGs ready in 03-assets/companions-core/')
  if (!coreOnly) {
    for (const companion of species) {
      for (const growth of growthStages.filter(({ stage }) => stage !== 2)) {
        await exportAsset({
          id: `${companion.id}-stage-${growth.stage}`,
          name: `${companion.name}・${growth.name}`,
          category: 'companions-core',
          source: 'src/ui/art/CompanionArt.tsx',
          raw: render(Pet, { species: companion.id, stage: growth.stage, mood: 'happy' }),
          speciesId: companion.id,
          stage: growth.stage,
          mood: 'happy',
          availability: 'game',
        })
      }
      for (const [mood, label] of Object.entries(moods)) {
        if (mood === 'happy') continue // The reference above already supplies the ninth expression.
        await exportAsset({
          id: `${companion.id}-${mood}`,
          name: `${companion.name}・${label}`,
          category: 'companions-expressions',
          source: 'src/ui/art/CompanionArt.tsx',
          raw: render(Pet, { species: companion.id, stage: 2, mood }),
          speciesId: companion.id,
          stage: 2,
          mood,
          availability: 'game',
        })
      }
      const outfits = [
        {
          id: 'picnic',
          name: 'ピクニック',
          hat: 'i-picnic-straw',
          neck: 'neck-bandana',
          bag: 'bag-basket',
        },
        { id: 'chef', name: 'お料理', hat: 'chef', neck: 'neck-bow', bag: 'bag-satchel' },
        {
          id: 'stargazing',
          name: '星空のおさんぽ',
          hat: 'i-crescent-hat',
          neck: 'neck-scarf',
          bag: 'bag-star',
        },
      ]
      for (const outfit of outfits) {
        // Read the catalogue's current crescent-hat ID rather than silently rendering an absent hat.
        if (outfit.id === 'stargazing')
          outfit.hat = items.find((item) => item.name === '三日月のとんがり帽').id
        await exportAsset({
          id: `${companion.id}-${outfit.id}`,
          name: `${companion.name}・${outfit.name}`,
          category: 'companions-outfits',
          source: 'src/ui/art/GameArt.tsx',
          raw: render(Pet, { species: companion.id, stage: 2, mood: 'happy', ...outfit }),
          speciesId: companion.id,
          stage: 2,
          outfit: { hat: outfit.hat, neck: outfit.neck, bag: outfit.bag },
          availability: 'game',
        })
      }
    }

    for (const item of items.filter(
      (item) => !['none', 'neck-none', 'bag-none'].includes(item.id),
    )) {
      const room = item.kind === 'room'
      await exportAsset({
        id: item.id,
        name: item.name,
        category: room ? 'backgrounds-game' : 'items-game',
        source: 'src/ui/art/GameArt.tsx',
        raw: render(ItemArt, { id: item.id }),
        width: room ? 1920 : 1024,
        transparent: !room,
        itemKind: item.kind,
        availability: 'game',
      })
      if (room) {
        const raw = render(GatheringScene, { variant: item.id })
        await exportAsset({
          id: `${item.id}-wide`,
          name: `${item.name}・16:9`,
          category: 'backgrounds-game',
          source: 'src/ui/art/KayaScenery.tsx',
          raw,
          width: 1920,
          height: 1080,
          transparent: false,
          note: 'ゲームの背景プレビューを16:9に中央トリミング',
          availability: 'game',
        })
      }
    }
    for (const variant of ['plain', 'garden', 'night']) {
      await exportAsset({
        id: `room-${variant}`,
        name: `室内の背景・${variant}`,
        category: 'backgrounds-legacy',
        source: 'src/ui/art/GameArt.tsx',
        raw: render(RoomScene, { variant }),
        width: 1920,
        transparent: false,
        availability: 'legacy-art',
      })
    }
    for (const recipe of legacyRecipes) {
      await exportAsset({
        id: recipe.id,
        name: recipe.name,
        category: 'recipes-basic',
        source: 'src/ui/art/GameArt.tsx',
        raw: render(DishArt, { kind: recipe.sample }),
        width: 1024,
        availability: 'game',
      })
    }

    await exportAsset({
      id: 'mogu-mark',
      name: 'もぐ日和のマーク',
      category: 'brand-and-ui',
      source: 'src/ui/art/GameMotifs.tsx',
      raw: render(MoguMark),
    })
    const font = await embeddedBrandFont()
    for (const [variant, color, ink] of [
      ['navy', '#1b1c33', '#ffffff'],
      ['white', '#ffffff', '#1b1c33'],
    ]) {
      const mark = render(MoguMark)
        .replace(/^<svg[^>]*>|<\/svg>$/g, '')
        .replace(/currentColor/g, color)
        .replace(/var\(--game-surface\)/g, ink)
      await exportAsset({
        id: `wordmark-${variant}`,
        name: `もぐ日和 ロゴ・${variant === 'navy' ? '紺' : '白'}`,
        category: 'brand-and-ui',
        source: 'src/ui/art/GameMotifs.tsx + src/ui/journey/JourneyFrame.tsx',
        raw: `<svg viewBox="0 0 360 86" fill="none"><style>${font}</style><g transform="translate(6 7) scale(1.4)">${mark}</g><text x="88" y="64" font-family="Noto Sans JP Variable" font-weight="850" font-size="60" fill="${color}">もぐ日和</text></svg>`,
        width: 2400,
        note: 'ゲームのマークと名称を組んだ横長版。Noto Sans JPの該当文字フォントをSVG内に埋め込み。',
      })
    }
    for (const [kind, label] of [
      ['room', 'ひろば'],
      ['book', 'ずかん'],
      ['shop', 'おみせ'],
    ]) {
      await exportAsset({
        id: `sign-${kind}`,
        name: `${label}のサイン`,
        category: 'brand-and-ui',
        source: 'src/ui/art/GameMotifs.tsx',
        raw: render(VillageSign, { kind }),
      })
    }
    const decorations = render(VillageBackdrop).match(/<svg[\s\S]*?<\/svg>/g) ?? []
    for (const [index, raw] of decorations.entries()) {
      await exportAsset({
        id: `botanical-margin-${index + 1}`,
        name: `草花と食器の挿絵 ${index + 1}`,
        category: 'brand-and-ui',
        source: 'src/ui/art/GameMotifs.tsx',
        raw,
        width: 720,
      })
    }
    const uiIcons = {
      Coins: 'コイン',
      Gem: 'ジェム',
      Camera: '写真',
      Utensils: 'ごはん',
      Heart: 'ハート',
      Sparkles: 'きらめき',
      BookOpen: 'ずかん',
      ShoppingBag: 'おみせ',
      Leaf: '葉っぱ',
      Flame: '連続記録',
      Moon: 'おやすみ',
      Music2: '音符',
      Hand: 'なでる',
      Check: '完了',
      ArrowRight: '次へ',
      Plus: '追加',
      Bell: 'お知らせ',
      Image: 'アルバム',
    }
    for (const [id, name] of Object.entries(uiIcons)) {
      await exportAsset({
        id: `icon-${id.toLowerCase()}`,
        name,
        category: 'brand-and-ui',
        source: 'lucide-react (ISC license)',
        raw: render(icons[id], { size: 1024, strokeWidth: 1.8 }),
      })
    }
    for (const id of ['action-frame', 'paper-frame', 'table-linen']) {
      await exportAsset({
        id,
        name: id,
        category: 'brand-and-ui',
        source: `public/art/ui/${id}.svg`,
        raw: await fs.readFile(path.join(root, 'public/art/ui', `${id}.svg`), 'utf8'),
        transparent: false,
      })
    }

    const expansion = JSON.parse(
      await fs.readFile(path.join(root, 'public/expansion/catalog.json'), 'utf8'),
    )
    for (const companion of expansion.characters) {
      for (const [stage, growth] of companion.stages.entries()) {
        await exportAsset({
          id: `${companion.id}-${stage}`,
          name: `${companion.name}・${growth.name}`,
          category: 'companions-expansion',
          source: `public${growth.artPath}`,
          raw: await fs.readFile(path.join(root, 'public', growth.artPath), 'utf8'),
          speciesId: companion.id,
          stage,
          availability: 'expansion-catalog',
        })
      }
    }
    for (const item of expansion.items) {
      let raw = await fs.readFile(path.join(root, 'public', item.artPath), 'utf8')
      if (item.renderSpec.previewCrop) raw = cropSvg(raw, item.renderSpec.previewCrop)
      await exportAsset({
        id: item.id,
        name: item.name,
        category: item.kind === 'room' ? 'backgrounds-expansion' : 'items-expansion',
        source: `public${item.artPath}`,
        raw,
        width: item.kind === 'room' ? 1920 : 1024,
        transparent: item.kind !== 'room',
        itemKind: item.kind,
        availability: 'expansion-catalog',
        ...(item.renderSpec.previewCrop
          ? { note: '原画のpreviewCropに従って帽子部分を切り出し' }
          : {}),
      })
    }
    for (const recipe of expansion.recipes) {
      const raw = await fs.readFile(path.join(root, 'public', recipe.artPath), 'utf8')
      await exportAsset({
        id: recipe.id,
        name: recipe.name,
        category: `recipes/${recipe.category}`,
        source: `public${recipe.artPath}`,
        raw,
        width: 768,
        transparent: false,
        recipeCategory: recipe.category,
        availability: 'expansion-catalog',
      })
      // The first rect and margin rule are the recipe-card paper, separate from the authored dish.
      const cutout = raw
        .replace(/<rect\b(?=[^>]*\bwidth="480")(?=[^>]*\bheight="360")[^>]*\/>/, '')
        .replace(/<path d="M0 319H480M34 0V360"[^>]*\/>/, '')
        .replace(/<path d="M0 314Q90 285 165 318T329 315T480 311V360H0Z"[^>]*\/>/, '')
      await exportAsset({
        id: `${recipe.id}-cutout`,
        name: `${recipe.name}・背景透過`,
        category: `recipes-cutout/${recipe.category}`,
        source: `public${recipe.artPath}`,
        raw: cutout,
        width: 768,
        recipeCategory: recipe.category,
        note: 'SVGの用紙背景と余白の罫線・クロスのみを除去。料理の描画は原画のまま。',
        availability: 'expansion-catalog',
      })
    }
  }
  await fs.mkdir(kit, { recursive: true })
  if (!coreOnly) {
    const licenseDirectory = path.join(output, 'licenses')
    await fs.mkdir(licenseDirectory, { recursive: true })
    await fs.copyFile(
      path.join(root, 'node_modules/lucide-react/LICENSE'),
      path.join(licenseDirectory, 'lucide.txt'),
    )
    await fs.copyFile(
      path.join(root, 'node_modules/@fontsource-variable/noto-sans-jp/LICENSE'),
      path.join(licenseDirectory, 'noto-sans-jp.txt'),
    )
  }
  await fs.writeFile(
    path.join(kit, 'assets-manifest.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        source: 'canonical-game-art',
        command: `node scripts/presentation/export-assets.mjs${coreOnly ? ' --core-only' : ''}`,
        total: manifest.length,
        assets: manifest,
      },
      null,
      2,
    ) + '\n',
  )
  console.log(`Done: ${manifest.length} SVG + PNG pairs in ${output}`)
} finally {
  await browser.close()
  await server.close()
}
