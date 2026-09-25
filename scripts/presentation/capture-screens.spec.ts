import { expect, test, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { initialGame, todayTokyo, type GameState } from '../../src/app/game/browserGame'
import { navigate, waitForSceneMotion } from '../../tests/e2e/helpers'
import { presentationSave } from './screens-fixture'

const root = fileURLToPath(new URL('../../', import.meta.url))
const output = `${root}/artifacts/presentation-kit/01-screenshots`
const manifestPath = `${root}/artifacts/presentation-kit/screenshots-manifest.json`
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim()

type Capture = {
  id: string
  label: string
  title: string
  category: string
  scene: string
  path: string
  viewport: { width: number; height: number }
  deviceScaleFactor: number
  fullPage: boolean
  sourceCommit: string
  demo: true
  width: number
  height: number
}

async function seed(page: Page, state: GameState, path = '/') {
  await page.goto('/')
  await page.evaluate(
    (value) => localStorage.setItem('mogubiyori-v1', JSON.stringify(value)),
    state,
  )
  await page.goto(path)
  await expect(page.locator('main')).toBeVisible()
  await waitForSceneMotion(page)
}

type Layout = { id: string; viewport: { width: number; height: number }; dpr: number }

function captureFor(page: Page, layout: Layout, entries: Capture[] = []) {
  mkdirSync(`${output}/${layout.id}`, { recursive: true })
  return async function shot(id: string, label: string, scene: string, fullPage = false) {
    await waitForSceneMotion(page)
    await page.evaluate(async () => {
      await document.fonts.ready
      await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)))
    })
    await page.mouse.move(layout.viewport.width - 1, layout.viewport.height - 1)
    const path = `01-screenshots/${layout.id}/${id}.png`
    const png = await page.screenshot({
      path: `${root}/artifacts/presentation-kit/${path}`,
      fullPage,
      animations: 'disabled',
    })
    entries.push({
      id: `${layout.id}-${id}`,
      label,
      title: label,
      category: 'スクリーンショット',
      scene,
      path,
      viewport: layout.viewport,
      deviceScaleFactor: layout.dpr,
      fullPage,
      sourceCommit,
      demo: true,
      width: png.readUInt32BE(16),
      height: png.readUInt32BE(20),
    })
    let previous: Capture[] = []
    try {
      previous = JSON.parse(readFileSync(manifestPath, 'utf8')).screenshots
    } catch {
      /* First capture. */
    }
    const preserved = previous.filter((entry) => entry.id !== `${layout.id}-${id}`)
    writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          title: 'もぐ日和 発表用スクリーンショット',
          captureMode: 'Vite test / VITE_GAME_MODE=local / isolated fictional save',
          note: '実アプリの画面をそのまま撮影。収集数・育成状況・所持金・記録は発表用デモデータ。カレー写真は AI 生成素材。写真判定候補は撮影用の固定応答。',
          screenshots: [...preserved, entries.at(-1)],
        },
        null,
        2,
      ) + '\n',
    )
    console.log(`${layout.id}: ${id}`)
  }
}

for (const layout of [
  { id: 'mobile', viewport: { width: 390, height: 844 }, dpr: 2 },
  { id: 'wide', viewport: { width: 1920, height: 1080 }, dpr: 1 },
]) {
  test.describe(layout.id, () => {
    test.use({ viewport: layout.viewport, deviceScaleFactor: layout.dpr })

    test('capture real pages with an isolated presentation save', async ({ page }) => {
      const entries: Capture[] = []
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      mkdirSync(`${output}/${layout.id}`, { recursive: true })
      const shot = captureFor(page, layout, entries)
      async function close() {
        await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).click()
        await expect(page.getByRole('dialog')).toHaveCount(0)
      }
      async function shop(category: string) {
        await navigate(page, 'おみせ')
        await page
          .getByRole('group', { name: 'おみせのカテゴリ' })
          .getByRole('button', { name: category, exact: true })
          .click()
      }

      await seed(page, initialGame(todayTokyo()))
      await expect(page.getByRole('heading', { name: '最初のなかまを選ぶ' })).toBeVisible()
      await shot('01-starter-selection', '最初のなかまを選ぶ', 'onboarding')
      await page.getByRole('button', { name: 'この子とはじめる', exact: true }).click()
      await expect(page.locator('[data-scene="welcome"]')).toBeVisible()
      await shot('02-welcome', 'こむぎと出会う', 'onboarding')

      const state = presentationSave()
      const curryPhoto = `${root}/artifacts/presentation-kit/05-demo-input/meal-curry.png`
      if (existsSync(curryPhoto))
        state.meals[0] = {
          ...state.meals[0],
          title: 'カレー',
          recipeId: 'curry',
          sample: 'curry',
          photo: `data:image/png;base64,${readFileSync(curryPhoto).toString('base64')}`,
        }
      await seed(page, state)
      await expect(page.locator('.play-world')).toBeVisible()
      for (const [id, label] of [
        ['plain', 'いつものひろば'],
        ['garden', '木もれびのひろば'],
        ['night', '星あかりのひろば'],
        ['seaside', '夕なぎの浜辺'],
        ['brook', '小川のほとり'],
        ['greenhouse', '温室のひろば'],
      ]) {
        if (id !== 'plain')
          await seed(page, { ...state, equipped: { ...state.equipped, room: id } })
        await shot(`10-plaza-${id}`, label, 'plaza')
      }
      await seed(page, {
        ...state,
        companions: state.companions.slice(0, 3),
        visitors: ['yuzu', 'momo'],
        equipped: { ...state.equipped, room: 'garden' },
      })
      await shot('11-plaza-visitors', 'ひろばに遊びに来たお客さん', 'plaza-visitors')
      await seed(page, {
        ...state,
        equipped: {
          hat: 'i-picnic-straw',
          neck: 'neck-bandana',
          bag: 'bag-satchel',
          room: 'garden',
        },
      })
      await shot('12-plaza-outfit', '帽子・バンダナ・かばんを着せたこむぎ', 'wardrobe')

      await page.locator('.play-growth').click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await shot('20-companion-profile', 'こむぎの成長と生態', 'profile')
      for (const [name, suffix] of [
        ['うまれたて', 'newborn'],
        ['ちびっこ', 'child'],
        ['わんぱく', 'young'],
      ]) {
        if (layout.id === 'wide' && suffix === 'child') continue
        await page
          .getByRole('dialog')
          .getByRole('button', { name: `${name}の姿を見る`, exact: true })
          .click()
        await shot(`21-growth-${suffix}`, `こむぎの${name}の姿`, 'profile-growth')
      }
      await page
        .getByRole('dialog')
        .getByRole('heading', { name: 'こむぎの性格', exact: true })
        .scrollIntoViewIfNeeded()
      await shot('22-companion-personality', '生態と性格の説明', 'profile-copy')
      await close()

      await navigate(page, 'ずかん')
      await expect(page.getByRole('heading', { name: 'ずかん', exact: true })).toBeVisible()
      await shot('30-recipe-collection', '料理カードのずかん', 'book-recipes')
      if (layout.id === 'mobile')
        await shot(
          '30-recipe-collection-full',
          '料理カードのずかん・ページ全体',
          'book-recipes',
          true,
        )
      await page.getByRole('searchbox', { name: '名前・材料で検索' }).fill('たまご')
      await shot('31-recipe-search', '材料でレシピを探す', 'book-search')
      await page.getByRole('searchbox', { name: '名前・材料で検索' }).fill('')
      await page.locator('.recipe-collection-card').first().click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await shot('32-recipe-detail', '料理の材料とレシピ', 'recipe-detail')
      if (layout.id === 'mobile') {
        await page
          .getByRole('dialog')
          .getByRole('heading', { name: 'つくりかた', exact: true })
          .scrollIntoViewIfNeeded()
        await shot('33-recipe-method', 'レシピのつくりかた', 'recipe-detail')
      }
      await close()
      await page.getByRole('button', { name: 'なかま', exact: true }).click()
      await shot('34-companion-collection', '6種類のなかまのずかん', 'book-companions')
      if (layout.id === 'mobile')
        await shot(
          '34-companion-collection-full',
          'なかまのずかん・ページ全体',
          'book-companions',
          true,
        )
      await page.getByRole('button', { name: 'ゆずの説明を見る', exact: true }).click()
      await shot('35-final-growth', 'ゆずのとっておきの姿', 'profile-final-growth')
      await close()

      for (const [category, id] of [
        ['ぼうし', 'hats'],
        ['くびもと', 'neck'],
        ['かばん', 'bags'],
        ['ひろば', 'rooms'],
      ]) {
        await shop(category)
        await shot(`40-shop-${id}`, `おみせ・${category}`, 'shop')
      }
      await page.locator('.shop-card').filter({ hasText: '星あかりのひろば' }).click()
      await shot('41-room-preview', 'ひろばのきせかえプレビュー', 'item-detail')
      await close()
      await shop('ぼうし')
      await page.locator('.shop-card').filter({ hasText: '三日月のとんがり帽' }).click()
      await shot('42-hat-preview', '帽子を試着する', 'item-detail')
      await close()

      await seed(page, state, '/album')
      await shot('50-meal-album', 'これまでのごはんの記録', 'album')
      await page.locator('.memory-card').first().click()
      await shot('51-meal-detail', 'ごはんの記録の詳細', 'album-detail')
      await close()
      await navigate(page, 'ひろば')
      await page.locator('.play-streak').click()
      await shot('60-streak', '連続記録とカレンダー', 'streak')
      await page
        .getByRole('dialog')
        .getByRole('button', { name: /おやすみチケット/ })
        .click()
      await shot('61-rest-ticket', 'おやすみチケット', 'rest')
      await close()
      await page.getByRole('button', { name: 'ごはんのお知らせ', exact: true }).click()
      await shot('62-meal-reminder', 'ごはんのお知らせ', 'reminder')
      await close()
      await page.getByRole('button', { name: '設定', exact: true }).click()
      await shot('63-settings', '設定', 'settings')
      await page.getByRole('button', { name: 'あそびかた', exact: true }).click()
      await shot('64-help', 'あそびかた', 'help')
      await close()
      await page.locator('.play-feed').click()
      await expect(page.locator('[data-scene="photo"]')).toBeVisible()
      await shot('70-photo-start', '料理写真を提出する入口', 'meal-photo')
      await page.getByRole('button', { name: '写真なしで体験する', exact: true }).click()
      await expect(page.locator('[data-scene="serve"]')).toBeVisible()
      await shot('71-meal-table', 'こむぎの食卓', 'meal-serve')
      await page.getByRole('button', { name: '料理を選ぶ', exact: true }).click()
      await expect(page.locator('[data-scene="recipe-pick"]')).toBeVisible()
      await shot('72-meal-picker', '料理の名前を選ぶ', 'meal-picker')
      if (existsSync(curryPhoto)) {
        await seed(page, state)
        let respond: (() => Promise<void>) | undefined
        await page.route('**/api/recognize-food', (route) => {
          respond = () => route.fulfill({ json: { candidates: ['curry'] } })
        })
        await page.locator('.play-feed').click()
        await page
          .getByLabel('料理の写真', { exact: true })
          .and(page.locator('input[type="file"]'))
          .setInputFiles(curryPhoto)
        await expect(page.locator('.meal-recognition-dots')).toBeVisible()
        await shot('73-photo-recognition', '料理写真を判定中', 'meal-recognition')
        await expect.poll(() => Boolean(respond)).toBe(true)
        await respond!()
        await page.getByRole('button', { name: '食卓へ', exact: true }).click()
        await expect(page.locator('[data-scene="serve"]')).toBeVisible()
        await expect(page.getByLabel('つくった料理', { exact: true })).toHaveText('カレー')
        await shot('74-photo-table', '写真からカレーの候補を選ぶ', 'meal-serve-photo')
      }
      expect(errors).toEqual([])
      expect(entries.length).toBeGreaterThan(35)
    })
    test('capture feeding rewards and collection details', async ({ page }) => {
      const shot = captureFor(page, layout)
      const state = presentationSave()
      state.xp = 270
      state.companions = [{ id: 'komugi', xp: 270, joinedDay: state.companions[0].joinedDay }]
      state.meals = state.meals.slice(0, 6)
      state.cards = []
      state.owned = ['none', 'neck-none', 'bag-none', 'plain']
      await seed(page, state)
      await page.locator('.play-feed').click()
      await page.getByRole('button', { name: '写真なしで体験する', exact: true }).click()
      await page.getByRole('button', { name: '料理を選ぶ', exact: true }).click()
      await page.getByRole('searchbox', { name: '名前・材料で検索' }).fill('カレー')
      await page.getByRole('button', { name: 'カレーを選ぶ', exact: true }).click()
      await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
      await expect(page.locator('[data-scene="eating"]')).toBeVisible()
      await shot('80-feast-eating', 'ごはんを食べるこむぎ', 'feast-eating')
      const labels: Record<string, string> = {
        xp: 'ごはんで経験値を獲得',
        growth: 'わんぱくの姿に成長',
        card: '新しい料理カードを獲得',
        arrivals: '新しいお客さんが来る',
        streak: '7日連続の自炊を達成',
        gift: '7日のおくりものを受け取る',
      }
      const eating = page.locator('[data-scene="eating"]')
      if (await eating.count())
        await eating.getByRole('button', { name: '早送り', exact: true }).click()
      for (let step = 0; step < 8; step += 1) {
        await waitForSceneMotion(page)
        const scene = await page
          .locator('main.journey-screen')
          .getAttribute('data-scene')
          .catch(() => null)
        if (!scene) break
        await shot(`81-reward-${scene}`, labels[scene] ?? scene, `feast-${scene}`)
        const next = page
          .locator('main.journey-screen')
          .getByRole('button', { name: /^(つづける|ひろばへ)$/ })
        await expect(next).toBeEnabled()
        await next.click()
        if (scene === 'gift') break
      }
      await seed(page, presentationSave(), '/book')
      await page
        .locator('.recipe-board')
        .evaluate((element) => element.scrollIntoView({ block: 'start' }))
      await shot('36-recipe-cards-focus', '料理カードが並ぶずかん', 'book-cards')
      await page.getByRole('button', { name: 'なかま', exact: true }).click()
      await page
        .locator('.friend-board')
        .evaluate((element) => element.scrollIntoView({ block: 'start' }))
      await shot('37-companions-focus', 'なかまのカード一覧', 'book-companions')
    })
  })
}
