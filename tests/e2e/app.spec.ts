import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { Buffer } from 'node:buffer'
import { recipes } from '../../src/game'
import type { GameState } from '../../src/game'

async function storedGame(page: Page): Promise<GameState> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('mogubiyori-v1')!))
}

async function start(page: Page, name = 'こむぎ') {
  await page.getByRole('button', { name: `${name}を選ぶ`, exact: true }).click()
  await page.getByRole('button', { name: 'この子とはじめる' }).click()
  await expect(page.getByRole('heading', { name: 'ごはんのひろば' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'コイン 140枚、おみせへ' })).toBeVisible()
}

async function navigate(page: Page, name: 'ひろば' | 'ずかん' | 'おみせ') {
  await page
    .getByRole('navigation', { name: 'メインナビゲーション' })
    .getByRole('button', { name, exact: true })
    .click()
}

async function submitSample(page: Page, recipeId = '', name = 'こむぎ') {
  await page.getByRole('button', { name: '写真なしで体験する' }).click()
  await page.getByRole('combobox', { name: 'つくった料理', exact: true }).selectOption(recipeId)
  await page.getByRole('button', { name: `${name}にごはんをあげる`, exact: true }).click()
  await expect(page.locator('.feast')).not.toHaveClass(/is-eating/)
}

async function feedSample(page: Page, recipeId = '') {
  await page.locator('.play-feed').click()
  await submitSample(page, recipeId)
}

async function returnToPlaza(page: Page) {
  await page.locator('.feast > .primary-button').click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}

async function nextDay(page: Page) {
  await page.getByRole('button', { name: '設定', exact: true }).click()
  await page.getByText('おためし設定', { exact: true }).click()
  await page.getByRole('button', { name: '翌日に進む' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
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
  await expect(page.getByRole('dialog').locator('.photo-picker img')).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('each of the three starters can be chosen and the choice survives reload', async ({
  page,
}) => {
  for (const [id, name] of [
    ['komugi', 'こむぎ'],
    ['mame', 'まめ'],
    ['shizuku', 'しずく'],
  ]) {
    await expect(page.getByRole('group', { name: '最初のなかま' }).getByRole('button')).toHaveCount(
      3,
    )
    await start(page, name)
    await page.reload()
    await expect(page.locator('.play-name')).toContainText(name)
    const state = await storedGame(page)
    expect(state.activeId).toBe(id)
    expect(state.companions).toHaveLength(1)
    expect(state.xp).toBe(0)
    expect(state.coins).toBe(140)
    expect(state.meals).toEqual([])
    await page.evaluate(() => localStorage.removeItem('mogubiyori-v1'))
    await page.reload()
  }
})

test('varied meals grow the companion and visitors join only after being fed', async ({ page }) => {
  await start(page)
  await feedSample(page, 'egg-rice')
  await expect(page.getByRole('dialog')).toContainText('すくすく成長！')
  await returnToPlaza(page)
  await expect(page.locator('.play-name')).toContainText('すくすく')
  await feedSample(page, 'tofu-soup')
  await returnToPlaza(page)
  await feedSample(page, 'curry')
  await expect(page.getByRole('dialog')).toContainText('おとなに成長！')
  await expect(page.locator('.visitor-arrival')).toBeVisible()
  await returnToPlaza(page)
  expect((await storedGame(page)).companions).toHaveLength(1)
  await expect(page.locator('.play-guests button')).toHaveCount(3)
  await page.getByRole('button', { name: 'お客さんのまめにごはんをあげる' }).click()
  expect((await storedGame(page)).companions).toHaveLength(1)
  await submitSample(page, 'fried-rice', 'まめ')
  await expect(page.getByRole('dialog')).toContainText('なかまになった！')
  await returnToPlaza(page)
  await expect(page.locator('.play-name')).toContainText('まめ')
  const state = await storedGame(page)
  expect(state.companions.map((buddy) => [buddy.id, buddy.xp])).toEqual([
    ['komugi', 135],
    ['mame', 45],
  ])
  expect(state.visitors).not.toContain('mame')
  expect(state.visitors).toHaveLength(3)
  await navigate(page, 'ずかん')
  await page
    .getByRole('group', { name: 'ずかんのカテゴリ' })
    .getByRole('button', { name: 'なかま', exact: true })
    .click()
  await expect(page.locator('.friend-card')).toHaveCount(2)
  await page.getByRole('button', { name: 'こむぎと暮らす' }).click()
  await expect(page.locator('.play-name')).toContainText('こむぎ')
  expect((await storedGame(page)).xp).toBe(135)
})

test('repeated recipes reduce growth while their card bonus is awarded once', async ({ page }) => {
  await start(page)
  for (const xp of [45, 30, 15]) {
    await page.locator('.play-feed').click()
    await page.getByRole('combobox', { name: 'つくった料理', exact: true }).selectOption('curry')
    if (xp < 45) await expect(page.locator('.repeat-hint')).toContainText(`+${xp} XP`)
    await submitSample(page, 'curry')
    await expect(page.locator('.feast-rewards')).toContainText(`+${xp} XP`)
    await returnToPlaza(page)
  }
  const state = await storedGame(page)
  expect(state.xp).toBe(90)
  expect(state.coins).toBe(240)
  expect(state.cards).toEqual(['curry'])
  expect(state.meals.map((meal) => meal.cardBonus)).toEqual([0, 0, 70])
  await navigate(page, 'ずかん')
  await expect(page.locator('.recipe-collection-card.is-discovered')).toHaveCount(1)
  await expect(
    page.getByRole('button', { name: 'カレーのレシピを見る', exact: true }),
  ).toBeVisible()
})

test('an undiscovered recipe can guide cooking and becomes a collected card afterward', async ({
  page,
}) => {
  await start(page)
  await navigate(page, 'ずかん')
  const index = recipes.findIndex((recipe) => recipe.id === 'curry')
  const curry = page.locator('.recipe-collection-card').nth(index)
  await expect(curry).toHaveClass(/is-unknown/)
  await curry.click()
  await expect(page.getByRole('dialog')).toContainText('材料')
  await expect(page.getByRole('dialog')).toContainText('つくりかた')
  await page.getByRole('button', { name: 'これをつくってあげる' }).click()
  await expect(page.getByRole('combobox', { name: 'つくった料理', exact: true })).toHaveValue(
    'curry',
  )
  await submitSample(page, 'curry')
  await expect(page.locator('.new-recipe-card')).toContainText('カレー')
  await returnToPlaza(page)
  await navigate(page, 'ずかん')
  await expect(page.getByRole('button', { name: 'カレーのレシピを見る', exact: true })).toHaveClass(
    /is-discovered/,
  )
})

test('daily login and three/seven-day cooking bonuses cannot be claimed twice', async ({
  page,
}) => {
  test.setTimeout(60000)
  await start(page)
  await page.reload()
  expect((await storedGame(page)).coins).toBe(140)
  for (let day = 1; day <= 7; day += 1) {
    await feedSample(page)
    if (day === 3) await expect(page.locator('.bonus-note')).toContainText('+30 コイン')
    if (day === 7) await expect(page.locator('.bonus-note')).toContainText('+100 コイン')
    await returnToPlaza(page)
    if (day < 7) await nextDay(page)
  }
  let state = await storedGame(page)
  expect(state.claimedLoginDays).toHaveLength(7)
  expect(new Set(state.claimedLoginDays).size).toBe(7)
  expect(state.coins).toBe(600)
  expect(state.equipped.hat).toBe('sprout')
  expect(state.meals.filter((meal) => meal.streakBonus)).toHaveLength(2)
  await page.reload()
  expect((await storedGame(page)).coins).toBe(600)
  await feedSample(page)
  await returnToPlaza(page)
  state = await storedGame(page)
  expect(state.coins).toBe(600)
  expect(state.meals[0].streakBonus).toBe(0)
  await expect(page.locator('.play-streak')).toContainText('7日連続')
})

test('a real photo alone persists in the meal album without a required recipe or title', async ({
  page,
}) => {
  await start(page)
  await page.locator('.play-feed').click()
  await uploadPhoto(page)
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await returnToPlaza(page)
  await page.reload()
  await navigate(page, 'ずかん')
  await page.getByRole('button', { name: 'ごはんの思い出' }).click()
  await expect(page.locator('.memory-card')).toHaveCount(1)
  await page.locator('.memory-card').click()
  await expect(page.getByRole('dialog')).toContainText('今日のごはん')
  await expect(page.getByRole('dialog').getByRole('img')).toHaveAttribute(
    'src',
    /^data:image\/jpeg;base64,/,
  )
  const state = await storedGame(page)
  expect(state.meals[0].title).toBe('今日のごはん')
  expect(state.meals[0].photo).toMatch(/^data:image\/jpeg;base64,/)
  expect(state.cards).toEqual([])
})

test('cosmetics use earned coins or trial gems without granting growth or meals', async ({
  page,
}) => {
  await start(page)
  await navigate(page, 'おみせ')
  await page.getByRole('button', { name: /ふたばのかんむり/ }).click()
  await page.getByRole('button', { name: '手に入れて、おきがえ' }).click()
  expect((await storedGame(page)).coins).toBe(20)
  await navigate(page, 'おみせ')
  await page.locator('.shop-card').first().click()
  await page.getByRole('button', { name: 'これにおきがえ' }).click()
  await navigate(page, 'おみせ')
  await page.getByRole('button', { name: /ふたばのかんむり/ }).click()
  await page.getByRole('button', { name: 'これにおきがえ' }).click()
  await page.getByRole('button', { name: 'ジェム 60個' }).click()
  await expect(page.getByRole('dialog')).toContainText('請求はありません')
  await page.getByRole('button', { name: '購入を体験する' }).click()
  await navigate(page, 'おみせ')
  await page.getByRole('button', { name: /コックさんの帽子/ }).click()
  await page.getByRole('button', { name: '手に入れて、おきがえ' }).click()
  await navigate(page, 'おみせ')
  await page.getByRole('button', { name: 'もようがえ', exact: true }).click()
  await page.getByRole('button', { name: /木もれびのひろば/ }).click()
  await page.getByRole('button', { name: '手に入れて、おきがえ' }).click()
  await expect(page.locator('.play-world')).toHaveClass(/theme-garden/)
  const state = await storedGame(page)
  expect(state.coins).toBe(20)
  expect(state.gems).toBe(30)
  expect(state.equipped).toEqual({ hat: 'chef', room: 'garden' })
  expect(state.xp).toBe(0)
  expect(state.meals).toEqual([])
})

test('mobile keeps the main feeding action in view and restores focus after Escape', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await start(page)
  const action = page.locator('.play-feed')
  await expect(page.locator('main .primary-button')).toHaveCount(1)
  const rect = await action.boundingBox()
  expect(rect!.y + rect!.height).toBeLessThan(764)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await action.click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(action).toBeFocused()
  for (const route of ['ずかん', 'おみせ', 'ひろば'] as const) {
    await navigate(page, route)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.getByRole('button', { name: 'こむぎをなでる' }).click()
  await expect(page.locator('.play-speech')).toContainText('えへへ。いっしょがいいね。')
})

test('submitting across midnight uses the new date before the timer refreshes', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-09-24T14:59:59Z'))
  await page.evaluate(() => localStorage.removeItem('mogubiyori-v1'))
  await page.reload()
  await start(page)
  await page.locator('.play-feed').click()
  await page.getByRole('button', { name: '写真なしで体験する' }).click()
  await page.clock.setFixedTime(new Date('2026-09-24T15:00:01Z'))
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await returnToPlaza(page)
  const state = await storedGame(page)
  expect(state.today).toBe('2026-09-25')
  expect(state.meals[0].day).toBe('2026-09-25')
  expect(state.meals.some((meal) => meal.day === '2026-09-24')).toBe(false)
  expect(state.claimedLoginDays).toEqual(['2026-09-24', '2026-09-25'])
  await expect(page.locator('.play-streak')).toContainText('1日連続')
})
