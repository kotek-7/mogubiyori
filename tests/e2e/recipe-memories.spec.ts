import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { chooseStarter, feed, initialGame } from '../../shared/game/game'
import { recipes } from '../../shared/content/recipes'
import type { GameState } from '../../shared/game/types'

const today = '2026-09-26'
const photo = `data:image/jpeg;base64,${readFileSync('public/art/meal-samples/sample-omurice.jpg').toString('base64')}`
const recipeName = recipes.find((recipe) => recipe.id === 'omurice')!.name

function starter(): GameState {
  return {
    ...chooseStarter(initialGame(today), 'komugi'),
    subscriptionPlan: 'premium',
    tutorial: { version: 1, step: 4, status: 'completed', introSeen: true, homeGuide: 'done' },
  }
}

function memoriesState(): GameState {
  let state = feed(
    { ...starter(), today: '2026-09-25' },
    { title: '昨日のオムライス', sample: 'rice', recipeId: 'omurice', photo },
    { mealId: 'yesterday' },
  )
  state = feed(
    { ...state, today, visitors: ['mame'] },
    { title: '今日のオムライス', sample: 'rice', recipeId: 'omurice', photo },
    { mealId: 'today' },
  )
  state = feed(
    state,
    { title: '', sample: 'rice', targetId: 'mame', mealRecordId: 'today' },
    { mealId: 'shared' },
  )
  // A restored share may have no photo; both gallery and detail still use the original.
  delete state.meals[0].photo
  state = feed(
    state,
    { title: '別の料理', sample: 'curry', recipeId: 'curry' },
    { mealId: 'unrelated' },
  )
  state.meals.push({
    id: 'legacy',
    day: '2026-09-22',
    title: '初めてのオムライス',
    sample: 'rice',
    recipeId: 'omurice',
    xp: 30,
    coins: 0,
    photo,
  })
  return state
}

async function openRecipe(page: Page, state: GameState) {
  await page.goto('/')
  await page.evaluate(
    (value) => localStorage.setItem('mogubiyori-v1', value),
    JSON.stringify(state),
  )
  await page.goto('/book')
  await page.getByRole('searchbox', { name: '名前・材料で検索' }).fill(recipeName)
  const card = page.locator('.recipe-collection-card').first()
  await card.click()
  await expect(page.getByRole('dialog', { name: recipeName, exact: true })).toBeVisible()
  return card
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(`${today}T03:00:00Z`))
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('acquired cards show a photo gallery that opens, edits and returns from the matching records', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  const card = await openRecipe(page, memoriesState())
  const dialog = page.getByRole('dialog')
  const gallery = dialog.getByRole('region', { name: '作った記録', exact: true })
  await expect(gallery.getByRole('button')).toHaveCount(3)
  await expect(gallery.locator('time')).toHaveText(['2026/09/26', '2026/09/25', '2026/09/22'])
  await expect(gallery.locator('img').first()).toHaveAttribute('src', photo)
  await gallery.scrollIntoViewIfNeeded()
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('recipe-memories-320.png') })
  const accessibility = await new AxeBuilder({ page })
    .include('dialog')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(accessibility.violations).toEqual([])

  await gallery.getByRole('button', { name: /今日のオムライスの記録を見る/ }).focus()
  await page.keyboard.press('Enter')
  await expect(dialog).toHaveAccessibleName('今日のオムライス')
  await expect(dialog.locator('.meal-view-art img')).toHaveAttribute('src', photo)
  await expect(
    dialog.getByRole('list', { name: 'この食事を分けたなかま' }).getByRole('listitem'),
  ).toHaveCount(2)
  await dialog.getByRole('button', { name: '記録を編集', exact: true }).click()
  await dialog.getByRole('textbox', { name: '食事の名前', exact: true }).fill('ふわふわオムライス')
  await dialog.getByLabel('食べた日', { exact: true }).fill('2026-09-24')
  await dialog.getByRole('button', { name: '変更を保存', exact: true }).click()
  await expect(dialog.getByRole('button', { name: '記録を編集', exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: '料理カードに戻る', exact: true }).click()
  await expect(dialog).toHaveAccessibleName(recipeName)
  await expect(gallery.locator('time')).toHaveText(['2026/09/25', '2026/09/24', '2026/09/22'])
  await expect(gallery).toContainText('ふわふわオムライス')

  await page.setViewportSize({ width: 390, height: 844 })
  await gallery.scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath('recipe-memories-390.png') })
  await gallery.getByRole('button', { name: /初めてのオムライスの記録を見る/ }).click()
  await expect(dialog).toHaveAccessibleName('初めてのオムライス')
  await expect(dialog).toContainText('以前の記録・未判定')
  await expect(dialog.getByRole('button', { name: '記録を編集', exact: true })).toHaveCount(0)
  await dialog.getByRole('button', { name: '料理カードに戻る', exact: true }).click()
  await expect(gallery.getByRole('button')).toHaveCount(3)
  await dialog.getByRole('button', { name: '閉じる', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(card).toBeFocused()
  await expect(page.getByRole('searchbox', { name: '名前・材料で検索' })).toHaveValue(recipeName)
})

test('only acquired cards have a gallery and an acquired card without matching records stays usable', async ({
  page,
}) => {
  await openRecipe(page, starter())
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('region', { name: '作った記録', exact: true })).toHaveCount(0)
  await expect(
    dialog.getByRole('button', { name: 'この料理を記録する', exact: true }),
  ).toBeVisible()
  await openRecipe(page, { ...starter(), cards: ['omurice'] })
  await expect(dialog.getByRole('region', { name: '作った記録', exact: true })).toContainText(
    'この料理の記録はまだありません。',
  )
  await expect(
    dialog.getByRole('button', { name: 'この料理を記録する', exact: true }),
  ).toBeEnabled()
})
