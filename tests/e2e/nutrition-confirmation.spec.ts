import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { dailyMealReport } from '../../shared/meals/analysis'
import {
  journey,
  sampleToTable,
  start,
  storedGame,
  uploadPhoto,
  waitForSceneMotion,
} from './helpers'

const confirmationTitle = '栄養記録なしでごはんをあげますか？'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await start(page)
})

test('cancel, Escape and close retain the unclassified photo and title without saving', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.route('**/api/recognize-food', (route) => route.fulfill({ json: { candidates: [] } }))
  const before = await storedGame(page)
  await page.locator('.play-feed').click()
  await uploadPhoto(page)
  await expect(page.locator('.meal-recognition-status')).toContainText('手動で選べます')
  const photo = await journey(page, 'photo').locator('img[src^="data:image/"]').getAttribute('src')
  await page.getByRole('button', { name: '食卓へ', exact: true }).click()
  await page.getByText('料理名をつける', { exact: true }).click()
  const title = page.getByRole('textbox', { name: '料理名（任意）', exact: true })
  await title.fill('名前だけの晩ごはん')
  const dialog = page.getByRole('dialog', { name: confirmationTitle, exact: true })
  for (const action of ['cancel', 'escape', 'close'] as const) {
    await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
    await expect(dialog).toBeVisible()
    expect(await storedGame(page)).toEqual(before)
    await expect(journey(page, 'eating')).toHaveCount(0)
    if (action === 'cancel') {
      await waitForSceneMotion(page)
      const accessibility = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(accessibility.violations).toEqual([])
      await page.screenshot({ path: test.info().outputPath('nutrition-confirmation-320.png') })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      await dialog.getByRole('button', { name: '入力に戻る', exact: true }).click()
    } else if (action === 'escape') await page.keyboard.press('Escape')
    else await dialog.getByRole('button', { name: '閉じる', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await expect(journey(page, 'serve')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }),
    ).toBeFocused()
    await expect(title).toHaveValue('名前だけの晩ごはん')
    expect(await storedGame(page)).toEqual(before)
  }
  await page.getByRole('button', { name: '写真にもどる', exact: true }).click()
  await expect(journey(page, 'photo').locator('img[src^="data:image/"]')).toHaveAttribute(
    'src',
    photo!,
  )
})

test('explicit confirmation saves one unscored meal and awards growth only once', async ({
  page,
}) => {
  const before = await storedGame(page)
  await page.locator('.play-feed').click()
  await sampleToTable(page)
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: confirmationTitle, exact: true })
  await expect(dialog).toBeVisible()
  expect(await storedGame(page)).toEqual(before)
  await dialog
    .getByRole('button', { name: 'このままごはんをあげる', exact: true })
    .evaluate((button: HTMLButtonElement) => {
      button.click()
      button.click()
    })
  await expect(journey(page, 'eating')).toBeVisible()
  const saved = await storedGame(page)
  expect(saved.meals).toHaveLength(1)
  expect(saved.mealRecords).toHaveLength(1)
  expect(saved.xp).toBe(before.xp + 45)
  expect(saved.coins).toBe(before.coins + 30)
  expect(saved.mealRecords![0].items[0]).toMatchObject({ groups: [], groupsConfirmed: false })
  expect(dailyMealReport(saved.mealRecords!, saved.today)).toMatchObject({
    score: null,
    mealCount: 1,
    scoredMealCount: 0,
  })
  await page.reload()
  expect(await storedGame(page)).toEqual(saved)
})

for (const classification of ['inferred', 'manual', 'confirmed-empty'] as const) {
  test(`${classification} classification submits directly without the warning`, async ({
    page,
  }) => {
    await page.locator('.play-feed').click()
    await sampleToTable(page, classification === 'inferred' ? 'curry' : '')
    if (classification !== 'inferred') {
      const vegetable = page.getByRole('checkbox', { name: '野菜・きのこ・海藻', exact: true })
      await expect(vegetable).toBeVisible()
      await vegetable.check()
      if (classification === 'confirmed-empty') await vegetable.uncheck()
    }
    await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
    await expect(journey(page, 'eating')).toBeVisible()
    await expect(page.getByRole('dialog', { name: confirmationTitle, exact: true })).toHaveCount(0)
    const saved = await storedGame(page)
    expect(saved.meals).toHaveLength(1)
    const item = saved.mealRecords![0].items[0]
    expect(item.groups.length > 0 || item.groupsConfirmed).toBe(true)
  })
}
