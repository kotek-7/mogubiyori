import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {
  chooseStarter,
  claimLogin,
  feed,
  initialGame,
  recipes,
  shiftDay,
} from '../../src/app/game/browserGame'
import type { GameState } from '../../src/app/game/browserGame'
import { FREE_RECIPE_IDS } from '../../shared/content/freeRecipes'
import {
  feedSample,
  journey,
  navigate,
  returnToPlaza,
  sampleToTable,
  start,
  storedGame,
  waitForSceneMotion,
} from './helpers'

const today = '2026-09-25'
const premiumRecipe = recipes.find((recipe) => recipe.id === 'r-shrimp-pan-pilaf')!

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

async function switchPlan(page: Page, plan: 'free' | 'premium') {
  await page.getByRole('button', { name: '設定', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog
    .getByRole('button', {
      name: plan === 'premium' ? '有料プランに切り替える' : '無料プランに切り替える',
      exact: true,
    })
    .click()
  await expect(dialog.locator('.subscription-current')).toContainText(
    plan === 'premium' ? '有料プラン' : '無料プラン',
  )
  await expect.poll(async () => (await storedGame(page)).subscriptionPlan).toBe(plan)
  await dialog.getByRole('button', { name: '閉じる', exact: true }).click()
  await expect(dialog).toHaveCount(0)
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(`${today}T03:00:00Z`))
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('the 320px header opens membership, stays usable and reflects the persisted plan', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 320, height: 700 })
  await seed(page, freshState())
  const header = page.locator('.play-header')
  const freeCta = header.getByRole('button', {
    name: 'プラスに加入：もぐ日和プラスの特典を見る',
    exact: true,
  })
  const premiumCta = header.getByRole('button', {
    name: 'プラス会員：会員プランを確認',
    exact: true,
  })
  await expect(freeCta).toContainText('プラスに加入')
  await expect(header.getByRole('button', { name: /ジェム/ })).toHaveCount(0)

  async function checkHeaderControls() {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    for (const button of await header.getByRole('button').all()) {
      await expect(button).toBeInViewport()
      await button.click({ trial: true })
    }
  }
  await checkHeaderControls()
  await waitForSceneMotion(page)
  const headerAccessibility = await new AxeBuilder({ page })
    .include('.play-header')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(headerAccessibility.violations).toEqual([])
  await freeCta.click()
  const dialog = page.getByRole('dialog', { name: '会員プラン', exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'もぐ日和プラス', exact: true })).toBeVisible()
  await waitForSceneMotion(page)
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(accessibility.violations).toEqual([])
  await dialog.getByRole('button', { name: '有料プランに切り替える', exact: true }).click()
  await expect.poll(async () => (await storedGame(page)).subscriptionPlan).toBe('premium')
  await dialog.getByRole('button', { name: '閉じる', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(premiumCta).toContainText('プラス会員')
  await page.reload()
  await expect(premiumCta).toContainText('プラス会員')
  await checkHeaderControls()
  await premiumCta.click()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '無料プランに切り替える', exact: true }).click()
  await expect.poll(async () => (await storedGame(page)).subscriptionPlan).toBe('free')
  await dialog.getByRole('button', { name: '閉じる', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await page.reload()
  await expect(freeCta).toContainText('プラスに加入')
  await checkHeaderControls()
  await header.getByRole('button', { name: 'コイン 140枚、おみせへ', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'おみせ', exact: true })).toBeVisible()
  await header.getByRole('button', { name: '設定', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '設定', exact: true })).toBeVisible()
})

test('a new free member sees 30 recipes and ads, and the mock premium choice survives reload', async ({
  page,
}) => {
  await page.goto('/')
  await start(page)
  expect((await storedGame(page)).subscriptionPlan).toBe('free')
  await expect(page.getByRole('complementary', { name: '広告', exact: true })).toHaveCount(0)
  await navigate(page, 'ずかん')
  await expect(page.getByRole('complementary', { name: '広告', exact: true })).toBeVisible()
  await expect(page.locator('.collection-count')).toContainText(`/ ${FREE_RECIPE_IDS.length}`)
  await expect(page.locator('.recipe-browser-summary')).toContainText('30 品')
  const search = page.getByRole('searchbox', { name: '名前・材料で検索' })
  await search.fill('うどん')
  await expect(page.getByRole('button', { name: /甘あげきつねうどんのレシピを見る/ })).toBeVisible()
  await search.fill(premiumRecipe.name)
  await expect(page.locator('.recipe-collection-card')).toHaveCount(0)
  await switchPlan(page, 'premium')
  await expect(page.locator('.recipe-collection-card')).toHaveCount(1)
  await expect(page.getByRole('complementary', { name: '広告', exact: true })).toHaveCount(0)
  await page.reload()
  await expect(page.locator('.collection-count')).toContainText(`/ ${recipes.length}`)
  await expect(page.locator('.recipe-browser-summary')).toContainText(`${recipes.length} 品`)
  expect((await storedGame(page)).subscriptionPlan).toBe('premium')
  await expect(page.getByRole('complementary', { name: '広告', exact: true })).toHaveCount(0)
  await switchPlan(page, 'free')
  await page.reload()
  await expect(page.locator('.collection-count')).toContainText(`/ ${FREE_RECIPE_IDS.length}`)
  await expect(page.getByRole('complementary', { name: '広告', exact: true })).toBeVisible()
  expect((await storedGame(page)).subscriptionPlan).toBe('free')
})

test('downgrading hides acquired premium recipes without losing cards or meals', async ({
  page,
}) => {
  const state = feed(
    { ...freshState(), subscriptionPlan: 'premium' },
    { title: premiumRecipe.name, sample: premiumRecipe.sample, recipeId: premiumRecipe.id },
  )
  await seed(page, state, '/book')
  const before = await storedGame(page)
  const search = page.getByRole('searchbox', { name: '名前・材料で検索' })
  await search.fill(premiumRecipe.name)
  await page
    .getByRole('button', { name: `${premiumRecipe.name}のレシピを見る`, exact: true })
    .click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'つくりかた' })).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).click()
  await switchPlan(page, 'free')
  await expect(page.locator('.recipe-collection-card')).toHaveCount(0)
  await page.reload()
  expect((await storedGame(page)).cards).toEqual(before.cards)
  expect((await storedGame(page)).mealRecords).toEqual(before.mealRecords)
  await switchPlan(page, 'premium')
  await search.fill(premiumRecipe.name)
  await page
    .getByRole('button', { name: `${premiumRecipe.name}のレシピを見る`, exact: true })
    .click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'つくりかた' })).toBeVisible()
  expect((await storedGame(page)).cards).toEqual(before.cards)
})

test('free members record once daily and can record another meal after switching from the limit sheet', async ({
  page,
}) => {
  await seed(page, freshState())
  await feedSample(page, 'onigiri')
  await returnToPlaza(page)
  expect((await storedGame(page)).mealRecords).toHaveLength(1)
  await page.locator('.play-feed').click()
  const dialog = page.getByRole('dialog', { name: 'ごはんをもっと記録する', exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('無料プランのごはん記録は1日1回です。')
  await expect(journey(page)).toHaveCount(0)
  expect((await storedGame(page)).mealRecords).toHaveLength(1)
  await dialog.getByRole('button', { name: '有料プランに切り替える', exact: true }).click()
  await expect(dialog.locator('.subscription-current')).toContainText('有料プラン')
  await dialog.getByRole('button', { name: '閉じる', exact: true }).click()
  await page.locator('.play-feed').click()
  await sampleToTable(page, 'curry')
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await expect(journey(page, 'eating')).toBeVisible()
  const saved = await storedGame(page)
  expect(saved.mealRecords).toHaveLength(2)
  expect(saved.mealRecords!.every((record) => record.day === today)).toBe(true)
  await returnToPlaza(page)
  await page.reload()
  expect((await storedGame(page)).mealRecords).toHaveLength(2)
})

test('an old report URL is restricted for free members and restored without data loss for premium', async ({
  page,
}) => {
  const oldDay = shiftDay(today, -4)
  const earliestFreeDay = shiftDay(today, -2)
  const state = feed(
    { ...freshState(), today: oldDay },
    { title: '以前のおにぎり', sample: 'rice', recipeId: 'onigiri' },
  )
  await seed(page, { ...state, today }, `/reports?day=${oldDay}&end=${oldDay}`)
  const before = await storedGame(page)
  const selectedDay = page.getByLabel('表示する日', { exact: true })
  await expect(selectedDay).toHaveValue(earliestFreeDay)
  await expect(selectedDay).toHaveAttribute('min', earliestFreeDay)
  await expect(page.locator('.meal-report-score strong')).toHaveText('—')
  await expect(page.getByRole('button', { name: '前の7日間', exact: true })).toBeDisabled()
  await expect(page.locator('.meal-week-day:disabled')).toHaveCount(4)
  await expect(page.locator('.meal-week-day:not(:disabled)')).toHaveCount(3)
  await expect(page.locator('.meal-week-day[aria-label*="30点"]')).toHaveCount(0)
  const foodCells = page.getByRole('table', { name: '食品を含む食事の数（食）', exact: true })
  await expect(foodCells.getByRole('cell', { name: '1', exact: true })).toHaveCount(0)
  await switchPlan(page, 'premium')
  await expect(selectedDay).toHaveValue(oldDay)
  await expect(page.locator('.meal-report-score strong')).toHaveText('30')
  await expect(page.getByRole('button', { name: '前の7日間', exact: true })).toBeEnabled()
  await expect(page.locator('.meal-week-day:disabled')).toHaveCount(0)
  await page.reload()
  await expect(selectedDay).toHaveValue(oldDay)
  await expect(page.locator('.meal-report-score strong')).toHaveText('30')
  await switchPlan(page, 'free')
  await expect(selectedDay).toHaveValue(earliestFreeDay)
  await expect(page.locator('.meal-report-score strong')).toHaveText('—')
  expect((await storedGame(page)).mealRecords).toEqual(before.mealRecords)
  expect((await storedGame(page)).cards).toEqual(before.cards)
})
