#!/usr/bin/env node
/** Index the selected built-in image-generation outputs without modifying the images. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const kit = path.resolve(root, process.env.PRESENTATION_KIT_DIR ?? 'artifacts/presentation-kit')
const titles = {
  'meal-curry': '写真提出用のカレー写真',
  'food-corner-background': '料理の隅飾り・本文背景',
  'keyvisual-picnic': '6体のピクニック・左に余白',
  'keyvisual-kitchen': 'こむぎのキッチン・左に余白',
  'keyvisual-evening': '6体の夕暮れ・締めの背景',
  'keyvisual-seaside-left': '浜辺のピクニック・右に余白',
  'keyvisual-community-bottom': '6体とごはん・上に余白',
  'spot-komugi-mealtime': 'こむぎとごはん',
  'spot-yuzu-recipe-book': 'ゆずと料理のずかん',
  'spot-mame-growth': 'まめと小さな芽',
  'spot-shizuku-soup': 'しずくと温かいスープ',
  'spot-momo-goma-rest': 'ももとごまのおやすみ',
  'spot-photo-and-komugi': 'こむぎと料理の写真',
}
const prompts = JSON.parse(
  await fs.readFile(path.join(root, 'docs/presentation/image-prompts.json'), 'utf8'),
)
const extra = JSON.parse(
  await fs.readFile(path.join(root, 'docs/presentation/extra-image-prompts.json'), 'utf8'),
)
prompts.push(
  ...extra.prompts.map((row) => ({
    ...row,
    file: `04-visuals/${row.id}.png`,
    role: row.title,
    promptFile: 'production-notes/extra-image-prompts.json',
  })),
)
const visuals = []
for (const row of prompts) {
  const buffer = await fs.readFile(path.join(kit, row.file))
  if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a')
    throw new Error(`Not a PNG: ${row.file}`)
  const category =
    row.id === 'meal-curry'
      ? 'demo-input'
      : row.id.startsWith('keyvisual')
        ? 'keyvisuals'
        : row.id.startsWith('spot-')
          ? 'spot-illustrations'
          : 'slide-backgrounds'
  visuals.push({
    id: row.id,
    title: row.title ?? titles[row.id] ?? row.id,
    category,
    png: row.file,
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    transparent: row.id.startsWith('spot-'),
    description: row.role,
    source: 'built-in image_gen',
    availability: 'generated-illustration',
    references: (row.references ?? []).map((reference) =>
      reference.replace(/^artifacts\/presentation-kit\//, ''),
    ),
    promptFile: row.promptFile ?? 'production-notes/image-prompts.json',
  })
}
await fs.writeFile(
  path.join(kit, 'visuals-manifest.json'),
  JSON.stringify(
    {
      title: 'もぐ日和 発表用の生成イラストとデモ写真',
      method: 'built-in image_gen',
      note: '既存のゲーム原画を参照して生成。原本の画素・透明度を維持し、拡大加工はしていません。',
      visuals,
    },
    null,
    2,
  ) + '\n',
)
console.log(`${visuals.length} generated images indexed`)
