import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {
  chooseStarter as chooseStarterState,
  claimLogin,
  initialGame,
} from '../../src/app/game/browserGame'
import {
  chooseStarter,
  completeConceptIntro,
  expectFocusedScene,
  journey,
  storedGame,
  waitForSceneMotion,
} from './helpers'

const day = '2026-09-26'
const scenes = ['intro-concept', 'intro-photo', 'intro-discovery'] as const
const headings = [
  'きみのごはんで、なかまが育つ',
  '今日の一皿を、おすそわけ',
  '次のごはんが、楽しみになる',
]

async function nextIntro(page: Page, step: number) {
  await journey(page, scenes[step])
    .getByRole('button', { name: step === 2 ? 'なかまを選ぶ' : 'つづける', exact: true })
    .click()
  await expect(journey(page, step === 2 ? 'choose' : scenes[step + 1])).toBeVisible()
}

async function expectOnlyIntroSaved(page: Page) {
  const initial = initialGame(day)
  expect(await storedGame(page)).toEqual({
    ...initial,
    tutorial: { ...initial.tutorial, introSeen: true },
  })
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(`${day}T03:00:00Z`))
  await page.goto('/')
})

test('the concept precedes selection and practice, with focused headings and back navigation', async ({
  page,
}) => {
  for (let step = 0; step < scenes.length; step += 1) {
    await expectFocusedScene(page, scenes[step])
    await expect(journey(page).getByRole('heading', { level: 1 })).toHaveText(headings[step])
    await expect(page.getByRole('button', { name: '設定', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '紹介をスキップ', exact: true })).toBeVisible()
    await expect(page.getByRole('group', { name: '最初のなかま' })).toHaveCount(0)
    await expect(journey(page, 'welcome')).toHaveCount(0)
    if (step > 0) {
      await page.getByRole('button', { name: '前の紹介に戻る', exact: true }).click()
      await expectFocusedScene(page, scenes[step - 1])
      await nextIntro(page, step - 1)
      await expectFocusedScene(page, scenes[step])
    }
    await nextIntro(page, step)
  }
  await expectOnlyIntroSaved(page)
  await chooseStarter(page)
  await expectFocusedScene(page, 'welcome')
})

test('finishing the introduction is saved before choosing a companion and survives reload', async ({
  page,
}) => {
  await completeConceptIntro(page)
  await expectOnlyIntroSaved(page)
  await page.reload()
  await expectFocusedScene(page, 'choose')
  await expect(page.locator('main[data-scene^="intro-"]')).toHaveCount(0)
  await expectOnlyIntroSaved(page)
})

test('an unfinished introduction can restart after reload without changing game progress', async ({
  page,
}) => {
  await nextIntro(page, 0)
  expect(await page.evaluate(() => localStorage.getItem('mogubiyori-v1'))).toBeNull()
  await page.reload()
  await expectFocusedScene(page, 'intro-concept')
  expect(await page.evaluate(() => localStorage.getItem('mogubiyori-v1'))).toBeNull()
})

for (const [step, scene] of scenes.entries()) {
  test(`skipping ${scene} saves the introduction and opens companion selection`, async ({
    page,
  }) => {
    for (let current = 0; current < step; current += 1) await nextIntro(page, current)
    await journey(page, scene).getByRole('button', { name: '紹介をスキップ', exact: true }).click()
    await expectFocusedScene(page, 'choose')
    await expectOnlyIntroSaved(page)
    await page.reload()
    await expect(journey(page, 'choose')).toBeVisible()
  })
}

test('existing players without an introduction marker return to their saved game', async ({
  page,
}) => {
  const state = claimLogin(chooseStarterState(initialGame(day), 'mame'))
  state.tutorial = { version: 1, step: 4, status: 'completed' }
  await page.evaluate((save) => localStorage.setItem('mogubiyori-v1', JSON.stringify(save)), state)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'ひろば', exact: true })).toBeVisible()
  await expect(page.locator('.play-name')).toContainText('まめ')
  await expect(page.locator('main[data-scene^="intro-"]')).toHaveCount(0)
  expect(await storedGame(page)).toEqual(state)
})

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
]) {
  test(`${viewport.width}x${viewport.height} introduction keeps actions visible and accessible`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    for (let step = 0; step < scenes.length; step += 1) {
      const screen = journey(page, scenes[step])
      await expect(screen).toBeVisible()
      await waitForSceneMotion(page)
      const primary = screen.getByRole('button', {
        name: step === 2 ? 'なかまを選ぶ' : 'つづける',
        exact: true,
      })
      const skip = screen.getByRole('button', { name: '紹介をスキップ', exact: true })
      for (const action of [primary, skip]) {
        await expect(action).toBeVisible()
        const bounds = await action.boundingBox()
        expect(bounds).not.toBeNull()
        expect(bounds!.x).toBeGreaterThanOrEqual(0)
        expect(bounds!.y).toBeGreaterThanOrEqual(0)
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width)
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(result.violations, scenes[step]).toEqual([])
      await page.screenshot({
        path: test.info().outputPath(`${viewport.width}-${scenes[step]}.png`),
      })
      await nextIntro(page, step)
    }
  })
}
