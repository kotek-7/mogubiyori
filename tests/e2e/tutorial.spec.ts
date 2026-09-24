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
const chapters = [
  'ごはんをあげる',
  '姿を育てる',
  'なかまをふやす',
  '料理カードを集める',
  '自炊を続ける',
]

const internalActions = (page: Page) =>
  journey(page).locator('button.tutorial-step-action, button.tutorial-recipe-target')

async function expectChapterLocked(page: Page) {
  await expect(journey(page).locator('button.tutorial-chapter-next')).toHaveCount(0)
  await expect(internalActions(page)).toHaveCount(1)
}

async function expectChapterReady(page: Page) {
  await expect(internalActions(page)).toHaveCount(0)
  await expect(journey(page).locator('button.tutorial-chapter-next')).toHaveCount(1)
}

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
  const kind = await button.evaluate((element) =>
    element.matches('.tutorial-chapter-next')
      ? 'chapter'
      : element.matches('.tutorial-step-action, .tutorial-recipe-target')
        ? 'internal'
        : 'secondary',
  )
  if (kind === 'chapter') await expectChapterReady(page)
  if (kind === 'internal') await expectChapterLocked(page)
  if (checkLayout) {
    await waitForSceneMotion(page)
    await expect(
      journey(page).locator(
        'button.tutorial-step-action, button.tutorial-chapter-next, button.tutorial-recipe-target',
      ),
    ).toHaveCount(1)
    const box = await button.boundingBox()
    const viewport = page.viewportSize()!
    expect(box, name).not.toBeNull()
    expect(box!.y, name).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height, name).toBeLessThanOrEqual(viewport.height)
    expect(box!.x, name).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width, name).toBeLessThanOrEqual(viewport.width)
    const secondary = journey(page).locator('button.journey-secondary')
    const isFinalAction =
      kind === 'chapter' && (await journey(page).getAttribute('data-scene')) === 'tutorial-streak'
    if (isFinalAction) await expect(secondary).toHaveCount(0)
    else {
      const secondaryBox = await secondary.boundingBox()
      expect(secondaryBox, `${name}: secondary action`).not.toBeNull()
      expect(
        secondaryBox!.y + secondaryBox!.height,
        `${name}: secondary action`,
      ).toBeLessThanOrEqual(viewport.height)
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `${name}: no horizontal overflow`,
    ).toBe(true)
    if (
      ['tutorial-friends', 'tutorial-cards'].includes(
        (await journey(page).getAttribute('data-scene'))!,
      )
    ) {
      expect(
        await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight),
        `${name}: the entire lesson fits in the viewport`,
      ).toBe(true)
    }
  }
  await button.click()
}

async function practice(
  page: Page,
  step: number,
  checkLayout = false,
  onCheckpoint?: (name: string) => Promise<void>,
) {
  const screen = journey(page, scenes[step])
  await expect(screen).toBeVisible()
  if (step === 0) {
    await action(page, 'ごはんをあげてみる', checkLayout)
    await expect(internalActions(page)).toBeDisabled()
    await expect(journey(page).locator('button.tutorial-chapter-next')).toHaveCount(0)
    await expect(screen.locator('.tutorial-xp-panel')).toContainText('+45 XP')
    await expect(screen.getByRole('progressbar', { name: '最初の成長まで' })).toHaveAttribute(
      'aria-valuenow',
      '45',
    )
    await expectChapterReady(page)
  } else if (step === 1) {
    await action(page, '育った姿を見る', checkLayout)
    await expect(screen.locator('.tutorial-evolution .pet-art')).toHaveClass(/pet-stage-1/)
    await expect(screen.locator('.tutorial-evolution .pet-body')).toHaveCSS(
      'filter',
      'brightness(0)',
    )
    await expect(screen.locator('.tutorial-evolution .pet-body')).toHaveCSS('opacity', '0.72')
    await action(page, 'もっと育った姿を見る', checkLayout)
    await expect(screen.locator('.tutorial-evolution .pet-art')).toHaveClass(/pet-stage-2/)
    const silhouettes = screen.locator('.tutorial-lesson .pet-art:not(.pet-stage-0) .pet-body')
    expect(await silhouettes.count()).toBeGreaterThan(0)
    for (const body of await silhouettes.all()) {
      await expect(body).toHaveCSS('filter', 'brightness(0)')
      await expect(body).toHaveCSS('opacity', '0.72')
    }
    await expectChapterReady(page)
  } else if (step === 2) {
    const lesson = screen.locator('.tutorial-friends-lesson')
    await expect(lesson).toHaveAttribute('data-phase', 'waiting')
    await expectChapterLocked(page)
    await expect(screen.locator('.tutorial-arriving-guest')).toHaveCount(0)
    await onCheckpoint?.('tutorial-friends-waiting')
    await action(page, 'こむぎにごはんをあげる', checkLayout)
    await expect(lesson).toHaveAttribute('data-phase', 'aroma')
    await expect(screen.locator('.tutorial-food-aroma')).toBeVisible()
    await expect(screen.locator('.tutorial-arriving-guest')).toHaveCount(0)
    await expect(screen.getByRole('region', { name: 'あそびかたガイド' })).toContainText(
      'おいしそうな匂いが広がっています。',
    )
    await onCheckpoint?.('tutorial-friends-aroma')
    await action(page, '匂いの先を見る', checkLayout)
    await expect(lesson).toHaveAttribute('data-phase', 'noticed')
    await expect(screen.locator('.tutorial-visitor-character')).toHaveClass(/is-distant/)
    await expect(screen.locator('.tutorial-visitor-reaction')).toBeVisible()
    await onCheckpoint?.('tutorial-friends-noticed')
    await action(page, '近くに呼ぶ', checkLayout)
    await expect(lesson).toHaveAttribute('data-phase', 'visiting')
    await expect(screen.locator('.tutorial-visitor-character')).toHaveClass(/is-near/)
    await expect(screen.locator('.tutorial-visitor-badge')).toContainText('お客さん')
    await expect(screen.getByRole('button', { name: /を選ぶ$/ })).toHaveCount(0)
    await onCheckpoint?.('tutorial-friends-visiting')
    await action(page, 'まめにごはんをあげる', checkLayout)
    await expect(internalActions(page)).toBeDisabled()
    await expect(screen.locator('button.tutorial-chapter-next')).toHaveCount(0)
    await expect(lesson).toHaveAttribute('data-phase', 'joined')
    await expect(screen.locator('.tutorial-collection-result')).toHaveText('まめが仲間になりました')
    const roster = screen.getByRole('region', { name: 'なかま 2匹', exact: true })
    await expect(roster.getByRole('listitem')).toHaveCount(2)
    await expect(roster).toContainText('こむぎ')
    await expect(roster).toContainText('まめ')
    await expectChapterLocked(page)
    await onCheckpoint?.('tutorial-friends-joined')
    await action(page, 'まめをひろばに呼ぶ', checkLayout)
    await expect(lesson).toHaveAttribute('data-phase', 'home')
    await expect(screen.locator('.tutorial-friend-growth')).toContainText('まめ')
    await expect(screen.locator('.tutorial-friend-growth')).toContainText('うまれたて')
    await expect(screen.locator('.tutorial-friend-growth')).toContainText('+45 XP')
    await expect(screen.getByRole('progressbar', { name: 'まめの次の成長まで' })).toHaveAttribute(
      'aria-valuenow',
      '45',
    )
    await expectChapterReady(page)
    await onCheckpoint?.('tutorial-friends-home')
  } else if (step === 3) {
    const lesson = screen.locator('.tutorial-recipe-lab')
    await expect(lesson).toHaveAttribute('data-phase', 'cooking')
    await expectChapterLocked(page)
    await onCheckpoint?.('tutorial-cards-cooking')
    await action(page, 'カレーの写真を撮る', checkLayout)
    await expect(lesson).toHaveAttribute('data-phase', 'photo')
    await expectChapterLocked(page)
    await onCheckpoint?.('tutorial-cards-photo')
    await action(page, 'この写真を記録する', checkLayout)
    await expect(lesson).toHaveAttribute('data-phase', 'earned')
    const reward = screen.getByRole('status', { name: '初回ボーナス 70コイン', exact: true })
    await expect(reward).toBeVisible()
    await expect(reward).toContainText('+70')
    await expectChapterLocked(page)
    await onCheckpoint?.('tutorial-cards-earned')
    await action(page, 'ずかんを見る', checkLayout)
    await expect(lesson).toHaveAttribute('data-phase', 'board')
    const board = screen.locator('.tutorial-recipe-board')
    await expect(board.locator('.is-filled')).toContainText('カレー')
    await expect(
      screen.getByRole('group', { name: 'レシピカード 1/10', exact: true }),
    ).toBeVisible()
    const wallet = screen.getByRole('group', { name: '70コイン', exact: true })
    await expect(wallet).toBeVisible()
    await expect(wallet.locator('strong')).toHaveText('70')
    await expectChapterLocked(page)
    await onCheckpoint?.('tutorial-cards-board')
    await action(page, 'おにぎりのレシピを見る', checkLayout)
    await expect(lesson).toHaveAttribute('data-phase', 'recipe')
    await expect(screen.getByRole('heading', { name: /おかかのおにぎり/ })).toBeVisible()
    await expect(screen.getByRole('list', { name: '材料', exact: true })).toBeVisible()
    await expectChapterReady(page)
    await onCheckpoint?.('tutorial-cards-recipe')
  } else {
    const celebration = screen.getByRole('group', { name: '自炊の連続記録', exact: true })
    const reducedMotion = await page.evaluate(
      () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    )
    await expect(celebration.locator('.streak-celebration-number strong')).toHaveText('0')
    await expect(celebration.getByRole('listitem', { name: /記録済み$/ })).toHaveCount(0)
    await onCheckpoint?.('tutorial-streak-empty')
    for (let day = 1; day <= 3; day += 1) {
      await action(page, `${day}日目のごはんを記録する`, checkLayout)
      if (!reducedMotion) {
        if (day < 3) await expect(internalActions(page)).toBeDisabled()
        else await expect(internalActions(page)).toHaveCount(0)
        await expect(screen.locator('button.tutorial-chapter-next')).toHaveCount(0)
      }
      await expect(
        celebration.getByRole('listitem', { name: `${day}日目 記録済み`, exact: true }),
      ).toBeVisible()
      await expect(celebration).toHaveAttribute('data-phase', 'complete')
      await expect(celebration.getByRole('listitem', { name: /記録済み$/ })).toHaveCount(day)
      await expect(celebration.locator('.streak-celebration-number strong')).toHaveText(String(day))
      if (day < 3) await expectChapterLocked(page)
      else await expectChapterReady(page)
      await onCheckpoint?.(`tutorial-streak-day-${day}`)
    }
    await expect(celebration.locator('.streak-celebration-prize')).toHaveAttribute(
      'aria-hidden',
      'false',
    )
    await expect(celebration.locator('.streak-celebration-prize')).toContainText('3日連続ボーナス')
    await expect(celebration.locator('.streak-celebration-prize strong')).toContainText('+30')
  }
}

async function nextLesson(
  page: Page,
  step: number,
  { checkLayout = false, replay = false }: { checkLayout?: boolean; replay?: boolean } = {},
) {
  await action(page, `次の章へ：${chapters[step + 1]}`, checkLayout)
  await expect(journey(page, scenes[step + 1])).toBeVisible()
  await expect
    .poll(async () => (await storedGame(page)).tutorial)
    .toMatchObject({
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
  await action(page, 'ひろばへ')
  await expect(journey(page)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'ごはんのひろば' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'ひろばのガイド', exact: true })).toBeVisible()
  const completed = await storedGame(page)
  expect(completed.tutorial).toEqual({
    version: 1,
    step: 4,
    status: 'completed',
    homeGuide: 'meal',
  })
  expect(completed.xp).toBe(0)
  expect(completed.meals).toHaveLength(0)
  await expectPracticeOnly(page, before)
  await page.reload()
  await expect(journey(page)).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'ひろばのガイド', exact: true })).toBeVisible()
  await expect(page.locator('.play-pet .pet-art')).toHaveClass(/pet-stage-0/)
  await expect(
    page.getByRole('button', { name: 'チュートリアルを続ける', exact: true }),
  ).toHaveCount(0)
  await expect(page.locator('.play-feed')).toHaveAccessibleName('ごはんをあげる')
  await page.locator('.play-feed').click()
  await expect(journey(page, 'photo')).toBeVisible()
  await expectPracticeOnly(page, before)
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
  await action(page, 'ひろばへ')
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
    expect(await storedGame(page)).toEqual(completed)
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
    const capture = async (name: string) => {
      await waitForSceneMotion(page)
      const path = testInfo.outputPath(`${name}-${viewport.width}.png`)
      await page.screenshot({ path, fullPage: false })
      await testInfo.attach(name, { path, contentType: 'image/png' })
    }
    for (let step = 0; step < scenes.length; step += 1) {
      await practice(page, step, true, capture)
      if (step < scenes.length - 1) await nextLesson(page, step, { checkLayout: true })
    }
    await expect(journey(page).locator('button.journey-secondary')).toHaveCount(0)
    await action(page, 'ひろばへ', true)
    await expect(journey(page)).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'ひろばのガイド', exact: true })).toBeVisible()
    await capture('tutorial-home-guide')
  })
}

test('visitor recruitment, the recipe lesson and the streak reward are accessible', async ({
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
  await practice(page, 2, false, check)
  await nextLesson(page, 2)
  await practice(page, 3, false, check)
  await nextLesson(page, 3)
  await practice(page, 4, false, check)
})
