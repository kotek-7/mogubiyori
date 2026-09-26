import { expect, test } from '@playwright/test'
import type { Page, Route } from '@playwright/test'
import { Buffer } from 'node:buffer'
import AxeBuilder from '@axe-core/playwright'
import { recipes } from '../../src/app/game/browserGame'
import { genericDishes } from '../../shared/content/dishes'
import { foodGroupLabels } from '../../shared/meals/types'
import type { FoodGroup, MealItem } from '../../shared/meals/types'
import {
  confirmUnclassifiedMeal,
  enablePremium,
  journey,
  navigate,
  returnToPlaza,
  sampleToTable,
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
    async reply(index: number, candidates: string[], status = 200, items?: MealItem[]) {
      const route = requests[index]
      const response = route.request().response()
      await route.fulfill({
        status,
        json:
          status === 200
            ? { candidates, ...(items === undefined ? {} : { items }) }
            : { error: 'unavailable' },
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

async function expectMealItems(page: Page, items: MealItem[]) {
  await expect(page.locator('.meal-record-item')).toHaveCount(items.length)
  for (const [index, item] of items.entries()) {
    const fields = page.getByRole('group', { name: `料理 ${index + 1}`, exact: true })
    await expect(fields).toBeVisible()
    await expect(
      fields.getByRole('textbox', { name: `料理 ${index + 1} の名前`, exact: true }),
    ).toHaveValue(item.name)
    await expect(fields.getByRole('combobox', { name: '量', exact: true })).toHaveValue(
      item.portion,
    )
    for (const [group, label] of Object.entries(foodGroupLabels)) {
      const input = fields.getByRole('checkbox', { name: label, exact: true })
      if (item.groups.includes(group as FoodGroup)) await expect(input).toBeChecked()
      else await expect(input).not.toBeChecked()
    }
  }
}

async function uploadDifferentPhoto(page: Page) {
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
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await start(page)
})

test('photo recognition automatically fills and saves every dish, food group and portion', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const api = await mockRecognition(page)
  const before = await storedGame(page)
  const detected: MealItem[] = [
    {
      name: 'カレー',
      recipeId: 'curry',
      groups: ['staple', 'protein', 'vegetable'],
      portion: 'large',
      groupsConfirmed: false,
    },
    { name: 'サラダ', groups: ['vegetable'], portion: 'small', groupsConfirmed: false },
    {
      name: 'いちごヨーグルト',
      groups: ['fruit', 'dairy'],
      portion: 'regular',
      groupsConfirmed: false,
    },
  ]
  await page.locator('.play-feed').click()
  await uploadPhoto(page)
  await api.waitFor(1)
  await toTable(page)
  await api.reply(0, ['curry'], 200, detected)
  await expect(journey(page).locator('.meal-recognition-status')).toContainText(
    '写真から3品の料理・食品グループ・量を推定しました。',
  )
  const disclosure = page.locator('summary').filter({ hasText: '食事の内容を確認' })
  await expect(disclosure.locator('..')).toHaveAttribute('open', '')
  await expectMealItems(page, detected)
  expect(await storedGame(page)).toEqual(before)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('recognized-meal-items-mobile.png') })
  await page.getByRole('group', { name: '料理 1', exact: true }).screenshot({
    path: testInfo.outputPath('recognized-meal-item-fields-mobile.png'),
  })
  // Reviewing requires no per-item confirmation and makes no edits to the inferred data.
  await giveMeal(page)
  const saved = await storedGame(page)
  expect(saved.mealRecords).toHaveLength(1)
  expect(saved.mealRecords![0].items).toEqual(detected)
  expect(saved.meals[0]).toMatchObject({ title: 'カレー', recipeId: 'curry' })
  await returnToPlaza(page)
  await page.reload()
  expect((await storedGame(page)).mealRecords).toEqual(saved.mealRecords)
})

test('a manually changed portion survives a late recognition while names, groups and sides fill in', async ({
  page,
}) => {
  const api = await mockRecognition(page)
  const before = await storedGame(page)
  const detected: MealItem[] = [
    {
      name: 'カレー',
      recipeId: 'curry',
      groups: ['staple', 'protein', 'vegetable'],
      portion: 'large',
      groupsConfirmed: false,
    },
    { name: 'サラダ', groups: ['vegetable'], portion: 'regular', groupsConfirmed: false },
  ]
  await page.locator('.play-feed').click()
  await uploadPhoto(page)
  await api.waitFor(1)
  await toTable(page)
  const primary = page.getByRole('group', { name: '料理 1', exact: true })
  await expect(primary).toBeVisible()
  await primary.getByRole('combobox', { name: '量', exact: true }).selectOption('small')
  await api.reply(0, ['curry'], 200, detected)
  const expected: MealItem[] = [{ ...detected[0], portion: 'small' }, detected[1]]
  await expectMealItems(page, expected)
  await expect(selectedMealRecipe(page)).toHaveText('カレー')
  expect(await storedGame(page)).toEqual(before)
  await giveMeal(page)
  expect((await storedGame(page)).mealRecords![0].items).toEqual(expected)
})

test('replacing a photo clears its automatic side dishes before saving the new photo details', async ({
  page,
}) => {
  const api = await mockRecognition(page)
  const before = await storedGame(page)
  const original: MealItem[] = [
    {
      name: 'カレー',
      recipeId: 'curry',
      groups: ['staple', 'vegetable'],
      portion: 'large',
      groupsConfirmed: false,
    },
    { name: 'サラダ', groups: ['vegetable'], portion: 'small', groupsConfirmed: false },
  ]
  const replacement: MealItem[] = [
    {
      name: 'おかかのおにぎり',
      recipeId: 'onigiri',
      groups: ['staple'],
      portion: 'regular',
      groupsConfirmed: false,
    },
    { name: '冷ややっこ', groups: ['protein'], portion: 'small', groupsConfirmed: false },
  ]
  await page.locator('.play-feed').click()
  await uploadPhoto(page)
  const firstPhoto = (await api.waitFor(1)).request().postDataJSON().photo
  await api.reply(0, ['curry'], 200, original)
  await toTable(page)
  await expectMealItems(page, original)
  await page.getByRole('button', { name: '写真にもどる', exact: true }).click()
  await uploadDifferentPhoto(page)
  const secondPhoto = (await api.waitFor(2)).request().postDataJSON().photo
  expect(secondPhoto).not.toBe(firstPhoto)
  await toTable(page)
  await expect(page.locator('.meal-record-item')).toHaveCount(1)
  await expect(page.getByRole('textbox', { name: '料理 1 の名前', exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: '料理 1 の名前', exact: true })).not.toHaveValue(
    'カレー',
  )
  await expect(page.getByRole('combobox', { name: '量', exact: true })).toHaveValue('unknown')
  await api.reply(1, ['onigiri'], 200, replacement)
  await expectMealItems(page, replacement)
  expect(await storedGame(page)).toEqual(before)
  await giveMeal(page)
  const saved = await storedGame(page)
  expect(saved.mealRecords![0].items).toEqual(replacement)
  expect(saved.meals[0]).toMatchObject({ recipeId: 'onigiri', photo: secondPhoto })
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
  await expect(choices.getByRole('button', { name: /として記録$/ })).toHaveCount(12)
  await expect(choices.getByRole('status')).toContainText(`${genericDishes.length}種類`)
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

test('the expanded dish picker searches aliases, filters and pages without changing the saved meal', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  const before = await storedGame(page)
  await page.locator('.play-feed').click()
  await sampleToTable(page)
  await page.getByRole('button', { name: '料理を選ぶ', exact: true }).click()
  const choices = page.getByRole('group', { name: '料理の種類で選ぶ' })
  const search = choices.getByRole('searchbox', { name: '料理名で検索' })
  const category = choices.getByRole('combobox', { name: '種類', exact: true })
  const pagination = choices.getByRole('navigation', { name: '料理の種類のページ' })
  const seen = new Set(await choices.locator('.meal-dish-list button').allTextContents())
  await expect(pagination.getByRole('button', { name: '前のページ' })).toBeDisabled()
  await pagination.getByRole('button', { name: '次のページ' }).click()
  await expect(choices.getByRole('status')).toContainText('13〜24件目')
  for (let current = 2; current <= Math.ceil(genericDishes.length / 12); current += 1) {
    for (const name of await choices.locator('.meal-dish-list button').allTextContents()) {
      seen.add(name)
    }
    if (current < Math.ceil(genericDishes.length / 12)) {
      await pagination.getByRole('button', { name: '次のページ' }).click()
      await expect(choices.getByRole('status')).toContainText(`${current * 12 + 1}〜`)
    }
  }
  await expect(pagination.getByRole('button', { name: '次のページ' })).toBeDisabled()
  expect([...seen].sort()).toEqual(genericDishes.map((dish) => dish.name).sort())

  await search.fill('ｷﾞｮｳｻﾞ')
  await expect(choices.getByRole('button', { name: '餃子として記録', exact: true })).toBeVisible()
  await category.selectOption('seafood')
  await expect(choices.getByRole('status')).toContainText('0種類')
  await expect(
    choices.getByText('料理が見つかりませんでした。別の名前でも探せます。'),
  ).toBeVisible()
  await choices.getByRole('button', { name: 'すべての料理を見る' }).click()
  await expect(search).toHaveValue('')
  await expect(category).toHaveValue('all')
  await expect(choices.getByRole('status')).toContainText('1〜12件目')

  await category.selectOption('meat')
  await search.fill('ぎょうざ')
  const choose = choices.getByRole('button', { name: '餃子として記録', exact: true })
  await expect(choose).toBeVisible()
  await waitForSceneMotion(page)
  expect(
    (await new AxeBuilder({ page }).include('.meal-generic-dishes').analyze()).violations,
  ).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(await choices.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  await choices.evaluate((element) => element.scrollIntoView({ block: 'start' }))
  await page.screenshot({ path: testInfo.outputPath('dish-search-mobile.png') })
  expect(await storedGame(page)).toEqual(before)

  await choose.focus()
  await page.keyboard.press('Enter')
  await expect(selectedMealRecipe(page)).toHaveText('餃子')
  await page.getByRole('button', { name: '料理を選ぶ', exact: true }).click()
  // Reopening lands on the selected dish's page, even for a newly added entry.
  await expect(
    choices.getByRole('button', { name: '餃子として記録', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '食卓にもどる', exact: true }).click()
  expect(await storedGame(page)).toEqual(before)
  await giveMeal(page, true)
  const saved = await storedGame(page)
  expect(saved.meals[0]).toMatchObject({ dishId: 'generic-gyoza', title: '餃子', cardBonus: 0 })
  expect(saved.meals[0].recipeId).toBeUndefined()
  expect(saved.cards).toEqual([])
  await returnToPlaza(page)
  await page.reload()
  expect(await storedGame(page)).toEqual(saved)
})

test('new dish photo candidates are selectable and cannot overwrite a manual dish choice', async ({
  page,
}) => {
  await enablePremium(page)
  const api = await mockRecognition(page)
  await page.locator('.play-feed').click()
  await uploadPhoto(page)
  await api.waitFor(1)
  await toTable(page)
  await api.reply(0, ['generic-gyoza'])
  await expect(selectedMealRecipe(page)).toHaveText('餃子')
  await giveMeal(page, true)
  expect((await storedGame(page)).meals[0]).toMatchObject({ dishId: 'generic-gyoza', cardBonus: 0 })
  await returnToPlaza(page)

  await page.locator('.play-feed').click()
  await uploadPhoto(page)
  await api.waitFor(2)
  await toTable(page)
  await page.getByRole('button', { name: '料理を選ぶ', exact: true }).click()
  const choices = page.getByRole('group', { name: '料理の種類で選ぶ' })
  await choices.getByRole('searchbox', { name: '料理名で検索' }).fill('ぎょうざ')
  await choices.getByRole('button', { name: '餃子として記録', exact: true }).click()
  await api.reply(1, ['generic-curry'])
  await expect(selectedMealRecipe(page)).toHaveText('餃子')
  await page.getByRole('button', { name: 'ひろばへ', exact: true }).click()
  expect((await storedGame(page)).meals).toHaveLength(1)
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

test('an ambiguous dessert suggestion remains a broad meal without guessed ingredients', async ({
  page,
}) => {
  const api = await mockRecognition(page)
  await page.locator('.play-feed').click()
  await uploadPhoto(page)
  await api.waitFor(1)
  await api.reply(0, ['generic-dessert'])
  await toTable(page)
  await expect(selectedMealRecipe(page)).toHaveText('お菓子・デザート')
  await giveMeal(page, true)
  expect((await storedGame(page)).meals[0]).toMatchObject({
    dishId: 'generic-dessert',
    cardBonus: 0,
  })
  expect((await storedGame(page)).cards).toEqual([])
})

test('pasta variations share one dish family while their recipe cards stay distinct', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await enablePremium(page)
  await page.locator('.play-feed').click()
  await sampleToTable(page)
  await page.getByRole('button', { name: '料理を選ぶ', exact: true }).click()
  const choices = page.getByRole('group', { name: '料理の種類で選ぶ' })
  for (const name of ['ペペロンチーノ', 'カルボナーラ']) {
    await choices.getByRole('searchbox', { name: '料理名で検索' }).fill(name)
    await expect(choices.getByRole('button', { name: /として記録$/ })).toHaveCount(1)
    await expect(
      choices.getByRole('button', { name: 'パスタとして記録', exact: true }),
    ).toBeVisible()
    await expect(
      choices.getByRole('button', { name: `${name}として記録`, exact: true }),
    ).toHaveCount(0)
    await page.getByRole('searchbox', { name: '名前・材料で検索' }).fill(name)
    await expect(page.locator('.recipe-collection-card').first()).toContainText(name)
  }
  await choices.scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath('broad-pasta-family-mobile.png') })
  await choices.getByRole('button', { name: 'パスタとして記録', exact: true }).click()
  await expect(selectedMealRecipe(page)).toHaveText('パスタ')
  await giveMeal(page)
  expect((await storedGame(page)).meals[0]).toMatchObject({
    dishId: 'generic-pasta',
    title: 'パスタ',
    cardBonus: 0,
  })
})
