import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import {
  chooseStarter,
  claimLogin,
  feed,
  initialGame,
  shiftDay,
} from '../../src/app/game/browserGame'
import type { GameState } from '../../src/app/game/browserGame'
import { journey, navigate, storedGame, waitForSceneMotion } from './helpers'

const today = '2026-09-25'

function freshState(): GameState {
  return claimLogin({
    ...chooseStarter(initialGame(today), 'komugi'),
    tutorial: { version: 1, step: 4, status: 'completed', homeGuide: 'done' },
  })
}

async function seed(page: Page, state: GameState, path = '/') {
  await page.goto('/')
  await page.evaluate(
    (value) => localStorage.setItem('mogubiyori-v1', value),
    JSON.stringify(state),
  )
  await page.goto(path)
}

async function activeNavigation(page: Page, name: 'ひろば' | '記録' | 'レポート') {
  const nav = page.getByRole('navigation', { name: 'メインナビゲーション', exact: true })
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1)
  await expect(nav.getByRole('button', { name, exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
}

async function expectSelectedDate(
  page: Page,
  path: '/album' | '/reports',
  day: string,
  end: string,
) {
  await expect
    .poll(() => {
      const url = new URL(page.url())
      return {
        path: url.pathname,
        day: url.searchParams.get('day'),
        end: url.searchParams.get('end'),
      }
    })
    .toEqual({ path, day, end })
  await expect(page.getByLabel('表示する日', { exact: true })).toHaveValue(day)
  await activeNavigation(page, path === '/album' ? '記録' : 'レポート')
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(`${today}T03:00:00Z`))
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('five navigation items and the empty record action are accessible on a 320px phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await seed(page, freshState())
  await expect(page.getByRole('heading', { name: 'ひろば', exact: true })).toBeVisible()
  const nav = page.getByRole('navigation', { name: 'メインナビゲーション', exact: true })
  await expect(nav.getByRole('button')).toHaveText([
    'ひろば',
    '記録',
    'レポート',
    'ずかん',
    'おみせ',
  ])
  for (const button of await nav.getByRole('button').all()) {
    const box = await button.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(320)
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
  const before = await storedGame(page)
  await page.getByRole('button', { name: '今日の自炊レポートを見る', exact: true }).click()
  await expect(page.getByRole('heading', { name: '自炊レポート', exact: true })).toBeVisible()
  await activeNavigation(page, 'レポート')
  await expect(page.locator('.meal-report-score strong')).toHaveText('—')
  await expect(page.getByRole('heading', { name: '食べたものの推移', exact: true })).toBeVisible()
  const reportsUrl = page.url()
  await page.getByRole('button', { name: '自炊を記録する', exact: true }).click()
  await expect(journey(page, 'photo')).toBeVisible()
  await page.getByRole('button', { name: 'レポートへ戻る', exact: true }).click()
  await expect(page).toHaveURL(reportsUrl)
  await expect(page.getByRole('heading', { name: '自炊レポート', exact: true })).toBeVisible()
  await expect(page.locator('#main')).toBeFocused()
  await waitForSceneMotion(page)
  const reportAccessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(reportAccessibility.violations).toEqual([])
  await page.screenshot({ path: test.info().outputPath('empty-reports-320.png') })
  await page.getByRole('button', { name: 'この日の記録を見る', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'ごはんの記録', exact: true })).toBeVisible()
  await activeNavigation(page, '記録')
  await expect(page.locator('.memory-card')).toHaveCount(0)
  await expect(page.locator('.meal-report-score')).toHaveCount(0)
  await expect(
    page.getByRole('region', { name: '7日間のごはんバランス', exact: true }),
  ).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const recordAccessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(recordAccessibility.violations).toEqual([])
  await page.screenshot({ path: test.info().outputPath('empty-records-320.png') })
  const recordsUrl = page.url()
  await page.getByRole('button', { name: '自炊を記録する', exact: true }).click()
  await expect(journey(page, 'photo')).toBeVisible()
  await page.getByRole('button', { name: '記録へ戻る', exact: true }).click()
  await expect(page).toHaveURL(recordsUrl)
  await expect(page.getByRole('heading', { name: 'ごはんの記録', exact: true })).toBeVisible()
  await expect(page.locator('#main')).toBeFocused()
  expect(await storedGame(page)).toEqual(before)
})

test('records and reports keep the selected day and week through links, reload and history', async ({
  page,
}) => {
  const recordDay = shiftDay(today, -8)
  const end = shiftDay(today, -7)
  let state = freshState()
  state.subscriptionPlan = 'premium'
  state = feed(
    { ...state, today: recordDay },
    { title: '先週のおにぎり', sample: 'rice', recipeId: 'onigiri' },
  )
  state = { ...state, today }
  await seed(page, state, '/reports')
  await page.getByRole('button', { name: '前の7日間', exact: true }).click()
  const week = page.getByRole('region', { name: '7日間のごはんバランス', exact: true })
  const dateName = new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric' }).format(
    new Date(`${recordDay}T12:00:00+09:00`),
  )
  await week.getByRole('button', { name: new RegExp(`^${dateName}、`) }).click()
  await expectSelectedDate(page, '/reports', recordDay, end)
  await expect(page.locator('.meal-report-score strong')).toHaveText('30')
  const reportUrl = page.url()
  await page.getByRole('button', { name: 'この日の記録を見る', exact: true }).click()
  await expectSelectedDate(page, '/album', recordDay, end)
  await expect(page.locator('.memory-card')).toContainText('先週のおにぎり')
  await expect(page.getByRole('button', { name: '自炊を記録する', exact: true })).toBeVisible()
  const strip = page.getByRole('group', { name: '7日間の記録', exact: true })
  await expect(strip.getByRole('button', { pressed: true })).toHaveAccessibleName(
    `${dateName}、記録 1食`,
  )
  const recordUrl = page.url()
  await page.getByRole('button', { name: '自炊を記録する', exact: true }).click()
  await expect(journey(page, 'photo')).toBeVisible()
  await page.getByRole('button', { name: '記録へ戻る', exact: true }).click()
  await expect(page).toHaveURL(recordUrl)
  await expectSelectedDate(page, '/album', recordDay, end)
  await expect(page.locator('#main')).toBeFocused()
  expect(await storedGame(page)).toEqual(state)
  await page.reload()
  await expectSelectedDate(page, '/album', recordDay, end)
  await expect(page.locator('.memory-card')).toContainText('先週のおにぎり')
  await page.getByRole('button', { name: 'この日のレポートを見る', exact: true }).click()
  await expect(page).toHaveURL(reportUrl)
  await expectSelectedDate(page, '/reports', recordDay, end)
  await page.goBack()
  await expect(page).toHaveURL(recordUrl)
  await expect(page.locator('.memory-card')).toContainText('先週のおにぎり')
  await activeNavigation(page, '記録')
  await page.goForward()
  await expect(page).toHaveURL(reportUrl)
  await expect(page.locator('.meal-report-score strong')).toHaveText('30')
  await activeNavigation(page, 'レポート')
  await page.reload()
  await expectSelectedDate(page, '/reports', recordDay, end)
  await expect(page.locator('.meal-report-score strong')).toHaveText('30')
  expect(await storedGame(page)).toEqual(state)
})

test('direct navigation selects records and reports independently', async ({ page }) => {
  await seed(page, freshState(), '/album')
  await activeNavigation(page, '記録')
  await navigate(page, 'レポート')
  await expect(page.getByRole('heading', { name: '自炊レポート', exact: true })).toBeVisible()
  await activeNavigation(page, 'レポート')
  await navigate(page, '記録')
  await expect(page.getByRole('heading', { name: 'ごはんの記録', exact: true })).toBeVisible()
  await activeNavigation(page, '記録')
})
