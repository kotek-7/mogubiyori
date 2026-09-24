import { readFile, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
const raw = await readFile('public/expansion/catalog.json', 'utf8'),
  data = JSON.parse(raw)
const manifest = JSON.parse(await readFile('public/expansion/manifest.json', 'utf8'))
const failures = [],
  warnings = [],
  seen = new Set(),
  artHashes = new Map()
function check(ok, msg) {
  if (!ok) failures.push(msg)
}
async function asset(path, label) {
  check(
    typeof path === 'string' && /^\/expansion\/assets\/[\w/-]+\.(svg|png)$/.test(path),
    `${label}: invalid art path`,
  )
  if (!path) return
  try {
    const text = await readFile(`public${path}`)
    check(text.length > 300, `${label}: empty art`)
    if (path.endsWith('.svg')) {
      const svg = text.toString()
      check(svg.startsWith('<svg') && svg.includes('</svg>'), `${label}: invalid SVG`)
      check(
        !/<script|<foreignObject|\son\w+=|href=["']https?:/i.test(svg),
        `${label}: external/executable SVG`,
      )
      const hash = createHash('sha256')
        .update(svg.replace(/<title.*?<\/title>/s, ''))
        .digest('hex')
      if (artHashes.has(hash))
        warnings.push(`${label}: identical geometry to ${artHashes.get(hash)}`)
      else artHashes.set(hash, label)
    }
  } catch {
    failures.push(`${label}: missing ${path}`)
  }
}
for (const [kind, entries] of Object.entries({
  recipe: data.recipes,
  character: data.characters,
  item: data.items,
})) {
  const names = new Set()
  for (const e of entries) {
    check(/^[rci]-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.id), `${kind}: invalid id ${e.id}`)
    check(!seen.has(e.id), `duplicate id ${e.id}`)
    seen.add(e.id)
    check(e.name && !names.has(e.name), `${kind}: duplicate/empty name ${e.name}`)
    names.add(e.name)
    check(e.description?.length >= 8, `${e.id}: missing description`)
  }
}
check(data.recipes.length >= 300, 'fewer than 300 recipes')
for (const r of data.recipes) {
  const label = r.id
  check(r.category in data.categories, `${label}: category`)
  check([1, 2, 3].includes(r.difficulty), `${label}: difficulty`)
  check(['common', 'rare', 'special'].includes(r.rarity), `${label}: rarity`)
  check(Number.isInteger(r.minutes) && r.minutes > 0 && r.minutes <= 1440, `${label}: time`)
  check(r.servings === 1, `${label}: servings`)
  check(
    r.ingredients.length >= 2 && r.ingredients.every((x) => x.name && x.amount),
    `${label}: ingredients`,
  )
  check(
    r.steps.length >= 3 && r.steps.every((s) => typeof s === 'string' && s.length >= 12),
    `${label}: steps too brief`,
  )
  check(r.tip?.length >= 12, `${label}: tip`)
  check(r.tags?.length >= 2 && r.equipment?.length > 0, `${label}: tags/equipment`)
  check([20, 40, 70].includes(r.reward), `${label}: reward`)
  check(
    r.art?.colors?.every((c) => /^#[0-9a-f]{6}$/i.test(c)),
    `${label}: colors`,
  )
  check(r.art.toppings?.length > 0, `${label}: missing toppings`)
  await asset(r.artPath, label)
}
check(data.characters.length >= 36, 'fewer than 36 characters')
for (const c of data.characters) {
  check(c.habitat in data.collections, `${c.id}: habitat`)
  check(c.stages.length === 5, `${c.id}: growth stages`)
  check(
    c.favoriteCategories.every((k) => k in data.categories),
    `${c.id}: favorite category`,
  )
  check(c.discovery.adultCompanions >= 1 && c.discovery.uniqueRecipes >= 1, `${c.id}: discovery`)
  check(
    ['greeting', 'fed', 'newDish', 'repeatDish'].every((k) => c.dialogue[k]?.length > 3),
    `${c.id}: dialogue`,
  )
  for (const [i, s] of c.stages.entries()) {
    check(
      s.name === ['うまれたて', 'ちびっこ', 'わんぱく', 'おとな', 'とっておき'][i] && s.description,
      `${c.id}: stage description`,
    )
    check(s.artPath.endsWith(`-${i}.svg`), `${c.id}: stage art order`)
    const t = s.renderSpec?.hatTransform
    check(
      t &&
        ['translateX', 'translateY', 'scaleX', 'scaleY'].every((key) => Number.isFinite(t[key])) &&
        t.scaleX > 0 &&
        t.scaleY > 0,
      `${c.id}: headwear transform`,
    )
    await asset(s.artPath, `${c.id} stage ${i}`)
  }
}
check(data.items.length >= 72, 'fewer than 72 items')
for (const i of data.items) {
  check(['hat', 'room'].includes(i.kind), `${i.id}: kind`)
  check(['coins', 'gems'].includes(i.currency), `${i.id}: currency`)
  check(Number.isInteger(i.price) && i.price >= 0, `${i.id}: price`)
  check(i.collection in data.collections, `${i.id}: collection`)
  check(i.unlock?.uniqueRecipes >= 0, `${i.id}: unlock`)
  check(i.renderSpec?.anchor === (i.kind === 'hat' ? 'head' : 'background'), `${i.id}: anchor`)
  await asset(i.artPath, i.id)
}
for (const s of manifest.scenes) await asset(s.artPath, s.id)
check(
  createHash('sha256').update(raw).digest('hex') === manifest.sha256,
  'manifest catalog hash mismatch',
)
check(
  manifest.counts.recipes === data.recipes.length &&
    manifest.counts.characters === data.characters.length &&
    manifest.counts.characterStages === data.characters.reduce((n, c) => n + c.stages.length, 0) &&
    manifest.counts.items === data.items.length,
  'manifest counts mismatch',
)
for (const [path, hash] of Object.entries(manifest.sourceHashes ?? {})) {
  check(
    createHash('sha256')
      .update(await readFile(path))
      .digest('hex') === hash,
    `stale generated pack: ${path}; run npm run content:build`,
  )
}
const categories = Object.fromEntries(
  Object.keys(data.categories).map((c) => [c, data.recipes.filter((r) => r.category === c).length]),
)
const report = {
  passed: failures.length === 0,
  counts: manifest.counts,
  categories,
  filesChecked: artHashes.size + manifest.scenes.length,
  failures,
  warnings,
  catalogBytes: (await stat('public/expansion/catalog.json')).size,
  kitchenTested: false,
}
console.log(JSON.stringify(report, null, 2))
await import('node:fs/promises').then((fs) =>
  fs.writeFile('content/expansion/validation-report.json', JSON.stringify(report, null, 2) + '\n'),
)
assert.equal(failures.length, 0, `${failures.length} content checks failed`)
