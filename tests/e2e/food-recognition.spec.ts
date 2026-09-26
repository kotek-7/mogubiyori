import { expect, test } from '@playwright/test'
import type { Page, Route } from '@playwright/test'
import { Buffer } from 'node:buffer'
import { recipes } from '../../src/app/game/browserGame'
import {
  confirmUnclassifiedMeal,
  enablePremium,
  journey,
  navigate,
  returnToPlaza,
  start,
  selectMealRecipe,
  selectedMealRecipe,
  storedGame,
  uploadPhoto,
  waitForSceneMotion,
} from './helpers'

// These responses exercise the browser workflow; they do not evaluate an image model.
async function mockRecognition(page: Page) {
  const requests: Route[] = []
  await page.route('**/api/recognize-food', (route) => {
    requests.push(route)
  })
  return {
    requests,
    async waitFor(count: number) {
      await expect.poll(() => requests.length).toBe(count)
      return requests[count - 1]
    },
    async reply(index: number, candidates: string[], status = 200) {
      const route = requests[index]
      const response = route.request().response()
      await route.fulfill({
        status,
        json: status === 200 ? { candidates } : { error: 'unavailable' },
      })
      await (await response)?.finished()
      await waitForSceneMotion(page)
    },
  }
}

async function toTable(page: Page) {
  await page.getByRole('button', { name: '食卓へ', exact: true }).click()
  await expect(journey(page, 'serve')).toBeVisible()
}

async function giveMeal(page: Page, unclassified = false) {
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  if (unclassified) await confirmUnclassifiedMeal(page)
  await expect(journey(page, 'eating')).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await start(page)
})

test('loading follows the photo to the table and a generic suggestion persists without a recipe card', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const api = await mockRecognition(page)
  await page.locator('.play-feed').click()
  await uploadPhoto(page)
  await api.waitFor(1)
  await waitForSceneMotion(page)
  await expect(page.locator('.meal-recognition-dots')).toBeVisible()
  await expect(page.getByRole('status')).toContainText('料理を見ています')
  await page.screenshot({ path: testInfo.outputPath('recognition-loading-photo.png') })
  await toTable(page)
  await waitForSceneMotion(page)
  await expect(page.locator('.meal-recognition-dots')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('recognition-loading-table.png') })
  await api.reply(0, ['generic-pasta'])
  await expect(page.locator('.meal-recognition-dots')).toHaveCount(0)
  await expect(selectedMealRecipe(page)).toHaveText('パスタ')
  await giveMeal(page)
  const saved = await storedGame(page)
  expect(saved.meals[0]).toMatchObject({
    dishId: 'generic-pasta',
    title: 'パスタ',
    sample: 'pasta',
    xp: 45,
    cardBonus: 0,
  })
  expect(saved.meals[0].recipeId).toBeUndefined()
  expect(saved.cards).toEqual([])
  expect(await returnToPlaza(page)).not.toContain('card')
  await page.reload()
  expect(await storedGame(page)).toEqual(saved)
  await page.goto('/album')
  await expect(page.locator('.memory-card')).toContainText('パスタ')
})

test('generic dishes can be selected manually when recognition fails', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  const api = await mockRecognition(page)
  await page.locator('.play-feed').click()
  await uploadPhoto(page)
  await api.waitFor(1)
  await api.reply(0, [], 503)
  await expect(page.locator('.meal-recognition-dots')).toHaveCount(0)
  await toTable(page)
  await page.getByRole('button', { name: '料理を選ぶ', exact: true }).click()
  const choices = page.getByRole('group', { name: '料理の種類で選ぶ' })
  await expect(choices.getByRole('button')).toHaveCount(16)
  for (const name of ['パスタ', 'カレー', 'チャーハン', 'ハンバーグ']) {
    await expect(choices.getByRole('button', { name: `${name}として記録` })).toBeVisible()
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('generic-dish-picker-mobile.png') })
  await choices.getByRole('button', { name: 'ハンバーグとして記録' }).click()
  await expect(selectedMealRecipe(page)).toHaveText('ハンバーグ')
  await expect(page.locator('.meal-selected-recipe-art img')).toHaveAttribute(
    'src',
    /r-onion-hamburg-steak\.svg$/,
  )
  await giveMeal(page)
  expect((await storedGame(page)).meals[0]).toMatchObject({
    dishId: 'generic-hamburg',
    title: 'ハンバーグ',
    cardBonus: 0,
  })
  expect((await storedGame(page)).cards).toEqual([])
})

test('a mocked photo suggestion grants its card and XP only after feeding is confirmed', async ({
  page,
}, testInfo) => {
  const api = await mockRecognition(page)
  const before = await storedGame(page)
  await page.locator('.play-feed').click()
  await uploadPhoto(page)
  const request = (await api.waitFor(1)).request()
  expect(request.method()).toBe('POST')
  expect(request.postDataJSON()).toEqual({
    photo: expect.stringMatching(/^data:image\/jpeg;base64,/),
  })

  // Recognition must not block continuing to the table or save a meal itself.
  await toTable(page)
  await expect(journey(page).locator('.meal-recognition-status')).toContainText('料理を見ています')
  expect(await storedGame(page)).toEqual(before)
  await api.reply(0, ['curry', 'onigiri'])
  await expect(selectedMealRecipe(page)).toHaveText('カレー')
  await expect(journey(page).locator('.meal-recognition-status')).toContainText(
    '料理の候補が見つかりました。',
  )
  expect(await storedGame(page)).toEqual(before)
  await page.screenshot({ path: testInfo.outputPath('recognition-mocked-serve.png') })

  await giveMeal(page)
  const saved = await storedGame(page)
  expect(saved.meals).toHaveLength(1)
  expect(saved.meals[0]).toMatchObject({
    recipeId: 'curry',
    title: 'カレー',
    xp: 45,
    cardBonus: 70,
  })
  expect(saved.meals[0].photo).toMatch(/^data:image\/jpeg;base64,/)
  expect(saved.cards).toEqual(['curry'])
  expect(saved.xp).toBe(before.xp + 45)
  expect(saved.coins).toBe(before.coins + 100)
  expect(await returnToPlaza(page)).toContain('card')
  await page.reload()
  expect(await storedGame(page)).toEqual(saved)
})

test('photo recognition accepts an added recipe from the shared catalog', async ({ page }) => {
  const api = await mockRecognition(page)
  const recipe = recipes.find((entry) => entry.id === 'r-oyako-don')!
  await page.locator('.play-feed').click()
  await uploadPhoto(page)
  await api.waitFor(1)
  await api.reply(0, [recipe.id])
  await toTable(page)
  await expect(selectedMealRecipe(page)).toHaveText(recipe.name)
  expect((await storedGame(page)).cards).toEqual([])
  await giveMeal(page)
  expect((await storedGame(page)).cards).toEqual([recipe.id])
  expect((await storedGame(page)).meals[0]).toMatchObject({
    recipeId: recipe.id,
    cardBonus: recipe.reward,
  })
})

test('a late suggestion preserves a manually selected recipe and custom meal title', async ({
  page,
}) => {
  await enablePremium(page)
  const api = await mockRecognition(page)
  // Each edit must protect the user's choice on its own.
  for (const [index, edit] of ['title', 'recipe'].entries()) {
    const before = await storedGame(page)
    await page.locator('.play-feed').click()
    await uploadPhoto(page)
    await api.waitFor(index + 1)
    await toTable(page)
    if (edit === 'recipe') await selectMealRecipe(page, 'onigiri')
    else {
      await page.getByText('料理名をつける', { exact: true }).click()
      await page.getByRole('textbox', { name: '料理名（任意）', exact: true }).fill('梅のおにぎり')
    }
    await api.reply(index, ['curry'])
    await expect(journey(page).locator('.meal-recognition-status')).toContainText(
      '料理の候補が見つかりました。',
    )
    await expect(selectedMealRecipe(page)).toHaveText(
      edit === 'recipe' ? 'おかかのおにぎり' : '今日のごはん',
    )
    if (edit === 'title')
      await expect(page.getByRole('textbox', { name: '料理名（任意）', exact: true })).toHaveValue(
        '梅のおにぎり',
      )
    expect(await storedGame(page)).toEqual(before)

    await giveMeal(page, edit === 'title')
    const saved = await storedGame(page)
    expect(saved.meals[0].recipeId).toBe(edit === 'recipe' ? 'onigiri' : undefined)
    expect(saved.meals[0].title).toBe(edit === 'recipe' ? 'おかかのおにぎり' : '梅のおにぎり')
    expect(saved.cards).toEqual(edit === 'recipe' ? ['onigiri'] : [])
    await returnToPlaza(page)
  }
})

test('a recipe chosen from the collection remains selected after a different photo suggestion', async ({
  page,
}) => {
  const api = await mockRecognition(page)
  await navigate(page, 'ずかん')
  await page
    .locator('.recipe-collection-card')
    .nth(recipes.findIndex((recipe) => recipe.id === 'curry'))
    .click()
  await page.getByRole('button', { name: 'この料理を記録する' }).click()
  await uploadPhoto(page)
  await api.waitFor(1)
  await api.reply(0, ['onigiri'])
  await toTable(page)
  await expect(selectedMealRecipe(page)).toHaveText('カレー')
  await giveMeal(page)
  expect((await storedGame(page)).meals[0].recipeId).toBe('curry')
  expect((await storedGame(page)).cards).toEqual(['curry'])
})

test('replacing a photo prevents an older response from replacing the latest recipe', async ({
  page,
}) => {
  const api = await mockRecognition(page)
  await page.locator('.play-feed').click()
  await uploadPhoto(page)
  const firstRequest = (await api.waitFor(1)).request().postDataJSON()
  const image = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 60
    const context = canvas.getContext('2d')!
    context.fillStyle = '#405d27'
    context.fillRect(0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await page
    .getByLabel('料理の写真', { exact: true })
    .and(page.locator('input[type="file"]'))
    .setInputFiles({
      name: 'replacement.png',
      mimeType: 'image/png',
      buffer: Buffer.from(image, 'base64'),
    })
  const secondRequest = (await api.waitFor(2)).request().postDataJSON()
  expect(secondRequest.photo).not.toBe(firstRequest.photo)
  await api.reply(1, ['onigiri'])
  await toTable(page)
  await expect(selectedMealRecipe(page)).toHaveText('おかかのおにぎり')
  await api.reply(0, ['curry'])
  await expect(selectedMealRecipe(page)).toHaveText('おかかのおにぎり')
  await giveMeal(page)
  expect((await storedGame(page)).meals[0]).toMatchObject({
    recipeId: 'onigiri',
    photo: secondRequest.photo,
  })
})

test('failed, unknown and empty recognition responses still allow manually recording the meal', async ({
  page,
}) => {
  await enablePremium(page)
  const api = await mockRecognition(page)
  for (const [index, result] of [
    { candidates: [], status: 503 },
    { candidates: ['not-a-game-recipe'], status: 200 },
    { candidates: [], status: 200 },
  ].entries()) {
    await page.locator('.play-feed').click()
    await uploadPhoto(page)
    await api.waitFor(index + 1)
    await api.reply(index, result.candidates, result.status)
    await toTable(page)
    await expect(journey(page).locator('.meal-recognition-status')).toContainText(
      '手動で選べます。',
    )
    await expect(selectedMealRecipe(page)).toHaveText('今日のごはん')
    await selectMealRecipe(page, 'curry')
    await giveMeal(page)
    const saved = await storedGame(page)
    expect(saved.meals).toHaveLength(index + 1)
    expect(saved.meals[0].recipeId).toBe('curry')
    expect(saved.cards).toEqual(['curry'])
    await returnToPlaza(page)
  }
})

test('sample-photo play skips recognition and ignores a response for a discarded photo', async ({
  page,
}) => {
  const api = await mockRecognition(page)
  const before = await storedGame(page)
  await page.locator('.play-feed').click()
  await page.getByRole('button', { name: 'サンプル写真で体験する', exact: true }).click()
  await expect(journey(page, 'serve')).toBeVisible()
  expect(api.requests).toHaveLength(0)
  await page.getByRole('button', { name: '写真にもどる', exact: true }).click()
  await uploadPhoto(page)
  await api.waitFor(1)
  await page.getByRole('button', { name: 'サンプル写真で体験する', exact: true }).click()
  await expect(journey(page, 'serve')).toBeVisible()
  await api.reply(0, ['curry'])
  await expect(selectedMealRecipe(page)).toHaveText('今日のごはん')
  expect(await storedGame(page)).toEqual(before)
  await giveMeal(page, true)
  const saved = await storedGame(page)
  expect(saved.meals).toHaveLength(1)
  expect(saved.meals[0].photo).toMatch(/^data:image\/jpeg;base64,/)
  expect(saved.meals[0].recipeId).toBeUndefined()
  expect(saved.cards).toEqual([])
  expect(api.requests).toHaveLength(1)
})

test('cancelling a pending recognition keeps the save and the next meal unchanged', async ({
  page,
}) => {
  const api = await mockRecognition(page)
  const before = await storedGame(page)
  await page.locator('.play-feed').click()
  await uploadPhoto(page)
  await api.waitFor(1)
  await page.getByRole('button', { name: 'ひろばへ', exact: true }).click()
  await expect(journey(page)).toHaveCount(0)
  expect(await storedGame(page)).toEqual(before)
  await page.locator('.play-feed').click()
  await page.getByRole('button', { name: 'サンプル写真で体験する', exact: true }).click()
  await api.reply(0, ['curry'])
  await expect(selectedMealRecipe(page)).toHaveText('今日のごはん')
  expect(await storedGame(page)).toEqual(before)
  await page.getByRole('button', { name: 'ひろばへ', exact: true }).click()
  expect(await storedGame(page)).toEqual(before)
})
