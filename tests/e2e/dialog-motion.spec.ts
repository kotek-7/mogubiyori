import { test, expect } from '@playwright/test'
import { claimLogin, demoGame, todayTokyo } from '../../src/app/game/browserGame'
import { waitForSceneMotion } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    (state) => localStorage.setItem('mogubiyori-v1', state),
    JSON.stringify(claimLogin(demoGame(todayTokyo()))),
  )
  await page.goto('/')
})

test('a closing sheet remains modal until its exit finishes and restores its opener', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const opener = page.getByRole('button', { name: '設定', exact: true })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: '設定', exact: true })
  await expect(dialog).toBeVisible()
  await waitForSceneMotion(page)
  const bounds = await dialog.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.x + bounds!.width / 2).toBeCloseTo(720, 0)
  expect(bounds!.y).toBeGreaterThanOrEqual(0)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(1000)
  await page.screenshot({ path: test.info().outputPath('sheet-desktop.png') })

  // Trigger repeated native cancels in one task, then inspect the first closing frame.
  const closing = await dialog.evaluate(async (element: HTMLDialogElement) => {
    element.dispatchEvent(new Event('cancel', { cancelable: true }))
    element.dispatchEvent(new Event('cancel', { cancelable: true }))
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    const opener = document.querySelector<HTMLButtonElement>(
      '.play-header button[aria-label="設定"]',
    )!
    opener.focus()
    return {
      open: element.open,
      modal: element.matches(':modal'),
      closing: element.hasAttribute('data-closing'),
      outsideFocusBlocked: document.activeElement !== opener,
    }
  })
  expect(closing).toEqual({ open: true, modal: true, closing: true, outsideFocusBlocked: true })
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()

  await opener.click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test('changing sheet content retains the native modal and keeps focus inside it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const opener = page.getByRole('button', { name: '設定', exact: true })
  await opener.click()
  const dialog = page.getByRole('dialog')
  await dialog.evaluate((element) => element.setAttribute('data-original-dialog', 'true'))
  await dialog.getByRole('button', { name: 'あそびかた', exact: true }).click()
  await expect(dialog).toHaveAccessibleName('あそびかた')
  await expect(dialog).toHaveAttribute('data-original-dialog', 'true')
  await expect(dialog.getByRole('heading', { name: 'あそびかた', exact: true })).toBeFocused()
  await expect(dialog.locator('.help-sheet')).toBeVisible()
  await expect(dialog.locator('.settings-sheet')).toHaveCount(0)
  await waitForSceneMotion(page)
  const bounds = await dialog.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.x + bounds!.width / 2).toBeCloseTo(195, 0)
  expect(bounds!.y).toBeGreaterThanOrEqual(0)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844)
  await page.screenshot({ path: test.info().outputPath('sheet-mobile-help.png') })
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: '閉じる', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test('reduced motion skips sheet movement and its backdrop animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const opener = page.getByRole('button', { name: '設定', exact: true })
  await opener.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const styles = await dialog.evaluate((element) => ({
    transform: getComputedStyle(element).transform,
    backdropAnimation: getComputedStyle(element, '::backdrop').animationName,
  }))
  expect(styles).toEqual({ transform: 'none', backdropAnimation: 'none' })
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
})
