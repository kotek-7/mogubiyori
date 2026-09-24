import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { GameState } from '../../src/game'
import { chooseStarter, journey, storedGame, waitForSceneMotion } from './helpers'

const scenes = [
  'welcome',
  'tutorial-growth',
  'tutorial-friends',
  'tutorial-cards',
  'tutorial-streak',
] as const

function gameProgress(state: GameState) {
  return Object.fromEntries(Object.entries(state).filter(([key]) => key !== 'tutorial'))
}

async function expectPracticeOnly(page: Page, before: GameState) {
  expect(gameProgress(await storedGame(page))).toEqual(gameProgress(before))
}

async function action(page: Page, name: string, checkLayout = false) {
  const button = journey(page).getByRole('button', { name, exact: true })
  await expect(button).toBeVisible()
  await expect(button).toBeEnabled()
  if (checkLayout) {
    await waitForSceneMotion(page)
    await expect(
      journey(page).locator(
        'button.journey-primary, button.tutorial-collection-action, button.tutorial-discovery-card',
      ),
    ).toHaveCount(1)
    const box = await button.boundingBox()
    const viewport = page.viewportSize()!
    expect(box, name).not.toBeNull()
    expect(box!.y, name).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height, name).toBeLessThanOrEqual(viewport.height)
    expect(box!.x, name).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width, name).toBeLessThanOrEqual(viewport.width)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `${name}: no horizontal overflow`,
    ).toBe(true)
  }
  await button.click()
}

async function practice(page: Page, step: number, checkLayout = false) {
  const screen = journey(page, scenes[step])
  await expect(screen).toBeVisible()
  if (step === 0) {
    await action(page, 'ごはんをあげてみる', checkLayout)
    await expect(screen.locator('.tutorial-xp-panel')).toContainText('+45 XP')
    await expect(screen.getByRole('progressbar', { name: '最初の成長まで' })).toHaveAttribute(
      'aria-valuenow',
      '45',
    )
  } else if (step === 1) {
    await action(page, '育った姿を見る', checkLayout)
    await expect(screen.locator('.tutorial-evolution .pet-art')).toHaveClass(/pet-stage-1/)
    await action(page, 'もっと育った姿を見る', checkLayout)
    await expect(screen.locator('.tutorial-evolution .pet-art')).toHaveClass(/pet-stage-2/)
  } else if (step === 2) {
    await action(page, 'まめを選ぶ', checkLayout)
    await action(page, 'まめにごはんをあげる', checkLayout)
    await expect(screen.locator('.tutorial-collection-result')).toHaveText('まめが仲間になりました')
    await expect(screen.getByRole('button', { name: 'まめを選ぶ', exact: true })).toHaveClass(
      /is-joined/,
    )
  } else if (step === 3) {
    await action(page, 'カレーのカードを見る', checkLayout)
    await expect(screen).toContainText('材料')
    await action(page, 'カードの獲得を見る', checkLayout)
    await expect(screen.locator('.tutorial-collected-card')).toHaveText('カレー')
    await expect(screen.locator('.tutorial-card-reward')).toHaveText('+70コイン')
  } else {
    await action(page, '翌日のごはんを記録する', checkLayout)
    await expect(screen.locator('.tutorial-day-count')).toHaveText('2日連続')
    await action(page, '翌日のごはんを記録する', checkLayout)
    await expect(screen.locator('.tutorial-day-count')).toHaveText('3日連続')
    await expect(screen.locator('.tutorial-streak-prize.is-earned')).toHaveText(
      '3日連続ボーナス +30',
    )
  }
}

async function nextLesson(
  page: Page,
  step: number,
  { checkLayout = false, replay = false }: { checkLayout?: boolean; replay?: boolean } = {},
) {
  await action(page, 'つづける', checkLayout)
  await expect(journey(page, scenes[step + 1])).toBeVisible()
  await expect
    .poll(async () => (await storedGame(page)).tutorial)
    .toEqual({
      version: 1,
      step: replay ? 4 : step + 1,
      status: replay ? 'completed' : 'active',
    })
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-24T03:00:00Z'))
  await page.goto('/')
})

test('five hands-on lessons resume after reload and never award real game progress', async ({
  page,
}) => {
  test.setTimeout(60000)
  await chooseStarter(page)
  const before = await storedGame(page)
  for (let step = 0; step < scenes.length; step += 1) {
    await page.reload()
    await expect(journey(page, scenes[step])).toBeVisible()
    expect((await storedGame(page)).tutorial).toEqual({ version: 1, step, status: 'active' })
    await practice(page, step)
    await expectPracticeOnly(page, before)
    if (step < scenes.length - 1) await nextLesson(page, step)
  }
  await action(page, 'はじめてのごはんへ')
  await expect(journey(page, 'photo')).toBeVisible()
  expect((await storedGame(page)).tutorial).toEqual({ version: 1, step: 4, status: 'completed' })
  await expectPracticeOnly(page, before)
  await page.getByRole('button', { name: 'ひろばへ', exact: true }).click()
  await page.reload()
  await expect(page.locator('.play-pet .pet-art')).toHaveClass(/pet-stage-0/)
  await expect(
    page.getByRole('button', { name: 'チュートリアルを続ける', exact: true }),
  ).toHaveCount(0)
})

test('a paused lesson can resume and completed guidance can replay without changing the save', async ({
  page,
}) => {
  test.setTimeout(90000)
  await chooseStarter(page)
  const before = await storedGame(page)
  for (let step = 0; step < 2; step += 1) {
    await practice(page, step)
    await nextLesson(page, step)
  }
  await action(page, 'ひろばを見てみる')
  await expect(journey(page)).toHaveCount(0)
  expect((await storedGame(page)).tutorial).toEqual({ version: 1, step: 2, status: 'paused' })
  await page.reload()
  await expect(journey(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'チュートリアルを続ける', exact: true }).click()
  await expect(journey(page, 'tutorial-friends')).toBeVisible()
  for (let step = 2; step < scenes.length; step += 1) {
    await practice(page, step)
    if (step < scenes.length - 1) await nextLesson(page, step)
  }
  await action(page, 'あとで記録する')
  await expect(journey(page)).toHaveCount(0)
  expect((await storedGame(page)).tutorial.status).toBe('completed')
  await expectPracticeOnly(page, before)
  const completed = await storedGame(page)

  await page.getByRole('button', { name: '設定', exact: true }).click()
  await page.getByRole('button', { name: 'チュートリアルをもう一度', exact: true }).click()
  await expect(journey(page, 'welcome')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  for (let step = 0; step < scenes.length; step += 1) {
    await practice(page, step)
    if (step < scenes.length - 1) await nextLesson(page, step, { replay: true })
  }
  await action(page, 'ひろばへ')
  await expect(journey(page)).toHaveCount(0)
  expect(await storedGame(page)).toEqual(completed)
})

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
]) {
  test(`${viewport.width}×${viewport.height} lessons keep every next action visible`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(60000)
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await chooseStarter(page)
    for (let step = 0; step < scenes.length; step += 1) {
      await practice(page, step, true)
      if (step < scenes.length - 1) await nextLesson(page, step, { checkLayout: true })
    }
    const laterButton = await page
      .getByRole('button', { name: 'あとで記録する', exact: true })
      .boundingBox()
    expect(laterButton).not.toBeNull()
    expect(laterButton!.y + laterButton!.height).toBeLessThanOrEqual(viewport.height)
    await page.screenshot({ path: testInfo.outputPath(`tutorial-streak-${viewport.width}.png`) })
    await action(page, 'はじめてのごはんへ', true)
    await expect(journey(page, 'photo')).toBeVisible()
  })
}

test('visitor choices, the recipe lesson and the streak reward are accessible', async ({
  page,
}) => {
  test.setTimeout(90000)
  await page.setViewportSize({ width: 390, height: 844 })
  await chooseStarter(page)
  const check = async (label: string) => {
    await waitForSceneMotion(page)
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(result.violations, label).toEqual([])
  }
  for (let step = 0; step < 2; step += 1) {
    await practice(page, step)
    await nextLesson(page, step)
  }
  await check('visitor choices')
  await practice(page, 2)
  await nextLesson(page, 2)
  await action(page, 'カレーのカードを見る')
  await expect(journey(page)).toContainText('材料')
  await check('recipe lesson')
  await action(page, 'カードの獲得を見る')
  await nextLesson(page, 3)
  await practice(page, 4)
  await check('streak reward')
})
