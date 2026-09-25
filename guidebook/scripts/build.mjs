import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { pages, renderPage } from '../src/book.mjs'

export const root = fileURLToPath(new URL('../', import.meta.url))
export async function build() {
  const output = path.join(root, 'dist')
  await rm(output, { recursive: true, force: true })
  await mkdir(output, { recursive: true })
  await cp(path.join(root, 'public'), output, { recursive: true })
  await cp(path.join(root, 'src/style.css'), path.join(output, 'style.css'))
  await cp(path.join(root, 'src/client.mjs'), path.join(output, 'client.mjs'))
  for (const page of pages) {
    const directory = path.join(output, page.path)
    await mkdir(directory, { recursive: true })
    await writeFile(path.join(directory, 'index.html'), renderPage(page))
  }
  await writeFile(
    path.join(output, '404.html'),
    renderPage({
      path: '404',
      title: 'ページが見つかりません',
      description: '指定されたページはありません。',
      body: '<section class="wrap section"><h1>ページが見つかりません</h1><a class="text-link" href="/contents/">総目次 →</a></section>',
    }),
  )
  await writeFile(
    path.join(output, 'page-index.json'),
    JSON.stringify(
      pages.map(({ path, title, chapter }) => ({
        path: `/${path}${path ? '/' : ''}`,
        title,
        chapter,
      })),
      null,
      2,
    ),
  )
  console.log(`Built ${pages.length} complete pages in guidebook/dist`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await build()
