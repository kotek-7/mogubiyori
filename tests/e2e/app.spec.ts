import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('cook, record privately, unlock the feed, and persist without exposing the private meal', async ({
  page,
}) => {
  const nav = page.getByRole('navigation', { name: 'メインナビゲーション', exact: true })
  await nav.getByRole('button', { name: 'みんなの食卓' }).click()
  await expect(
    page.getByRole('heading', { name: 'あなたの一皿で、 みんなの食卓がひらく。' }),
  ).toBeVisible()
  await nav.getByRole('button', { name: '今日のひとさじ' }).click()
  await page.getByRole('button', { name: 'これを作ってみる' }).click()
  const recipe = page.getByRole('dialog')
  await recipe.locator('.cooking-steps button').first().click()
  await expect(recipe.locator('.cooking-steps button').first()).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await recipe.getByRole('button', { name: 'できた！ 一皿を記録' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: 'この一皿を記録する' })).toBeDisabled()
  await dialog.getByRole('button', { name: 'サンプルの一皿を使う' }).click()
  await dialog.getByLabel('料理の名前').fill('わたしだけの一皿')
  await dialog.getByLabel('今日のひとこと').fill('できたことがうれしい。')
  await dialog.getByRole('button', { name: 'この一皿を記録する' }).click()
  await expect(page.getByRole('heading', { name: '今日もひとつ、つくれた！' })).toBeVisible()
  await expect(page.locator('.success-stat')).toContainText('7日')
  await page.getByRole('button', { name: 'みんなの食卓がひらきました' }).click()
  await expect(page.locator('.feed-card')).toHaveCount(3)
  await expect(page.getByRole('heading', { name: 'わたしだけの一皿' })).toHaveCount(0)
  await page.getByRole('button', { name: 'むぎの料理にいいね' }).click()
  await expect(page.getByRole('button', { name: 'むぎの料理にいいね' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.reload()
  await expect(page.getByRole('button', { name: 'むぎの料理にいいね' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await nav.getByRole('button', { name: '自炊アルバム' }).click()
  await page.getByRole('button', { name: /わたしだけの一皿/ }).click()
  await expect(page.getByRole('dialog')).toContainText('できたことがうれしい。')
  await expect(page.getByRole('dialog')).toContainText('自分だけの記録')
})

test('changes recommendation, calendar, feed and reward variants; exports observations', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'アイデアの実験室', exact: true }).click()
  const lab = page.getByRole('dialog')
  await lab.getByRole('button', { name: '3日分の提案', exact: true }).click()
  await lab.getByRole('button', { name: '週3日の目標', exact: true }).click()
  await lab.getByRole('button', { name: '繰り返しを減点', exact: true }).click()
  await lab.getByRole('button', { name: 'いつでも見る', exact: true }).click()
  await lab.getByLabel('触って気づいたこと').fill('週3日なら続きそう。')
  const downloadPromise = page.waitForEvent('download')
  await lab.getByRole('button', { name: '設定とメモを書き出す' }).click()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  const chunks = []
  for await (const chunk of stream!) chunks.push(chunk)
  const data = JSON.parse(Buffer.concat(chunks).toString())
  expect(data.notes).toBe('週3日なら続きそう。')
  expect(data.settings.habit).toBe('weekly')
  expect(data.meals.every((m: Record<string, unknown>) => !('photo' in m))).toBe(true)
  await lab.getByRole('button', { name: 'この設定で体験する' }).click()
  await expect(page.locator('.recommendations-section .recipe-card')).toHaveCount(3)
  await expect(page.locator('.streak-card')).toContainText('今週の目標、達成！')
  await page
    .getByRole('navigation', { name: 'メインナビゲーション', exact: true })
    .getByRole('button', { name: 'みんなの食卓' })
    .click()
  await expect(page.locator('.feed-card')).toHaveCount(3)
  await page.reload()
  await expect(page.locator('.feed-card')).toHaveCount(3)
})

test('protects the streak with a ticket, then resets the feed on the next day', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'おやすみチケット 残り2枚', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'チケットを1枚使う 残り2枚' }).click()
  await expect(page.getByRole('button', { name: 'おやすみチケット 残り1枚' })).toBeDisabled()
  await page.getByRole('button', { name: 'アイデアの実験室', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: '翌日へ進める' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'この設定で体験する' }).click()
  await expect(page.locator('.streak-number')).toHaveText('6日')
  await page.getByRole('button', { name: 'アイデアの実験室', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: '翌日へ進める' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'この設定で体験する' }).click()
  await expect(page.locator('.streak-number')).toHaveText('0日')
  await page
    .getByRole('navigation', { name: 'メインナビゲーション', exact: true })
    .getByRole('button', { name: 'みんなの食卓' })
    .click()
  await expect(page.locator('.feed-locked')).toBeVisible()
})

test('real file upload, rename, classification and anonymous visibility survive reload', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'もう作った？ 写真で、今日の一皿を記録' }).click()
  const dialog = page.getByRole('dialog')
  // A browser-generated PNG exercises actual decoding, compression and persistence.
  const fixture = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 60
    const context = canvas.getContext('2d')!
    context.fillStyle = '#dfc992'
    context.fillRect(0, 0, 100, 60)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await dialog.getByLabel('料理の写真').setInputFiles({
    name: 'meal.png',
    mimeType: 'image/png',
    buffer: Buffer.from(fixture, 'base64'),
  })
  await expect(dialog.getByAltText('記録する料理の写真')).toBeVisible()
  await dialog.getByLabel('料理の名前').fill('今日の野菜スープ')
  await dialog.getByLabel('料理のジャンル').selectOption('スープ')
  await dialog.getByRole('button', { name: '匿名でみんな', exact: true }).click()
  await dialog.getByRole('button', { name: 'この一皿を記録する' }).click()
  await page.getByRole('button', { name: 'みんなの食卓がひらきました' }).click()
  await expect(page.locator('.feed-card')).toHaveCount(4)
  await expect(page.getByText('となりの自炊さん（あなた）')).toBeVisible()
  await page.reload()
  await expect(page.getByAltText('今日の野菜スープ')).toHaveAttribute('src', /^data:image\/jpeg/)
})

test('filters available recipes and handles empty results', async ({ page }) => {
  await page
    .getByRole('navigation', { name: 'メインナビゲーション', exact: true })
    .getByRole('button', { name: '献立ノート', exact: true })
    .click()
  await page.getByRole('button', { name: 'さくっと 5分以内' }).click()
  await expect(page.locator('.recipe-card')).toHaveCount(2)
  await page.getByRole('button', { name: '買い足しなし', exact: true }).click()
  await expect(page.locator('.recipe-card')).toHaveCount(1)
  await page.getByRole('textbox', { name: '料理名・食材で検索' }).fill('見つからない料理')
  await expect(
    page.getByRole('heading', { name: 'いまの条件では見つかりませんでした。' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '条件を広げてみる' }).click()
  await expect(page.locator('.recipe-card')).toHaveCount(8)
})

test('mobile navigation and dialog are usable without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: '今日の、ひとさじ。' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page
    .getByRole('navigation', { name: 'モバイルナビゲーション', exact: true })
    .getByRole('button', { name: '残す' })
    .click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  await page.getByRole('button', { name: 'アイデアの実験室', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'はじめての自炊' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '記録を置き換えて開始' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'この設定で体験する' }).click()
  await page.getByRole('button', { name: 'メニューを閉じる' }).click()
  await page
    .getByRole('navigation', { name: 'モバイルナビゲーション', exact: true })
    .getByRole('button', { name: '記録', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: '最初の一皿を、ここに。' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})
