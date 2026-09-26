import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { journey, start, storedGame } from './helpers'

const sampleCapture = (page: Page) =>
  page.getByRole('dialog', { name: 'サンプル写真の撮影体験', exact: true })

type CaptureReport = {
  phases: string[]
  source: string
  reducedMotion: boolean
  largeWidth: number
  smallestPlacingWidth: number
  flashOpacity: number
  activeAnimations: number
  feedBlocked: boolean
  placingShadeOpacity: number
  startedAt: number
  duration: number
}

type ObservedWindow = Window & { sampleCaptureReport: CaptureReport }

async function observeSampleCapture(page: Page) {
  await page.evaluate(() => {
    const report: CaptureReport = {
      phases: [],
      source: '',
      reducedMotion: false,
      largeWidth: 0,
      smallestPlacingWidth: Number.MAX_VALUE,
      flashOpacity: 0,
      activeAnimations: 0,
      feedBlocked: true,
      placingShadeOpacity: 0,
      startedAt: 0,
      duration: 0,
    }
    ;(window as ObservedWindow).sampleCaptureReport = report
    function observe() {
      const dialog = document.querySelector<HTMLDialogElement>('.sample-photo-capture')
      if (!dialog) {
        if (report.startedAt && !report.duration)
          report.duration = performance.now() - report.startedAt
        return
      }
      const phase = dialog.dataset.phase!
      if (report.phases.at(-1) !== phase) report.phases.push(phase)
      if (phase === 'loading') return
      report.startedAt ||= performance.now()
      report.reducedMotion = dialog.dataset.reducedMotion === 'true'
      const picture = dialog.querySelector<HTMLElement>('.sample-capture-photo')!
      const width = picture.getBoundingClientRect().width
      if (phase === 'capture') report.largeWidth = Math.max(report.largeWidth, width)
      else report.smallestPlacingWidth = Math.min(report.smallestPlacingWidth, width)
      report.source = picture.querySelector('img')!.src
      const flash = dialog.querySelector('.sample-capture-flash')!
      const flashStyle = getComputedStyle(flash)
      if (flashStyle.display !== 'none')
        report.flashOpacity = Math.max(report.flashOpacity, Number(flashStyle.opacity))
      report.activeAnimations = Math.max(
        report.activeAnimations,
        dialog.getAnimations({ subtree: true }).length,
      )
      const feed = document.querySelector<HTMLButtonElement>('button[form="serve-meal"]')
      if (feed) report.feedBlocked &&= feed.disabled && dialog.matches(':modal')
      const shade = dialog.querySelector('.sample-capture-backdrop')
      if (phase === 'placing' && shade)
        report.placingShadeOpacity = Math.max(
          report.placingShadeOpacity,
          Number(getComputedStyle(shade).opacity),
        )
    }
    const observer = new MutationObserver(observe)
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-phase'],
    })
    function frame() {
      observe()
      if (report.duration) observer.disconnect()
      else requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  })
}

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
  await expect(sampleCapture(page).getByRole('status')).toHaveText('サンプル写真を読み込んでいます')
  await expect(
    page.getByRole('button', { name: '読み込み中', exact: true, includeHidden: true }),
  ).toBeDisabled()
  await expect(
    page.getByRole('button', {
      name: 'サンプル写真で体験する',
      exact: true,
      includeHidden: true,
    }),
  ).toBeDisabled()
  release()
  await expect(sampleCapture(page)).toHaveCount(0)
  await expect(page.getByRole('alert')).toContainText('サンプル写真を読み込めませんでした')
  await expect(journey(page, 'photo')).toBeVisible()
  await page.unroute(pattern)
  await page.getByRole('button', { name: 'サンプル写真で体験する', exact: true }).click()
  await expect(journey(page, 'serve')).toBeVisible()
  await expect(page.locator('.meal-serving-dish img')).toHaveJSProperty('naturalWidth', 800)
})

test('the sample flashes as a large camera photo and shrinks onto the plate without opening a camera', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const before = await storedGame(page)
  let recognitionRequests = 0
  await page.route('**/api/recognize-food', async (route) => {
    recognitionRequests += 1
    await route.fulfill({ json: { candidates: [] } })
  })
  await page.evaluate(() => {
    document.documentElement.dataset.cameraRequests = '0'
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => {
        document.documentElement.dataset.cameraRequests = String(
          Number(document.documentElement.dataset.cameraRequests) + 1,
        )
        throw new DOMException('No camera in sample experience', 'NotAllowedError')
      },
    })
  })
  await observeSampleCapture(page)
  await page.getByRole('button', { name: 'サンプル写真で体験する', exact: true }).click()
  const served = page.locator('.meal-serving-dish img')
  await expect(served).toBeVisible()
  await expect(sampleCapture(page)).toHaveCount(0)
  const report = await page.evaluate(() => (window as ObservedWindow).sampleCaptureReport)
  expect(report.phases).toEqual(['loading', 'capture', 'placing'])
  expect(report.reducedMotion).toBe(false)
  expect(report.largeWidth).toBeGreaterThan(250)
  expect(report.largeWidth).toBeLessThanOrEqual(390)
  expect(report.smallestPlacingWidth).toBeLessThan(report.largeWidth * 0.85)
  expect(report.flashOpacity).toBeGreaterThan(0)
  expect(report.flashOpacity).toBeLessThanOrEqual(0.5)
  expect(report.placingShadeOpacity).toBe(0)
  expect(report.feedBlocked).toBe(true)
  expect(report.duration).toBeLessThan(1400)
  expect(report.source).toMatch(/^data:image\/jpeg;base64,/)
  await expect(served).toHaveAttribute('src', report.source)
  await expect(page.getByRole('button', { name: 'こむぎにごはんをあげる' })).toBeEnabled()
  expect(await page.evaluate(() => document.documentElement.dataset.cameraRequests)).toBe('0')
  expect(recognitionRequests).toBe(0)
  expect(await storedGame(page)).toEqual(before)
})

test('reduced motion keeps the sample preview still and serves the same photo without a flash', async ({
  page,
}) => {
  await observeSampleCapture(page)
  await page.getByRole('button', { name: 'サンプル写真で体験する', exact: true }).click()
  const served = page.locator('.meal-serving-dish img')
  await expect(served).toBeVisible()
  await expect(sampleCapture(page)).toHaveCount(0)
  const report = await page.evaluate(() => (window as ObservedWindow).sampleCaptureReport)
  expect(report.phases).toEqual(['loading', 'capture'])
  expect(report.reducedMotion).toBe(true)
  expect(report.flashOpacity).toBe(0)
  expect(report.activeAnimations).toBe(0)
  await expect(served).toHaveAttribute('src', report.source)
})

test('cancelling a sample preview discards the pending experience without saving a meal', async ({
  page,
}) => {
  const before = await storedGame(page)
  await page.clock.install()
  await page.getByRole('button', { name: 'サンプル写真で体験する', exact: true }).click()
  const dialog = sampleCapture(page)
  await expect(dialog).toHaveAttribute('data-phase', 'capture')
  await dialog.getByRole('button', { name: '体験をやめる', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await page.clock.fastForward(5000)
  await expect(page.getByRole('heading', { name: 'ひろば', exact: true })).toBeVisible()
  expect(await storedGame(page)).toEqual(before)
  await page.locator('.play-feed').click()
  await expect(journey(page, 'photo')).toBeVisible()
  await expect(page.getByRole('img', { name: 'サンプルの料理写真', exact: true })).toHaveCount(0)
})
