import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { navigate, start, storedGame, waitForSceneMotion } from './helpers'

const pet = (page: Page) => page.getByRole('button', { name: 'こむぎをなでる', exact: true })
const status = (page: Page) => page.locator('.companion-reaction-status')

async function expectReaction(page: Page, action: string, sequence: number) {
  await expect(pet(page)).toHaveAttribute('data-interaction', action)
  await expect(pet(page)).toHaveAttribute('data-reaction-sequence', String(sequence))
  await expect(pet(page)).toHaveAttribute('data-reaction', /\S+/)
  await expect(pet(page)).toHaveAttribute('data-motion', /\S+/)
  await expect(status(page)).toHaveText(/^こむぎが.+/)
  await expect(pet(page).locator('.companion-reaction-effects')).toBeVisible()
}

async function reactionDuration(button: Locator) {
  return button.evaluate((element) =>
    Number.parseFloat((element as HTMLElement).style.getPropertyValue('--reaction-duration')),
  )
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await start(page)
  await waitForSceneMotion(page)
})

test('repeated interactions vary, restart their lifetime and leave the saved game unchanged', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  const before = await storedGame(page)
  const now = new Date()
  await page.clock.install({ time: now })
  await page.clock.pauseAt(new Date(now.getTime() + 1000))
  const reactions: string[] = []
  for (let sequence = 1; sequence <= 6; sequence += 1) {
    await pet(page).click()
    await expectReaction(page, 'poke', sequence)
    const id = (await pet(page).getAttribute('data-reaction'))!
    expect(reactions.slice(-3), 'recent reactions should not repeat immediately').not.toContain(id)
    if (sequence >= 3) expect(id).toMatch(/^poke\.rapid\./)
    reactions.push(id)
  }

  const previousDuration = await reactionDuration(pet(page))
  expect(previousDuration).toBeGreaterThan(200)
  await page.clock.fastForward(previousDuration - 100)
  await page.getByRole('button', { name: 'こむぎをくすぐる', exact: true }).click()
  await expectReaction(page, 'tickle', 7)
  const latestReaction = await pet(page).getAttribute('data-reaction')
  const latestStatus = await status(page).textContent()
  const latestDuration = await reactionDuration(pet(page))

  // Cross the previous reaction's deadline while the newer reaction is still active.
  await page.clock.fastForward(200)
  await expectReaction(page, 'tickle', 7)
  await expect(pet(page)).toHaveAttribute('data-reaction', latestReaction!)
  await expect(status(page)).toHaveText(latestStatus!)
  expect(await storedGame(page)).toEqual(before)

  await page.clock.fastForward(latestDuration)
  await expect(pet(page)).not.toHaveAttribute('data-reaction')
  await expect(status(page)).toBeEmpty()
  await expect(pet(page).locator('.companion-reaction-effects')).toHaveCount(0)
  expect(await storedGame(page)).toEqual(before)
  expect(errors).toEqual([])
})

test('all interactions work with the keyboard and returning to the plaza clears the reaction', async ({
  page,
}) => {
  const controls = page.getByRole('group', { name: 'こむぎとふれあう' })
  await expect(controls.getByRole('button')).toHaveCount(2)
  await pet(page).focus()
  await pet(page).press('Enter')
  await expectReaction(page, 'pet', 1)
  const tickle = controls.getByRole('button', { name: 'こむぎをくすぐる', exact: true })
  await tickle.focus()
  await tickle.press('Space')
  await expectReaction(page, 'tickle', 2)
  await expect(tickle).toBeFocused()
  const wave = controls.getByRole('button', { name: 'こむぎに手をふる', exact: true })
  await wave.focus()
  await wave.press('Enter')
  await expectReaction(page, 'wave', 3)
  await expect(wave).toBeFocused()
  await expect(status(page)).toHaveAttribute('role', 'status')
  await expect(status(page)).toHaveAttribute('aria-live', 'polite')
  expect((await pet(page).getAttribute('aria-describedby'))?.split(' ')).toContain(
    await status(page).getAttribute('id'),
  )

  await navigate(page, 'ずかん')
  await navigate(page, 'ひろば')
  await expect(pet(page)).not.toHaveAttribute('data-reaction')
  await expect(status(page)).toBeEmpty()
})

test('reduced motion keeps the facial response and announcement without moving the character', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const portrait = pet(page).locator('.pet-art')
  await expect(portrait).toHaveClass(/pet-hungry/)
  const idleArt = await portrait.innerHTML()
  await page.getByRole('button', { name: 'こむぎに手をふる', exact: true }).click()
  await expectReaction(page, 'wave', 1)
  await expect(portrait).not.toHaveClass(/pet-hungry/)
  expect(await portrait.innerHTML()).not.toBe(idleArt)
  await expect
    .poll(() =>
      pet(page).evaluate((element) =>
        element
          .getAnimations({ subtree: true })
          .filter((animation) => animation.pending || animation.playState === 'running')
          .map((animation) => animation.id),
      ),
    )
    .toEqual([])
  await expect(status(page)).toBeVisible()
})

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
]) {
  test(`interaction controls stay usable without overlap at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const state = await storedGame(page)
    state.companions.push(
      { id: 'mame', xp: 0, joinedDay: state.today },
      { id: 'shizuku', xp: 0, joinedDay: state.today },
    )
    await page.evaluate((newValue) => {
      const key = 'mogubiyori-v1'
      const oldValue = localStorage.getItem(key)
      localStorage.setItem(key, newValue)
      window.dispatchEvent(
        new StorageEvent('storage', {
          key,
          oldValue,
          newValue,
          storageArea: localStorage,
          url: location.href,
        }),
      )
    }, JSON.stringify(state))
    const friends = page.locator('.play-friend-count')
    await expect(friends).toContainText('3/6')
    const controls = page.getByRole('group', { name: 'こむぎとふれあう' })
    await controls.getByRole('button', { name: 'こむぎに手をふる', exact: true }).click()
    await expectReaction(page, 'wave', 1)
    const rectangles = []
    for (const button of await controls.getByRole('button').all()) {
      const box = await button.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.y).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
      expect(
        await button.evaluate((element) => {
          const bounds = element.getBoundingClientRect()
          const foreground = document.elementFromPoint(
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2,
          )
          return foreground === element || element.contains(foreground)
        }),
        'the companion and its feedback must not cover an interaction control',
      ).toBe(true)
      rectangles.push(box!)
    }
    const [first, second] = rectangles
    expect(first.x + first.width).toBeLessThanOrEqual(second.x)
    const friendsBox = await friends.boundingBox()
    expect(friendsBox).not.toBeNull()
    expect(friendsBox!.x + friendsBox!.width).toBeLessThanOrEqual(first.x)
    expect(
      await friends.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        const foreground = document.elementFromPoint(
          bounds.x + bounds.width / 2,
          bounds.y + bounds.height / 2,
        )
        return foreground === element || element.contains(foreground)
      }),
      'the companion collection must stay clickable beside the interaction controls',
    ).toBe(true)
    const feedback = await status(page).boundingBox()
    expect(feedback).not.toBeNull()
    expect(feedback!.y + feedback!.height).toBeLessThanOrEqual(first.y)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await testInfo.attach(`companion-interaction-${viewport.width}`, {
      body: await page.screenshot({
        path: testInfo.outputPath(`interaction-${viewport.width}.png`),
      }),
      contentType: 'image/png',
    })
  })
}
