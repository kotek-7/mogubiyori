import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { claimLogin, demoGame, feed, recipes, todayTokyo } from '../../src/app/game/browserGame'
import type { Page } from '@playwright/test'
import {
  advanceXp,
  chooseStarter,
  enablePremium,
  feedSample,
  journey,
  navigate,
  returnToPlaza,
  sampleToTable,
  start,
  submitSample,
  waitForSceneMotion,
} from './helpers'

async function check(page: Page, label: string) {
  await waitForSceneMotion(page)
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(result.violations, label).toEqual([])
}

async function extendMealAnimationTimers(page: Page) {
  // Keep the eating scene visible while axe runs; its own timers stay live.
  // Automatic eating completion is covered separately in xp-reward.spec.ts.
  await page.addInitScript(() => {
    const schedule = window.setTimeout.bind(window)
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) =>
      schedule(handler, delay === 3600 ? 60000 : delay, ...args)) as typeof window.setTimeout
  })
}

test('starter selection is accessible before any companion has been chosen', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('group', { name: '最初のなかま' }).waitFor()
  await check(page, 'starter selection')
})

test('plaza, recipe collection, recipe detail and shop are accessible', async ({ page }) => {
  await page.goto('/')
  await start(page)
  await check(page, 'plaza')
  await navigate(page, 'ずかん')
  await check(page, 'recipe collection')
  await page
    .locator('.recipe-collection-card')
    .nth(recipes.findIndex((recipe) => recipe.id === 'curry'))
    .click()
  await page.getByRole('dialog').waitFor()
  await check(page, 'recipe detail')
  await page.getByRole('button', { name: '閉じる', exact: true }).click()
  await navigate(page, 'おみせ')
  await check(page, 'shop')
})

test('the companion collection with visitors has accessible labels and contrast', async ({
  page,
}) => {
  const state = claimLogin(feed(demoGame(todayTokyo()), { title: 'ごはん', sample: 'rice' }))
  await page.addInitScript(
    (value) => localStorage.setItem('mogubiyori-v1', value),
    JSON.stringify(state),
  )
  await page.goto('/#book')
  await page
    .getByRole('group', { name: 'ずかんのカテゴリ' })
    .getByRole('button', { name: 'なかま', exact: true })
    .click()
  await expect(page.locator('.friend-visitor')).toHaveCount(3)
  await check(page, 'companion collection and visitors')
})

test('mobile welcome, photo, serving, eating, XP, growth, card and daily streak scenes are accessible', async ({
  page,
}) => {
  test.setTimeout(60000)
  await page.setViewportSize({ width: 390, height: 844 })
  await extendMealAnimationTimers(page)
  await page.goto('/')
  await chooseStarter(page)
  await check(page, 'welcome')
  await page
    .getByRole('button', { name: 'チュートリアルをスキップしてひろばへ', exact: true })
    .click()
  await page.getByRole('button', { name: 'ごはんをあげる', exact: true }).click()
  await expect(journey(page, 'photo')).toBeVisible()
  await check(page, 'photo')
  await sampleToTable(page, 'curry')
  await check(page, 'serving')
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await expect(journey(page, 'eating')).toBeVisible()
  await check(page, 'eating')
  await page.getByRole('button', { name: '早送り', exact: true }).click()
  await expect(journey(page, 'xp')).toBeVisible()
  await check(page, 'XP reward')
  await advanceXp(page)
  await expect(journey(page, 'card')).toBeVisible()
  await check(page, 'recipe card')
  await page.getByRole('button', { name: 'つづける', exact: true }).click()
  await expect(journey(page, 'streak')).toBeVisible()
  await expect(journey(page, 'streak').locator('.streak-celebration')).toHaveAttribute(
    'data-phase',
    'complete',
  )
  await expect(journey(page, 'streak').locator('.streak-celebration-prize')).toHaveCount(0)
  await check(page, 'first cooking day')
  await page.getByRole('button', { name: 'つづける', exact: true }).click()
  await expect(journey(page, 'mealReport')).toBeVisible()
  await check(page, 'daily meal report')
  await returnToPlaza(page)
  await enablePremium(page)
  await feedSample(page, 'tofu-soup')
  await returnToPlaza(page)
  await feedSample(page, 'onigiri')
  await page.getByRole('button', { name: '早送り', exact: true }).click()
  await advanceXp(page)
  await expect(journey(page, 'growth')).toBeVisible()
  await check(page, 'growth')
})

test('arrival, streak, gift, recruitment and ordinary XP scenes are accessible', async ({
  page,
}) => {
  test.setTimeout(60000)
  await extendMealAnimationTimers(page)
  const state = claimLogin(demoGame(todayTokyo()))
  await page.addInitScript(
    (value) => localStorage.setItem('mogubiyori-v1', value),
    JSON.stringify(state),
  )
  await page.goto('/')
  await feedSample(page)
  await page.getByRole('button', { name: '早送り', exact: true }).click()
  await advanceXp(page)
  await expect(journey(page, 'growth')).toBeVisible()
  await page.getByRole('button', { name: 'つづける', exact: true }).click()
  await expect(journey(page, 'arrivals')).toBeVisible()
  await check(page, 'arrivals')
  await page.getByRole('button', { name: 'つづける', exact: true }).click()
  await expect(journey(page, 'streak')).toBeVisible()
  await expect(journey(page, 'streak').locator('.streak-celebration')).toHaveAttribute(
    'data-phase',
    'complete',
  )
  await check(page, 'seven-day streak')
  await page.getByRole('button', { name: 'つづける', exact: true }).click()
  await expect(journey(page, 'gift')).toBeVisible()
  await check(page, 'seven-day gift')
  await page.getByRole('button', { name: 'つづける', exact: true }).click()
  await expect(journey(page, 'mealReport')).toBeVisible()
  await check(page, 'meal report after seven-day gift')
  await page.getByRole('button', { name: 'ひろばへ', exact: true }).click()
  await enablePremium(page)
  await page.getByRole('button', { name: 'お客さんのまめにごはんをあげる' }).click()
  await submitSample(page, '', 'まめ')
  await page.getByRole('button', { name: '早送り', exact: true }).click()
  await advanceXp(page)
  await expect(journey(page, 'joined')).toBeVisible()
  await check(page, 'recruitment')
  await returnToPlaza(page)
  await page.locator('.play-feed').click()
  await submitSample(page, '', 'まめ')
  await page.getByRole('button', { name: '早送り', exact: true }).click()
  await expect(journey(page, 'xp')).toBeVisible()
  await check(page, 'ordinary XP reward')
})
