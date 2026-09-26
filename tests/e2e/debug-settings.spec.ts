import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { shiftDay } from '../../shared/game/game'
import { start, storedGame } from './helpers'

const debugDialog = (page: Page) => page.getByRole('dialog', { name: 'デバッグ設定', exact: true })

async function openDebug(page: Page) {
  await page.keyboard.press('Control+Alt+d')
  await expect(debugDialog(page)).toBeVisible()
}

test.use({ reducedMotion: 'reduce' })

test('debug settings stay hidden until the brand gesture or keyboard shortcut', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await start(page)
  await page.getByRole('button', { name: '設定', exact: true }).click()
  const settings = page.getByRole('dialog', { name: '設定', exact: true })
  await expect(settings.getByText('おためし設定', { exact: true })).toHaveCount(0)
  await expect(settings.getByRole('button', { name: '翌日に進む', exact: true })).toHaveCount(0)
  await expect(
    settings.getByRole('button', { name: '成長・出会いを体験', exact: true }),
  ).toHaveCount(0)
  await expect(settings.getByRole('button', { name: '進捗をリセット', exact: true })).toHaveCount(0)
  await settings.getByRole('button', { name: '閉じる', exact: true }).click()
  await expect(settings).toHaveCount(0)
  const brand = page.getByRole('button', { name: 'もぐ日和 ひろば', exact: true })
  await brand.click()
  await expect(debugDialog(page)).toHaveCount(0)
  for (let tap = 0; tap < 6; tap += 1) await brand.click()
  await expect(debugDialog(page)).toBeVisible()
  await expect(debugDialog(page).getByText('この端末', { exact: true })).toBeVisible()
  await debugDialog(page).getByRole('button', { name: '閉じる', exact: true }).click()
  await expect(debugDialog(page)).toHaveCount(0)
  await openDebug(page)
  await expect(
    debugDialog(page).getByRole('button', { name: '保存データを読み直す' }),
  ).toBeVisible()
})

test('debug day changes persist through reload and report the saved game date', async ({
  page,
}) => {
  await page.goto('/')
  await start(page)
  const before = await storedGame(page)
  await openDebug(page)
  await debugDialog(page).getByRole('button', { name: '翌日に進む', exact: true }).click()
  await expect.poll(async () => (await storedGame(page)).dayOffset).toBe(1)
  await debugDialog(page).getByRole('button', { name: '7日進める', exact: true }).click()
  await expect.poll(async () => (await storedGame(page)).dayOffset).toBe(8)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'ひろば', exact: true })).toBeVisible()
  await openDebug(page)
  expect((await storedGame(page)).today).toBe(shiftDay(before.today, 8))
  await expect(debugDialog(page)).toContainText(shiftDay(before.today, 8))
})

test('debug growth changes persist for the selected companion', async ({ page }) => {
  await page.goto('/')
  await start(page)
  await openDebug(page)
  await debugDialog(page)
    .getByRole('combobox', { name: 'なかま', exact: true })
    .selectOption('komugi')
  await debugDialog(page).getByRole('combobox', { name: '成長段階', exact: true }).selectOption('4')
  await debugDialog(page).getByRole('button', { name: '成長段階を変更', exact: true }).click()
  await expect.poll(async () => (await storedGame(page)).companions[0].xp).toBe(1050)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'ひろば', exact: true })).toBeVisible()
  await openDebug(page)
  await expect(
    debugDialog(page).getByRole('combobox', { name: '成長段階', exact: true }),
  ).toHaveValue('4')
  expect((await storedGame(page)).xp).toBe(1050)
})

test('debug replacement requires confirmation and cancellation preserves the record', async ({
  page,
}) => {
  await page.goto('/')
  await start(page, 'まめ')
  const before = await storedGame(page)
  await openDebug(page)
  await debugDialog(page)
    .getByRole('button', { name: '体験用データに置き換える', exact: true })
    .click()
  await expect(
    debugDialog(page).getByRole('button', { name: '記録を消して置き換える', exact: true }),
  ).toBeVisible()
  expect(await storedGame(page)).toEqual(before)
  await debugDialog(page).getByRole('button', { name: 'やめる', exact: true }).click()
  expect(await storedGame(page)).toEqual(before)
  await expect(
    debugDialog(page).getByRole('button', { name: '記録を消して置き換える', exact: true }),
  ).toHaveCount(0)
  await debugDialog(page)
    .getByRole('button', { name: '体験用データに置き換える', exact: true })
    .click()
  await debugDialog(page)
    .getByRole('button', { name: '記録を消して置き換える', exact: true })
    .click()
  await expect.poll(async () => (await storedGame(page)).meals.length).toBe(6)
  await expect(
    debugDialog(page).getByRole('combobox', { name: 'なかま', exact: true }),
  ).toHaveValue('komugi')
  await debugDialog(page).getByRole('combobox', { name: '成長段階', exact: true }).selectOption('4')
  await debugDialog(page).getByRole('button', { name: '成長段階を変更', exact: true }).click()
  await expect
    .poll(
      async () => (await storedGame(page)).companions.find((entry) => entry.id === 'komugi')?.xp,
    )
    .toBe(1050)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'ひろば', exact: true })).toBeVisible()
  expect((await storedGame(page)).companions).toEqual([
    expect.objectContaining({ id: 'komugi', xp: 1050 }),
  ])
})
