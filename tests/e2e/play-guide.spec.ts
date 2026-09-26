import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { chooseStarter, claimLogin, feed, initialGame } from '../../src/app/game/browserGame'
import type { GameState } from '../../src/app/game/browserGame'
import { journey, returnToPlaza, sampleToTable, storedGame, waitForSceneMotion } from './helpers'

type GuidePhase = NonNullable<GameState['tutorial']['homeGuide']>

function starter(homeGuide?: GuidePhase): GameState {
  const state = claimLogin(chooseStarter(initialGame('2026-09-24'), 'komugi'))
  return {
    ...state,
    tutorial: {
      version: 1,
      step: 4,
      status: 'completed',
      ...(homeGuide ? { homeGuide } : {}),
    },
  }
}

async function seedGame(page: Page, state: GameState) {
  await page.goto('/')
  await page.evaluate(
    (value) => localStorage.setItem('mogubiyori-v1', value),
    JSON.stringify(state),
  )
  await page.reload()
  await expect(page.locator('.play-feed')).toBeVisible()
}

const homeGuide = (page: Page) => page.getByRole('region', { name: 'ひろばのガイド', exact: true })

const bookButton = (page: Page) =>
  page
    .getByRole('navigation', { name: 'メインナビゲーション' })
    .getByRole('button', { name: 'ずかん', exact: true })

const shopButton = (page: Page) =>
  page
    .getByRole('navigation', { name: 'メインナビゲーション' })
    .getByRole('button', { name: 'おみせ', exact: true })

const shopGuide = (page: Page) => page.getByRole('region', { name: 'おみせのガイド', exact: true })

async function expectHomeGuide(page: Page, phase: Exclude<GuidePhase, 'done'>) {
  const target =
    phase === 'meal'
      ? page.locator('.play-feed')
      : phase === 'growth'
        ? page.locator('.play-growth')
        : phase === 'book'
          ? bookButton(page)
          : shopButton(page)
  await expect(page.locator('.play-app')).toHaveAttribute('data-home-guide', phase)
  await expect(homeGuide(page)).toHaveCount(1)
  await expect(homeGuide(page)).toHaveAttribute('id', `home-${phase}-guide`)
  await expect(target).toHaveClass(/is-guide-target/)
  await expect(target).toHaveAttribute('aria-describedby', `home-${phase}-guide-text`)
  await expect(page.locator('.is-guide-target')).toHaveCount(1)
  await expect.poll(async () => (await storedGame(page)).tutorial.homeGuide).toBe(phase)
  return target
}

async function expectShopGuide(page: Page, scene: 'item' | 'purchase') {
  const target =
    scene === 'item'
      ? page.locator('.shop-card.is-guide-target')
      : page.getByRole('dialog').getByRole('button', { name: '購入して使う', exact: true })
  await expect(page.locator('.play-app')).toHaveAttribute('data-home-guide', 'shop')
  await expect(homeGuide(page)).toHaveCount(0)
  await expect(shopGuide(page)).toHaveCount(1)
  await expect(shopGuide(page)).toHaveAttribute('id', `shop-${scene}-guide`)
  await expect(target).toHaveClass(/is-guide-target/)
  await expect(target).toHaveAttribute('aria-describedby', `shop-${scene}-guide-text`)
  await expect(page.locator('.is-guide-target')).toHaveCount(1)
  await expect.poll(async () => (await storedGame(page)).tutorial.homeGuide).toBe('shop')
  return scene === 'item'
    ? page.getByRole('button', {
        name: new RegExp(await target.locator(':scope > strong').innerText()),
      })
    : target
}

async function expectNoGuide(page: Page) {
  await expect(homeGuide(page)).toHaveCount(0)
  await expect(shopGuide(page)).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'ごはんの記録ガイド', exact: true })).toHaveCount(0)
  await expect(page.locator('.is-guide-target')).toHaveCount(0)
}

async function expectInsideViewport(page: Page, element: Locator) {
  await expect(element).toBeVisible()
  const box = await element.boundingBox()
  const viewport = page.viewportSize()!
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-24T03:00:00Z'))
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('the meal, growth, recipe and shopping guide resumes and completes with a purchase', async ({
  page,
}) => {
  await seedGame(page, starter('meal'))
  await expectHomeGuide(page, 'meal')
  await page.reload()
  const feedButton = await expectHomeGuide(page, 'meal')
  await feedButton.click()
  await expect(journey(page, 'photo')).toBeVisible()
  await expect(page.locator('#meal-photo-guide')).toBeVisible()
  await expect(journey(page, 'photo').locator('.journey-primary')).toHaveAttribute(
    'aria-describedby',
    'meal-photo-guide-text',
  )

  // Leaving the photo screen must not count as completing the real meal.
  await journey(page, 'photo').getByRole('button', { name: 'ひろばへ', exact: true }).click()
  await expect(journey(page)).toHaveCount(0)
  await expectHomeGuide(page, 'meal')
  await page.locator('.play-feed').click()
  await sampleToTable(page, 'curry')
  await expect(page.locator('#meal-serve-guide')).toBeVisible()
  await expect(journey(page, 'serve').locator('.journey-primary')).toHaveAttribute(
    'aria-describedby',
    'meal-serve-guide-text',
  )
  await journey(page, 'serve').getByRole('button', { name: 'こむぎにごはんをあげる' }).click()
  await returnToPlaza(page)
  await expectHomeGuide(page, 'growth')

  await page.reload()
  const growthButton = await expectHomeGuide(page, 'growth')
  await growthButton.click()
  await expect(page.getByRole('dialog').locator('.profile-sheet')).toBeVisible()
  await expect(homeGuide(page)).toHaveCount(0)
  await expect.poll(async () => (await storedGame(page)).tutorial.homeGuide).toBe('book')
  await page.getByRole('button', { name: '閉じる', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expectHomeGuide(page, 'book')

  await page.reload()
  const target = await expectHomeGuide(page, 'book')
  await page.getByRole('navigation').getByRole('button', { name: 'おみせ', exact: true }).click()
  await expect(homeGuide(page)).toHaveCount(0)
  await expect(page.locator('.play-nav')).toHaveCSS('position', 'fixed')
  await page.getByRole('navigation').getByRole('button', { name: 'ひろば', exact: true }).click()
  await expectHomeGuide(page, 'book')
  await target.click()
  await expect(target).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('heading', { name: '料理カード', exact: true })).toBeVisible()
  await expectHomeGuide(page, 'shop')
  await page.reload()
  const shopTarget = await expectHomeGuide(page, 'shop')
  await shopTarget.click()
  await expectShopGuide(page, 'item')
  const beforePurchase = await storedGame(page)
  await page.getByRole('button', { name: /コックさんの帽子/ }).click()
  const purchase = await expectShopGuide(page, 'purchase')
  await purchase.click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect.poll(async () => (await storedGame(page)).coins).toBe(beforePurchase.coins - 80)
  const purchased = await storedGame(page)
  expect(purchased.owned).toContain('chef')
  expect(purchased.equipped.hat).toBe('chef')
  await expect(page.locator('.play-app')).toHaveAttribute('data-home-guide', 'done')
  await expectNoGuide(page)
  await page.reload()
  expect(await storedGame(page)).toEqual(purchased)
  await expectNoGuide(page)
})

test('the guide can be dismissed from every home step and stays dismissed after reload', async ({
  page,
}) => {
  for (const phase of ['meal', 'growth', 'book', 'shop'] as const) {
    const state = starter(phase)
    await seedGame(
      page,
      phase === 'meal'
        ? state
        : feed(state, { title: 'カレー', sample: 'curry', recipeId: 'curry' }),
    )
    const target = await expectHomeGuide(page, phase)
    await homeGuide(page).getByRole('button', { name: 'ガイドを終了する', exact: true }).click()
    await expect(page.locator('.play-app')).toHaveAttribute('data-home-guide', 'done')
    await expectNoGuide(page)
    await expect(target).toBeFocused()
    await page.reload()
    await expect.poll(async () => (await storedGame(page)).tutorial.homeGuide).toBe('done')
    await expectNoGuide(page)
  }
})

test('opening, closing and equipping an owned item keep the saved shopping guide active', async ({
  page,
}) => {
  const state = starter('shop')
  await seedGame(page, { ...state, owned: [...state.owned, 'chef'] })
  await shopButton(page).click()
  await expectShopGuide(page, 'item')
  await page.reload()
  await expectShopGuide(page, 'item')
  const before = await storedGame(page)
  await page.getByRole('button', { name: /ふたばのかんむり/ }).click()
  await expectShopGuide(page, 'purchase')
  await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).click()
  await expectShopGuide(page, 'item')
  expect(await storedGame(page)).toEqual(before)
  await page.getByRole('button', { name: /コックさんの帽子/ }).click()
  await expect(shopGuide(page)).toHaveCount(0)
  await page.getByRole('dialog').getByRole('button', { name: '使う', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expectHomeGuide(page, 'shop')
  expect((await storedGame(page)).coins).toBe(before.coins)
  expect((await storedGame(page)).equipped.hat).toBe('chef')
  await page.reload()
  await expectHomeGuide(page, 'shop')
})

test('the shopping guide can be dismissed from item selection or purchase without buying', async ({
  page,
}) => {
  for (const scene of ['item', 'purchase'] as const) {
    await seedGame(page, starter('shop'))
    await shopButton(page).click()
    if (scene === 'purchase') await page.getByRole('button', { name: /コックさんの帽子/ }).click()
    const target = await expectShopGuide(page, scene)
    const before = await storedGame(page)
    await shopGuide(page).getByRole('button', { name: 'ガイドを終了する', exact: true }).click()
    await expectNoGuide(page)
    await expect(scene === 'item' ? shopButton(page) : target).toBeFocused()
    await expect.poll(async () => (await storedGame(page)).tutorial.homeGuide).toBe('done')
    const dismissed = await storedGame(page)
    expect(dismissed.coins).toBe(before.coins)
    expect(dismissed.owned).toEqual(before.owned)
    expect(dismissed.equipped).toEqual(before.equipped)
    await page.reload()
    expect(await storedGame(page)).toEqual(dismissed)
    await expectNoGuide(page)
  }
})

test('an existing completed save without the home guide never starts it implicitly', async ({
  page,
}) => {
  await seedGame(page, starter())
  await expect(journey(page)).toHaveCount(0)
  await expectNoGuide(page)
  await page.locator('.play-feed').click()
  await expect(journey(page, 'photo')).toBeVisible()
  await expectNoGuide(page)
  await sampleToTable(page)
  await expectNoGuide(page)
  await journey(page, 'serve').getByRole('button', { name: 'ひろばへ', exact: true }).click()
  await expect(journey(page)).toHaveCount(0)
  await page.locator('.play-growth').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: '閉じる', exact: true }).click()
  await bookButton(page).click()
  await expectNoGuide(page)
  await shopButton(page).click()
  await expectNoGuide(page)
  await page.getByRole('button', { name: /コックさんの帽子/ }).click()
  await expectNoGuide(page)
  await page.reload()
  await expectNoGuide(page)
  expect((await storedGame(page)).tutorial.homeGuide).toBeUndefined()
})

test('the guide and its real action fit together on a 320px screen', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await seedGame(page, starter('meal'))
  const target = await expectHomeGuide(page, 'meal')
  await waitForSceneMotion(page)
  await expectInsideViewport(page, homeGuide(page))
  await expectInsideViewport(page, target)
  expect(
    await target.evaluate((button) => {
      const box = button.getBoundingClientRect()
      return button.contains(document.elementFromPoint(box.x + box.width / 2, box.bottom - 2))
    }),
    'the fixed navigation must not cover the feed button',
  ).toBe(true)
  const capture = async (name: string) => {
    await waitForSceneMotion(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const path = testInfo.outputPath(`${name}-320.png`)
    await page.screenshot({ path, fullPage: false })
    await testInfo.attach(name, { path, contentType: 'image/png' })
  }
  await capture('play-guide-meal')
  await target.click()
  await expect(journey(page, 'photo')).toBeVisible()
  await waitForSceneMotion(page)
  await expectInsideViewport(page, page.locator('#meal-photo-guide'))
  await expectInsideViewport(page, journey(page, 'photo').locator('.journey-primary'))
  await capture('play-guide-photo')
  await sampleToTable(page)
  await waitForSceneMotion(page)
  await expectInsideViewport(page, page.locator('#meal-serve-guide'))
  await expectInsideViewport(page, journey(page, 'serve').locator('.journey-primary'))
  await capture('play-guide-serve')
})

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
]) {
  test(`the coin-to-shop guide remains usable on a ${viewport.width}px screen`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await seedGame(page, { ...starter('book'), coins: 100 })
    await bookButton(page).click()
    const shopTarget = await expectHomeGuide(page, 'shop')
    const capture = async (name: string) => {
      await waitForSceneMotion(page)
      const path = testInfo.outputPath(`${name}-${viewport.width}.png`)
      await page.screenshot({ path, fullPage: false })
      await testInfo.attach(name, { path, contentType: 'image/png' })
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width)
    }
    await expectInsideViewport(page, homeGuide(page))
    await expectInsideViewport(page, shopTarget)
    await capture('play-guide-coins-to-shop')
    await shopTarget.click()
    const itemTarget = await expectShopGuide(page, 'item')
    await expect(itemTarget).toContainText('コックさんの帽子')
    await expectInsideViewport(page, shopGuide(page))
    await capture('play-guide-shop-selection')
    await expectInsideViewport(page, itemTarget)
    expect(
      await itemTarget.evaluate((button) => {
        const box = button.getBoundingClientRect()
        return button.contains(document.elementFromPoint(box.x + box.width / 2, box.bottom - 2))
      }),
      'the fixed navigation must not cover the guided shop item',
    ).toBe(true)
    await itemTarget.click()
    const purchase = await expectShopGuide(page, 'purchase')
    await expectInsideViewport(page, shopGuide(page))
    await expectInsideViewport(page, purchase)
    await capture('play-guide-shop-purchase')
    const outlineClearance = await purchase.evaluate((button) => {
      const box = button.getBoundingClientRect()
      const style = getComputedStyle(button)
      const outline = Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset)
      const dialog = button.closest('dialog')!
      const sheet = dialog.getBoundingClientRect()
      const left = sheet.left + dialog.clientLeft
      const top = sheet.top + dialog.clientTop
      return {
        top: box.top - outline - top,
        left: box.left - outline - left,
        right: left + dialog.clientWidth - box.right - outline,
        bottom: top + dialog.clientHeight - box.bottom - outline,
      }
    })
    for (const [edge, clearance] of Object.entries(outlineClearance)) {
      expect(
        clearance,
        `the purchase button and outline must fit inside the dialog's ${edge} edge`,
      ).toBeGreaterThanOrEqual(0)
    }
  })
}
