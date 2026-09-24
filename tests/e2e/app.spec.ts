import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { GameState } from '../../src/game'

async function storedGame(page: Page): Promise<GameState> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('mogubiyori-v1')!))
}

async function navigate(page: Page, name: 'おへや' | '思い出' | 'おみせ') {
  await page
    .getByRole('navigation', { name: 'メインナビゲーション' })
    .getByRole('button', { name, exact: true })
    .click()
}

async function feedSample(page: Page) {
  await page.getByRole('button', { name: 'つくったごはんをあげる' }).click()
  await page.getByRole('button', { name: '写真なしで体験する' }).click()
  await page.getByRole('button', { name: 'こむぎにごはんをあげる' }).click()
  await expect(page.locator('.feast')).not.toHaveClass(/is-eating/)
}

async function returnToRoom(page: Page) {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /おへや/ })
    .click()
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

test('cooking feeds the companion, levels up and unlocks the seventh-day gift in one loop', async ({
  page,
}) => {
  await expect(page.locator('main .primary-button')).toHaveCount(1)
  await expect(page.locator('.streak-badge')).toHaveText('6日連続')
  await expect(page.getByRole('progressbar', { name: '満腹度' })).toHaveAttribute(
    'aria-valuenow',
    '28',
  )
  await feedSample(page)
  await expect(page.getByRole('dialog')).toContainText('7日つづいた！')
  await expect(page.getByRole('dialog')).toContainText('ふたばのかんむり')
  await returnToRoom(page)
  await expect(page.getByRole('button', { name: '今日のごはん、ありがとう' })).toBeVisible()
  await expect(page.locator('.pet-profile')).toContainText('Lv. 4')
  await expect(page.getByRole('progressbar', { name: '満腹度' })).toHaveAttribute(
    'aria-valuenow',
    '96',
  )
  await page.reload()
  await expect(page.locator('.streak-badge')).toHaveText('7日連続')
  const state = await storedGame(page)
  expect(state.meals).toHaveLength(7)
  expect(state.coins).toBe(150)
  expect(state.equipped.hat).toBe('sprout')
})

test('a photo alone becomes a persistent meal without requiring a dish name', async ({ page }) => {
  await page.getByRole('button', { name: 'つくったごはんをあげる' }).click()
  await uploadPhoto(page)
  await page.getByRole('button', { name: 'こむぎにごはんをあげる' }).click()
  await returnToRoom(page)
  await page.reload()
  await navigate(page, '思い出')
  await expect(page.locator('.memory-card')).toHaveCount(7)
  await page.locator('.memory-card').first().click()
  await expect(page.getByRole('dialog')).toContainText('今日のごはん')
  await expect(page.getByRole('dialog').getByRole('img')).toHaveAttribute(
    'src',
    /^data:image\/jpeg;base64,/,
  )
  const meal = (await storedGame(page)).meals[0]
  expect(meal.title).toBe('今日のごはん')
  expect(meal.photo).toMatch(/^data:image\/jpeg;base64,/)
})

test('a new day brings hunger back and missing a meal breaks the streak without losing growth', async ({
  page,
}) => {
  await page.getByRole('button', { name: '今日はおやすみ', exact: true }).click()
  await page.getByRole('button', { name: 'チケットを使って休む' }).click()
  await expect(page.getByRole('progressbar', { name: '満腹度' })).toHaveAttribute(
    'aria-valuenow',
    '28',
  )
  await nextDay(page)
  await expect(page.locator('.streak-badge')).toHaveText('6日連続')
  await expect(page.getByRole('progressbar', { name: '満腹度' })).toHaveAttribute(
    'aria-valuenow',
    '8',
  )
  await feedSample(page)
  await returnToRoom(page)
  await nextDay(page)
  await expect(page.getByRole('progressbar', { name: '満腹度' })).toHaveAttribute(
    'aria-valuenow',
    '28',
  )
  await expect(page.locator('.streak-badge')).toHaveText('7日連続')
  await expect(page.getByRole('button', { name: 'つくったごはんをあげる' })).toBeVisible()
  await nextDay(page)
  await expect(page.getByRole('progressbar', { name: '満腹度' })).toHaveAttribute(
    'aria-valuenow',
    '8',
  )
  await expect(page.locator('.streak-badge')).toHaveText('0日連続')
  await expect(page.locator('.pet-profile')).toContainText('Lv. 4')
  await expect(page.locator('.speech-bubble')).toContainText('おなかぺこぺこ')
  await feedSample(page)
  await returnToRoom(page)
  await expect(page.locator('.streak-badge')).toHaveText('1日連続')
})

test('earned coins buy a cosmetic and owned cosmetics can be equipped again for free', async ({
  page,
}) => {
  await navigate(page, 'おみせ')
  await page.getByRole('button', { name: /ふたばのかんむり/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: '手に入れて、おきがえ' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  let state = await storedGame(page)
  expect(state.coins).toBe(0)
  expect(state.equipped.hat).toBe('sprout')
  await navigate(page, 'おみせ')
  await page.getByRole('button', { name: /いつものこむぎ/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'これにおきがえ' }).click()
  await navigate(page, 'おみせ')
  await page.getByRole('button', { name: /ふたばのかんむり/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'これにおきがえ' }).click()
  await page.reload()
  state = await storedGame(page)
  expect(state.coins).toBe(0)
  expect(state.equipped.hat).toBe('sprout')
  await navigate(page, 'おみせ')
  await expect(page.locator('.shop-card.is-equipped')).toContainText('ふたばのかんむり')
})

test('trial gems enable cosmetic purchases and leave feeding as the source of growth', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'ジェム 60個' }).click()
  await expect(page.getByRole('dialog')).toContainText('請求はありません')
  await page.getByRole('dialog').getByRole('button', { name: '購入を体験する' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'ジェム 210個' })).toBeVisible()
  await navigate(page, 'おみせ')
  await page.getByRole('button', { name: /コックさんの帽子/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: '手に入れて、おきがえ' }).click()
  await navigate(page, 'おみせ')
  await page
    .getByRole('group', { name: 'おみせのカテゴリ' })
    .getByRole('button', { name: 'おへや', exact: true })
    .click()
  await page.getByRole('button', { name: /木もれびのおへや/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: '手に入れて、おきがえ' }).click()
  await navigate(page, 'おへや')
  await expect(page.locator('.room-scene')).toHaveClass(/room-garden/)
  await expect(page.getByRole('progressbar', { name: '満腹度' })).toHaveAttribute(
    'aria-valuenow',
    '28',
  )
  const state = await storedGame(page)
  expect(state.gems).toBe(30)
  expect(state.xp).toBe(260)
  expect(state.equipped).toEqual({ hat: 'chef', room: 'garden' })
})

test('reminder tone changes the companion message and persists after reopening', async ({
  page,
}) => {
  await page.getByRole('button', { name: '設定', exact: true }).click()
  await page.getByRole('button', { name: 'ひかえめ', exact: true }).click()
  await page.getByRole('button', { name: '閉じる', exact: true }).click()
  await expect(page.locator('.speech-bubble')).toContainText('きょうのごはん、なにかなぁ。')
  await page.getByRole('button', { name: '設定', exact: true }).click()
  await page.getByRole('button', { name: /ぐいぐい/ }).click()
  await page.getByRole('button', { name: '閉じる', exact: true }).click()
  await page.reload()
  await expect(page.locator('.speech-bubble')).toContainText('ねえねえ、ごはんまだ〜？')
  await page.getByRole('button', { name: 'こむぎからのおたより' }).click()
  await expect(page.getByRole('dialog')).toContainText('こむぎ')
  expect((await storedGame(page)).reminder).toBe('eager')
})

test('mobile room keeps feeding in view and navigation remains usable without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const action = page.getByRole('button', { name: 'つくったごはんをあげる' })
  const rect = await action.boundingBox()
  expect(rect!.y + rect!.height).toBeLessThan(760)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await action.click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(action).toBeFocused()
  await navigate(page, '思い出')
  await expect(page.locator('.memory-card')).toHaveCount(6)
  await navigate(page, 'おみせ')
  await expect(page.getByRole('heading', { name: 'よりみち商店。' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await navigate(page, 'おへや')
  await page.getByRole('button', { name: 'こむぎをなでる' }).click()
  await expect(page.locator('.speech-bubble')).toContainText('えへへ。きょうも会えたね。')
})

test('the game keeps earlier cooking-app records untouched in their own storage key', async ({
  page,
}) => {
  const oldData = JSON.stringify({
    version: 1,
    meals: [{ title: '以前の自炊記録' }],
    note: 'preserve me',
  })
  await page.evaluate((value) => localStorage.setItem('hitosaji-demo-v1', value), oldData)
  await page.reload()
  await feedSample(page)
  await returnToRoom(page)
  await page.reload()
  expect(await page.evaluate(() => localStorage.getItem('hitosaji-demo-v1'))).toBe(oldData)
  await expect(page.getByRole('button', { name: '今日のごはん、ありがとう' })).toBeVisible()
})

test('a meal submitted after midnight belongs to the new day even before the date timer runs', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-09-24T14:59:59Z'))
  await page.evaluate(() => localStorage.removeItem('mogubiyori-v1'))
  await page.reload()
  await expect(page.locator('.streak-badge')).toHaveText('6日連続')
  await page.getByRole('button', { name: 'つくったごはんをあげる' }).click()
  await page.getByRole('button', { name: '写真なしで体験する' }).click()

  // Changing Date without advancing timers leaves the open form on yesterday's state.
  await page.clock.setFixedTime(new Date('2026-09-24T15:00:01Z'))
  await page.getByRole('button', { name: 'こむぎにごはんをあげる' }).click()
  await expect(page.getByRole('dialog')).toContainText('1日つづいた！')
  await returnToRoom(page)

  const state = await storedGame(page)
  expect(state.today).toBe('2026-09-25')
  expect(state.meals[0].day).toBe('2026-09-25')
  expect(state.meals[0].xp).toBe(45)
  expect(state.meals.some((meal) => meal.day === '2026-09-24')).toBe(false)
  await expect(page.locator('.streak-badge')).toHaveText('1日連続')
  await expect(page.getByRole('button', { name: '今日のごはん、ありがとう' })).toBeVisible()
})
