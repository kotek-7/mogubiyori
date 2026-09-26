import { expect, test } from '@playwright/test'
import { journey, start, storedGame } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await start(page)
  await page.locator('.play-feed').click()
})

test('random samples load three different photos and keep the selected photo when going back', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const before = await storedGame(page)
  const images: string[] = []
  for (const [index, path] of [
    '/art/tutorial/sample-curry.jpg',
    '/art/meal-samples/sample-omurice.jpg',
    '/art/meal-samples/sample-salmon.jpg',
  ].entries()) {
    await page.evaluate(
      (value) => {
        Math.random = () => value
      },
      (index + 0.5) / 3,
    )
    const request = page.waitForRequest((request) => new URL(request.url()).pathname === path)
    await page.getByRole('button', { name: 'サンプル写真で体験する', exact: true }).click()
    await request
    await expect(journey(page, 'serve')).toBeVisible()
    const image = page.locator('.meal-serving-dish img')
    await expect(image).toHaveJSProperty('naturalWidth', 800)
    const source = (await image.getAttribute('src'))!
    expect(source).toMatch(/^data:image\/jpeg;base64,/)
    expect(images).not.toContain(source)
    images.push(source)
    await expect(journey(page).getByText('サンプル写真', { exact: true })).toBeVisible()
    if (index === 2) await page.screenshot({ path: testInfo.outputPath('sample-meal-mobile.png') })
    await page.getByRole('button', { name: '写真にもどる', exact: true }).click()
    await expect(journey(page, 'photo').getByAltText('サンプルの料理写真')).toHaveAttribute(
      'src',
      source,
    )
  }
  expect(await storedGame(page)).toEqual(before)
})

test('sample loading prevents advancing and a failed load can be retried', async ({ page }) => {
  let release!: () => void
  const paused = new Promise<void>((resolve) => {
    release = resolve
  })
  const pattern = '**/art/**/sample-*.jpg'
  await page.route(pattern, async (route) => {
    await paused
    await route.fulfill({ status: 503, body: 'unavailable' })
  })
  await page.getByRole('button', { name: 'サンプル写真で体験する', exact: true }).click()
  await expect(journey(page, 'photo').getByRole('status')).toHaveText(
    'サンプル写真を読み込んでいます',
  )
  await expect(page.getByRole('button', { name: '読み込み中', exact: true })).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'サンプル写真で体験する', exact: true }),
  ).toBeDisabled()
  release()
  await expect(page.getByRole('alert')).toContainText('サンプル写真を読み込めませんでした')
  await expect(journey(page, 'photo')).toBeVisible()
  await page.unroute(pattern)
  await page.getByRole('button', { name: 'サンプル写真で体験する', exact: true }).click()
  await expect(journey(page, 'serve')).toBeVisible()
  await expect(page.locator('.meal-serving-dish img')).toHaveJSProperty('naturalWidth', 800)
})
