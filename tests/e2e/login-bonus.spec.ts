import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { chooseStarter, journey, nextDay, start, storedGame, waitForSceneMotion } from './helpers'

const day = new Date('2026-09-26T03:00:00Z')

test('a saved login bonus waits for the tutorial, can be dismissed, and does not replay on reload', async ({
  page,
}) => {
  await page.clock.install({ time: day })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await chooseStarter(page)
  await expect.poll(async () => (await storedGame(page)).coins).toBe(140)
  const bonus = page.getByRole('status', { name: 'ログインボーナス', exact: true })
  await page.clock.fastForward(6000)
  await expect(bonus).toHaveCount(0)

  await page.getByRole('button', { name: 'チュートリアルをスキップしてひろばへ' }).click()
  await expect(bonus).toBeVisible()
  await expect(bonus).toContainText('+20')
  await bonus.getByRole('button', { name: 'ログインボーナスを閉じる' }).click()
  await expect(bonus).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('button', { name: 'コイン 140枚、おみせへ' })).toBeVisible()
  await expect(bonus).toHaveCount(0)

  await page.keyboard.press('Control+Alt+d')
  const dialog = page.getByRole('dialog', { name: 'デバッグ設定', exact: true })
  await dialog.getByRole('button', { name: '翌日に進む', exact: true }).click()
  await expect.poll(async () => (await storedGame(page)).coins).toBe(160)
  await page.clock.fastForward(6000)
  await expect(bonus).toHaveCount(0)
  await dialog.getByRole('button', { name: '閉じる', exact: true }).click()
  await expect(bonus).toBeVisible()
  await expect(bonus).toContainText('+20')
  await page.clock.fastForward(6000)
  await expect(bonus).toHaveCount(0)
  expect((await storedGame(page)).coins).toBe(160)
})

test('opening a meal keeps the login celebration pending until the player returns', async ({
  page,
}) => {
  await page.clock.install({ time: day })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await start(page)
  const bonus = page.getByRole('status', { name: 'ログインボーナス', exact: true })
  await expect(bonus).toBeVisible()
  await page.getByRole('button', { name: 'ごはんをあげる', exact: true }).click()
  await expect(journey(page, 'photo')).toBeVisible()
  await expect(bonus).toHaveCount(0)
  await page.clock.fastForward(6000)
  await journey(page, 'photo').getByRole('button', { name: 'ひろばへ', exact: true }).click()
  await expect(bonus).toBeVisible()
  await page.clock.fastForward(6000)
  await expect(bonus).toHaveCount(0)
  expect((await storedGame(page)).coins).toBe(140)
})

test('the coin animation completes and the bonus closes automatically or by hand', async ({
  page,
}, testInfo) => {
  await page.clock.setFixedTime(day)
  await page.goto('/')
  await start(page)
  const bonus = page.getByRole('status', { name: 'ログインボーナス', exact: true })
  await expect(bonus).toBeVisible()
  expect(
    await bonus.locator('.login-bonus-coin').evaluate((coin) => coin.getAnimations().length),
  ).toBeGreaterThan(0)
  await waitForSceneMotion(page)
  const path = testInfo.outputPath('login-bonus-desktop.png')
  await page.screenshot({ path })
  await testInfo.attach('login-bonus-desktop', { path, contentType: 'image/png' })
  await expect(bonus).toHaveCount(0, { timeout: 7000 })
  await nextDay(page)
  await expect(bonus).toBeVisible()
  await bonus.getByRole('button', { name: 'ログインボーナスを閉じる' }).click()
  await expect(bonus).toHaveCount(0)
  expect((await storedGame(page)).coins).toBe(160)
})

for (const width of [320, 390]) {
  test(`login bonus fits at ${width}px and respects reduced motion`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.clock.install({ time: day })
    await page.goto('/')
    await start(page)
    const bonus = page.getByRole('status', { name: 'ログインボーナス', exact: true })
    await expect(bonus).toBeVisible()
    await waitForSceneMotion(page)
    const box = (await bonus.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height)
    expect(await bonus.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(
      0,
    )
    const path = testInfo.outputPath(`login-bonus-${width}.png`)
    await page.screenshot({ path })
    await testInfo.attach('login-bonus', { path, contentType: 'image/png' })
    const accessibility = await new AxeBuilder({ page })
      .include('.login-bonus-celebration')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(accessibility.violations).toEqual([])
    await bonus.getByRole('button', { name: 'ログインボーナスを閉じる' }).click()
    await expect(bonus).toHaveCount(0)
    expect((await storedGame(page)).coins).toBe(140)
  })
}
