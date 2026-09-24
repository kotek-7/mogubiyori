import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('main screens and experiment controls have accessible labels and contrast', async ({
  page,
}) => {
  for (const route of ['today', 'recipes', 'album', 'community', 'lab']) {
    await page.goto(`/#${route}`)
    if (route === 'lab') await page.getByRole('dialog').waitFor()
    await page.evaluate(() => document.fonts.ready)
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(result.violations, route).toEqual([])
    if (route === 'lab') await page.getByRole('button', { name: '閉じる', exact: true }).click()
  }
})

test('mobile cooking and recording dialogs support accessible form interaction', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'これを作ってみる' }).click()
  let result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(result.violations, 'recipe').toEqual([])
  await page.getByRole('button', { name: 'できた！ 一皿を記録' }).click()
  result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(result.violations, 'record form').toEqual([])
})
