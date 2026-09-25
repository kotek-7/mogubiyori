import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { GameState } from '../../src/app/game/browserGame'
import { chooseStarter, journey, storedGame, waitForSceneMotion } from './helpers'

const scenes = [
  'welcome',
  'tutorial-growth',
  'tutorial-friends',
  'tutorial-cards',
  'tutorial-streak',
] as const
const chapters = [
  'ごはんをあげる',
  '姿を育てる',
  'なかまをふやす',
  '料理カードを集める',
  '自炊を続ける',
]
const internalActions = (page: Page) =>
  journey(page).locator('button.tutorial-step-action, button.tutorial-recipe-target')

async function expectPracticeOnly(page: Page, before: GameState) {
  const progress = (state: GameState) =>
    Object.fromEntries(Object.entries(state).filter(([key]) => key !== 'tutorial'))
  expect(progress(await storedGame(page))).toEqual(progress(before))
}

async function firstMeal(page: Page) {
  const screen = journey(page, 'welcome')
  await screen.getByRole('button', { name: 'サンプル写真を使う', exact: true }).click()
  await expect(screen.getByRole('img', { name: 'サンプルのカレー写真' })).toBeVisible()
  await screen.getByRole('button', { name: 'この写真でごはんをあげる', exact: true }).click()
  await expect(screen.locator('.tutorial-meal-world')).toHaveClass(/is-eating/)
  await expect(screen.locator('.tutorial-meal-world')).toHaveClass(/is-full/)
  await expect(screen.locator('.tutorial-xp-panel')).toContainText('+45 XP')
  await expect(screen.getByRole('progressbar', { name: '最初の成長まで' })).toHaveAttribute(
    'aria-valuenow',
    '45',
  )
}

async function nextLesson(page: Page, step: number, replay = false) {
  await journey(page)
    .getByRole('button', { name: `次の章へ：${chapters[step + 1]}`, exact: true })
    .click()
  await expect(journey(page, scenes[step + 1])).toBeVisible()
  await expect
    .poll(async () => (await storedGame(page)).tutorial)
    .toMatchObject({
      version: 1,
      step: replay ? 4 : step + 1,
      status: replay ? 'completed' : 'active',
    })
}

async function skipToChapter(page: Page, step: number, replay = false) {
  await firstMeal(page)
  for (let current = 0; current < step; current += 1) await nextLesson(page, current, replay)
}

function demoPhase(page: Page, step: number) {
  const screen = journey(page, scenes[step])
  return screen.locator(
    step === 1
      ? '.tutorial-evolution .pet-art'
      : step === 2
        ? '.tutorial-friends-lesson'
        : '.tutorial-recipe-lab',
  )
}

async function readDemoPhase(page: Page, step: number) {
  return demoPhase(page, step).getAttribute(step === 1 ? 'class' : 'data-phase')
}

async function expectDemoStart(page: Page, step: number) {
  if (step === 1) await expect(demoPhase(page, step)).toHaveClass(/pet-stage-0/)
  else
    await expect(demoPhase(page, step)).toHaveAttribute(
      'data-phase',
      step === 2 ? 'waiting' : 'cooking',
    )
}

async function watchDemo(page: Page, step: number) {
  const screen = journey(page, scenes[step])
  const guide = screen.getByRole('region', { name: 'あそびかたガイド' })
  const guidance = await guide.locator('p').textContent()
  await expect(internalActions(page)).toHaveCount(0)
  await expect(screen.locator('.tutorial-chapter-next')).toBeEnabled()
  if (step === 1) {
    await expect(demoPhase(page, step)).toHaveClass(/pet-stage-1/)
    await expect(demoPhase(page, step)).toHaveClass(/pet-stage-2/)
    await expect(guide).toContainText('5')
    const silhouettes = screen.locator('.tutorial-lesson .pet-art:not(.pet-stage-0) .pet-body')
    expect(await silhouettes.count()).toBeGreaterThan(0)
    for (const body of await silhouettes.all()) {
      await expect(body).toHaveCSS('filter', 'brightness(0)')
      await expect(body).toHaveCSS('opacity', '0.72')
    }
  } else if (step === 2) {
    for (const phase of ['aroma', 'noticed', 'visiting', 'joined', 'home']) {
      await expect(demoPhase(page, step)).toHaveAttribute('data-phase', phase)
      await expect(guide.locator('p')).toHaveText(guidance!)
    }
    await expect(screen.locator('.tutorial-friend-growth')).toContainText('まめ')
    await expect(screen.locator('.tutorial-friend-growth')).toContainText('+45 XP')
    await expect(guide).toContainText('わんぱく')
    await expect(guide).toContainText('なかま')
  } else if (step === 3) {
    for (const phase of ['capturing', 'photo', 'earned', 'board', 'browse', 'recipe']) {
      await expect(demoPhase(page, step)).toHaveAttribute('data-phase', phase)
      await expect(guide.locator('p')).toHaveText(guidance!)
      if (phase === 'earned')
        await expect(screen.getByRole('status', { name: '初回ボーナス 70コイン' })).toBeVisible()
      if (phase === 'board') {
        await expect(
          screen.getByRole('group', { name: '料理カード 1/30', exact: true }),
        ).toBeVisible()
        await expect(screen.getByRole('group', { name: '70コイン', exact: true })).toBeVisible()
      }
    }
    await expect(screen.getByRole('heading', { name: /おかかのおにぎり/ })).toBeVisible()
    await expect(screen.getByRole('list', { name: '材料', exact: true })).toBeVisible()
    await expect(guide).toContainText('AI')
    await expect(guide).toContainText('材料と作り方')
  } else {
    const celebration = screen.getByRole('group', { name: '連続記録', exact: true })
    await expect(celebration.locator('.streak-celebration-number strong')).toHaveText('3', {
      timeout: 15000,
    })
    await expect(celebration).toHaveAttribute('data-phase', 'complete')
    await expect(celebration.getByRole('listitem', { name: /記録済み$/ })).toHaveCount(3)
    await expect(celebration.locator('.streak-celebration-prize')).toHaveAttribute(
      'aria-hidden',
      'false',
    )
    await expect(celebration.locator('.streak-celebration-prize')).toContainText('+30')
    await expect(celebration.locator('.streak-celebration-prize')).toContainText('おやすみチケット')
    await expect(guide).toContainText('3日続けると30コイン')
    await expect(guide).toContainText('レポート')
  }
  await expect(guide.locator('p')).toHaveText(guidance!)
  await expect(screen).toBeVisible()
  await expect(screen.locator('.tutorial-chapter-next')).toBeEnabled()
  if (step < 4) {
    await expect(screen.getByRole('button', { name: 'デモを一時停止', exact: true })).toHaveCount(0)
    await expect(screen.getByRole('button', { name: '最初から見る', exact: true })).toBeVisible()
  }
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-24T03:00:00Z'))
  await page.goto('/')
})

test('seven taps reach the plaza without waiting for chapter demonstrations', async ({ page }) => {
  await chooseStarter(page)
  const before = await storedGame(page)
  await page.evaluate(() => {
    document.documentElement.dataset.tutorialTaps = '0'
    document.addEventListener('click', () => {
      const root = document.documentElement
      root.dataset.tutorialTaps = String(Number(root.dataset.tutorialTaps) + 1)
    })
  })
  await firstMeal(page)
  for (let step = 0; step < scenes.length - 1; step += 1) {
    await nextLesson(page, step)
    await expect(internalActions(page)).toHaveCount(0)
    await expect(journey(page).locator('.tutorial-chapter-next')).toBeEnabled()
    if (step < 3) await expectDemoStart(page, step + 1)
  }
  await journey(page).getByRole('button', { name: 'ひろばへ', exact: true }).click()
  await expect(journey(page)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'ひろば', exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'ひろばのガイド', exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-tutorial-taps', '7')
  expect((await storedGame(page)).tutorial).toEqual({
    version: 1,
    step: 4,
    status: 'completed',
    homeGuide: 'meal',
  })
  await expectPracticeOnly(page, before)
  await page.reload()
  await expect(journey(page)).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'ひろばのガイド', exact: true })).toBeVisible()
  await expect(page.locator('.play-pet .pet-art')).toHaveClass(/pet-stage-0/)
  await page.locator('.play-feed').click()
  await expect(journey(page, 'photo')).toBeVisible()
  await expectPracticeOnly(page, before)
})

test('automatic demonstrations retain each lesson and never award saved game progress', async ({
  page,
}) => {
  test.setTimeout(90000)
  await chooseStarter(page)
  const before = await storedGame(page)
  await firstMeal(page)
  for (let step = 1; step < scenes.length; step += 1) {
    await nextLesson(page, step - 1)
    await page.reload()
    await expect(journey(page, scenes[step])).toBeVisible()
    expect((await storedGame(page)).tutorial).toEqual({ version: 1, step, status: 'active' })
    await watchDemo(page, step)
    await expectPracticeOnly(page, before)
  }
})

test('demonstrations can pause, resume and restart without moving focus or chapters', async ({
  page,
}) => {
  test.setTimeout(60000)
  await chooseStarter(page)
  await skipToChapter(page, 1)
  const before = await storedGame(page)
  for (let step = 1; step <= 3; step += 1) {
    const screen = journey(page, scenes[step])
    await screen.getByRole('button', { name: 'デモを一時停止', exact: true }).click()
    const paused = await readDemoPhase(page, step)
    const resume = screen.getByRole('button', { name: 'デモを再生', exact: true })
    await expect(resume).toBeFocused()
    await page.waitForTimeout(2300)
    expect(await readDemoPhase(page, step)).toBe(paused)
    await expect(resume).toBeFocused()
    await resume.click()
    await expect.poll(() => readDemoPhase(page, step), { timeout: 5000 }).not.toBe(paused)
    await expect(screen.getByRole('button', { name: 'デモを一時停止', exact: true })).toBeFocused()
    if (step === 1) {
      await expect(demoPhase(page, step)).toHaveClass(/pet-stage-2/)
      const completed = screen.getByRole('button', { name: 'デモの再生完了', exact: true })
      await expect(completed).toHaveAttribute('aria-disabled', 'true')
      await expect(completed).toBeFocused()
    }
    await screen.getByRole('button', { name: '最初から見る', exact: true }).click()
    await expectDemoStart(page, step)
    await expectPracticeOnly(page, before)
    if (step < 3) await nextLesson(page, step)
  }
})

test('a paused chapter restarts and completed guidance replays without changing the save', async ({
  page,
}) => {
  test.setTimeout(60000)
  await chooseStarter(page)
  const before = await storedGame(page)
  await skipToChapter(page, 2)
  await expect(demoPhase(page, 2)).toHaveAttribute('data-phase', 'aroma')
  await journey(page).getByRole('button', { name: 'ひろばを見てみる', exact: true }).click()
  await expect(journey(page)).toHaveCount(0)
  expect((await storedGame(page)).tutorial).toEqual({ version: 1, step: 2, status: 'paused' })
  await page.reload()
  await page.getByRole('button', { name: 'チュートリアルを続ける', exact: true }).click()
  await expectDemoStart(page, 2)
  await nextLesson(page, 2)
  await nextLesson(page, 3)
  await journey(page).getByRole('button', { name: 'ひろばへ', exact: true }).click()
  await expect(journey(page)).toHaveCount(0)
  await expectPracticeOnly(page, before)
  const completed = await storedGame(page)
  await page.getByRole('button', { name: '設定', exact: true }).click()
  await page.getByRole('button', { name: 'チュートリアルをもう一度', exact: true }).click()
  await expect(journey(page, 'welcome')).toBeVisible()
  await skipToChapter(page, 4, true)
  expect(await storedGame(page)).toEqual(completed)
  await journey(page).getByRole('button', { name: 'ひろばへ', exact: true }).click()
  await expect(journey(page)).toHaveCount(0)
  expect(await storedGame(page)).toEqual(completed)
})

test('photo confirmation stays until feeding and interrupted photos reset', async ({ page }) => {
  await chooseStarter(page)
  const before = await storedGame(page)
  const screen = journey(page, 'welcome')
  const lesson = screen.locator('.tutorial-first-photo')
  await screen.getByRole('button', { name: 'サンプル写真を使う', exact: true }).click()
  await page.waitForTimeout(2000)
  await expect(lesson).toHaveAttribute('data-phase', 'photo')
  await expect(screen.locator('.tutorial-xp-panel')).toHaveCount(0)
  await expect(screen.locator('.tutorial-chapter-next')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(journey(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'チュートリアルを続ける', exact: true }).click()
  await expect(lesson).toHaveAttribute('data-phase', 'cooking')
  await screen.getByRole('button', { name: 'サンプル写真を使う', exact: true }).click()
  await page.reload()
  await expect(lesson).toHaveAttribute('data-phase', 'cooking')
  await expect(screen.locator('.tutorial-photo img')).toHaveCount(0)
  await firstMeal(page)
  await expectPracticeOnly(page, before)
})

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
]) {
  test(`${viewport.width}×${viewport.height} reduced-motion lessons keep actions visible and accessible`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000)
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await chooseStarter(page)
    await firstMeal(page)
    for (let step = 0; step < scenes.length; step += 1) {
      const screen = journey(page, scenes[step])
      if (step > 0 && step < 4)
        await screen.getByRole('button', { name: 'デモを一時停止', exact: true }).click()
      await waitForSceneMotion(page)
      for (const control of await screen
        .locator('.tutorial-chapter-next, .journey-secondary')
        .all()) {
        const box = await control.boundingBox()
        expect(box).not.toBeNull()
        expect(box!.x).toBeGreaterThanOrEqual(0)
        expect(box!.y).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(axe.violations, scenes[step]).toEqual([])
      const path = testInfo.outputPath(`${scenes[step]}-${viewport.width}.png`)
      await page.screenshot({ path })
      await testInfo.attach(scenes[step], { path, contentType: 'image/png' })
      if (step < 4) await nextLesson(page, step)
    }
    await journey(page).getByRole('button', { name: 'ひろばへ', exact: true }).click()
    await expect(journey(page)).toHaveCount(0)
  })
}
