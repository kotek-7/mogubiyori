import { expect, test } from '@playwright/test'
import type { CDPSession, Page } from '@playwright/test'
import { claimLogin, chooseStarter, initialGame, todayTokyo } from '../../src/app/game/browserGame'
import { storedGame, waitForSceneMotion } from './helpers'

const pet = (page: Page) => page.locator('.play-pet')
const surface = (page: Page) => pet(page).locator('[data-gesture-surface]')
const status = (page: Page) => page.locator('.companion-reaction-status')

async function center(page: Page) {
  const box = await surface(page).boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width).toBeGreaterThan(0)
  expect(box!.height).toBeGreaterThan(0)
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 }
}

async function blankAboveCharacter(page: Page) {
  const point = await pet(page).evaluate((button) => {
    const bounds = button.getBoundingClientRect()
    const surfaceBounds = button.querySelector('[data-gesture-surface]')!.getBoundingClientRect()
    for (let y = surfaceBounds.top - 12; y > bounds.top + 8; y -= 20) {
      for (const fraction of [0.5, 0.25, 0.75]) {
        const x = bounds.left + bounds.width * fraction
        const foreground = document.elementFromPoint(x, y)
        if (foreground && button.contains(foreground)) return { x, y }
      }
    }
    return null
  })
  expect(point, 'the portrait must leave a scrollable area above the anatomy').not.toBeNull()
  return point!
}

async function expectReaction(page: Page, action: string, sequence: number) {
  await expect(pet(page)).toHaveAttribute('data-interaction', action)
  await expect(pet(page)).toHaveAttribute('data-reaction-sequence', String(sequence))
  await expect(status(page)).toHaveText(/^こむぎが.+/)
  await expect(pet(page).locator('.companion-reaction-effects')).toBeVisible()
}

type TouchPoint = { x: number; y: number; id: number }

async function touch(
  session: CDPSession,
  type: 'touchStart' | 'touchMove' | 'touchEnd',
  points: TouchPoint[],
) {
  await session.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: points.map((point) => ({ ...point, radiusX: 5, radiusY: 5, force: 1 })),
  })
}

test.beforeEach(async ({ page }) => {
  const state = {
    ...claimLogin(chooseStarter(initialGame(todayTokyo()), 'komugi')),
    tutorial: { version: 1, step: 4, status: 'completed' },
  }
  await page.addInitScript(
    (value) => localStorage.setItem('mogubiyori-v1', value),
    JSON.stringify(state),
  )
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(pet(page)).toBeVisible()
  await waitForSceneMotion(page)
})

test('a pointer tap reacts once while keyboard and explicit interaction controls stay usable', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await expect(page.locator('.companion-gesture-hint')).toHaveCount(0)
  const saved = await storedGame(page)
  const point = await center(page)
  await page.mouse.click(point.x, point.y)
  await expectReaction(page, 'poke', 1)
  await pet(page).focus()
  await pet(page).press('Enter')
  await expectReaction(page, 'pet', 2)
  await page.getByRole('button', { name: 'こむぎをくすぐる', exact: true }).click()
  await expectReaction(page, 'tickle', 3)
  await page.getByRole('button', { name: 'こむぎに手をふる', exact: true }).click()
  await expectReaction(page, 'wave', 4)
  expect(await storedGame(page)).toEqual(saved)
  expect(errors).toEqual([])
})

test('dragging, rubbing and flicking have distinct reactions with no extra release click', async ({
  page,
}) => {
  const saved = await storedGame(page)
  let point = await center(page)
  await page.mouse.move(point.x, point.y)
  await page.mouse.down()
  await page.mouse.move(point.x + 20, point.y, { steps: 4 })
  // A deliberate slow stroke exceeds the flick window without remaining stationary.
  await page.waitForTimeout(450)
  await page.mouse.move(point.x + 50, point.y, { steps: 4 })
  await expect(pet(page)).toHaveAttribute('data-gesture', 'stroke')
  await expect(pet(page)).toHaveClass(/is-touching/)
  expect(
    await pet(page).evaluate((element) =>
      Number.parseFloat((element as HTMLElement).style.getPropertyValue('--gesture-x')),
    ),
  ).toBeGreaterThan(0)
  await page.mouse.up()
  await expectReaction(page, 'pet', 1)
  await expect(pet(page)).not.toHaveClass(/is-touching/)

  point = await center(page)
  await page.mouse.move(point.x, point.y)
  await page.mouse.down()
  for (const offset of [28, -28, 28]) {
    await page.mouse.move(point.x + offset, point.y, { steps: 4 })
  }
  await expect(pet(page)).toHaveAttribute('data-gesture', 'rub')
  await expectReaction(page, 'tickle', 2)
  await page.mouse.up()
  await expectReaction(page, 'tickle', 2)

  point = await center(page)
  await page.mouse.move(point.x, point.y)
  await page.mouse.down()
  await page.mouse.move(point.x, point.y - 120)
  await page.mouse.up()
  await expectReaction(page, 'flick', 3)
  expect(await storedGame(page)).toEqual(saved)
})

test('holding responds once before release and pointer capture completes a stroke outside the character', async ({
  page,
}) => {
  const saved = await storedGame(page)
  let point = await center(page)
  await page.mouse.move(point.x, point.y)
  await page.mouse.down()
  await expectReaction(page, 'cuddle', 1)
  await expect(pet(page)).toHaveAttribute('data-gesture', 'hold')
  // Keep holding through another hold interval; one press still produces only one reaction.
  await page.waitForTimeout(700)
  await expectReaction(page, 'cuddle', 1)
  await page.mouse.up()
  await expectReaction(page, 'cuddle', 1)

  point = await center(page)
  const petBox = (await pet(page).boundingBox())!
  await page.mouse.move(point.x, point.y)
  await page.mouse.down()
  await page.mouse.move(petBox.x + petBox.width + 70, point.y, { steps: 8 })
  await page.mouse.up()
  await expectReaction(page, 'pet', 2)
  await expect(pet(page)).not.toHaveAttribute('data-gesture')
  expect(await storedGame(page)).toEqual(saved)
})

test('canceled pointers and drags from blank portrait space never become accidental pokes', async ({
  page,
}) => {
  const point = await center(page)
  await page.mouse.move(point.x, point.y)
  await page.mouse.down()
  await surface(page).dispatchEvent('pointercancel', {
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    bubbles: true,
  })
  await page.mouse.up()
  // Give the canceled hold timer enough time to reveal a cleanup error.
  await page.waitForTimeout(750)
  await expect(pet(page)).not.toHaveAttribute('data-interaction')
  await expect(pet(page)).not.toHaveAttribute('data-gesture')
  await expect(status(page)).toBeEmpty()

  const blank = await blankAboveCharacter(page)
  await page.mouse.move(blank.x, blank.y)
  await page.mouse.down()
  await page.mouse.move(point.x, point.y, { steps: 8 })
  await expect(pet(page)).not.toHaveClass(/is-touching/)
  await page.mouse.up()
  await expect(pet(page)).not.toHaveAttribute('data-interaction')
  await expect(status(page)).toBeEmpty()

  await page.mouse.click(point.x, point.y)
  await expectReaction(page, 'poke', 1)
})

test('reduced motion preserves direct gestures and feedback without animating the character', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const body = pet(page).locator('.pet-body')
  const point = await center(page)
  await page.mouse.move(point.x, point.y)
  await page.mouse.down()
  await page.mouse.move(point.x + 48, point.y, { steps: 5 })
  await expect(pet(page)).toHaveAttribute('data-gesture', 'stroke')
  expect(await body.evaluate((element) => getComputedStyle(element).transform)).toBe('none')
  await page.mouse.up()
  await expectReaction(page, 'pet', 1)
  await expect
    .poll(() =>
      pet(page).evaluate(
        (element) =>
          element
            .getAnimations({ subtree: true })
            .filter((animation) => animation.pending || animation.playState === 'running').length,
      ),
    )
    .toBe(0)
  await expect(status(page)).toBeVisible()
})

test.describe('touch gestures', () => {
  test.use({ viewport: { width: 390, height: 568 }, isMobile: true, hasTouch: true })

  test('real touch taps and rubs react once while swiping outside the character still scrolls', async ({
    page,
  }) => {
    const saved = await storedGame(page)
    // Supply scrollable content even when the room itself fills exactly one viewport.
    await page.evaluate(() => {
      const spacer = document.createElement('div')
      spacer.style.height = '600px'
      spacer.setAttribute('aria-hidden', 'true')
      document.body.append(spacer)
    })
    const session = await page.context().newCDPSession(page)
    let point = await center(page)
    await touch(session, 'touchStart', [{ ...point, id: 1 }])
    await touch(session, 'touchEnd', [])
    await expectReaction(page, 'poke', 1)

    point = await center(page)
    await touch(session, 'touchStart', [{ ...point, id: 1 }])
    for (const offset of [28, -28, 28]) {
      await touch(session, 'touchMove', [{ x: point.x + offset, y: point.y, id: 1 }])
    }
    await expect(pet(page)).toHaveAttribute('data-gesture', 'rub')
    await touch(session, 'touchEnd', [])
    await expectReaction(page, 'tickle', 2)
    expect(await page.evaluate(() => scrollY)).toBe(0)

    // Even the empty part of the portrait button must retain native scrolling.
    const scrollStart = await blankAboveCharacter(page)
    await touch(session, 'touchStart', [{ ...scrollStart, id: 1 }])
    for (let step = 1; step <= 8; step += 1) {
      await touch(session, 'touchMove', [{ x: scrollStart.x, y: scrollStart.y - step * 15, id: 1 }])
      await page.waitForTimeout(16)
    }
    await touch(session, 'touchEnd', [])
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(40)
    await expect(pet(page)).toHaveAttribute('data-reaction-sequence', '2')
    expect(await storedGame(page)).toEqual(saved)
    await session.detach()
  })

  test('a second finger cancels the pending gesture without an accidental tap or hold', async ({
    page,
  }) => {
    const session = await page.context().newCDPSession(page)
    const point = await center(page)
    const first = { ...point, id: 1 }
    const second = { x: point.x + 20, y: point.y, id: 2 }
    await touch(session, 'touchStart', [first])
    await touch(session, 'touchStart', [first, second])
    await page.waitForTimeout(750)
    await touch(session, 'touchEnd', [])
    await expect(pet(page)).not.toHaveAttribute('data-interaction')
    await expect(pet(page)).not.toHaveAttribute('data-gesture')
    await expect(status(page)).toBeEmpty()
    await touch(session, 'touchStart', [first])
    await touch(session, 'touchEnd', [])
    await expectReaction(page, 'poke', 1)
    await session.detach()
  })
})
