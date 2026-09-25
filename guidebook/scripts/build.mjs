import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
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
      title: '道に迷ったら',
      description: '総目次から、もう一度。',
      body: '<section class="wrap section"><p class="eyebrow">道しるべ</p><h1>この道の先には、<br>まだページがありません。</h1><p>いったん目次をひらいて、行き先を選びましょう。</p><a class="button" href="/contents/">総目次へ →</a></section>',
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
  const metadata = JSON.parse(await readFile(path.join(root, '.openai/hosting.json'), 'utf8'))
  await mkdir(path.join(output, '.openai'), { recursive: true })
  await writeFile(path.join(output, '.openai/hosting.json'), JSON.stringify(metadata))
  console.log(`Built ${pages.length} complete pages in guidebook/dist`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await build()
