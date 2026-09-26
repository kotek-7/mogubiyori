import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { recipeArt } from './recipe-art.mjs'
import { recipeSilhouette } from './recipe-silhouette.mjs'
const read = async (path) => JSON.parse(await readFile(path, 'utf8'))
const sourceRecipes = (
  await Promise.all(
    ['staples', 'mains-sides', 'everyday', 'global-mains', 'bakery-sweets'].map((name) =>
      read(`content/expansion/recipes/${name}.json`),
    ),
  )
).flat()
// Rotate meal categories in the opening view; every category retains source order.
const recipeCategories = ['rice', 'main', 'noodles', 'side', 'soup', 'breakfast', 'snack']
const buckets = recipeCategories.map((category) =>
  sourceRecipes.filter((recipe) => recipe.category === category),
)
const recipes = []
for (let index = 0; index < Math.max(...buckets.map((bucket) => bucket.length)); index++)
  for (const bucket of buckets) if (bucket[index]) recipes.push(bucket[index])
if (recipes.length !== sourceRecipes.length)
  throw new Error('未登録の料理分類があります。分類を追加してから再生成してください。')
const characters = await read('content/expansion/characters.json')
const items = await read('content/expansion/items.json')
await mkdir('public/expansion/assets/recipes', { recursive: true })
await mkdir('public/expansion/assets/recipe-silhouettes', { recursive: true })
const modes = {}
for (const recipe of recipes) {
  const { svg, mode } = recipeArt(recipe)
  recipe.artPath = `/expansion/assets/recipes/${recipe.id}.svg`
  modes[mode] = (modes[mode] || 0) + 1
  await writeFile(`public${recipe.artPath}`, svg)
  await writeFile(
    `public/expansion/assets/recipe-silhouettes/${recipe.id}.svg`,
    recipeSilhouette(svg),
  )
}
const categories = {
  rice: 'ごはん',
  noodles: '麺',
  soup: 'スープ・汁もの',
  main: '主菜',
  side: '副菜',
  breakfast: '朝ごはん',
  snack: 'おやつ',
}
const collections = {
  meadow: '畑の食卓',
  forest: '森の台所',
  seaside: '港のごはん',
  market: '町の食堂',
  cafe: '喫茶の時間',
  night: '夜の炊事場',
}
const data = {
  schemaVersion: 1,
  id: 'shokudo-vol-1',
  name: '町の食堂と料理ずかん',
  categories,
  collections,
  recipes,
  characters,
  items,
}
const serialized = JSON.stringify(data, null, 2) + '\n'
const sourceFiles = [
  'content/expansion/recipes/staples.json',
  'content/expansion/recipes/mains-sides.json',
  'content/expansion/recipes/everyday.json',
  'content/expansion/recipes/global-mains.json',
  'content/expansion/recipes/bakery-sweets.json',
  'content/expansion/characters.json',
  'content/expansion/items.json',
  'scripts/content/recipe-art.mjs',
  'scripts/content/recipe-silhouette.mjs',
  'scripts/content/dessert-art.mjs',
  'scripts/content/savory-art.mjs',
  'scripts/content/global-art.mjs',
  'scripts/content/build-pack.mjs',
  'scripts/content/generate-companions-items.py',
]
const sourceHashes = Object.fromEntries(
  await Promise.all(
    sourceFiles.map(async (path) => [
      path,
      createHash('sha256')
        .update(await readFile(path))
        .digest('hex'),
    ]),
  ),
)
await writeFile('public/expansion/catalog.json', serialized)
const manifest = {
  schemaVersion: 1,
  id: data.id,
  title: data.name,
  contentVersion: '1.2.0',
  sourceHashes,
  catalog: 'catalog.json',
  sha256: createHash('sha256').update(serialized).digest('hex'),
  counts: {
    recipes: recipes.length,
    characters: characters.length,
    characterStages: characters.reduce((n, c) => n + c.stages.length, 0),
    items: items.length,
  },
  recipeArtModes: modes,
  review: { automated: 'Run node scripts/content/validate-pack.mjs', kitchenTested: false },
  scenes: [
    {
      id: 'neighborhood-table',
      artPath: '/expansion/assets/scenes/neighborhood-table.png',
      source: 'Built-in imagegen',
      prompt: 'content/expansion/art/neighborhood-table.prompt.txt',
    },
  ],
}
await writeFile('public/expansion/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
console.log(
  JSON.stringify(
    { counts: manifest.counts, recipeArtModes: modes, catalogBytes: Buffer.byteLength(serialized) },
    null,
    2,
  ),
)
