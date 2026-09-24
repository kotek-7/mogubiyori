import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { claimLogin, demoGame, feed, recipes, todayTokyo } from '../../src/game'
import type { Page } from '@playwright/test'

async function check(page: Page, label: string) {
  await page.evaluate(() => document.fonts.ready)
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(result.violations, label).toEqual([])
}

async function start(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'この子とはじめる' }).click()
  await expect(page.getByRole('heading', { name: 'ごはんのひろば' })).toBeVisible()
}

test('starter selection is accessible before any companion has been chosen', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('group', { name: '最初のなかま' }).waitFor()
  await check(page, 'starter selection')
})

test('plaza, recipe collection, recipe detail and shop are accessible', async ({ page }) => {
  await start(page)
  await check(page, 'plaza')
  await page.getByRole('navigation').getByRole('button', { name: 'ずかん', exact: true }).click()
  await check(page, 'recipe collection')
  await page
    .locator('.recipe-collection-card')
    .nth(recipes.findIndex((recipe) => recipe.id === 'curry'))
    .click()
  await page.getByRole('dialog').waitFor()
  await check(page, 'recipe detail')
  await page.getByRole('button', { name: '閉じる', exact: true }).click()
  await page.getByRole('navigation').getByRole('button', { name: 'おみせ', exact: true }).click()
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

test('mobile food submission and the growth celebration are accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await start(page)
  await page.locator('.play-feed').click()
  await page.getByRole('dialog').waitFor()
  await check(page, 'photo submission')
  await page.getByRole('button', { name: '写真なしで体験する' }).click()
  await page.getByRole('combobox', { name: 'つくった料理', exact: true }).selectOption('curry')
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await expect(page.locator('.feast')).not.toHaveClass(/is-eating/)
  await check(page, 'growth and first recipe card celebration')
})
