import { expect, test } from '@playwright/test'
import type { Page, Route } from '@playwright/test'
import { Buffer } from 'node:buffer'
import { recipes } from '../../src/game'
import {
  journey,
  navigate,
  returnToPlaza,
  start,
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

const recipeSelect = (page: Page) =>
  page.getByRole('combobox', { name: 'つくった料理', exact: true })

async function toTable(page: Page) {
  await page.getByRole('button', { name: '食卓へ', exact: true }).click()
  await expect(journey(page, 'serve')).toBeVisible()
}

async function giveMeal(page: Page) {
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await expect(journey(page, 'eating')).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await start(page)
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
  await expect(journey(page).getByRole('status')).toContainText('料理を見ています。')
  expect(await storedGame(page)).toEqual(before)
  await api.reply(0, ['curry', 'onigiri'])
  await expect(recipeSelect(page)).toHaveValue('curry')
  await expect(journey(page).getByRole('status')).toContainText('料理の候補が見つかりました。')
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

test('a late suggestion preserves a manually selected recipe and custom meal title', async ({
  page,
}) => {
  const api = await mockRecognition(page)
  // Each edit must protect the user's choice on its own.
  for (const [index, edit] of ['title', 'recipe'].entries()) {
    const before = await storedGame(page)
    await page.locator('.play-feed').click()
    await uploadPhoto(page)
    await api.waitFor(index + 1)
    await toTable(page)
    if (edit === 'recipe') await recipeSelect(page).selectOption('onigiri')
    else {
      await page.getByText('料理名をつける', { exact: true }).click()
      await page.getByRole('textbox', { name: '料理名（任意）', exact: true }).fill('梅のおにぎり')
    }
    await api.reply(index, ['curry'])
    await expect(journey(page).getByRole('status')).toContainText('料理の候補が見つかりました。')
    await expect(recipeSelect(page)).toHaveValue(edit === 'recipe' ? 'onigiri' : '')
    if (edit === 'title')
      await expect(page.getByRole('textbox', { name: '料理名（任意）', exact: true })).toHaveValue(
        '梅のおにぎり',
      )
    expect(await storedGame(page)).toEqual(before)

    await giveMeal(page)
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
  await expect(recipeSelect(page)).toHaveValue('curry')
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
  await expect(recipeSelect(page)).toHaveValue('onigiri')
  await api.reply(0, ['curry'])
  await expect(recipeSelect(page)).toHaveValue('onigiri')
  await giveMeal(page)
  expect((await storedGame(page)).meals[0]).toMatchObject({
    recipeId: 'onigiri',
    photo: secondRequest.photo,
  })
})

test('failed, unknown and empty recognition responses still allow manually recording the meal', async ({
  page,
}) => {
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
    await expect(journey(page).getByRole('status')).toContainText('手動で選べます。')
    await expect(recipeSelect(page)).toHaveValue('')
    await recipeSelect(page).selectOption('curry')
    await giveMeal(page)
    const saved = await storedGame(page)
    expect(saved.meals).toHaveLength(index + 1)
    expect(saved.meals[0].recipeId).toBe('curry')
    expect(saved.cards).toEqual(['curry'])
    await returnToPlaza(page)
  }
})

test('photo-free play skips recognition and ignores a response for a discarded photo', async ({
  page,
}) => {
  const api = await mockRecognition(page)
  const before = await storedGame(page)
  await page.locator('.play-feed').click()
  await page.getByRole('button', { name: '写真なしで体験する', exact: true }).click()
  await expect(journey(page, 'serve')).toBeVisible()
  expect(api.requests).toHaveLength(0)
  await page.getByRole('button', { name: '写真にもどる', exact: true }).click()
  await uploadPhoto(page)
  await api.waitFor(1)
  await page.getByRole('button', { name: '写真なしで体験する', exact: true }).click()
  await expect(journey(page, 'serve')).toBeVisible()
  await api.reply(0, ['curry'])
  await expect(recipeSelect(page)).toHaveValue('')
  expect(await storedGame(page)).toEqual(before)
  await giveMeal(page)
  const saved = await storedGame(page)
  expect(saved.meals).toHaveLength(1)
  expect(saved.meals[0].photo).toBeUndefined()
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
  await page.getByRole('button', { name: '写真なしで体験する', exact: true }).click()
  await api.reply(0, ['curry'])
  await expect(recipeSelect(page)).toHaveValue('')
  expect(await storedGame(page)).toEqual(before)
  await page.getByRole('button', { name: 'ひろばへ', exact: true }).click()
  expect(await storedGame(page)).toEqual(before)
})
