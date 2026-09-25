import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { Buffer } from 'node:buffer'
import { chooseStarter, journey, storedGame } from './helpers'

const samplePath = '/art/tutorial/sample-curry.jpg'

type CameraWindow = Window & { tutorialCameraTracks: MediaStreamTrack[] }

async function installCamera(page: Page) {
  await page.addInitScript(() => {
    const tracks: MediaStreamTrack[] = []
    ;(window as CameraWindow).tutorialCameraTracks = tracks
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => {
        const canvas = document.createElement('canvas')
        canvas.width = 1200
        canvas.height = 600
        const stream = canvas.captureStream(30)
        const context = canvas.getContext('2d')!
        context.fillStyle = '#dfc992'
        context.fillRect(0, 0, canvas.width, canvas.height)
        tracks.push(...stream.getTracks())
        return stream
      },
    })
  })
}

async function expectCameraStopped(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const tracks = (window as CameraWindow).tutorialCameraTracks
        return tracks.length > 0 && tracks.every((track) => track.readyState === 'ended')
      }),
    )
    .toBe(true)
}

async function mealPhoto(page: Page) {
  const fixture = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 600
    const context = canvas.getContext('2d')!
    context.fillStyle = '#dfc992'
    context.fillRect(0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  return { name: 'my-meal.png', mimeType: 'image/png', buffer: Buffer.from(fixture, 'base64') }
}

test.beforeEach(async ({ page }) => {
  await installCamera(page)
  await page.clock.setFixedTime(new Date('2026-09-24T03:00:00Z'))
  await page.goto('/')
  await chooseStarter(page)
})

test('the first photo opens an in-page camera and separate library and tolerates cancellation', async ({
  page,
}) => {
  const screen = journey(page, 'welcome')
  const lesson = screen.locator('.tutorial-first-photo')
  const before = await storedGame(page)
  await screen.getByRole('button', { name: '料理の写真を撮る', exact: true }).click()
  const camera = page.getByRole('dialog', { name: '料理の写真を撮る' })
  await expect(camera.getByRole('button', { name: '撮影する', exact: true })).toBeEnabled()
  await camera.getByRole('button', { name: 'カメラを閉じる', exact: true }).click()
  await expect(camera).toHaveCount(0)
  await expectCameraStopped(page)
  await expect(lesson).toHaveAttribute('data-phase', 'cooking')

  const libraryOpened = page.waitForEvent('filechooser')
  await screen.getByRole('button', { name: '撮った写真を選ぶ', exact: true }).click()
  const library = await libraryOpened
  expect(await library.element().getAttribute('aria-label')).toBe('撮影済みの料理写真')
  expect(await library.element().getAttribute('capture')).toBeNull()
  expect(await library.element().getAttribute('accept')).toBe('image/jpeg,image/png,image/webp')
  await library.setFiles([])
  await expect(lesson).toHaveAttribute('data-phase', 'cooking')
  await expect(lesson.getByRole('alert')).toHaveCount(0)
  await expect(screen.locator('.tutorial-xp-panel')).toHaveCount(0)
  expect(await storedGame(page)).toEqual(before)
})

test('the first photo can be captured inside the page and used without changing the saved game', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const screen = journey(page, 'welcome')
  const before = await storedGame(page)
  let chooserCount = 0
  page.on('filechooser', () => {
    chooserCount += 1
  })
  await screen.getByRole('button', { name: '料理の写真を撮る', exact: true }).click()
  const camera = page.getByRole('dialog', { name: '料理の写真を撮る' })
  await expect(camera.getByRole('button', { name: '撮影する', exact: true })).toBeEnabled()
  await camera.getByRole('button', { name: '撮影する', exact: true }).click()
  await expect(camera).toHaveCount(0)
  await expectCameraStopped(page)
  const preview = screen.getByRole('img', { name: '選んだ料理の写真', exact: true })
  await expect(preview).toHaveAttribute('src', /^data:image\/jpeg;base64,/)
  await expect
    .poll(() =>
      preview.evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight]),
    )
    .toEqual([800, 400])
  const capturedSource = await preview.getAttribute('src')
  await screen.getByRole('button', { name: 'この写真を使う', exact: true }).click()
  await expect(screen.locator('.tutorial-meal-world')).toHaveClass(/is-hungry/)
  await expect(screen.locator('.tutorial-photo img')).toHaveAttribute('src', capturedSource!)
  expect(chooserCount).toBe(0)
  expect(await storedGame(page)).toEqual(before)
})

test('a selected photo is resized, can be selected again and stays through feeding without saving', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const screen = journey(page, 'welcome')
  const lesson = screen.locator('.tutorial-first-photo')
  const before = await storedGame(page)
  const photo = await mealPhoto(page)
  const opened = page.waitForEvent('filechooser')
  await screen.getByRole('button', { name: '撮った写真を選ぶ', exact: true }).click()
  await (await opened).setFiles(photo)
  await expect(lesson).toHaveAttribute('data-phase', 'photo')
  const preview = screen.getByRole('img', { name: '選んだ料理の写真', exact: true })
  await expect(preview).toBeVisible()
  await expect(preview).toHaveAttribute('src', /^data:image\/jpeg;base64,/)
  await expect
    .poll(() =>
      preview.evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight]),
    )
    .toEqual([800, 400])
  const selectedSource = await preview.getAttribute('src')
  await expect(screen.getByLabel('撮影済みの料理写真', { exact: true })).toHaveValue('')

  await screen.getByRole('button', { name: '料理の写真を撮り直す', exact: true }).click()
  const retake = page.getByRole('dialog', { name: '料理の写真を撮る' })
  await expect(retake.getByRole('button', { name: '撮影する', exact: true })).toBeEnabled()
  await retake.getByRole('button', { name: 'カメラを閉じる', exact: true }).click()
  await expect(retake).toHaveCount(0)
  await expectCameraStopped(page)
  await expect(preview).toHaveAttribute('src', selectedSource!)

  const cancelled = page.waitForEvent('filechooser')
  await screen.getByRole('button', { name: '写真を選び直す', exact: true }).click()
  await (await cancelled).setFiles([])
  await expect(preview).toHaveAttribute('src', selectedSource!)
  await expect(lesson).toHaveAttribute('data-phase', 'photo')

  await screen.getByRole('button', { name: 'サンプル写真を使う', exact: true }).click()
  const reopened = page.waitForEvent('filechooser')
  await screen.getByRole('button', { name: '写真を選び直す', exact: true }).click()
  const replacement = await reopened
  expect(await replacement.element().getAttribute('aria-label')).toBe('撮影済みの料理写真')
  await replacement.setFiles(photo)
  await expect(preview).toHaveAttribute('src', selectedSource!)
  await screen.getByRole('button', { name: 'この写真を使う', exact: true }).click()
  await expect(screen.locator('.tutorial-meal-world')).toHaveClass(/is-hungry/)
  await expect(screen.getByRole('group', { name: 'こむぎのごはん', exact: true })).toBeFocused()
  const servedPhoto = screen.locator('.tutorial-photo img')
  await expect(servedPhoto).toHaveAttribute('src', selectedSource!)
  expect(await storedGame(page)).toEqual(before)

  await screen.getByRole('button', { name: 'ごはんをあげる', exact: true }).click()
  await expect(screen.locator('.tutorial-meal-world')).toHaveClass(/is-eating/)
  await expect(servedPhoto).toHaveAttribute('src', selectedSource!)
  await expect(screen.locator('.tutorial-meal-world')).toHaveClass(/is-full/)
  await expect(servedPhoto).toHaveAttribute('src', selectedSource!)
  await expect(screen.locator('.tutorial-xp-panel')).toContainText('+45 XP')
  expect(await storedGame(page)).toEqual(before)
  await page.reload()
  await expect(lesson).toHaveAttribute('data-phase', 'cooking')
  await expect(screen.locator('.tutorial-photo img')).toHaveCount(0)
  await expect(screen.getByRole('img', { name: '選んだ料理の写真', exact: true })).toHaveCount(0)
})

test('the supplied sample photo is usable without opening a photo chooser', async ({ page }) => {
  const screen = journey(page, 'welcome')
  const before = await storedGame(page)
  let chooserCount = 0
  page.on('filechooser', () => {
    chooserCount += 1
  })
  await screen.getByRole('button', { name: 'サンプル写真を使う', exact: true }).click()
  const preview = screen.getByRole('img', { name: 'サンプルのカレー写真', exact: true })
  await expect(preview).toHaveAttribute('src', samplePath)
  await expect
    .poll(() =>
      preview.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true)
  await screen.getByRole('button', { name: 'この写真を使う', exact: true }).click()
  await expect(screen.locator('.tutorial-meal-world')).toHaveClass(/is-hungry/)
  await expect(screen.locator('.tutorial-photo img')).toHaveAttribute('src', samplePath)
  await screen.getByRole('button', { name: 'ごはんをあげる', exact: true }).click()
  await expect(screen.locator('.tutorial-meal-world')).toHaveClass(/is-full/)
  await expect(screen.locator('.tutorial-photo img')).toHaveAttribute('src', samplePath)
  expect(chooserCount).toBe(0)
  expect(await storedGame(page)).toEqual(before)
})

test('choosing the sample while a photo loads prevents a late decode from replacing it', async ({
  page,
}) => {
  const screen = journey(page, 'welcome')
  const lesson = screen.locator('.tutorial-first-photo')
  const before = await storedGame(page)
  const photo = await mealPhoto(page)
  await page.evaluate(() => {
    window.createImageBitmap = new Proxy(window.createImageBitmap, {
      async apply(target, thisArg, args) {
        await new Promise<void>((resolve) => {
          window.addEventListener('release-tutorial-photo', () => resolve(), { once: true })
        })
        const bitmap = await Reflect.apply(target, thisArg, args)
        document.documentElement.dataset.tutorialPhotoDecoded = 'true'
        return bitmap
      },
    })
  })
  await screen.getByLabel('撮影済みの料理写真', { exact: true }).setInputFiles(photo)
  await expect(lesson).toHaveAttribute('data-phase', 'loading')
  await expect(screen.getByRole('button', { name: '読み込み中', exact: true })).toBeDisabled()
  await screen.getByRole('button', { name: 'サンプル写真を使う', exact: true }).click()
  await expect(lesson).toHaveAttribute('data-phase', 'photo')
  await page.evaluate(() => window.dispatchEvent(new Event('release-tutorial-photo')))
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.tutorialPhotoDecoded))
    .toBe('true')
  await expect(
    screen.getByRole('img', { name: 'サンプルのカレー写真', exact: true }),
  ).toHaveAttribute('src', samplePath)
  await expect(screen.getByRole('img', { name: '選んだ料理の写真', exact: true })).toHaveCount(0)
  await screen.getByRole('button', { name: 'この写真を使う', exact: true }).click()
  await expect(screen.locator('.tutorial-photo img')).toHaveAttribute('src', samplePath)
  expect(await storedGame(page)).toEqual(before)
})

for (const invalid of [
  { name: 'notes.txt', mimeType: 'text/plain', error: 'JPEG・PNG・WebPの写真を選んでください。' },
  {
    name: 'broken.png',
    mimeType: 'image/png',
    error: 'この写真を読み込めませんでした。別の写真を選んでください。',
  },
]) {
  test(`${invalid.name} shows a recoverable error and allows the sample photo`, async ({
    page,
  }) => {
    const screen = journey(page, 'welcome')
    const lesson = screen.locator('.tutorial-first-photo')
    const before = await storedGame(page)
    await screen.getByLabel('撮影済みの料理写真', { exact: true }).setInputFiles({
      name: invalid.name,
      mimeType: invalid.mimeType,
      buffer: Buffer.from('This is not an image'),
    })
    await expect(lesson.getByRole('alert')).toHaveText(invalid.error)
    await expect(lesson).toHaveAttribute('data-phase', 'cooking')
    await expect(
      screen.getByRole('button', { name: '料理の写真を撮る', exact: true }),
    ).toBeEnabled()
    expect(await storedGame(page)).toEqual(before)
    await screen.getByRole('button', { name: 'サンプル写真を使う', exact: true }).click()
    await expect(lesson.getByRole('alert')).toHaveCount(0)
    await expect(lesson).toHaveAttribute('data-phase', 'photo')
    await expect(
      screen.getByRole('img', { name: 'サンプルのカレー写真', exact: true }),
    ).toBeVisible()
    await screen.getByRole('button', { name: 'この写真を使う', exact: true }).click()
    await expect(screen.locator('.tutorial-meal-world')).toHaveClass(/is-hungry/)
    expect(await storedGame(page)).toEqual(before)
  })
}
