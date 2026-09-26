import { expect, test, type Browser, type Locator, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { videoState } from './videos-fixture'
import { waitForSceneMotion } from '../../tests/e2e/helpers'

const output = resolve('artifacts/presentation-kit/02-videos')
const raw = resolve('test-results/presentation-video-originals')
const sourceCommit = execFileSync(
  'git',
  ['rev-parse', process.env.PRESENTATION_SOURCE_COMMIT ?? 'HEAD'],
  { encoding: 'utf8' },
).trim()
const orientationFilter = process.env.PRESENTATION_VIDEO_ORIENTATION
if (orientationFilter && !['portrait', 'landscape'].includes(orientationFilter)) {
  throw new Error('PRESENTATION_VIDEO_ORIENTATION must be portrait or landscape')
}
const onlyMissing = process.env.PRESENTATION_VIDEO_ONLY_MISSING === '1'
const pause = (page: Page, ms = 1600) => page.waitForTimeout(ms)
const posters = new WeakMap<Page, Buffer>()

async function rememberPoster(page: Page) {
  await waitForSceneMotion(page)
  posters.set(page, await page.screenshot())
}
const mainNav = (page: Page, name: string) =>
  page
    .getByRole('navigation', { name: 'メインナビゲーション' })
    .getByRole('button', { name, exact: true })

async function click(page: Page, target: Locator, wait = 1350) {
  await target.scrollIntoViewIfNeeded()
  const box = await target.boundingBox()
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 })
  await pause(page, 250)
  await target.click()
  await pause(page, wait)
}

async function categories(page: Page, group: string, label: string) {
  await click(
    page,
    page.getByRole('group', { name: group }).getByRole('button', { name: label, exact: true }),
  )
}

async function rewards(page: Page, holdGrowth = 3200) {
  await expect(page.locator('[data-scene="xp"]')).toBeVisible({ timeout: 10_000 })
  for (let i = 0; i < 10; i++) {
    const current = await page
      .locator('main.journey-screen')
      .getAttribute('data-scene')
      .catch(() => null)
    if (!current) break
    await pause(
      page,
      current === 'growth' || current === 'card'
        ? holdGrowth
        : current === 'mealReport'
          ? 3500
          : 1900,
    )
    if (current === 'growth' || current === 'card') await rememberPoster(page)
    const button = page
      .locator('main.journey-screen')
      .getByRole('button', { name: /^(つづける|ひろばへ)$/ })
    await expect(button).toBeEnabled({ timeout: 10_000 })
    await click(page, button, 950)
    if (await page.locator('.play-world').isVisible()) break
  }
}

type Scene = {
  id: string
  title: string
  description: string
  format?: 'portrait'
  fixture?: string
  photo?: boolean
  run: (page: Page) => Promise<void>
}

const scenes: Scene[] = [
  {
    id: '01-first-companion',
    title: '最初のなかまを選ぶ',
    fixture: 'fresh',
    description: '3種類のなかまを見比べ、こむぎを選んで最初の出会いへ進む。',
    run: async (page) => {
      await rememberPoster(page)
      await click(page, page.getByRole('button', { name: 'まめを選ぶ', exact: true }), 2000)
      await click(page, page.getByRole('button', { name: 'しずくを選ぶ', exact: true }), 2000)
      await click(page, page.getByRole('button', { name: 'こむぎを選ぶ', exact: true }), 2000)
      await click(page, page.getByRole('button', { name: 'この子とはじめる' }), 4200)
    },
  },
  {
    id: '02-book-and-description',
    title: 'ずかんからもぐの説明を見る',
    format: 'portrait',
    description: 'ひろばとずかんのタブを切り替え、なかまの生態・性格・成長した姿を見る。',
    run: async (page) => {
      await click(page, mainNav(page, 'ずかん'))
      await click(page, mainNav(page, 'ひろば'))
      await click(page, mainNav(page, 'ずかん'))
      await categories(page, 'ずかんのカテゴリ', 'なかま')
      await click(page, page.getByRole('button', { name: 'まめの説明を見る', exact: true }), 3000)
      await rememberPoster(page)
      await click(
        page,
        page.getByRole('button', { name: 'うまれたての姿を見る', exact: true }),
        2600,
      )
      await page
        .getByRole('dialog')
        .evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' }))
      await pause(page, 2800)
      await click(page, page.getByRole('button', { name: '閉じる', exact: true }))
    },
  },
  {
    id: '03-change-companion',
    title: 'なかまをひろばに呼ぶ',
    description: 'ずかんで暮らしているなかまを選び、まめ、しずくへと切り替える。',
    run: async (page) => {
      await click(page, mainNav(page, 'ずかん'))
      await categories(page, 'ずかんのカテゴリ', 'なかま')
      await click(page, page.getByRole('button', { name: 'まめと暮らす', exact: true }), 2500)
      await click(page, mainNav(page, 'ずかん'))
      await categories(page, 'ずかんのカテゴリ', 'なかま')
      await click(page, page.getByRole('button', { name: 'しずくと暮らす', exact: true }), 3000)
    },
  },
  {
    id: '04-shopping-and-outfit',
    title: 'おみせで購入してきせかえる',
    format: 'portrait',
    description: 'ぼうしと赤いバンダナを試着し、コインで購入してひろばのこむぎに着せる。',
    run: async (page) => {
      await click(page, mainNav(page, 'おみせ'))
      await categories(page, 'おみせのカテゴリ', 'ぼうし')
      await click(page, page.locator('.shop-card').filter({ hasText: 'ベレー' }).first(), 2300)
      await click(
        page,
        page.getByRole('dialog').getByRole('button', { name: '購入して使う' }),
        2200,
      )
      await click(page, mainNav(page, 'おみせ'))
      await categories(page, 'おみせのカテゴリ', 'くびもと')
      await click(page, page.locator('.shop-card').filter({ hasText: '赤いバンダナ' }), 2200)
      await click(
        page,
        page.getByRole('dialog').getByRole('button', { name: '購入して使う' }),
        3000,
      )
    },
  },
  {
    id: '05-change-scenery',
    title: 'ひろばの景色を変える',
    description: 'おみせのひろばカテゴリで星あかりと夕なぎの浜辺を試し、景色を切り替える。',
    run: async (page) => {
      for (const name of ['星あかりのひろば', '夕なぎの浜辺']) {
        await click(page, mainNav(page, 'おみせ'))
        await categories(page, 'おみせのカテゴリ', 'ひろば')
        await click(page, page.locator('.shop-card').filter({ hasText: name }), 2300)
        await click(
          page,
          page.getByRole('dialog').getByRole('button', { name: '購入して使う' }),
          3500,
        )
      }
    },
  },
  {
    id: '06-touch-and-play',
    title: 'もぐとふれあう',
    format: 'portrait',
    description: 'こむぎにタッチし、なでる・くすぐる・手をふる操作に応える表情と動きを見せる。',
    run: async (page) => {
      const surface = page.locator('.play-pet [data-gesture-surface]')
      let box = await surface.boundingBox()
      if (!box) throw new Error('Gesture surface missing')
      const x = box.x + box.width / 2,
        y = box.y + box.height / 2
      await page.mouse.click(x, y)
      await pause(page, 2600)
      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.mouse.move(x + 16, y, { steps: 5 })
      await pause(page, 500)
      await page.mouse.move(x + 48, y, { steps: 7 })
      await page.mouse.up()
      await pause(page, 2600)
      await click(page, page.getByRole('button', { name: 'こむぎをくすぐる', exact: true }), 2600)
      await click(page, page.getByRole('button', { name: 'こむぎに手をふる', exact: true }), 2800)
    },
  },
  {
    id: '07-growth-after-meal',
    title: 'ごはんをあげて成長する',
    fixture: 'growth',
    description:
      'サンプル写真のごはんから食事・XP獲得・新しい姿への成長まで、一続きの操作を見せる。',
    run: async (page) => {
      await click(page, page.locator('.play-feed'))
      await click(page, page.getByRole('button', { name: 'サンプル写真で体験する' }), 2400)
      await click(
        page,
        page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }),
        1000,
      )
      await rewards(page, 4300)
    },
  },
  {
    id: '08-recipe-collection',
    title: '料理カードを探してレシピを見る',
    description: 'ずかんの料理カードを検索し、カレーの材料・つくりかたを確認する。',
    run: async (page) => {
      await click(page, mainNav(page, 'ずかん'))
      await page
        .getByRole('searchbox', { name: '名前・材料で検索' })
        .pressSequentially('カレー', { delay: 160 })
      await pause(page, 2200)
      await click(
        page,
        page.getByRole('button', { name: 'カレーのレシピを見る', exact: true }),
        3400,
      )
      await rememberPoster(page)
      await page
        .getByRole('dialog')
        .evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' }))
      await pause(page, 3200)
      await click(page, page.getByRole('button', { name: '閉じる', exact: true }))
    },
  },
  {
    id: '09-growth-collection',
    title: '5段階の成長した姿を見る',
    fixture: 'forms',
    format: 'portrait',
    description: 'プロフィールの成長一覧から、うまれたてからとっておきまでの姿を順番に見る。',
    run: async (page) => {
      await click(page, page.locator('.play-growth'), 2200)
      for (const name of ['うまれたて', 'ちびっこ', 'わんぱく', 'おとな', 'とっておき'])
        await click(
          page,
          page.getByRole('button', { name: `${name}の姿を見る`, exact: true }),
          2400,
        )
    },
  },
  {
    id: '10-meal-album',
    title: 'ごはんの記録を振り返る',
    description: '記録タブで今日と前日の料理を選び、食事の時間や食品の内訳を振り返る。',
    run: async (page) => {
      await click(page, mainNav(page, '記録'), 2000)
      await click(page, page.locator('.memory-card').first(), 3400)
      await click(page, page.getByRole('button', { name: '閉じる', exact: true }))
      await click(
        page,
        page.getByRole('group', { name: '7日間の記録', exact: true }).getByRole('button').nth(5),
      )
      await click(page, page.locator('.memory-card').nth(1), 3200)
      await rememberPoster(page)
      await click(page, page.getByRole('button', { name: '閉じる', exact: true }))
    },
  },
  {
    id: '11-photo-to-meal-and-card',
    title: '料理の写真から食事とカード獲得へ',
    fixture: 'meal',
    photo: true,
    description:
      'カレーの写真を提出し、料理の候補を確認して食卓へ。食事、XP獲得、料理カード獲得、食後のレポートを経てひろばへ戻る。',
    run: async (page) => {
      await click(page, page.locator('.play-feed'))
      await page
        .getByLabel('料理の写真', { exact: true })
        .and(page.locator('input[type="file"]'))
        .setInputFiles(resolve('artifacts/presentation-kit/05-demo-input/meal-curry.png'))
      await pause(page, 4200)
      await click(page, page.getByRole('button', { name: '食卓へ', exact: true }), 3400)
      await click(
        page,
        page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }),
        1000,
      )
      await rewards(page, 4200)
    },
  },
]

scenes.push({
  ...scenes.find((scene) => scene.id === '11-photo-to-meal-and-card')!,
  id: '12-photo-to-meal-portrait',
  title: '料理の写真から食事とカード獲得へ（縦）',
  format: 'portrait',
})

// Preserve the first twelve exports and add the missing orientation of every operation.
for (const [index, original] of scenes.slice(0, 10).entries()) {
  const format = original.format === 'portrait' ? undefined : 'portrait'
  const orientation = format === 'portrait' ? 'portrait' : 'landscape'
  const number = String(index + 13).padStart(2, '0')
  scenes.push({
    ...original,
    id: `${number}-${original.id.slice(3)}-${orientation}`,
    title: `${original.title}（${format === 'portrait' ? '縦' : '横'}）`,
    format,
  })
}

const reportEdit: Scene = {
  id: '23-report-and-edit-landscape',
  title: '7日間のレポートを見て食事の記録を直す（横）',
  description:
    '7日間のグラフから日付を選び、今日の記録を開く。朝ごはんの内容を編集し、レポートへの反映を確認する。',
  run: async (page) => {
    await click(page, mainNav(page, 'レポート'), 2000)
    const days = page
      .getByRole('region', { name: '7日間のごはんバランス', exact: true })
      .locator('.meal-week-day')
    await click(page, days.nth(4), 1100)
    await click(page, days.last(), 1100)
    await click(page, page.getByRole('button', { name: 'この日の記録を見る', exact: true }), 1600)
    await click(page, page.locator('.memory-card').filter({ hasText: '朝のおにぎり' }), 1600)
    const dialog = page.getByRole('dialog')
    await click(page, dialog.getByRole('button', { name: '記録を編集', exact: true }), 1200)
    await dialog
      .getByRole('textbox', { name: '食事の名前', exact: true })
      .fill('おにぎりと卵と野菜')
    await dialog
      .getByRole('textbox', { name: '料理 1 の名前', exact: true })
      .fill('おにぎり・ゆで卵・サラダ')
    await click(page, dialog.getByRole('checkbox', { name: '肉・魚・卵・豆', exact: true }), 700)
    await click(
      page,
      dialog.getByRole('checkbox', { name: '野菜・きのこ・海藻', exact: true }),
      1500,
    )
    await click(page, dialog.getByRole('button', { name: '変更を保存', exact: true }), 1800)
    await expect(dialog.getByRole('button', { name: '記録を編集', exact: true })).toBeVisible()
    await click(page, dialog.getByRole('button', { name: '閉じる', exact: true }), 1100)
    await click(
      page,
      page.getByRole('button', { name: 'この日のレポートを見る', exact: true }),
      1800,
    )
    await page.locator('.meal-report-score').scrollIntoViewIfNeeded()
    await pause(page, 2200)
    await expect(page.locator('.meal-report-score strong')).toHaveText('100')
    await rememberPoster(page)
  },
}
scenes.push(reportEdit, {
  ...reportEdit,
  id: '24-report-and-edit-portrait',
  title: '7日間のレポートを見て食事の記録を直す（縦）',
  format: 'portrait',
})

async function capture(browser: Browser, baseURL: string, scene: Scene) {
  mkdirSync(output, { recursive: true })
  mkdirSync(raw, { recursive: true })
  const viewport =
    scene.format === 'portrait' ? { width: 450, height: 800 } : { width: 1440, height: 810 }
  const context = await browser.newContext({
    baseURL,
    viewport,
    deviceScaleFactor: 1,
    timezoneId: 'Asia/Tokyo',
    locale: 'ja-JP',
    reducedMotion: 'no-preference',
    recordVideo: { dir: raw, size: viewport },
  })
  if (scene.fixture !== 'fresh')
    await context.addInitScript((state) => {
      if (!localStorage.getItem('mogubiyori-v1'))
        localStorage.setItem('mogubiyori-v1', JSON.stringify(state))
    }, videoState(scene.fixture))
  if (scene.photo)
    await context.route('**/api/recognize-food', async (route) => {
      await new Promise((done) => setTimeout(done, 2200))
      await route.fulfill({ status: 200, json: { candidates: ['curry', 'generic-curry'] } })
    })
  const started = Date.now()
  const page = await context.newPage()
  const failures: string[] = []
  page.on('pageerror', (error) => failures.push(error.message))
  await page.goto('/', { waitUntil: 'networkidle' })
  await waitForSceneMotion(page)
  const trim = (Date.now() - started) / 1000
  await pause(page, 1700)
  try {
    await scene.run(page)
    await waitForSceneMotion(page)
    await pause(page, 1900)
    const poster = posters.get(page) ?? (await page.screenshot())
    writeFileSync(resolve(output, `${scene.id}-poster.png`), poster)
    expect(failures).toEqual([])
  } finally {
    await context.close()
  }
  const webm = await page.video()!.path()
  const file = `${scene.id}.mp4`
  const size = scene.format === 'portrait' ? { width: 720, height: 1280 } : viewport
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-loglevel',
      'error',
      '-ss',
      trim.toFixed(3),
      '-i',
      webm,
      '-an',
      '-vf',
      `scale=${size.width}:${size.height}:flags=lanczos,fps=30`,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-threads',
      '2',
      '-crf',
      '18',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      resolve(output, file),
    ],
    { timeout: 120_000 },
  )
  const metadata = JSON.parse(
    execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', resolve(output, file)],
      { encoding: 'utf8' },
    ),
  )
  const stream = metadata.streams.find(
    (entry: { codec_type: string }) => entry.codec_type === 'video',
  )
  const record = {
    id: scene.id,
    title: scene.title,
    description: scene.description,
    file: `02-videos/${file}`,
    poster: `02-videos/${scene.id}-poster.png`,
    durationSeconds: Number(metadata.format.duration),
    width: stream.width,
    height: stream.height,
    orientation: scene.format === 'portrait' ? 'portrait' : 'landscape',
    codec: stream.codec_name,
    pixelFormat: stream.pix_fmt,
    sourceCommit,
    capturedAt: new Date().toISOString(),
    audio: false,
    conditions: {
      data: '架空のローカルデモデータ。実ユーザーの写真・アカウント・保存データは不使用。',
      motion: 'アプリ既定のアニメーション。早送りなし。読み込み前の映像のみ冒頭をトリミング。',
      viewport,
      outputScale: scene.format === 'portrait' ? 1.6 : 1,
      recognition: scene.photo
        ? '固定候補 curry / generic-curry を2.2秒後に返すモック。実モデルの料理判定性能を示す動画ではない。'
        : '料理判定API不使用。',
      sourcePhoto: scene.photo ? '05-demo-input/meal-curry.png（発表用に生成した料理写真）' : null,
    },
  }
  writeFileSync(resolve(output, `${scene.id}.json`), `${JSON.stringify(record, null, 2)}\n`)
  // Parallel capture batches merge these independent records after all workers finish.
  if (process.env.PRESENTATION_VIDEO_DEFER_MANIFEST === '1') return
  const manifestPath = resolve(output, 'videos-manifest.json')
  const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : []
  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      [...previous.filter((entry: { id: string }) => entry.id !== scene.id), record].sort((a, b) =>
        a.id.localeCompare(b.id),
      ),
      null,
      2,
    )}\n`,
  )
}

for (const scene of scenes) {
  test(scene.id, async ({ browser, baseURL }) => {
    test.skip(
      Boolean(orientationFilter) &&
        orientationFilter !== (scene.format === 'portrait' ? 'portrait' : 'landscape'),
      '指定した向き以外は撮影しない',
    )
    test.skip(
      onlyMissing &&
        ['.mp4', '-poster.png', '.json'].every((suffix) =>
          existsSync(resolve(output, `${scene.id}${suffix}`)),
        ),
      '完成済みの動画・ポスター・記録を保持する',
    )
    test.skip(
      scene.photo &&
        !existsSync(resolve('artifacts/presentation-kit/05-demo-input/meal-curry.png')),
      '発表用の料理画像の生成待ち',
    )
    await capture(browser, baseURL!, scene)
  })
}
