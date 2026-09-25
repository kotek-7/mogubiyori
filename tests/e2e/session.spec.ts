import { expect, test } from '@playwright/test'
import { chooseStarter, start, storedGame } from './helpers'

test('resetting and choosing the same companion again awards the new game login bonus', async ({
  page,
}) => {
  await page.goto('/')
  await start(page)
  await page.getByRole('button', { name: '設定', exact: true }).click()
  const before = await storedGame(page)
  await page.getByRole('button', { name: '進捗をリセット', exact: true }).click()
  await page.getByRole('button', { name: 'やめる', exact: true }).click()
  await expect(page.getByRole('button', { name: '記録を消して始める', exact: true })).toHaveCount(0)
  expect(await storedGame(page)).toEqual(before)
  await page.getByRole('button', { name: '進捗をリセット', exact: true }).click()
  await page.getByRole('button', { name: '記録を消して始める', exact: true }).click()
  await start(page)
  const state = await storedGame(page)
  expect(state.activeId).toBe('komugi')
  expect(state.coins).toBe(140)
  expect(state.claimedLoginDays).toEqual([state.today])
})

test('a failed automatic login claim retries after a later successful command', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem
    let failedClaim = false
    Storage.prototype.setItem = function (key, value) {
      if (key === 'mogubiyori-v1' && !failedClaim && JSON.parse(value).claimedLoginDays.length) {
        failedClaim = true
        throw new DOMException('Storage temporarily unavailable', 'QuotaExceededError')
      }
      return original.call(this, key, value)
    }
  })
  await page.goto('/')
  await chooseStarter(page)
  await expect(page.getByRole('alert')).toContainText('保存できませんでした')
  expect((await storedGame(page)).coins).toBe(120)
  expect((await storedGame(page)).claimedLoginDays).toEqual([])
  await page.getByRole('button', { name: 'ひろばを見てみる' }).click()
  await expect(page.getByRole('button', { name: 'コイン 140枚、おみせへ' })).toBeVisible()
  const state = await storedGame(page)
  expect(state.claimedLoginDays).toEqual([state.today])
})
