import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

async function openLab(page: Page) {
  await page.getByRole('button', { name: '設定', exact: true }).click()
  await page.getByRole('button', { name: 'アイデアの実験室', exact: true }).click()
}
async function uploadPhoto(page: Page) {
  const fixture = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 60
    const context = canvas.getContext('2d')!
    context.fillStyle = '#dfc992'
    context.fillRect(0, 0, 100, 60)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await page.getByLabel('料理の写真').setInputFiles({
    name: 'meal.png',
    mimeType: 'image/png',
    buffer: Buffer.from(fixture, 'base64'),
  })
  await expect(page.getByAltText('記録する料理の写真')).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('one primary action leads from today through photo and celebration back to completed today', async ({
  page,
}) => {
  await expect(page.locator('main .primary')).toHaveCount(1)
  await expect(page.locator('main .recipe-card')).toHaveCount(0)
  expect((await page.locator('main').innerText()).length).toBeLessThan(130)
  await page.getByRole('button', { name: '今日の一皿を残す' }).click()
  await expect(page.getByRole('dialog').locator('.primary')).toHaveCount(1)
  await expect(page.getByRole('button', { name: '写真を選ぶ', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '写真なしで試す' }).click()
  await expect(page.getByLabel('料理の名前', { exact: true })).not.toBeVisible()
  await page.getByRole('button', { name: 'この一皿を記録する' }).click()
  await expect(page.getByRole('heading', { name: '今日も、つづいた！' })).toBeVisible()
  await expect(page.locator('.success-count')).toHaveText('7日連続')
  await expect(page.getByRole('dialog').locator('.primary')).toHaveCount(1)
  await page.getByRole('button', { name: 'つづける', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.daily-ritual')).toHaveClass(/is-complete/)
  await expect(page.getByRole('button', { name: '今日の記録を見る' })).toBeVisible()
  await page.reload()
  await expect(page.locator('.ritual-count')).toHaveText('7日連続')
})

test('a real photo alone is sufficient and is saved without inventing a dish or classification', async ({
  page,
}) => {
  await page.getByRole('button', { name: '今日の一皿を残す' }).click()
  await uploadPhoto(page)
  await page.getByRole('button', { name: 'この一皿を記録する' }).click()
  await page.getByRole('button', { name: 'つづける', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: '今日の記録を見る' }).click()
  await expect(page.getByRole('dialog')).toContainText('未分類')
  await expect(page.getByRole('dialog').getByAltText('今日の一皿')).toHaveAttribute(
    'src',
    /^data:image\/jpeg/,
  )
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('hitosaji-demo-v1')!).meals.at(-1),
  )
  expect(stored.recipeId).toBe('')
  expect(stored.title).toBe('今日の一皿')
  expect(stored.category).toBe('未分類')
  expect(stored.visibility).toBe('private')
})

test('optional details preserve privacy while private records still unlock the feed', async ({
  page,
}) => {
  await page.getByRole('button', { name: '今日の一皿を残す' }).click()
  await page.getByRole('button', { name: '写真なしで試す' }).click()
  await page.getByText('メモ・公開範囲', { exact: true }).click()
  await page.getByLabel('料理の名前', { exact: true }).fill('わたしだけの一皿')
  await page.getByLabel('今日のひとこと').fill('できたことがうれしい。')
  await page.getByRole('button', { name: 'この一皿を記録する' }).click()
  await page.getByRole('button', { name: 'つづける', exact: true }).click()
  await page.getByRole('navigation').getByRole('button', { name: '食卓', exact: true }).click()
  await expect(page.locator('.feed-card')).toHaveCount(3)
  await expect(page.getByRole('heading', { name: 'わたしだけの一皿' })).toHaveCount(0)
  await page.getByRole('button', { name: 'むぎの料理にいいね' }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'むぎの料理にいいね' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('navigation').getByRole('button', { name: '記録', exact: true }).click()
  await page.getByRole('button', { name: /わたしだけの一皿/ }).click()
  await expect(page.getByRole('dialog')).toContainText('できたことがうれしい。')
})

test('optional anonymous sharing adds the meal to the local feed', async ({ page }) => {
  await page.getByRole('button', { name: '今日の一皿を残す' }).click()
  await uploadPhoto(page)
  await page.getByText('メモ・公開範囲', { exact: true }).click()
  await page.getByLabel('料理の名前', { exact: true }).fill('今日の野菜スープ')
  await page.getByLabel('料理のジャンル').selectOption('スープ')
  await page.getByRole('button', { name: '匿名でみんな', exact: true }).click()
  await page.getByRole('button', { name: 'この一皿を記録する' }).click()
  await page.getByRole('button', { name: 'つづける', exact: true }).click()
  await page.getByRole('navigation').getByRole('button', { name: '食卓', exact: true }).click()
  await expect(page.locator('.feed-card')).toHaveCount(4)
  await expect(page.getByText('となりの自炊さん（あなた）')).toBeVisible()
})

test('variants and observations are kept behind settings and exported', async ({ page }) => {
  await openLab(page)
  const lab = page.getByRole('dialog')
  await lab.getByRole('button', { name: '3日分の提案', exact: true }).click()
  await lab.getByRole('button', { name: '週3日の目標', exact: true }).click()
  await lab.getByRole('button', { name: 'いつでも見る', exact: true }).click()
  await lab.getByLabel('触って気づいたこと').fill('週3日なら続きそう。')
  const downloadPromise = page.waitForEvent('download')
  await lab.getByRole('button', { name: '設定とメモを書き出す' }).click()
  const stream = await (await downloadPromise).createReadStream()
  const chunks = []
  for await (const chunk of stream!) chunks.push(chunk)
  const data = JSON.parse(Buffer.concat(chunks).toString())
  expect(data.notes).toBe('週3日なら続きそう。')
  expect(data.settings.habit).toBe('weekly')
  expect(data.meals.every((m: Record<string, unknown>) => !('photo' in m))).toBe(true)
  await lab.getByRole('button', { name: 'この設定で体験する' }).click()
  await expect(page.locator('.ritual-count')).toHaveText('3/ 3日')
  await page.getByRole('button', { name: '献立に迷ったら' }).click()
  await expect(page.locator('.recipe-card')).toHaveCount(3)
  await page.getByRole('navigation').getByRole('button', { name: '食卓', exact: true }).click()
  await expect(page.locator('.feed-card')).toHaveCount(3)
})

test('a rest preserves the streak but an unprotected day breaks it', async ({ page }) => {
  await page.getByRole('button', { name: 'おやすみチケット 残り2枚' }).click()
  await page.getByRole('button', { name: 'チケットを使って休む' }).click()
  await expect(page.locator('.ritual-message')).toHaveText('今日は、おやすみ。')
  await openLab(page)
  await page.getByRole('button', { name: '翌日へ進める' }).click()
  await page.getByRole('button', { name: 'この設定で体験する' }).click()
  await expect(page.locator('.ritual-count')).toHaveText('6日連続')
  await openLab(page)
  await page.getByRole('button', { name: '翌日へ進める' }).click()
  await page.getByRole('button', { name: 'この設定で体験する' }).click()
  await expect(page.locator('.ritual-count')).toHaveText('1日目へ')
  await page.getByRole('navigation').getByRole('button', { name: '食卓', exact: true }).click()
  await expect(page.locator('.feed-locked')).toBeVisible()
})

test('optional recipe assistance still filters, guides cooking and leads into recording', async ({
  page,
}) => {
  await page.getByRole('button', { name: '献立に迷ったら' }).click()
  await page.getByRole('button', { name: 'さくっと 5分以内' }).click()
  await expect(page.locator('.recipe-card')).toHaveCount(1)
  await page.getByRole('textbox', { name: '料理名・食材で検索' }).fill('見つからない料理')
  await expect(page.locator('.empty-state')).toBeVisible()
  await page.getByRole('button', { name: '条件を広げてみる' }).click()
  await page.locator('.recipe-card').first().click()
  await page.getByRole('dialog').locator('.cooking-steps button').first().click()
  await expect(page.getByRole('dialog').locator('.cooking-steps button').first()).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'できた！ 一皿を記録' }).click()
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-label', '今日の一皿')
})

test('the main action fits on mobile and a new user can start from an empty album', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const action = page.getByRole('button', { name: '今日の一皿を残す' })
  const rect = await action.boundingBox()
  expect(rect!.y + rect!.height).toBeLessThan(740)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await action.click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await openLab(page)
  await page.getByRole('button', { name: 'はじめての自炊' }).click()
  await page.getByRole('button', { name: '記録を置き換えて開始' }).click()
  await page.getByRole('button', { name: 'この設定で体験する' }).click()
  await expect(page.locator('.ritual-count')).toHaveText('1日目へ')
  await page.getByRole('navigation').getByRole('button', { name: '記録', exact: true }).click()
  await expect(page.getByRole('heading', { name: '最初の一皿を、ここに。' })).toBeVisible()
})
