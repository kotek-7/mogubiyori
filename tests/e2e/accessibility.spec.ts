import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

for (const route of ['room', 'album', 'shop']) {
  test(`${route} has accessible labels, structure and contrast`, async ({ page }) => {
    await page.goto(`/#${route}`)
    await page.getByRole('heading', { level: 1 }).waitFor()
    await page.evaluate(() => document.fonts.ready)
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(result.violations).toEqual([])
  })
}

test('mobile photo submission and celebration remain accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'つくったごはんをあげる' }).click()
  await page.getByRole('dialog').waitFor()
  let result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(result.violations, 'photo submission').toEqual([])
  await page.getByRole('button', { name: '写真なしで体験する' }).click()
  await page.getByRole('button', { name: 'こむぎにごはんをあげる' }).click()
  await page
    .locator('.feast')
    .filter({ has: page.locator('.primary-button') })
    .waitFor()
  await expect(page.locator('.feast')).not.toHaveClass(/is-eating/)
  result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(result.violations, 'celebration').toEqual([])
})
