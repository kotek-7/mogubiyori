import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { recipes } from '../../src/app/game/browserGame'
import {
  advanceXp,
  feedSample,
  journey,
  navigate,
  returnToPlaza,
  selectedMealRecipe,
  start,
  storedGame,
  waitForSceneMotion,
} from './helpers'

test('the main collection searches all 310 recipes and replaces the separate recipe board', async ({
  page,
}) => {
  await page.goto('/')
  await start(page)
  await navigate(page, 'ずかん')
  await expect(page.locator('.collection-count')).toContainText('/ 310')
  await expect(page.locator('.recipe-collection-card')).toHaveCount(24)
  await expect(page.getByRole('link', { name: '料理を探す' })).toHaveCount(0)
  await page.getByRole('searchbox', { name: '名前・材料で検索' }).fill('ふんわり親子丼')
  await page
    .getByRole('button', { name: 'ふんわり親子丼のレシピを見る（未獲得）', exact: true })
    .click()
  await expect(page.getByRole('dialog')).toContainText('材料（1人分）')
  await expect(page.getByRole('dialog')).toContainText('つくりかた')
  await expect(page.getByRole('dialog')).toContainText('おいしくつくるコツ')
  await expect(page.getByRole('dialog').locator('ol > li').first()).toBeVisible()
  await expect(
    page.getByRole('dialog').getByRole('img', { name: 'ふんわり親子丼' }),
  ).toHaveAttribute('src', '/expansion/assets/recipes/r-oyako-don.svg')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByRole('searchbox', { name: '名前・材料で検索' }).fill('存在しない献立')
  await expect(page.getByText('条件に合うレシピが見つかりませんでした。')).toBeVisible()
  await page.getByRole('button', { name: 'すべてのレシピを見る' }).click()
  await page.getByRole('button', { name: '次のページ', exact: true }).click()
  await expect(page.getByRole('navigation', { name: 'レシピ一覧のページ' })).toContainText('2 / 13')
  await expect(page.locator('.recipe-collection-card')).toHaveCount(24)
  await page.getByRole('searchbox', { name: '名前・材料で検索' }).fill('とまと')
  await expect(page.locator('.recipe-collection-card').first()).toBeVisible()
  await page.getByRole('combobox', { name: '種類', exact: true }).selectOption('side')
  await page.getByRole('combobox', { name: '調理時間', exact: true }).selectOption('10')
  await page.getByRole('combobox', { name: '難しさ', exact: true }).selectOption('1')
  await expect(page.locator('.recipe-collection-card').first()).toBeVisible()
  await page.locator('.recipe-collection-card').first().click()
  await expect(page.getByRole('dialog')).toContainText('トマト')
  await page.goto('/expansion/index.html')
  await expect(page.locator('[data-tab="recipes"]')).toHaveCount(0)
  await page.getByRole('link', { name: '料理カード', exact: true }).click()
  await expect(page).toHaveURL(/\/#book$/)
  await expect(page.locator('.collection-count')).toContainText('/ 310')
})

test('an added recipe earns one card and keeps its artwork and progress after reload', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await start(page)
  const before = await storedGame(page)
  const recipe = recipes.find((entry) => entry.id === 'r-oyako-don')!
  await navigate(page, 'ずかん')
  await page.getByRole('searchbox', { name: '名前・材料で検索' }).fill(recipe.name)
  await page
    .getByRole('button', { name: `${recipe.name}のレシピを見る（未獲得）`, exact: true })
    .click()
  await page.getByRole('button', { name: 'この料理を記録する' }).click()
  await page.getByRole('button', { name: '写真なしで体験する' }).click()
  await expect(selectedMealRecipe(page)).toHaveText(recipe.name)
  await expect(page.locator('.meal-serving-dish img')).toHaveAttribute('src', recipe.artPath!)
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await expect(page.locator('.feast-plate img')).toHaveAttribute('src', recipe.artPath!)
  await page.getByRole('button', { name: '早送り', exact: true }).click()
  await advanceXp(page)
  await expect(journey(page, 'card').getByRole('img', { name: recipe.name })).toHaveAttribute(
    'src',
    recipe.artPath!,
  )
  await returnToPlaza(page)
  const first = await storedGame(page)
  expect(first.cards).toEqual([recipe.id])
  expect(first.meals[0]).toMatchObject({
    recipeId: recipe.id,
    cardBonus: recipe.reward,
    title: recipe.name,
    xp: 45,
  })
  expect(first.coins).toBe(before.coins + 30 + recipe.reward)
  await page.reload()
  expect(await storedGame(page)).toEqual(first)
  await navigate(page, 'ずかん')
  await page.getByRole('combobox', { name: 'カード', exact: true }).selectOption('yes')
  await expect(page.locator('.recipe-collection-card')).toHaveCount(1)
  await expect(page.locator('.recipe-collection-card img')).toHaveAttribute('src', recipe.artPath!)
  await page.getByRole('button', { name: 'ごはんの記録' }).click()
  await expect(page.locator('.memory-card img')).toHaveAttribute('src', recipe.artPath!)
  await page.locator('.memory-card').click()
  await expect(page.getByRole('dialog').getByRole('img', { name: recipe.name })).toHaveAttribute(
    'src',
    recipe.artPath!,
  )
  await page.getByRole('button', { name: '閉じる', exact: true }).click()
  await navigate(page, 'ひろば')
  await feedSample(page, recipe.id)
  expect((await storedGame(page)).meals[0].cardBonus).toBe(0)
  expect((await storedGame(page)).cards).toEqual([recipe.id])
  expect(await returnToPlaza(page)).not.toContain('card')
})

test('the shared meal picker is accessible on mobile and cancellation preserves input', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await start(page)
  await page.locator('.play-feed').click()
  await page.getByRole('button', { name: '写真なしで体験する' }).click()
  await page.getByText('料理名をつける', { exact: true }).click()
  await page.getByRole('textbox', { name: '料理名（任意）', exact: true }).fill('今日の手作り')
  await page.getByRole('button', { name: '料理を選ぶ', exact: true }).click()
  await expect(journey(page, 'recipe-pick')).toBeVisible()
  await expect(page.locator('.recipe-collection-card')).toHaveCount(24)
  await waitForSceneMotion(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.keyboard.press('Escape')
  await expect(journey(page, 'serve')).toBeVisible()
  await expect(selectedMealRecipe(page)).toHaveText('いつものごはん')
  await page.getByText('料理名をつける', { exact: true }).click()
  await expect(page.getByRole('textbox', { name: '料理名（任意）', exact: true })).toHaveValue(
    '今日の手作り',
  )
  expect((await storedGame(page)).meals).toHaveLength(0)
})

test('character growth, cosmetic preview and mobile layout remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/expansion/index.html')
  await page.getByRole('button', { name: 'なかまたち' }).click()
  await expect(page.locator('#result-count')).toContainText('36 種類')
  await page.locator('.card').first().click()
  await expect(page.getByRole('dialog').locator('.detail-facts')).toContainText('特徴')
  await expect(page.getByRole('dialog').locator('.quote')).toHaveCount(0)
  const stages = page.getByRole('group', { name: '成長段階' }).getByRole('button')
  await expect(stages).toHaveCount(5)
  await expect(page.locator('[data-stage="4"]')).toHaveAttribute('aria-pressed', 'true')
  const finalForm = await page.locator('.growth-preview').getAttribute('src')
  expect(finalForm).toMatch(/-4\.svg$/)
  const names = ['うまれたて', 'ちびっこ', 'わんぱく', 'おとな', 'とっておき']
  for (const [index, name] of names.entries()) {
    const button = page.locator(`[data-stage="${index}"]`)
    await expect(button).toHaveText(name)
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.growth-preview')).toHaveAttribute(
      'src',
      new RegExp(`-${index}\\.svg$`),
    )
    const rect = await button.boundingBox()
    expect(rect && rect.width >= 44 && rect.height >= 44).toBe(true)
    expect(rect && rect.x >= 0 && rect.x + rect.width <= 390).toBe(true)
  }
  await page.getByRole('button', { name: '閉じる', exact: true }).click()
  await page.getByRole('button', { name: 'きせかえとひろば' }).click()
  await expect(page.locator('#result-count')).toContainText('72 種類')
  await page.getByRole('combobox', { name: '分類', exact: true }).selectOption('hat')
  await page.locator('.card').first().click()
  await expect(page.locator('.tryon .hat')).toBeVisible()
  await page.getByLabel('表示するなかま').selectOption({ index: 1 })
  await expect(page.locator('.tryon .pet')).toBeVisible()
  await page.getByRole('button', { name: '閉じる', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})
