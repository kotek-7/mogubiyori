import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pages } from '../src/book.mjs'
import { stories, discoveries } from '../src/stories.mjs'
import { species, islandSpecies } from '../src/world-data.ts'

const root = fileURLToPath(new URL('../dist/', import.meta.url))
const pagesByPath = new Map(pages.map((page) => [`/${page.path}${page.path ? '/' : ''}`, page]))
assert.equal(pagesByPath.size, pages.length, 'Every page must have a unique URL')
assert.equal(stories.length, 8)
assert.equal(discoveries.length, 6)
assert.equal(species.length + islandSpecies.length, 42)
const htmlByPath = new Map()
const links = new Map()
let assets = 0
for (const [url, page] of pagesByPath) {
  const html = await readFile(path.join(root, page.path, 'index.html'), 'utf8')
  htmlByPath.set(url, html)
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${url}: one main heading`)
  assert(html.includes('lang="ja"'), `${url}: Japanese language`)
  assert(html.includes('name="description"'), `${url}: page description`)
  assert(html.includes('id="main"'), `${url}: keyboard skip destination`)
  assert(
    !/\bundefined\b|\bNaN\b|TODO|COMING SOON|<!--ASIDE:/.test(html),
    `${url}: unfinished content`,
  )
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
  assert.equal(new Set(ids).size, ids.length, `${url}: duplicate element IDs`)
  for (const image of html.matchAll(/<img\b[^>]*>/g))
    assert(/\balt="[^"]*"/.test(image[0]), `${url}: image alternative text`)
  const urls = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => match[1])
  links.set(url, urls)
}
for (const [url, targets] of links) {
  for (const raw of targets) {
    const target = new URL(raw.replaceAll('&amp;', '&'), `http://guidebook.test${url}`)
    assert.equal(
      target.origin,
      'http://guidebook.test',
      `${url}: external runtime dependency ${raw}`,
    )
    if (target.pathname.endsWith('/')) {
      assert(pagesByPath.has(target.pathname), `${url}: broken page link ${raw}`)
      if (target.hash)
        assert(
          htmlByPath.get(target.pathname).includes(`id="${target.hash.slice(1)}"`),
          `${url}: broken fragment ${raw}`,
        )
    } else {
      assert(
        (await stat(path.join(root, target.pathname))).isFile(),
        `${url}: missing asset ${raw}`,
      )
      assets++
    }
  }
}
const visited = new Set()
const queue = ['/']
while (queue.length) {
  const url = queue.shift()
  if (visited.has(url)) continue
  visited.add(url)
  for (const target of links.get(url)) {
    const next = new URL(target, `http://guidebook.test${url}`).pathname
    if (pagesByPath.has(next) && !visited.has(next)) queue.push(next)
  }
}
assert.equal(visited.size, pages.length, 'All pages must be reachable from the cover')
const fieldPages = [...htmlByPath.entries()].filter(([url]) => url.startsWith('/mogs/field-'))
for (const [url, html] of fieldPages) {
  assert.equal((html.match(/class="field-card"/g) || []).length, 6, `${url}: six island species`)
}
for (const entry of islandSpecies) {
  assert(
    fieldPages.some(([, html]) => html.includes(`id="${entry.id}"`)),
    `${entry.name}: missing from the field guide`,
  )
}
const shop = htmlByPath.get('/village/the-folded-bread-shop/')
assert(
  shop.includes('/stories/letter-with-a-folded-edge/'),
  'The folded bread shop must connect to its own story',
)
for (const story of stories) {
  assert(story.paragraphs.length >= 6, `${story.title}: complete narrative`)
  assert(story.paragraphs.join('').length >= 700, `${story.title}: complete story`)
}
for (const css of ['style.css', 'fonts/noto-sans-jp.css']) {
  const text = await readFile(path.join(root, css), 'utf8')
  for (const [, reference] of text.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
    const asset = reference.startsWith('/')
      ? path.join(root, reference)
      : path.resolve(root, path.dirname(css), reference)
    assert((await stat(asset)).isFile(), `${css}: missing font/style resource ${reference}`)
  }
}
console.log(
  `PASS: ${pages.length} rendered pages, all reachable, ${assets} local asset references, 42 species, 8 complete stories, no broken links or missing fonts.`,
)
