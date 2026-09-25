import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { Buffer } from 'node:buffer'
import { journey, selectedMealRecipe, start, storedGame } from './helpers'

type CameraState = {
  mode: 'ready' | 'denied' | 'pending'
  tracks: MediaStreamTrack[]
  pending: (() => void)[]
  constraints: MediaStreamConstraints[]
}

type CameraWindow = Window & { cameraTest: CameraState }

async function installCamera(page: Page) {
  await page.addInitScript(() => {
    const state: CameraState = { mode: 'ready', tracks: [], pending: [], constraints: [] }
    ;(window as CameraWindow).cameraTest = state
    const stream = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1600
      canvas.height = 900
      const context = canvas.getContext('2d')!
      const result = canvas.captureStream(30)
      context.fillStyle = '#dfc992'
      context.fillRect(0, 0, canvas.width, canvas.height)
      state.tracks.push(...result.getTracks())
      return result
    }
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async (constraints: MediaStreamConstraints) => {
        state.constraints.push(constraints)
        if (state.mode === 'denied') throw new DOMException('Permission denied', 'NotAllowedError')
        if (state.mode === 'pending') {
          await new Promise<void>((resolve) => state.pending.push(resolve))
        }
        return stream()
      },
    })
  })
}

async function expectCameraStopped(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const tracks = (window as CameraWindow).cameraTest.tracks
        return tracks.length > 0 && tracks.every((track) => track.readyState === 'ended')
      }),
    )
    .toBe(true)
}

const cameraDialog = (page: Page) => page.getByRole('dialog', { name: '料理の写真を撮る' })

async function openCamera(page: Page) {
  await page.getByRole('button', { name: '料理の写真を撮る・選ぶ', exact: true }).click()
  await expect(cameraDialog(page)).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await installCamera(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await start(page)
  await page.locator('.play-feed').click()
})

test('the in-page camera captures a small JPEG, stops the camera and sends the photo to recognition', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const before = await storedGame(page)
  let chooserCount = 0
  let recognizedPhoto = ''
  page.on('filechooser', () => {
    chooserCount += 1
  })
  await page.route('**/api/recognize-food', async (route) => {
    recognizedPhoto = route.request().postDataJSON().photo
    await route.fulfill({ json: { candidates: ['generic-curry'] } })
  })
  await openCamera(page)
  const dialog = cameraDialog(page)
  await expect(dialog.getByLabel('カメラの映像')).toBeVisible()
  await expect(dialog.getByRole('button', { name: '撮影する', exact: true })).toBeEnabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await dialog.getByRole('button', { name: '撮影する', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expectCameraStopped(page)
  const preview = journey(page, 'photo').getByRole('img', { name: '今日の料理', exact: true })
  await expect(preview).toHaveAttribute('src', /^data:image\/jpeg;base64,/)
  await expect
    .poll(() =>
      preview.evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight]),
    )
    .toEqual([800, 450])
  await expect.poll(() => recognizedPhoto).toBe(await preview.getAttribute('src'))
  expect(chooserCount).toBe(0)
  expect(await storedGame(page)).toEqual(before)
  await page.getByRole('button', { name: '食卓へ', exact: true }).click()
  await expect(selectedMealRecipe(page)).toHaveText('カレー')
})

test('cancelling the camera releases its tracks and leaves the meal unchanged', async ({
  page,
}) => {
  const before = await storedGame(page)
  await openCamera(page)
  await expect(
    cameraDialog(page).getByRole('button', { name: '撮影する', exact: true }),
  ).toBeEnabled()
  await cameraDialog(page).getByRole('button', { name: 'カメラを閉じる', exact: true }).click()
  await expect(cameraDialog(page)).toHaveCount(0)
  await expectCameraStopped(page)
  await expect(journey(page, 'photo')).toBeVisible()
  await expect(
    journey(page, 'photo').getByRole('img', { name: '今日の料理', exact: true }),
  ).toHaveCount(0)
  expect(await storedGame(page)).toEqual(before)
})

test('denied camera permission leaves a working gallery fallback without native camera capture', async ({
  page,
}) => {
  await page.evaluate(() => {
    ;(window as CameraWindow).cameraTest.mode = 'denied'
  })
  await page.route('**/api/recognize-food', (route) => route.fulfill({ json: { candidates: [] } }))
  await openCamera(page)
  const dialog = cameraDialog(page)
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(dialog.getByRole('button', { name: '撮影する', exact: true })).toBeDisabled()
  const image = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 600
    canvas.getContext('2d')!.fillRect(0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  const opened = page.waitForEvent('filechooser')
  await dialog.getByRole('button', { name: '撮った写真を選ぶ', exact: true }).click()
  const chooser = await opened
  expect(await chooser.element().getAttribute('capture')).toBeNull()
  await chooser.setFiles({
    name: 'meal.png',
    mimeType: 'image/png',
    buffer: Buffer.from(image, 'base64'),
  })
  await expect(dialog).toHaveCount(0)
  const preview = journey(page, 'photo').getByRole('img', { name: '今日の料理', exact: true })
  await expect(preview).toBeVisible()
  await expect
    .poll(() =>
      preview.evaluate((element: HTMLImageElement) => [
        element.naturalWidth,
        element.naturalHeight,
      ]),
    )
    .toEqual([800, 400])
})

test('camera permission resolving after cancellation releases the late stream', async ({
  page,
}) => {
  await page.evaluate(() => {
    ;(window as CameraWindow).cameraTest.mode = 'pending'
  })
  const before = await storedGame(page)
  await openCamera(page)
  await expect(
    cameraDialog(page).getByRole('button', { name: '撮影する', exact: true }),
  ).toBeDisabled()
  await expect
    .poll(() => page.evaluate(() => (window as CameraWindow).cameraTest.pending.length))
    .toBeGreaterThan(0)
  await cameraDialog(page).getByRole('button', { name: 'カメラを閉じる', exact: true }).click()
  await expect(cameraDialog(page)).toHaveCount(0)
  await page.evaluate(() => {
    for (const resolve of (window as CameraWindow).cameraTest.pending) resolve()
  })
  await expectCameraStopped(page)
  await expect(journey(page, 'photo')).toBeVisible()
  expect(await storedGame(page)).toEqual(before)
})

test('leaving the page releases the camera without capturing a meal', async ({ page }) => {
  const before = await storedGame(page)
  await openCamera(page)
  await expect(
    cameraDialog(page).getByRole('button', { name: '撮影する', exact: true }),
  ).toBeEnabled()
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')))
  await expectCameraStopped(page)
  expect(await storedGame(page)).toEqual(before)
})
