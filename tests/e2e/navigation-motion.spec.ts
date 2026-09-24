import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { claimLogin, demoGame, todayTokyo } from '../../src/app/game/browserGame'
import { expectFocusedScene, navigate, waitForSceneMotion } from './helpers'

const runtimeErrors = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  runtimeErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(
    (state) => localStorage.setItem('mogubiyori-v1', state),
    JSON.stringify(claimLogin(demoGame(todayTokyo()))),
  )
})

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page)).toEqual([])
})

async function expectRoute(
  page: Page,
  path: '/' | '/book' | '/album' | '/shop',
  heading: string,
  navigation: 'ひろば' | 'ずかん' | 'おみせ',
) {
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  await expect(page.getByRole('main')).toHaveCount(1)
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(heading)
  const nav = page.getByRole('navigation', { name: 'メインナビゲーション' })
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1)
  await expect(nav.getByRole('button', { name: navigation, exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
}

test('browser back and forward keep the page and active navigation consistent', async ({
  page,
}) => {
  await page.goto('/')
  await navigate(page, 'ずかん')
  await expectRoute(page, '/book', 'ずかん', 'ずかん')
  await page.getByRole('button', { name: 'ごはんの記録', exact: true }).click()
  await expectRoute(page, '/album', 'ごはんの記録', 'ずかん')
  await navigate(page, 'おみせ')
  await expectRoute(page, '/shop', 'おみせ', 'おみせ')

  await page.goBack()
  await expectRoute(page, '/album', 'ごはんの記録', 'ずかん')
  await page.goBack()
  await expectRoute(page, '/book', 'ずかん', 'ずかん')
  await page.goBack()
  await expectRoute(page, '/', 'ひろば', 'ひろば')
  await page.goForward()
  await expectRoute(page, '/book', 'ずかん', 'ずかん')
  await page.goForward()
  await expectRoute(page, '/album', 'ごはんの記録', 'ずかん')
  await page.goForward()
  await expectRoute(page, '/shop', 'おみせ', 'おみせ')
  await waitForSceneMotion(page)
  await expectRoute(page, '/shop', 'おみせ', 'おみせ')
})

test('rapid navigation settles on the last destination and remains usable', async ({ page }) => {
  await page.goto('/')
  await expectRoute(page, '/', 'ひろば', 'ひろば')
  // Dispatch across rendering frames while earlier navigation may still be animating.
  await page.getByRole('navigation', { name: 'メインナビゲーション' }).evaluate(async (nav) => {
    for (const name of ['ずかん', 'おみせ', 'ひろば', 'ずかん', 'ひろば', 'おみせ']) {
      const button = [...nav.querySelectorAll('button')].find(
        (entry) => entry.textContent?.trim() === name,
      )!
      button.click()
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
  })
  await expectRoute(page, '/shop', 'おみせ', 'おみせ')
  await waitForSceneMotion(page)
  await expectRoute(page, '/shop', 'おみせ', 'おみせ')
  await page.getByRole('button', { name: /ふたばのかんむり/ }).click()
  await expect(page.getByRole('dialog')).toContainText('ふたばのかんむり')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await navigate(page, 'ずかん')
  await expectRoute(page, '/book', 'ずかん', 'ずかん')
})

test('rapid category changes leave one current panel with usable controls', async ({ page }) => {
  await page.goto('/book')
  const book = page.getByRole('group', { name: 'ずかんのカテゴリ' })
  const bookPanelCounts = await book.evaluate(async (group) => {
    const counts: number[] = []
    for (const name of ['なかま', '料理カード', 'なかま', '料理カード', 'なかま']) {
      const button = [...group.querySelectorAll('button')].find(
        (entry) => entry.textContent?.trim() === name,
      )!
      button.click()
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      counts.push(document.querySelectorAll('.motion-category-panel').length)
    }
    return counts
  })
  expect(bookPanelCounts).toEqual([1, 1, 1, 1, 1])
  await expect(book.getByRole('button', { pressed: true })).toHaveText('なかま')
  await expect(page.locator('.motion-category-panel')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'なかま', exact: true })).toBeVisible()
  await expect(page.locator('.recipe-collection-card')).toHaveCount(0)
  await page.getByRole('button', { name: 'こむぎと暮らす', exact: true }).click()
  await expectRoute(page, '/', 'ひろば', 'ひろば')

  await navigate(page, 'おみせ')
  const shop = page.getByRole('group', { name: 'おみせのカテゴリ' })
  const shopPanelCounts = await shop.evaluate(async (group) => {
    const counts: number[] = []
    for (const name of ['ひろば', 'ぼうし', 'ひろば', 'ぼうし', 'ひろば']) {
      const button = [...group.querySelectorAll('button')].find(
        (entry) => entry.textContent?.trim() === name,
      )!
      button.click()
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      counts.push(document.querySelectorAll('.motion-category-panel').length)
    }
    return counts
  })
  expect(shopPanelCounts).toEqual([1, 1, 1, 1, 1])
  await expect(shop.getByRole('button', { pressed: true })).toHaveText('ひろば')
  await expect(page.locator('.motion-category-panel')).toHaveCount(1)
  await expect(page.getByRole('button', { name: /ふたばのかんむり/ })).toHaveCount(0)
  await page.getByRole('button', { name: /木もれびのひろば/ }).click()
  await expect(page.getByRole('dialog')).toContainText('木もれびのひろば')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('cancelling a meal opened from the book returns to the plaza and its action', async ({
  page,
}) => {
  await page.goto('/book')
  await page.locator('.recipe-collection-card').first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'この料理を記録する', exact: true }).click()
  await expectFocusedScene(page, 'photo')
  await page.getByRole('button', { name: 'ひろばへ', exact: true }).click()
  await expectRoute(page, '/', 'ひろば', 'ひろば')
  await expect(page.locator('.play-feed')).toBeFocused()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

for (const fallback of ['reduced motion', 'View Transition API unavailable'] as const) {
  test(`${fallback} preserves navigation, categories and history`, async ({ page }) => {
    if (fallback === 'reduced motion') {
      await page.emulateMedia({ reducedMotion: 'reduce' })
    } else {
      await page.addInitScript(() => {
        Object.defineProperty(document, 'startViewTransition', {
          configurable: true,
          value: undefined,
        })
      })
    }
    await page.goto('/')
    await navigate(page, 'ずかん')
    await expectRoute(page, '/book', 'ずかん', 'ずかん')
    const book = page.getByRole('group', { name: 'ずかんのカテゴリ' })
    await book.getByRole('button', { name: 'なかま', exact: true }).click()
    await expect(page.locator('.motion-category-panel')).toHaveCount(1)
    await expect(page.getByRole('heading', { name: 'なかま', exact: true })).toBeVisible()
    await navigate(page, 'おみせ')
    await expectRoute(page, '/shop', 'おみせ', 'おみせ')
    await page
      .getByRole('group', { name: 'おみせのカテゴリ' })
      .getByRole('button', { name: 'ひろば', exact: true })
      .click()
    await expect(page.getByRole('button', { name: /木もれびのひろば/ })).toBeVisible()
    await page.goBack()
    await expectRoute(page, '/book', 'ずかん', 'ずかん')
    await expect(book.getByRole('button', { pressed: true })).toHaveText('なかま')
    await page.goForward()
    await expectRoute(page, '/shop', 'おみせ', 'おみせ')
    await expect(
      page.getByRole('group', { name: 'おみせのカテゴリ' }).getByRole('button', { pressed: true }),
    ).toHaveText('ひろば')
    await page.getByRole('button', { name: /木もれびのひろば/ }).click()
    await expect(page.getByRole('dialog')).toContainText('木もれびのひろば')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
}
